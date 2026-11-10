# Campus Event & Team Finder - Backend Architecture

This directory contains the complete Python FastAPI backend and Supabase PostgreSQL database architecture.

## Tech Stack
- **API Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **ORM/Driver:** `supabase-py` and `psycopg2`
- **Extensions Used:** `postgis`, `pg_cron`, `uuid-ossp`

## Project Structure
```
backend/
├── database/
│   └── init.sql         # The complete schema, RLS policies, functions, views, and indexes
├── scripts/
│   ├── benchmark.py     # Benchmarks index performance and tests concurrent transactions
│   ├── create_admin.py  # Utility to create an administrator securely
│   └── seed_data.py     # Uses Faker to populate the database with realistic test data
├── .env.example         # Template for environment variables
├── database.py          # Supabase client instantiation
├── main.py              # FastAPI application, auth middleware, and endpoints
├── models.py            # Pydantic validation models
└── requirements.txt     # Python dependencies
```

## Setup Instructions

### 1. Database Setup
1. Create a new [Supabase](https://supabase.com/) project.
2. Navigate to the SQL Editor in the Supabase Dashboard.
3. Open `database/init.sql`, copy its entire contents, and execute it. 
   *(This will create all tables, indexes, triggers, materialized views, RLS policies, and secure functions).*
4. Enable the `pg_cron` extension in your database settings if you want the materialized views to auto-refresh.

### 2. Python Environment Setup
1. Ensure Python 3.10+ is installed.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the values from your Supabase Project Settings (API Settings & Database Settings).
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(Never expose this to the frontend!)*
   - `DATABASE_URL` *(Used by the benchmark script for direct psycopg2 connections).*

### 4. Running Scripts

**Create an Admin:**
```bash
python scripts/create_admin.py <admin_email> <password> <full_name>
```

**Seed the Database:**
```bash
python scripts/seed_data.py
```

**Run Benchmarks & Concurrency Tests:**
*(Verifies that row-level locking strictly enforces capacity limits and prevents duplicate registrations).*
```bash
python scripts/benchmark.py
```

### 5. Start the FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```

Once running, you can view the interactive API documentation at:
`http://localhost:8000/docs`

## Architectural Highlights

- **Transactions & Concurrency:** The `register_for_event` PostgreSQL function uses `SELECT ... FOR UPDATE` row-level locks to completely prevent race conditions during high-volume signups.
- **Security Definer:** Swiping and registering operate inside `SECURITY DEFINER` functions to maintain safe state transitions without exposing underlying table permissions to the client.
- **Row Level Security (RLS):** Policies are rigorously enforced. A student can only view their own messages, their own swipes, and their own matches.
- **Advanced Indexing:** Employs B-Trees for standard queries, GIN for searching skills/arrays and Full-Text Search on event details, and GiST for geospatial location queries (via PostGIS).
- **Analytics View:** Implements `admin_analytics_matview`, a materialized view designed to be refreshed via `pg_cron`, ensuring the admin dashboard loads instantly even with millions of records.
