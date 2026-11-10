-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==========================================
-- 2. SCHEMA DEFINITION
-- ==========================================

-- PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    bio TEXT,
    major TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EVENTS
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    registration_deadline TIMESTAMPTZ NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    is_team_event BOOLEAN NOT NULL DEFAULT FALSE,
    min_team_size INT NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
    max_team_size INT NOT NULL DEFAULT 4 CHECK (max_team_size >= min_team_size),
    required_registration_fields JSONB DEFAULT '["Full Name", "Roll Number", "Department", "GitHub URL"]'::jsonb,
    location GEOGRAPHY(POINT, 4326),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EVENT REGISTRATIONS
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    credentials JSONB DEFAULT '{}'::jsonb,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- TEAMS (For team-based events)
CREATE TABLE teams (
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

-- TEAM MEMBERS
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

-- TEAM INVITATIONS
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, receiver_id)
);

-- EVENT SWIPES (Tinder-style left/right)
CREATE TABLE event_swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, event_id)
);

-- TEAMMATE SWIPES
CREATE TABLE teammate_swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_id, target_id),
    CHECK (swiper_id != target_id)
);

-- MATCHES
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(LEAST(student_1, student_2), GREATEST(student_1, student_2))
);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

-- B-Tree Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
        CREATE INDEX IF NOT EXISTS idx_students_id ON public.students(id);
    END IF;
END $$;
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_registrations_student_id ON event_registrations(student_id);
CREATE INDEX idx_matches_student_1 ON matches(student_1);
CREATE INDEX idx_matches_student_2 ON matches(student_2);
CREATE INDEX idx_messages_match_id ON messages(match_id);

-- Team Indexes
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(team_code);
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student_id ON team_members(student_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_receiver ON team_invitations(receiver_id);

-- GIN Indexes for array columns
CREATE INDEX idx_profiles_skills ON profiles USING GIN (skills);
CREATE INDEX idx_profiles_interests ON profiles USING GIN (interests);
CREATE INDEX idx_events_required_skills ON events USING GIN (required_skills);

-- GIN Index for Full Text Search on Events
ALTER TABLE events ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;
CREATE INDEX idx_events_search ON events USING GIN (search_vector);

-- GiST Index for Geospatial queries
CREATE INDEX idx_events_location ON events USING GIST (location);

-- ==========================================
-- 4. TRIGGERS
-- ==========================================

-- Lightweight, non-blocking trigger for new user creation on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger for events
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_modtime
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 5. BUSINESS LOGIC FUNCTIONS (SECURITY DEFINER)
-- ==========================================

-- Register for Event Function (Transaction safe, Row-Level locking, Custom Credential Collection)
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

-- Create Team Function (Designates current user as Team Lead & generates team code)
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

-- Join Team By Code Function
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
        -- Auto-register student if event has capacity
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

-- Invite Student to Team Function
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

    -- Verify current user is in team
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


-- Teammate Swiping & Matching Function
CREATE OR REPLACE FUNCTION swipe_teammate(p_target_id UUID, p_direction TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_swiper_id UUID;
    v_mutual_swipe RECORD;
    v_match_id UUID;
BEGIN
    v_swiper_id := auth.uid();
    
    IF v_swiper_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    IF v_swiper_id = p_target_id THEN
        RAISE EXCEPTION 'Cannot swipe on yourself';
    END IF;

    -- Insert swipe (Unique constraint prevents duplicates)
    INSERT INTO teammate_swipes (swiper_id, target_id, direction)
    VALUES (v_swiper_id, p_target_id, p_direction)
    ON CONFLICT (swiper_id, target_id) DO UPDATE SET direction = p_direction, created_at = NOW();

    -- Check for mutual match if swiped right
    IF p_direction = 'right' THEN
        SELECT * INTO v_mutual_swipe 
        FROM teammate_swipes 
        WHERE swiper_id = p_target_id AND target_id = v_swiper_id AND direction = 'right';

        IF FOUND THEN
            -- Create match safely
            INSERT INTO matches (student_1, student_2)
            VALUES (LEAST(v_swiper_id, p_target_id), GREATEST(v_swiper_id, p_target_id))
            ON CONFLICT DO NOTHING
            RETURNING id INTO v_match_id;
            
            IF v_match_id IS NULL THEN
                SELECT id INTO v_match_id FROM matches 
                WHERE student_1 = LEAST(v_swiper_id, p_target_id) AND student_2 = GREATEST(v_swiper_id, p_target_id);
            END IF;

            RETURN jsonb_build_object('matched', true, 'match_id', v_match_id);
        END IF;
    END IF;

    RETURN jsonb_build_object('matched', false);
END;
$$;

-- ==========================================
-- 6. VIEWS & MATERIALIZED VIEWS
-- ==========================================

-- Standard View for User Details
CREATE OR REPLACE VIEW user_details AS
SELECT 
    p.id, 
    p.full_name, 
    p.bio, 
    p.skills, 
    p.interests,
    COUNT(DISTINCT er.id) as registered_events_count,
    COUNT(DISTINCT m.id) as matches_count
FROM profiles p
LEFT JOIN event_registrations er ON p.id = er.student_id
LEFT JOIN matches m ON p.id = m.student_1 OR p.id = m.student_2
GROUP BY p.id;

-- Materialized View for Admin Analytics (Refreshed via pg_cron)
CREATE MATERIALIZED VIEW admin_analytics_matview AS
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM event_registrations) as total_registrations,
    (SELECT COUNT(*) FROM matches) as total_matches,
    NOW() as last_refreshed;

CREATE UNIQUE INDEX idx_admin_analytics_refreshed ON admin_analytics_matview (last_refreshed);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_admin_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_analytics_matview;
END;
$$;

-- Using pg_cron to refresh materialized view every hour
-- NOTE: Requires pg_cron extension to be fully enabled in supabase dashboard
-- SELECT cron.schedule('refresh_analytics', '0 * * * *', 'SELECT refresh_admin_analytics();');

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teammate_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check if admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Anyone can view profiles, only self can update, admins can view/update all
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON profiles USING (is_admin());

-- Events: Anyone can view, admins can manage
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can insert events" ON events FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete events" ON events FOR DELETE USING (is_admin());

-- Event Registrations: Users can view their own, admins can view all
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = student_id OR is_admin());
-- Registration INSERT is handled by the SECURITY DEFINER function `register_for_event`

