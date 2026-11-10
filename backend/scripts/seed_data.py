import os
import random
from faker import Faker
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import timedelta, datetime

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
fake = Faker()

def seed_database(num_students=50, num_events=10):
    print("Starting database seeding...")
    
    # 1. Create Students
    student_ids = []
    print(f"Creating {num_students} students...")
    for _ in range(num_students):
        email = fake.unique.email()
        res = supabase.auth.admin.create_user({
            "email": email,
            "password": "Password123!",
            "email_confirm": True
        })
        uid = res.user.id
        student_ids.append(uid)
        
        # Profile might be created by a trigger, so upsert
        skills = random.sample(['React', 'Python', 'Node.js', 'UI/UX', 'Figma', 'Marketing', 'Machine Learning', 'Data Science'], k=random.randint(2, 5))
        interests = random.sample(['Web3', 'AI', 'Startups', 'FinTech', 'EdTech', 'Open Source'], k=random.randint(1, 4))
        
        supabase.table("profiles").upsert({
            "id": uid,
            "full_name": fake.name(),
            "email": email,
            "bio": fake.text(max_nb_chars=150),
            "skills": skills,
            "interests": interests,
            "role": "student"
        }).execute()
        
    # 2. Create Events
    event_ids = []
    print(f"Creating {num_events} events...")
    admin_id = student_ids[0] # Just use the first student as the creator for demo
    
    for _ in range(num_events):
        event_date = fake.date_between(start_date='today', end_date='+30d')
        res = supabase.table("events").insert({
            "title": fake.catch_phrase(),
            "description": fake.paragraph(),
            "category": random.choice(['Technology', 'Business', 'Arts & Design', 'Sciences', 'Seminar']),
            "event_date": str(event_date),
            "start_time": "10:00:00",
            "end_time": "14:00:00",
            "venue": fake.company() + " Building",
            "capacity": random.randint(10, 50),
            "registration_deadline": str(event_date - timedelta(days=1)) + "T23:59:59Z",
            "required_skills": random.sample(['React', 'Python', 'UI/UX'], k=random.randint(0, 2)),
            "created_by": admin_id
        }).execute()
        event_ids.append(res.data[0]['id'])
        
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
