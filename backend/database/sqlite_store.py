import sqlite3
import json
import os
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "campus_connect.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Tables
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        major TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        branch TEXT DEFAULT '',
        year TEXT DEFAULT '',
        skills TEXT DEFAULT '[]',
        interests TEXT DEFAULT '[]',
        role TEXT NOT NULL DEFAULT 'student',
        created_at TEXT NOT NULL
    );
    """)
    profile_columns = {
        row["name"] for row in cursor.execute("PRAGMA table_info(profiles);").fetchall()
    }
    if "major" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN major TEXT DEFAULT '';")
        cursor.execute("UPDATE profiles SET major = branch WHERE major = '';")
    if "password_hash" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN password_hash TEXT DEFAULT '';")
    if "status" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active';")
    if "github" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN github TEXT DEFAULT '';")
    if "linkedin" not in profile_columns:
        cursor.execute("ALTER TABLE profiles ADD COLUMN linkedin TEXT DEFAULT '';")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Technology',
        club TEXT DEFAULT 'Engineering Council',
        event_date TEXT,
        start_time TEXT DEFAULT '10:00:00',
        end_time TEXT DEFAULT '18:00:00',
        venue TEXT DEFAULT 'Campus Center',
        venue_name TEXT DEFAULT 'Campus Center',
        capacity INTEGER NOT NULL DEFAULT 100,
        registered INTEGER NOT NULL DEFAULT 0,
        registration_deadline TEXT,
        required_skills TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        is_team_event INTEGER NOT NULL DEFAULT 0,
        min_team_size INTEGER NOT NULL DEFAULT 1,
        max_team_size INTEGER NOT NULL DEFAULT 4,
        required_registration_fields TEXT DEFAULT '["Full Name", "Roll Number", "Department", "GitHub URL"]',
        latitude REAL DEFAULT 17.385044,
        longitude REAL DEFAULT 78.486671,
        start_at TEXT,
        deadline_at TEXT,
        expire_at TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(created_by) REFERENCES profiles(id) ON DELETE SET NULL
    );
    """)

    event_columns = {
        row["name"] for row in cursor.execute("PRAGMA table_info(events);").fetchall()
    }
    event_additions = {
        "event_type": "TEXT NOT NULL DEFAULT 'event'",
        "banner_url": "TEXT DEFAULT ''",
        "participation_mode": "TEXT DEFAULT 'Offline'",
        "registration_start": "TEXT",
        "eligibility": "TEXT DEFAULT ''",
        "problem_statements": "TEXT DEFAULT '[]'",
        "themes": "TEXT DEFAULT '[]'",
        "prizes": "TEXT DEFAULT '[]'",
        "sponsors": "TEXT DEFAULT '[]'",
        "organizers": "TEXT DEFAULT '[]'",
        "registration_link": "TEXT DEFAULT ''",
        "approval_required": "INTEGER NOT NULL DEFAULT 0",
        "published_at": "TEXT",
    }
    for column, ddl in event_additions.items():
        if column not in event_columns:
            cursor.execute(f"ALTER TABLE events ADD COLUMN {column} {ddl};")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_registrations (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT,
        credentials TEXT DEFAULT '{}',
        registered_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(event_id, student_id)
    );
    """)

    registration_columns = {
        row["name"] for row in cursor.execute("PRAGMA table_info(event_registrations);").fetchall()
    }
    if "status" not in registration_columns:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN status TEXT NOT NULL DEFAULT 'approved';")
    if "team_name" not in registration_columns:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN team_name TEXT DEFAULT '';")
    if "reviewed_at" not in registration_columns:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN reviewed_at TEXT;")
    if "reviewed_by" not in registration_columns:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN reviewed_by TEXT;")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        preferred_skills TEXT DEFAULT '[]',
        team_code TEXT UNIQUE NOT NULL,
        leader_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY(leader_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL,
        FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY(student_id) REFERENCES profiles(id) ON DELETE CASCADE,
        UNIQUE(team_id, student_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        receiver_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE(team_id, receiver_id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pulse_activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id TEXT,
        event_id TEXT,
        action_label TEXT DEFAULT 'View',
        action_link TEXT DEFAULT '/events',
        created_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        department TEXT DEFAULT 'All',
        year TEXT DEFAULT 'All',
        priority TEXT NOT NULL DEFAULT 'normal',
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT,
        created_at TEXT NOT NULL,
        published_at TEXT,
        FOREIGN KEY(created_by) REFERENCES profiles(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        actor_id TEXT,
        actor_email TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        detail TEXT DEFAULT '',
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(status);")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_unique_user_event ON event_registrations(student_id, event_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);")

    # Ensure verified admin profile exists
    cursor.execute("SELECT id FROM profiles WHERE email = 'faculty.admin@university.edu';")
    if not cursor.fetchone():
        now = datetime.utcnow().isoformat()
        cursor.execute("""
        INSERT INTO profiles (id, email, full_name, bio, branch, year, skills, interests, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            'admin_faculty_1',
            'faculty.admin@university.edu',
            'Dr. Sarah Mitchell',
            'Faculty Advisor & Head of Engineering Council',
            'Administration',
            'Faculty',
            json.dumps(['Academic Leadership', 'Event Coordination']),
            json.dumps(['Student Innovation', 'Tech Symposia']),
            'admin',
            now
        ))

    # Provision the default faculty administrator password when unset
    cursor.execute("SELECT password_hash FROM profiles WHERE email = 'faculty.admin@university.edu';")
    admin_row = cursor.fetchone()
    if admin_row and not admin_row["password_hash"]:
        cursor.execute(
            "UPDATE profiles SET password_hash = ? WHERE email = 'faculty.admin@university.edu';",
            (hash_password('CampusAdmin2026!'),)
        )

    conn.commit()
    conn.close()

