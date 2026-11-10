-- =========================================================================
-- CampusConnect: Database Cleanup, Schema Verification & Data Purge
-- =========================================================================
-- Run this script in the Supabase SQL Editor or PostgreSQL terminal.
-- It verifies all schemas, ensures CASCADE constraints, and purges all
-- dummy/mock/placeholder records to establish a clean production state.
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =========================================================================
-- 2. Schema Verification (Tables & Cascade Constraints)
-- =========================================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    bio TEXT DEFAULT '',
    major TEXT NOT NULL DEFAULT '',
    branch TEXT DEFAULT 'CSE',
    year TEXT DEFAULT '1',
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Technology',
    club TEXT DEFAULT 'Engineering Council',
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '10:00:00',
    end_time TIME NOT NULL DEFAULT '18:00:00',
    venue TEXT NOT NULL DEFAULT 'Campus Center',
    venue_name TEXT DEFAULT 'Campus Center',
    capacity INT NOT NULL CHECK (capacity >= 0),
    registered INT NOT NULL DEFAULT 0 CHECK (registered >= 0),
    registration_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    required_skills TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_team_event BOOLEAN NOT NULL DEFAULT FALSE,
    min_team_size INT NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
    max_team_size INT NOT NULL DEFAULT 4 CHECK (max_team_size >= min_team_size),
    required_registration_fields JSONB DEFAULT '["Full Name", "Roll Number", "Department", "GitHub URL"]'::jsonb,
    location GEOGRAPHY(POINT, 4326),
    latitude DOUBLE PRECISION DEFAULT 17.385044,
    longitude DOUBLE PRECISION DEFAULT 78.486671,
    start_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '8 days'),
    deadline_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    expire_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 days'),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Registrations
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credentials JSONB DEFAULT '{}'::jsonb,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    preferred_skills TEXT[] DEFAULT '{}',
    team_code TEXT NOT NULL UNIQUE,
    leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

-- Team Invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, receiver_id)
);

-- Event Swipes (Tinder-style)
CREATE TABLE IF NOT EXISTS public.event_swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, event_id)
);

-- Teammate Swipes
CREATE TABLE IF NOT EXISTS public.teammate_swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_id, target_id),
    CHECK (swiper_id != target_id)
);

-- Matches
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(LEAST(student_1, student_2), GREATEST(student_1, student_2))
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications / Pulse Activities
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pulse_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    action_label TEXT DEFAULT 'View',
    action_link TEXT DEFAULT '/events',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. PURGE ALL DUMMY / MOCK / PLACEHOLDER RECORDS
-- =========================================================================

-- Safely purge in topological order respecting foreign keys
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.pulse_activities CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.team_invitations CASCADE;
TRUNCATE TABLE public.team_members CASCADE;
TRUNCATE TABLE public.teams CASCADE;
TRUNCATE TABLE public.event_registrations CASCADE;
TRUNCATE TABLE public.event_swipes CASCADE;
TRUNCATE TABLE public.teammate_swipes CASCADE;
TRUNCATE TABLE public.matches CASCADE;
TRUNCATE TABLE public.events CASCADE;

-- If dummy profiles exist (keeping verified faculty admins intact)
DELETE FROM public.profiles 
WHERE email NOT LIKE '%faculty.admin%' 
  AND email NOT LIKE '%admin@demo.com%'
  AND email NOT IN (SELECT email FROM auth.users WHERE email LIKE '%faculty%');

-- =========================================================================
-- 4. Enable Realtime Publications
-- =========================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Verify Clean State
SELECT 'events' AS table_name, count(*) AS remaining_count FROM public.events
UNION ALL
SELECT 'teams', count(*) FROM public.teams
UNION ALL
SELECT 'event_registrations', count(*) FROM public.event_registrations
UNION ALL
SELECT 'team_members', count(*) FROM public.team_members
UNION ALL
SELECT 'matches', count(*) FROM public.matches;
