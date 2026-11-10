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
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, student_id)
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

-- Register for Event Function (Transaction safe, Row-Level locking)
CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student_id UUID;
    v_event RECORD;
    v_current_registrations INT;
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

    -- Insert registration (Unique constraint prevents duplicates)
    INSERT INTO event_registrations (event_id, student_id)
    VALUES (p_event_id, v_student_id);

    RETURN jsonb_build_object('success', true, 'message', 'Successfully registered');
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Already registered for this event';
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