# --- Password hashing for faculty/admin accounts ---
def hash_password(password, salt=None):
    salt = salt or uuid.uuid4().hex
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 120000).hex()
    return f"pbkdf2_sha256${salt}${digest}"

def verify_password(password, stored):
    if not stored:
        return False
    try:
        _, salt, digest = stored.split('$', 2)
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 120000).hex()
    return hmac.compare_digest(candidate, digest)

def purge_all_records():
    """TRUNCATE / DELETE all dummy events, registrations, teams, invitations, and non-admin profiles."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pulse_activities;")
    cursor.execute("DELETE FROM team_invitations;")
    cursor.execute("DELETE FROM team_members;")
    cursor.execute("DELETE FROM teams;")
    cursor.execute("DELETE FROM event_registrations;")
    cursor.execute("DELETE FROM events;")
    # Keep only faculty admin profiles
    cursor.execute("DELETE FROM profiles WHERE role != 'admin' AND email NOT LIKE '%faculty%';")
    conn.commit()
    conn.close()

# --- Profiles ---
def ensure_profile(user_id, email, full_name=None, role='student', skills=None, interests=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM profiles WHERE email = ?;", (email,))
    row = cursor.fetchone()
    now = datetime.utcnow().isoformat()
    if not row:
        cursor.execute("SELECT id FROM profiles WHERE id = ?;", (user_id,))
        row_id = cursor.fetchone()
        if not row_id:
            cursor.execute("""
            INSERT INTO profiles (id, email, full_name, major, bio, branch, year, skills, interests, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                user_id,
                email,
                full_name or email.split('@')[0],
                '',
                '',
                '',
                '',
                json.dumps(skills if skills is not None else []),
                json.dumps(interests if interests is not None else []),
                role,
                now
            ))
            actual_id = user_id
        else:
            actual_id = row_id["id"]
    else:
        actual_id = row["id"]
        cursor.execute("UPDATE profiles SET role = ?, full_name = COALESCE(full_name, ?) WHERE id = ?;", (role, full_name, actual_id))
    conn.commit()
    conn.close()
    return actual_id

