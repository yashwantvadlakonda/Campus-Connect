# CampusConnect Database

PostgreSQL database schemas, PostGIS spatial extensions, pg_cron automated archival jobs, Row-Level Security (RLS) policies, and analytical RPC functions for the CampusConnect platform.

## 🗄️ File Overview

- **`init.sql`**: The single source of truth for database initialization. Contains:
  1. Extensions: `uuid-ossp`, `postgis`, `pg_cron`
  2. Tables: `profiles`, `events`, `event_registrations`, `event_swipes`, `teammate_swipes`, `matches`, `messages`
  3. ACID Concurrency: `register_for_event()` with row-level locks (`FOR UPDATE`)
  4. Matching Algorithm: `swipe_teammate()`
  5. Views: `v_skill_demand`, `user_details`, and `admin_analytics_matview`
  6. Admin RPC Functions: `admin_dashboard()` and `admin_list_users()`
  7. Row-Level Security: Strict RLS policies protecting student and admin access.
- **`migrations/`**: Incremental schema changes for existing Supabase projects. Apply each migration once in the Supabase SQL Editor.

## 🚀 Setup Instructions

1. Open your PostgreSQL console or Supabase SQL Editor.
2. Run `init.sql`.
3. Verify that all tables, views, and functions are created.

For an existing project, run [`migrations/20261110_add_student_profile_fields.sql`](./migrations/20261110_add_student_profile_fields.sql) to add the student profile `major` and `year` fields without replacing existing profile rows.
