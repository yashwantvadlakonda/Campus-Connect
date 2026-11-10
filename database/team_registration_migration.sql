-- =========================================================================
-- CampusConnect: Team Formation & Credential Registration Migration
-- =========================================================================

-- 1. Alter Events table to add team & custom registration credential configuration
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_team_event BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_team_size INT NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
ADD COLUMN IF NOT EXISTS max_team_size INT NOT NULL DEFAULT 4 CHECK (max_team_size >= min_team_size),
ADD COLUMN IF NOT EXISTS required_registration_fields JSONB DEFAULT '["Full Name", "Roll Number", "Department", "GitHub URL"]'::jsonb;

-- 2. Alter Event Registrations table to store dynamic credentials
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb;

-- 3. Create Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    preferred_skills TEXT[] DEFAULT '{}',
    team_code TEXT NOT NULL UNIQUE,
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

-- 5. Create Team Invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, receiver_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(team_code);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student_id ON team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_receiver ON team_invitations(receiver_id);

-- 7. Update Register for Event RPC with Row-level locking & credentials support
CREATE OR REPLACE FUNCTION register_for_event(
    p_event_id UUID,
    p_credentials JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_event RECORD;
    v_current_registrations INT;
    v_reg_id UUID;
BEGIN
    v_student_id := auth.uid();
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the event row for update to prevent race conditions
    SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    IF NOW() > v_event.registration_deadline THEN
        RAISE EXCEPTION 'Registration deadline has passed';
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_current_registrations FROM event_registrations WHERE event_id = p_event_id;
    
    IF v_current_registrations >= v_event.capacity THEN
        RAISE EXCEPTION 'Event is at full capacity';
    END IF;

    -- Insert registration with credentials (Unique constraint prevents duplicates)
    INSERT INTO event_registrations (event_id, student_id, credentials)
    VALUES (p_event_id, v_student_id, p_credentials)
    RETURNING id INTO v_reg_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Successfully registered',
        'registration_id', v_reg_id,
        'event_id', p_event_id,
        'is_team_event', COALESCE(v_event.is_team_event, false),
        'min_team_size', COALESCE(v_event.min_team_size, 1),
        'max_team_size', COALESCE(v_event.max_team_size, 4)
    );
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Already registered for this event';
END;
$$;

-- 8. Create Team RPC
CREATE OR REPLACE FUNCTION create_team(
    p_event_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT '',
    p_preferred_skills TEXT[] DEFAULT '{}',
    p_team_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_event RECORD;
    v_code TEXT;
    v_team_id UUID;
    v_existing_team RECORD;
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify student is registered for event
    IF NOT EXISTS (SELECT 1 FROM event_registrations WHERE event_id = p_event_id AND student_id = v_student_id) THEN
        RAISE EXCEPTION 'Must be registered for the event before creating a team';
    END IF;

    -- Verify event is a team event
    SELECT * INTO v_event FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    IF NOT COALESCE(v_event.is_team_event, true) THEN
        RAISE EXCEPTION 'This event is not configured for team participation';
    END IF;

    -- Check if student already belongs to a team for this event
    SELECT tm.id INTO v_existing_team 
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.event_id = p_event_id AND tm.student_id = v_student_id;

    IF FOUND THEN
        RAISE EXCEPTION 'Already a member of a team for this event';
    END IF;

    -- Generate unique alphanumeric team code if not provided
    v_code := COALESCE(p_team_code, UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)));

    -- Insert team
    INSERT INTO teams (event_id, name, description, preferred_skills, team_code, leader_id)
    VALUES (p_event_id, p_name, p_description, p_preferred_skills, v_code, v_student_id)
    RETURNING id INTO v_team_id;

    -- Insert current user as leader
    INSERT INTO team_members (team_id, student_id, role)
    VALUES (v_team_id, v_student_id, 'leader');

    RETURN jsonb_build_object(
        'success', true,
        'team_id', v_team_id,
        'team_code', v_code,
        'name', p_name,
        'event_id', p_event_id,
        'message', 'Team successfully created'
    );
END;
$$;

-- 9. Join Team By Code RPC
CREATE OR REPLACE FUNCTION join_team_by_code(p_team_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_team RECORD;
    v_event RECORD;
    v_current_count INT;
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_team FROM teams WHERE UPPER(team_code) = UPPER(TRIM(p_team_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid team code';
    END IF;

    -- Verify event registration
    IF NOT EXISTS (SELECT 1 FROM event_registrations WHERE event_id = v_team.event_id AND student_id = v_student_id) THEN
        INSERT INTO event_registrations (event_id, student_id)
        VALUES (v_team.event_id, v_student_id)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Check event team limits
    SELECT * INTO v_event FROM events WHERE id = v_team.event_id;
    SELECT COUNT(*) INTO v_current_count FROM team_members WHERE team_id = v_team.id;

    IF v_current_count >= COALESCE(v_event.max_team_size, 4) THEN
        RAISE EXCEPTION 'Team is full (Max % members allowed)', v_event.max_team_size;
    END IF;

    -- Add member
    INSERT INTO team_members (team_id, student_id, role)
    VALUES (v_team.id, v_student_id, 'member')
    ON CONFLICT (team_id, student_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'team_id', v_team.id,
        'team_name', v_team.name,
        'event_id', v_team.event_id,
        'message', 'Successfully joined team'
    );
END;
$$;

-- 10. Invite Team Member RPC
CREATE OR REPLACE FUNCTION invite_team_member(p_team_id UUID, p_receiver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_invitation_id UUID;
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND student_id = v_student_id) THEN
        RAISE EXCEPTION 'Only team members can invite other students';
    END IF;

    INSERT INTO team_invitations (team_id, sender_id, receiver_id, status)
    VALUES (p_team_id, v_student_id, p_receiver_id, 'pending')
    ON CONFLICT (team_id, receiver_id) DO UPDATE SET status = 'pending', created_at = NOW()
    RETURNING id INTO v_invitation_id;

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation_id,
        'message', 'Invitation sent successfully'
    );
END;
$$;

-- 11. Enable Row Level Security & Realtime
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Teams are viewable by registered students') THEN
        CREATE POLICY "Teams are viewable by registered students" ON teams FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Team leaders can update team details') THEN
        CREATE POLICY "Team leaders can update team details" ON teams FOR UPDATE USING (auth.uid() = leader_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Team members are viewable by everyone') THEN
        CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_invitations' AND policyname = 'Team invitations are viewable by participants') THEN
        CREATE POLICY "Team invitations are viewable by participants" ON team_invitations FOR SELECT
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
END $$;