def db_get_profile(user_id):
    conn = get_db()
    row = conn.execute(
        "SELECT id, email, full_name, major, bio, branch, year, skills, interests, role, github, linkedin FROM profiles WHERE id = ?;",
        (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None

    profile = dict(row)
    for field in ("skills", "interests"):
        try:
            profile[field] = json.loads(profile[field] or "[]")
        except (TypeError, json.JSONDecodeError):
            profile[field] = []
    return profile

def db_update_profile(user_id, updates):
    allowed_fields = {"full_name", "major", "bio", "branch", "year", "skills", "interests", "github", "linkedin"}
    fields = {key: value for key, value in updates.items() if key in allowed_fields}
    if not fields:
        return db_get_profile(user_id)

    if "major" in fields:
        fields["branch"] = fields["major"]
    elif "branch" in fields:
        fields["major"] = fields["branch"]
    for field in ("skills", "interests"):
        if field in fields:
            fields[field] = json.dumps(fields[field])

    assignments = ", ".join(f"{field} = ?" for field in fields)
    conn = get_db()
    conn.execute(
        f"UPDATE profiles SET {assignments} WHERE id = ?;",
        (*fields.values(), user_id)
    )
    conn.commit()
    conn.close()
    return db_get_profile(user_id)

# --- Events CRUD ---
PUBLISHED_STATUSES = ('published', 'Active')

def _load_json(value, fallback=None):
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else (fallback or [])
    except (TypeError, json.JSONDecodeError):
        return fallback or []

def _serialize_event(r):
    return {
        "id": r["id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "club": r["club"],
        "date": r["event_date"] or "Upcoming",
        "time": r["start_time"] or "10:00 AM",
        "venue": r["venue"],
        "venue_name": r["venue_name"],
        "capacity": r["capacity"],
        "registered": r["registered"],
        "requiredSkills": _load_json(r["required_skills"]),
        "tags": _load_json(r["tags"]),
        "is_team_event": bool(r["is_team_event"]),
        "min_team_size": r["min_team_size"],
        "max_team_size": r["max_team_size"],
        "required_registration_fields": _load_json(r["required_registration_fields"]),
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "start_at": r["start_at"],
        "deadline_at": r["deadline_at"],
        "expire_at": r["expire_at"],
        "status": r["status"],
        "event_type": r["event_type"] or "event",
        "banner_url": r["banner_url"] or "",
        "participation_mode": r["participation_mode"] or "Offline",
        "registration_start": r["registration_start"],
        "eligibility": r["eligibility"] or "",
        "problem_statements": _load_json(r["problem_statements"]),
        "themes": _load_json(r["themes"]),
        "prizes": _load_json(r["prizes"]),
        "sponsors": _load_json(r["sponsors"]),
        "organizers": _load_json(r["organizers"]),
        "registration_link": r["registration_link"] or "",
        "approval_required": bool(r["approval_required"]),
        "published_at": r["published_at"],
        "created_by": r["created_by"],
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
    }

def db_get_events(include_unpublished=False, user_id=None):
    conn = get_db()
    cursor = conn.cursor()
    if include_unpublished:
        cursor.execute("SELECT * FROM events ORDER BY created_at DESC;")
    else:
        cursor.execute(
            "SELECT * FROM events WHERE status IN ('published', 'Active') ORDER BY created_at DESC;"
        )
    rows = cursor.fetchall()
    events = [_serialize_event(r) for r in rows]

    registered_ids = set()
    if user_id:
        cursor.execute("SELECT event_id FROM event_registrations WHERE student_id = ?;", (user_id,))
        registered_ids = {str(r["event_id"]) for r in cursor.fetchall()}
    for event in events:
        event["is_registered"] = str(event["id"]) in registered_ids

    conn.close()
    return events

def db_get_event(event_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM events WHERE id = ?;", (event_id,)).fetchone()
    conn.close()
    return _serialize_event(row) if row else None

def db_create_event(data, created_by_id):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    event_id = data.get("id") or str(uuid.uuid4())
    
    venue = data.get("venue") or data.get("venue_name") or "Main Campus"
    venue_name = data.get("venue_name") or venue
    event_date = data.get("event_date") or (data.get("start_at")[:10] if data.get("start_at") else now[:10])
    start_time = data.get("start_time") or "10:00:00"
    end_time = data.get("end_time") or "18:00:00"
    capacity = int(data.get("capacity") or 100)
    is_team = 1 if data.get("is_team_event") else 0
    min_size = int(data.get("min_team_size") or 1)
    max_size = int(data.get("max_team_size") or 4)

    req_fields = data.get("required_registration_fields") or ["Full Name", "Roll Number", "Department", "GitHub URL"]
    req_skills = data.get("required_skills") or data.get("tags") or []
    tags = data.get("tags") or req_skills

    creator = None
    if created_by_id:
        cursor.execute("SELECT id FROM profiles WHERE id = ?;", (created_by_id,))
        if cursor.fetchone():
            creator = created_by_id
        else:
            cursor.execute("SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;")
            admin_row = cursor.fetchone()
            if admin_row:
                creator = admin_row["id"]

    status = data.get("status") or "draft"
    if status == "Active":
        status = "published"
    published_at = now if status == "published" else None
    event_type = data.get("event_type") or "event"

    cursor.execute("""
    INSERT INTO events (
        id, title, description, category, club, event_date, start_time, end_time,
        venue, venue_name, capacity, registered, registration_deadline,
        required_skills, tags, is_team_event, min_team_size, max_team_size,
        required_registration_fields, latitude, longitude, start_at, deadline_at,
        expire_at, status, created_by, created_at, updated_at,
        event_type, banner_url, participation_mode, registration_start, eligibility,
        problem_statements, themes, prizes, sponsors, organizers, registration_link,
        approval_required, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        event_id,
        data.get("title", "Untitled Event"),
        data.get("description", ""),
        data.get("category", "Technology"),
        data.get("club") or data.get("organiser") or "Campus Council",
        event_date,
        start_time,
        end_time,
        venue,
        venue_name,
        capacity,
        data.get("deadline_at") or data.get("registration_deadline"),
        json.dumps(req_skills),
        json.dumps(tags),
        is_team,
        min_size,
        max_size,
        json.dumps(req_fields),
        float(data.get("latitude") or 17.385044),
        float(data.get("longitude") or 78.486671),
        data.get("start_at"),
        data.get("deadline_at"),
        data.get("expire_at"),
        status,
        creator,
        now,
        now,
        event_type,
        data.get("banner_url") or "",
        data.get("participation_mode") or "Offline",
        data.get("registration_start"),
        data.get("eligibility") or "",
        json.dumps(data.get("problem_statements") or []),
        json.dumps(data.get("themes") or tags),
        json.dumps(data.get("prizes") or []),
        json.dumps(data.get("sponsors") or []),
        json.dumps(data.get("organizers") or []),
        data.get("registration_link") or "",
        1 if data.get("approval_required") else 0,
        published_at
    ))
    conn.commit()
    conn.close()

    created = db_get_event(event_id)
    return created or {"id": event_id, "title": data.get("title"), "status": status}

def db_update_event(event_id, data):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    updates = []
    params = []

    fields_map = {
        "title": "title",
        "description": "description",
        "category": "category",
        "club": "club",
        "venue": "venue",
        "venue_name": "venue_name",
        "capacity": "capacity",
        "status": "status",
        "start_at": "start_at",
        "deadline_at": "deadline_at",
        "expire_at": "expire_at",
        "event_date": "event_date",
        "start_time": "start_time",
        "end_time": "end_time",
        "registration_deadline": "registration_deadline",
        "event_type": "event_type",
        "banner_url": "banner_url",
        "participation_mode": "participation_mode",
        "registration_start": "registration_start",
        "eligibility": "eligibility",
        "registration_link": "registration_link",
        "published_at": "published_at",
    }
    if data.get("status") == "Active":
        data["status"] = "published"
    if data.get("status") == "published" and not data.get("published_at"):
        data["published_at"] = now

    for k, col in fields_map.items():
        if k in data:
            updates.append(f"{col} = ?")
            params.append(data[k])

    if "is_team_event" in data:
        updates.append("is_team_event = ?")
        params.append(1 if data["is_team_event"] else 0)

    if "min_team_size" in data:
        updates.append("min_team_size = ?")
        params.append(int(data["min_team_size"]))

    if "max_team_size" in data:
        updates.append("max_team_size = ?")
        params.append(int(data["max_team_size"]))

    if "required_registration_fields" in data:
        updates.append("required_registration_fields = ?")
        params.append(json.dumps(data["required_registration_fields"]))

    if "tags" in data:
        updates.append("tags = ?")
        params.append(json.dumps(data["tags"]))

    if "required_skills" in data:
        updates.append("required_skills = ?")
        params.append(json.dumps(data["required_skills"]))

    for list_field in ("problem_statements", "themes", "prizes", "sponsors", "organizers"):
        if list_field in data:
            updates.append(f"{list_field} = ?")
            params.append(json.dumps(data[list_field] or []))

    if "approval_required" in data:
        updates.append("approval_required = ?")
        params.append(1 if data["approval_required"] else 0)

    if updates:
        updates.append("updated_at = ?")
        params.append(now)
        params.append(event_id)
        sql = f"UPDATE events SET {', '.join(updates)} WHERE id = ?;"
        cursor.execute(sql, params)
        conn.commit()

    conn.close()
    return True

def db_delete_event(event_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM events WHERE id = ?;", (event_id,))
    conn.commit()
    conn.close()
    return True

# --- Registrations ---
def db_register_for_event(event_id, user_id, user_name, credentials):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check event exists, is published & capacity
    cursor.execute("SELECT capacity, registered, is_team_event, min_team_size, max_team_size, status, approval_required, deadline_at FROM events WHERE id = ?;", (event_id,))
    ev = cursor.fetchone()
    if not ev:
        conn.close()
        raise ValueError("Event not found")

    if ev["status"] not in ('published', 'Active'):
        conn.close()
        raise ValueError("This event is not open for registration")

    if ev["deadline_at"]:
        try:
            if datetime.fromisoformat(ev["deadline_at"].replace('Z', '')) < datetime.utcnow():
                conn.close()
                raise ValueError("Registration deadline has passed")
        except ValueError as error:
            if "deadline has passed" in str(error):
                raise

    if ev["registered"] >= ev["capacity"]:
        conn.close()
        raise ValueError("Event is at full capacity")

    # Check already registered
    cursor.execute("SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?;", (event_id, user_id))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        raise ValueError("Already registered for this event")

    now = datetime.utcnow().isoformat()
    reg_id = f"reg_{str(event_id)[:6]}_{str(user_id)[:6]}_{int(datetime.utcnow().timestamp())}"
    
    # Ensure profile exists for student
    cursor.execute("SELECT id FROM profiles WHERE id = ?;", (user_id,))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO profiles (id, email, full_name, role, created_at)
        VALUES (?, ?, ?, 'student', ?);
        """, (user_id, f"{user_id}@campusconnect.edu", user_name, now))

    reg_status = "pending" if ev["approval_required"] else "approved"
    credentials = credentials or {}
    team_name = credentials.get("Team Name") or credentials.get("team_name") or ""

    cursor.execute("""
    INSERT INTO event_registrations (id, event_id, student_id, student_name, credentials, registered_at, status, team_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        reg_id,
        event_id,
        user_id,
        user_name,
        json.dumps(credentials),
        now,
        reg_status,
        team_name
    ))

    # Increment registered count only when the seat is confirmed
    if reg_status == "approved":
        cursor.execute("UPDATE events SET registered = registered + 1 WHERE id = ?;", (event_id,))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Registration submitted for faculty approval." if reg_status == "pending" else "Successfully registered for event!",
        "registration_id": reg_id,
        "ticket_id": f"TKT-{str(event_id)[:4].upper()}-{str(uuid.uuid4())[:4].upper()}",
        "event_id": event_id,
        "status": reg_status,
        "is_team_event": bool(ev["is_team_event"]),
        "min_team_size": ev["min_team_size"],
        "max_team_size": ev["max_team_size"],
        "registered_at": now,
        "credentials": credentials
    }

# --- Teams ---
def db_create_team(event_id, user_id, user_name, team_name, description, preferred_skills, team_code):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    team_id = f"team_{str(event_id)[:4]}_{int(datetime.utcnow().timestamp())}"

    # Verify event
    cursor.execute("SELECT min_team_size, max_team_size FROM events WHERE id = ?;", (event_id,))
    ev = cursor.fetchone()
    min_size = ev["min_team_size"] if ev else 2
    max_size = ev["max_team_size"] if ev else 4
    # Ensure leader profile exists
    cursor.execute("SELECT id FROM profiles WHERE id = ?;", (user_id,))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO profiles (id, email, full_name, role, created_at)
        VALUES (?, ?, ?, 'student', ?);
        """, (user_id, f"{user_id}@campusconnect.edu", user_name, now))

    cursor.execute("""
    INSERT INTO teams (id, event_id, name, description, preferred_skills, team_code, leader_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        team_id,
        event_id,
        team_name,
        description or "",
        json.dumps(preferred_skills or []),
        team_code,
        user_id,
        now,
        now
    ))

    cursor.execute("""
    INSERT INTO team_members (id, team_id, student_id, student_name, role, joined_at)
    VALUES (?, ?, ?, ?, 'leader', ?);
    """, (
        str(uuid.uuid4()),
        team_id,
        user_id,
        user_name,
        now
    ))

    conn.commit()
    conn.close()

    return {
        "id": team_id,
        "event_id": event_id,
        "name": team_name,
        "description": description or "",
        "preferred_skills": preferred_skills or [],
        "team_code": team_code,
        "leader_id": user_id,
        "min_team_size": min_size,
        "max_team_size": max_size,
        "members": [
            {
                "student_id": user_id,
                "full_name": user_name,
                "role": "leader",
                "joined_at": now
            }
        ],
        "invitations": []
    }

def db_get_team_for_event(event_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT t.* FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE t.event_id = ? AND tm.student_id = ?;
    """, (event_id, user_id))
    t = cursor.fetchone()
    if not t:
        conn.close()
        return None

    team_id = t["id"]
    cursor.execute("SELECT * FROM team_members WHERE team_id = ?;", (team_id,))
    members_rows = cursor.fetchall()
    members = [{
        "student_id": m["student_id"],
        "full_name": m["student_name"] or "Teammate",
        "role": m["role"],
        "joined_at": m["joined_at"]
    } for m in members_rows]

    cursor.execute("SELECT * FROM team_invitations WHERE team_id = ?;", (team_id,))
    inv_rows = cursor.fetchall()
    invitations = [{
        "id": i["id"],
        "receiver_id": i["receiver_id"],
        "receiver_name": i["receiver_name"],
        "status": i["status"],
        "created_at": i["created_at"]
    } for i in inv_rows]

    conn.close()
    return {
        "id": t["id"],
        "event_id": t["event_id"],
        "name": t["name"],
        "description": t["description"],
        "preferred_skills": json.loads(t["preferred_skills"] or "[]"),
        "team_code": t["team_code"],
        "leader_id": t["leader_id"],
        "members": members,
        "invitations": invitations
    }

def db_join_team(team_code, user_id, user_name):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM teams WHERE team_code = ?;", (team_code.upper().strip(),))
    team = cursor.fetchone()
    if not team:
        conn.close()
        raise ValueError(f"No squad found with code {team_code}")

    team_id = team["id"]
    cursor.execute("SELECT id FROM team_members WHERE team_id = ? AND student_id = ?;", (team_id, user_id))
    if cursor.fetchone():
        conn.close()
        return db_get_team_for_event(team["event_id"], user_id)

    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO team_members (id, team_id, student_id, student_name, role, joined_at)
    VALUES (?, ?, ?, ?, 'member', ?);
    """, (str(uuid.uuid4()), team_id, user_id, user_name, now))

    conn.commit()
    conn.close()
    return db_get_team_for_event(team["event_id"], user_id)

def db_invite_team_member(team_id, sender_id, receiver_id, receiver_name):
    conn = get_db()
    cursor = conn.cursor()
    inv_id = f"inv_{str(team_id)[:6]}_{str(receiver_id)[:6]}_{int(datetime.utcnow().timestamp())}"
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO team_invitations (id, team_id, sender_id, receiver_id, receiver_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?);
    """, (inv_id, team_id, sender_id, receiver_id, receiver_name, now))
    conn.commit()
    conn.close()
    return {
        "id": inv_id,
        "team_id": team_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "receiver_name": receiver_name,
        "status": "pending",
        "created_at": now
    }

def db_get_team_invitations(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ti.*, t.name AS team_name, t.team_code, t.event_id
        FROM team_invitations ti
        JOIN teams t ON t.id = ti.team_id
        WHERE ti.receiver_id = ? AND ti.status = 'pending'
        ORDER BY ti.created_at DESC;
    """, (user_id,))
    rows = cursor.fetchall()
    invitations = []
    for r in rows:
        invitations.append({
            "id": r["id"],
            "team_id": r["team_id"],
            "team_name": r["team_name"],
            "team_code": r["team_code"],
            "event_id": r["event_id"],
            "sender_id": r["sender_id"],
            "status": r["status"],
            "created_at": r["created_at"],
        })
    conn.close()
    return invitations

def db_accept_team_invitation(invitation_id, user_id, user_name):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM team_invitations WHERE id = ? AND receiver_id = ?;", (invitation_id, user_id))
    inv = cursor.fetchone()
    if not inv:
        conn.close()
        raise ValueError("Invitation not found")
    if inv["status"] != "pending":
        conn.close()
        raise ValueError("Invitation is no longer pending")

    team_id = inv["team_id"]
    cursor.execute("SELECT * FROM teams WHERE id = ?;", (team_id,))
    team = cursor.fetchone()
    if not team:
        conn.close()
        raise ValueError("Team not found")

    now = datetime.utcnow().isoformat()
    cursor.execute("SELECT id FROM team_members WHERE team_id = ? AND student_id = ?;", (team_id, user_id))
    if not cursor.fetchone():
        member_id = f"member_{str(team_id)[:6]}_{str(user_id)[:6]}_{int(datetime.utcnow().timestamp())}"
        cursor.execute("""
            INSERT INTO team_members (id, team_id, student_id, student_name, role, joined_at)
            VALUES (?, ?, ?, ?, 'member', ?);
        """, (member_id, team_id, user_id, user_name, now))

    cursor.execute("UPDATE team_invitations SET status = 'accepted' WHERE id = ?;", (invitation_id,))
    conn.commit()
    conn.close()
    return db_get_team_for_event(team["event_id"], user_id)

# --- Stats & Analytics ---
def db_get_dashboard_stats(user_id=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as cnt FROM events WHERE status IN ('published', 'Active');")
    upcoming_events = cursor.fetchone()["cnt"]

    if user_id:
        cursor.execute("SELECT COUNT(DISTINCT event_id) as cnt FROM event_registrations WHERE student_id = ?;", (user_id,))
        registered_events = cursor.fetchone()["cnt"]
        cursor.execute("SELECT count(*) as cnt FROM profiles WHERE role != 'admin' AND id != ?;", (user_id,))
        teammates_count = cursor.fetchone()["cnt"]
    else:
        cursor.execute("SELECT count(*) as cnt FROM event_registrations;")
        registered_events = cursor.fetchone()["cnt"]
        cursor.execute("SELECT count(*) as cnt FROM profiles WHERE role != 'admin';")
        teammates_count = cursor.fetchone()["cnt"]

    cursor.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;")
    recent_activity = []
    for r in cursor.fetchall():
        actor_email = r["actor_email"] or "campus@connect.local"
        name = actor_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        initials = ''.join(part[0] for part in name.split()[:2]).upper() or 'CC'
        action = r["action"] or 'ACTIVITY'
        action_type = action.upper()
        if action_type in ('EVENT_PUBLISHED', 'PUBLISHED'):
            tag_color = 'bg-indigo-50 text-indigo-700 border-indigo-200'
            link = '/events'
        elif action_type in ('SEAT_RESERVED', 'REGISTERED'):
            tag_color = 'bg-emerald-50 text-emerald-700 border-emerald-200'
            link = '/events'
        elif action_type in ('SQUAD_CREATED', 'MEMBER_JOINED'):
            tag_color = 'bg-violet-50 text-violet-700 border-violet-200'
            link = '/matches'
        else:
            tag_color = 'bg-slate-50 text-slate-700 border-slate-200'
            link = '/events'
        created_at = r["created_at"] or ''
        time_label = created_at.replace('T', ' ')[:16] if created_at else 'Just now'
        recent_activity.append({
            "id": r["id"],
            "user": {
                "name": name,
                "initials": initials,
                "avatarGradient": 'from-indigo-600 via-blue-600 to-purple-600',
            },
            "type": action_type.replace('_', ' '),
            "tagColor": tag_color,
            "time": time_label,
            "desc": r["detail"] or f"{action_type.replace('_', ' ').title()} on {r['entity_type'] or 'campus'}.",
            "actionLabel": 'View',
            "actionLink": link,
        })

    conn.close()
    return {
        "upcomingEvents": upcoming_events,
        "registeredEvents": registered_events,
        "suggestedTeammates": teammates_count,
        "matches": 0,
        "recentActivity": recent_activity
    }

def db_get_admin_dashboard_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) as cnt FROM profiles WHERE role = 'student';")
    total_students = cursor.fetchone()["cnt"]

    cursor.execute("SELECT count(*) as cnt FROM events WHERE status IN ('published', 'Active');")
    active_events = cursor.fetchone()["cnt"]

    cursor.execute("SELECT count(*) as cnt FROM events;")
    total_events = cursor.fetchone()["cnt"]

    cursor.execute("SELECT count(*) as cnt FROM event_registrations;")
    total_registrations = cursor.fetchone()["cnt"]

    cursor.execute("SELECT count(*) as cnt FROM teams;")
    total_teams = cursor.fetchone()["cnt"]

    # Top skills dynamically
    cursor.execute("SELECT skills FROM profiles;")
    skill_rows = cursor.fetchall()
    skill_map = {}
    for r in skill_rows:
        try:
            sk_list = json.loads(r["skills"] or "[]")
            for s in sk_list:
                skill_map[s] = skill_map.get(s, 0) + 1
        except Exception:
            pass

    top_skills = [{"skill": k, "count": v} for k, v in sorted(skill_map.items(), key=lambda x: x[1], reverse=True)[:8]]

    # Event capacities
    cursor.execute("SELECT id, title, club, registered, capacity, status FROM events;")
    ev_rows = cursor.fetchall()
    event_capacities = []
    for e in ev_rows:
        pct = min(100, round((e["registered"] / (e["capacity"] or 1)) * 100))
        event_capacities.append({
            "id": e["id"],
            "title": e["title"],
            "club": e["club"],
            "registered": e["registered"],
            "capacity": e["capacity"],
            "percent": pct,
            "status": "Full" if e["registered"] >= e["capacity"] else e["status"]
        })

    cursor.execute("SELECT count(*) AS cnt FROM event_registrations WHERE status = 'pending';")
    pending_approvals = cursor.fetchone()["cnt"]

    cursor.execute("SELECT count(*) AS cnt FROM events WHERE event_type = 'hackathon' AND status IN ('published', 'Active');")
    active_hackathons = cursor.fetchone()["cnt"]

    cursor.execute(
        "SELECT count(*) AS cnt FROM events WHERE status IN ('published', 'Active') AND (event_date IS NULL OR event_date >= ?);",
        (datetime.utcnow().date().isoformat(),)
    )
    upcoming_events = cursor.fetchone()["cnt"]

    # Department participation
    cursor.execute("""
    SELECT COALESCE(NULLIF(p.branch, ''), 'Unassigned') AS department, COUNT(er.id) AS count
    FROM event_registrations er
    LEFT JOIN profiles p ON p.id = er.student_id
    WHERE er.status = 'approved'
    GROUP BY department ORDER BY count DESC;
    """)
    department_participation = [dict(r) for r in cursor.fetchall()]

    # 14-day registration velocity
    velocity = []
    for offset in range(13, -1, -1):
        day = (datetime.utcnow() - timedelta(days=offset)).date().isoformat()
        cursor.execute(
            "SELECT count(*) AS cnt FROM event_registrations WHERE DATE(registered_at) = ?;", (day,)
        )
        velocity.append({"date": day[5:], "registrations": cursor.fetchone()["cnt"]})

    # Per-event engagement
    cursor.execute("""
    SELECT e.id, e.title, e.event_type, e.capacity,
           COUNT(er.id) AS total,
           SUM(CASE WHEN er.status = 'approved' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN er.status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM events e LEFT JOIN event_registrations er ON er.event_id = e.id
    GROUP BY e.id ORDER BY total DESC LIMIT 10;
    """)
    event_engagement = [{
        "id": r["id"], "title": r["title"], "event_type": r["event_type"],
        "capacity": r["capacity"], "total": r["total"] or 0,
        "approved": r["approved"] or 0, "pending": r["pending"] or 0
    } for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;")
    recent_activity = []
    for r in cursor.fetchall():
        actor_email = r["actor_email"] or "campus@connect.local"
        name = actor_email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
        initials = ''.join(part[0] for part in name.split()[:2]).upper() or 'CC'
        action = r["action"] or 'ACTIVITY'
        action_type = action.upper()
        if action_type in ('EVENT_PUBLISHED', 'PUBLISHED'):
            tag_color = 'bg-indigo-50 text-indigo-700 border-indigo-200'
            link = '/events'
        elif action_type in ('SEAT_RESERVED', 'REGISTERED'):
            tag_color = 'bg-emerald-50 text-emerald-700 border-emerald-200'
            link = '/events'
        elif action_type in ('SQUAD_CREATED', 'MEMBER_JOINED'):
            tag_color = 'bg-violet-50 text-violet-700 border-violet-200'
            link = '/matches'
        else:
            tag_color = 'bg-slate-50 text-slate-700 border-slate-200'
            link = '/events'
        created_at = r["created_at"] or ''
        time_label = created_at.replace('T', ' ')[:16] if created_at else 'Just now'
        recent_activity.append({
            "id": r["id"],
            "user": {
                "name": name,
                "initials": initials,
                "avatarGradient": 'from-indigo-600 via-blue-600 to-purple-600',
            },
            "type": action_type.replace('_', ' '),
            "tagColor": tag_color,
            "time": time_label,
            "desc": r["detail"] or f"{action_type.replace('_', ' ').title()} on {r['entity_type'] or 'campus'}.",
            "actionLabel": 'View',
            "actionLink": link,
        })

    conn.close()
    return {
        "totalStudents": total_students,
        "total_students": total_students,
        "activeEvents": active_events,
        "active_events": active_events,
        "activeHackathons": active_hackathons,
        "active_hackathons": active_hackathons,
        "upcomingEvents": upcoming_events,
        "upcoming_events": upcoming_events,
        "totalEvents": total_events,
        "total_events": total_events,
        "totalRegistrations": total_registrations,
        "total_registrations": total_registrations,
        "pendingApprovals": pending_approvals,
        "pending_approvals": pending_approvals,
        "totalMatches": total_teams,
        "total_matches": total_teams,
        "totalTeams": total_teams,
        "total_teams": total_teams,
        "registrationVelocity": velocity,
        "registration_velocity": velocity,
        "topSkills": top_skills,
        "top_skills": top_skills,
        "eventCapacities": event_capacities,
        "event_capacities": event_capacities,
        "departmentParticipation": department_participation,
        "eventEngagement": event_engagement,
        "recentActivity": recent_activity,
    }

def db_get_admin_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE role = 'student' ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    users = []
    for r in rows:
        cursor.execute(
            "SELECT COUNT(*) AS cnt FROM event_registrations WHERE student_id = ?;",
            (r["id"],)
        )
        participation = cursor.fetchone()["cnt"]
        users.append({
            "id": r["id"],
            "full_name": r["full_name"],
            "email": r["email"],
            "major": r["major"] or r["branch"],
            "branch": r["branch"],
            "year": r["year"],
            "bio": r["bio"],
            "skills": _load_json(r["skills"]),
            "interests": _load_json(r["interests"]),
            "status": r["status"] or "active",
            "participation_count": participation,
            "created_at": r["created_at"]
        })
    conn.close()
    return users

# --- Admin accounts & roles ---
def db_get_portal_account(email):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE LOWER(email) = LOWER(?);", (email.strip(),)).fetchone()
    conn.close()
    if not row:
        return None
    account = dict(row)
    account["full_name"] = account.get("full_name") or account["email"].split('@')[0]
    account["role"] = account.get("role") or "student"
    account["status"] = account.get("status") or "active"
    return account

def db_get_portal_account_by_id(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM profiles WHERE id = ?;", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    account = dict(row)
    account["role"] = account.get("role") or "student"
    account["status"] = account.get("status") or "active"
    return account

def db_create_portal_account(email, password, full_name, role):
    if role not in ('admin', 'faculty'):
        raise ValueError("Role must be admin or faculty")
    conn = get_db()
    cursor = conn.cursor()
    existing = cursor.execute("SELECT id FROM profiles WHERE LOWER(email) = LOWER(?);", (email.strip(),)).fetchone()
    if existing:
        conn.close()
        raise ValueError("An account with this email already exists")
    now = datetime.utcnow().isoformat()
    user_id = "usr_" + uuid.uuid4().hex[:12]
    cursor.execute("""
    INSERT INTO profiles (id, email, full_name, major, bio, branch, year, skills, interests, role, created_at, password_hash, status)
    VALUES (?, ?, ?, '', '', 'Administration', 'Faculty', '[]', '[]', ?, ?, ?, 'active');
    """, (user_id, email.strip(), full_name.strip(), role, now, hash_password(password)))
    conn.commit()
    conn.close()
    return db_get_portal_account_by_id(user_id)

def db_get_faculty_accounts():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, email, full_name, role, status, created_at FROM profiles WHERE role IN ('faculty', 'admin') ORDER BY created_at ASC;"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def db_update_user_status(user_id, status):
    if status not in ('active', 'suspended'):
        raise ValueError("Status must be active or suspended")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE profiles SET status = ? WHERE id = ?;", (status, user_id))
    changed = cursor.rowcount
    conn.commit()
    conn.close()
    return changed > 0

def db_update_user_role(user_id, role):
    if role not in ('admin', 'faculty'):
        raise ValueError("Role must be admin or faculty")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE profiles SET role = ? WHERE id = ?;", (role, user_id))
    changed = cursor.rowcount
    conn.commit()
    conn.close()
    return changed > 0

# --- Registrations management ---
def db_get_admin_registrations(event_id=None, status=None, search=None):
    conn = get_db()
    cursor = conn.cursor()
    query = """
    SELECT er.*, e.title AS event_title, e.event_type, e.club AS event_club,
           p.email AS student_email, p.branch, p.year
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    LEFT JOIN profiles p ON p.id = er.student_id
    WHERE 1=1
    """
    params = []
    if event_id:
        query += " AND er.event_id = ?"
        params.append(event_id)
    if status and status != 'all':
        query += " AND er.status = ?"
        params.append(status)
    if search:
        query += " AND (LOWER(er.student_name) LIKE ? OR LOWER(p.email) LIKE ? OR LOWER(e.title) LIKE ?)"
        term = f"%{search.lower()}%"
        params.extend([term, term, term])
    query += " ORDER BY er.registered_at DESC LIMIT 500;"
    rows = cursor.execute(query, params).fetchall()

    registrations = []
    for r in rows:
        team = None
        cursor.execute(
            "SELECT t.name, t.team_code FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE t.event_id = ? AND tm.student_id = ?;",
            (r["event_id"], r["student_id"])
        )
        team_row = cursor.fetchone()
        if team_row:
            team = {"name": team_row["name"], "team_code": team_row["team_code"]}
        registrations.append({
            "id": r["id"],
            "event_id": r["event_id"],
            "event_title": r["event_title"],
            "event_type": r["event_type"],
            "event_club": r["event_club"],
            "student_id": r["student_id"],
            "student_name": r["student_name"] or "Student",
            "student_email": r["student_email"] or "",
            "branch": r["branch"] or "",
            "year": r["year"] or "",
            "status": r["status"] or "approved",
            "team": team,
            "team_name": r["team_name"] or (team or {}).get("name", ""),
            "credentials": json.loads(r["credentials"] or "{}"),
            "registered_at": r["registered_at"],
            "reviewed_at": r["reviewed_at"],
        })
    conn.close()
    return registrations

def db_get_student_registrations(user_id):
    conn = get_db()
    cursor = conn.cursor()
    query = """
    SELECT er.*, e.title AS event_title, e.event_type, e.club AS event_club,
           e.event_date, e.start_time, e.venue, e.venue_name, e.capacity, e.registered,
           p.email AS student_email, p.branch, p.year
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    LEFT JOIN profiles p ON p.id = er.student_id
    WHERE er.student_id = ?
    ORDER BY er.registered_at DESC LIMIT 200;
    """
    rows = cursor.execute(query, (user_id,)).fetchall()

    registrations = []
    for r in rows:
        team = None
        cursor.execute(
            "SELECT t.name, t.team_code FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE t.event_id = ? AND tm.student_id = ?;",
            (r["event_id"], r["student_id"])
        )
        team_row = cursor.fetchone()
        if team_row:
            team = {"name": team_row["name"], "team_code": team_row["team_code"]}
        registrations.append({
            "id": r["id"],
            "event_id": r["event_id"],
            "event_title": r["event_title"],
            "event_type": r["event_type"],
            "event_club": r["event_club"],
            "event_date": r["event_date"],
            "start_time": r["start_time"],
            "venue": r["venue"],
            "venue_name": r["venue_name"],
            "capacity": r["capacity"],
            "registered": r["registered"],
            "student_id": r["student_id"],
            "student_name": r["student_name"] or "Student",
            "student_email": r["student_email"] or "",
            "branch": r["branch"] or "",
            "year": r["year"] or "",
            "status": r["status"] or "approved",
            "team": team,
            "team_name": r["team_name"] or (team or {}).get("name", ""),
            "credentials": json.loads(r["credentials"] or "{}"),
            "registered_at": r["registered_at"],
            "reviewed_at": r["reviewed_at"],
        })
    conn.close()
    return registrations

def db_set_registration_status(reg_id, new_status, reviewer_id):
    if new_status not in ('approved', 'rejected', 'pending'):
        raise ValueError("Status must be approved, rejected or pending")
    conn = get_db()
    cursor = conn.cursor()
    row = cursor.execute("SELECT * FROM event_registrations WHERE id = ?;", (reg_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Registration not found")
    previous = row["status"] or "approved"
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "UPDATE event_registrations SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?;",
        (new_status, now, reviewer_id, reg_id)
    )
    if previous != "approved" and new_status == "approved":
        cursor.execute("UPDATE events SET registered = registered + 1 WHERE id = ?;", (row["event_id"],))
    elif previous == "approved" and new_status != "approved":
        cursor.execute(
            "UPDATE events SET registered = MAX(registered - 1, 0) WHERE id = ?;",
            (row["event_id"],)
        )
    conn.commit()
    conn.close()
    return {"success": True, "id": reg_id, "status": new_status}

# --- Announcements ---
def _serialize_announcement(r):
    return {
        "id": r["id"],
        "title": r["title"],
        "body": r["body"],
        "department": r["department"] or "All",
        "year": r["year"] or "All",
        "priority": r["priority"] or "normal",
        "status": r["status"] or "draft",
        "created_by": r["created_by"],
        "created_at": r["created_at"],
        "published_at": r["published_at"],
    }

def db_get_announcements(published_only=False, department=None, year=None):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM announcements WHERE 1=1"
    params = []
    if published_only:
        query += " AND status = 'published'"
    if department and department != 'All':
        query += " AND (department = 'All' OR department = ?)"
        params.append(department)
    if year and year != 'All':
        query += " AND (year = 'All' OR year = ?)"
        params.append(str(year))
    query += " ORDER BY created_at DESC LIMIT 100;"
    rows = cursor.execute(query, params).fetchall()
    conn.close()
    return [_serialize_announcement(r) for r in rows]

def db_create_announcement(data, actor_id):
    conn = get_db()
    cursor = conn.cursor()
    ann_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    status = data.get("status") or "draft"
    cursor.execute("""
    INSERT INTO announcements (id, title, body, department, year, priority, status, created_by, created_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        ann_id,
        data["title"].strip(),
        data["body"].strip(),
        data.get("department") or "All",
        str(data.get("year") or "All"),
        data.get("priority") or "normal",
        status,
        actor_id,
        now,
        now if status == "published" else None
    ))
    conn.commit()
    conn.close()
    return next((a for a in db_get_announcements() if a["id"] == ann_id), None)

def db_update_announcement(ann_id, data):
    conn = get_db()
    cursor = conn.cursor()
    existing = cursor.execute("SELECT * FROM announcements WHERE id = ?;", (ann_id,)).fetchone()
    if not existing:
        conn.close()
        raise ValueError("Announcement not found")
    fields = {}
    for key in ("title", "body", "department", "year", "priority", "status"):
        if key in data and data[key] is not None:
            fields[key] = str(data[key])
    if fields.get("status") == "published" and not existing["published_at"]:
        fields["published_at"] = datetime.utcnow().isoformat()
    if fields:
        assignments = ", ".join(f"{key} = ?" for key in fields)
        cursor.execute(
            f"UPDATE announcements SET {assignments} WHERE id = ?;",
            (*fields.values(), ann_id)
        )
        conn.commit()
    conn.close()
    return next((a for a in db_get_announcements() if a["id"] == ann_id), None)

def db_delete_announcement(ann_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM announcements WHERE id = ?;", (ann_id,))
    changed = cursor.rowcount
    conn.commit()
    conn.close()
    return changed > 0

# --- Activity logs ---
def db_log_activity(actor, action, entity_type, entity_id=None, detail=""):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO activity_logs (id, actor_id, actor_email, action, entity_type, entity_id, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        str(uuid.uuid4()),
        getattr(actor, "id", None) if actor else None,
        getattr(actor, "email", "") if actor else "",
        action,
        entity_type,
        entity_id,
        detail,
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()

def db_get_activity_logs(limit=50):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?;", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
