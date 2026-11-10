import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

# Initialize Supabase client with the service role key to bypass RLS and manage users
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def create_admin(email, password, full_name):
    print(f"Creating administrator: {email}...")
    
    try:
        # 1. Create user in auth.users using admin api
        res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        user_id = res.user.id
        print(f"User created in auth.users with ID: {user_id}")
        
        # 2. Update or insert into profiles table with 'admin' role
        # We use upsert because a trigger might have already created a basic profile row
        supabase.table("profiles").upsert({
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "role": "admin"
        }).execute()
        
        print("Successfully created administrator account!")
        print("Note: The service role key used for this operation must NEVER be exposed in the frontend.")
        
    except Exception as e:
        print(f"Failed to create admin: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <email> <password> <full_name>")
        sys.exit(1)
        
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3]
    
    create_admin(email, password, full_name)
