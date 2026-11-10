# CampusConnect (Campus Event & Team Finder)

> A modern, high-performance platform engineered for university ecosystems. Featuring Tinder-style event discovery, sub-16ms skill matching heuristics, PostgreSQL ACID-compliant seat allocation, and a restricted faculty governance console.

---

## 🏛️ Engineering Authors

- **Vadlakonda Yashwanth** — Lead Architect & Frontend Engineer
- **Konderi Ram Shankar** — Backend & Geospatial Systems Engineer
- **Yagati Shiva** — ML Heuristics & Graph Algorithms Engineer

---

## 🏗️ Repository Architecture

The project is cleanly decoupled into three independent, production-ready modules:

```
Campus-Connect/
├── frontend/             # React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
│   ├── src/              # Application components, routes, and design system
│   ├── public/           # Static web assets
│   ├── index.html        # SPA root HTML template
│   ├── vite.config.js    # Vite bundler configuration
│   └── package.json      # Dependencies and scripts
│
├── backend/              # FastAPI, Pydantic, Supabase Python Client
│   ├── main.py           # Core REST API endpoints and middleware
│   ├── models.py         # Pydantic schemas and request validators
│   ├── database.py       # Supabase service-role client helper
│   ├── requirements.txt  # Python package dependencies
│   └── scripts/          # Admin provisioning (create_admin.py) & seed scripts
│
└── database/             # PostgreSQL, PostGIS, pg_cron, Row-Level Security
    ├── init.sql          # Complete DDL schema, ACID triggers, RPCs, views
    ├── migrations/       # Incremental updates for existing database deployments
    └── README.md         # Database deployment and extension setup guide
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (Supabase / PostgreSQL)

1. Open your PostgreSQL or [Supabase](https://supabase.com) project SQL editor.
2. Ensure extensions are enabled:
   - `uuid-ossp`
   - `postgis`
   - `pg_cron`
3. Execute [`database/init.sql`](./database/init.sql). This establishes:
   - Tables (`profiles`, `events`, `event_registrations`, `teammate_swipes`, `matches`, `messages`)
   - PostgreSQL row locks for guaranteed seat allocations (`FOR UPDATE`)
   - `v_skill_demand` view and `admin_dashboard()`, `admin_list_users()` RPC functions
   - Comprehensive Row-Level Security (RLS) policies.
4. For an existing Supabase project, apply [`database/migrations/20261110_add_student_profile_fields.sql`](./database/migrations/20261110_add_student_profile_fields.sql) to add the saved major/year fields and enable profile realtime updates.

---

### 2. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-publishable-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Provision a verified faculty administrator account:
   ```bash
   python scripts/create_admin.py faculty.admin@university.edu CampusAdmin2026! "Faculty Administrator"
   ```
6. Start the API server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   API Documentation: `http://localhost:8000/docs`

---

### 3. Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
   VITE_BACKEND_URL=http://localhost:8000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🛡️ Core Platform Features

- **Tinder-Style Event Deck:** Interactive card stack (`framer-motion`) with gesture swiping for instant RSVPs.
- **Teammate Finder Deck:** Skill-weighted heuristics matching students based on complementary project interests.
- **ACID Row-Lock Reservations:** Database-level transaction concurrency preventing seat overbooking.
- **Faculty / Administrator Portal (`/admin/*`):**
  - Restricted role-based authentication guarding against student login.
  - Telemetry Dashboard with 14-day velocity chart, in-demand skills ranking, and visual capacity meters.
  - Event Management with PostGIS geospatial coordinates, tags array chip inputs, and cascade delete safeguards.
  - Real-time Student Directory with instant search, branch/year filters, and modal inspections.

---

## 📄 License & Attribution

Developed as a University Software Engineering Capstone Project.
Licensed under the MIT License.