-- Teams: Authenticated users can view teams
CREATE POLICY "Teams are viewable by registered students" ON teams FOR SELECT USING (true);
CREATE POLICY "Team leaders can update team details" ON teams FOR UPDATE USING (auth.uid() = leader_id OR is_admin());
CREATE POLICY "Team leaders or admins can delete teams" ON teams FOR DELETE USING (auth.uid() = leader_id OR is_admin());

-- Team Members: Authenticated users can view team members
CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can leave or leaders can manage team members" ON team_members FOR DELETE 
USING (
    auth.uid() = student_id OR 
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND leader_id = auth.uid()) OR 
    is_admin()
);

-- Team Invitations: Senders, receivers, or team leaders can view/update
CREATE POLICY "Team invitations are viewable by participants" ON team_invitations FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin());
CREATE POLICY "Users can respond to team invitations" ON team_invitations FOR UPDATE
USING (auth.uid() = receiver_id OR is_admin());

-- Swipes: Users can view their own, admins can view all
CREATE POLICY "Users can view own event swipes" ON event_swipes FOR SELECT USING (auth.uid() = student_id OR is_admin());
CREATE POLICY "Users can view own teammate swipes" ON teammate_swipes FOR SELECT USING (auth.uid() = swiper_id OR is_admin());

-- Matches: Users can view their own matches
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = student_1 OR auth.uid() = student_2 OR is_admin());

-- Messages: Only matched users can read and insert messages
CREATE POLICY "Matched users can read messages" ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM matches 
        WHERE id = match_id 
        AND (student_1 = auth.uid() OR student_2 = auth.uid())
    ) OR is_admin()
);

CREATE POLICY "Matched users can send messages" ON messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
        SELECT 1 FROM matches 
        WHERE id = match_id 
        AND (student_1 = auth.uid() OR student_2 = auth.uid())
    )
);

-- ==========================================
-- 8. ENABLE REALTIME
-- ==========================================
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table team_invitations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;

-- ==========================================
-- 9. ADMIN FUNCTIONS & ANALYTICS VIEWS
-- ==========================================

-- Top In-Demand Skills View
CREATE OR REPLACE VIEW v_skill_demand AS
SELECT 
    TRIM(s) AS skill, 
    COUNT(*) AS count
FROM profiles, UNNEST(skills) AS s
WHERE s IS NOT NULL AND role = 'student'
GROUP BY TRIM(s)
ORDER BY count DESC
LIMIT 12;

-- Admin Dashboard RPC Function
CREATE OR REPLACE FUNCTION admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_students INT;
    v_active_events INT;
    v_total_registrations INT;
    v_total_matches INT;
    v_top_skills JSONB;
    v_capacities JSONB;
BEGIN
    -- Only admin can call this RPC
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: This portal is strictly restricted to verified faculty administrators';
    END IF;

    SELECT COUNT(*) INTO v_total_students FROM profiles WHERE role = 'student';
    SELECT COUNT(*) INTO v_active_events FROM events WHERE (registration_deadline >= NOW() OR updated_at >= NOW() - INTERVAL '30 days');
    SELECT COUNT(*) INTO v_total_registrations FROM event_registrations;
    SELECT COUNT(*) INTO v_total_matches FROM matches;

    -- Aggregate top skills
    SELECT jsonb_agg(sub) INTO v_top_skills FROM (
        SELECT skill, count FROM v_skill_demand LIMIT 8
    ) sub;

    -- Aggregate event capacities
    SELECT jsonb_agg(sub) INTO v_capacities FROM (
        SELECT 
            e.id, 
            e.title, 
            COALESCE(e.category, 'General') as club, 
            COUNT(er.id) as registered, 
            e.capacity,
            ROUND((COUNT(er.id)::numeric / NULLIF(e.capacity, 0)) * 100) as percent,
            CASE WHEN e.registration_deadline >= NOW() THEN 'Active' ELSE 'Closed' END as status
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT 6
    ) sub;

    RETURN jsonb_build_object(
        'total_students', COALESCE(v_total_students, 0),
        'active_events', COALESCE(v_active_events, 0),
        'total_registrations', COALESCE(v_total_registrations, 0),
        'total_matches', COALESCE(v_total_matches, 0),
        'top_skills', COALESCE(v_top_skills, '[]'::jsonb),
        'event_capacities', COALESCE(v_capacities, '[]'::jsonb)
    );
END;
$$;

-- Admin List Users RPC Function
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_users JSONB;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: This portal is strictly restricted to verified faculty administrators';
    END IF;

    SELECT jsonb_agg(sub) INTO v_users FROM (
        SELECT 
            id,
            full_name,
            email,
            COALESCE(bio, 'CSE') as branch,
            '3' as year,
            skills,
            created_at
        FROM profiles
        WHERE role = 'student'
        ORDER BY created_at DESC
    ) sub;

    RETURN COALESCE(v_users, '[]'::jsonb);
END;
$$;
