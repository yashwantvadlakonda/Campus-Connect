import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import threading

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Missing DATABASE_URL in .env")

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def run_explain_analyze(conn, query):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"EXPLAIN ANALYZE {query}")
        result = cur.fetchall()
        for row in result:
            print(row['QUERY PLAN'])

def benchmark_indexes():
    print("\n--- BENCHMARKING INDEXES ---")
    conn = get_connection()
    
    print("\n1. Querying Events by Date (Should use idx_events_date)")
    query = "SELECT * FROM events WHERE event_date = CURRENT_DATE"
    run_explain_analyze(conn, query)
    
    print("\n2. Full-Text Search on Events (Should use GIN idx_events_search)")
    query = "SELECT title FROM events WHERE search_vector @@ to_tsquery('english', 'hackathon')"
    run_explain_analyze(conn, query)

    conn.close()

def concurrent_registration_test():
    print("\n--- 50-WAY CONCURRENT REGISTRATION TEST ---")
    
    conn = get_connection()
    conn.autocommit = True
    
    # 1. Setup a test event with capacity 10
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Create a dummy user to own the event
        cur.execute("INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'testadmin@demo.com') ON CONFLICT DO NOTHING RETURNING id;")
        admin_id = cur.fetchone()['id'] if cur.rowcount > 0 else None
        if not admin_id:
            cur.execute("SELECT id FROM auth.users WHERE email = 'testadmin@demo.com'")
            admin_id = cur.fetchone()['id']
            
        cur.execute("INSERT INTO profiles (id, full_name, email, role) VALUES (%s, 'Test Admin', 'testadmin@demo.com', 'admin') ON CONFLICT DO NOTHING;", (admin_id,))
        
        cur.execute("""
            INSERT INTO events (title, description, category, event_date, start_time, end_time, venue, capacity, registration_deadline, created_by)
            VALUES ('Concurrent Test Event', 'Testing DB Locks', 'Technology', CURRENT_DATE + INTERVAL '10 days', '10:00', '12:00', 'Test Venue', 10, CURRENT_DATE + INTERVAL '5 days', %s)
            RETURNING id;
        """, (admin_id,))
        event_id = cur.fetchone()['id']
        
        # Create 50 dummy students
        student_ids = []
        for i in range(50):
            cur.execute(f"INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'student{i}@demo.com') ON CONFLICT DO NOTHING RETURNING id;")
            if cur.rowcount > 0:
                uid = cur.fetchone()['id']
                cur.execute("INSERT INTO profiles (id, full_name, email, role) VALUES (%s, %s, %s, 'student') ON CONFLICT DO NOTHING;", (uid, f"Student {i}", f"student{i}@demo.com"))
                student_ids.append(uid)
            else:
                cur.execute(f"SELECT id FROM auth.users WHERE email = 'student{i}@demo.com'")
                student_ids.append(cur.fetchone()['id'])

    print(f"Created Event ID: {event_id} with Capacity: 10")
    print("Launching 50 concurrent registration attempts...")

    success_count = 0
    fail_count = 0
    lock = threading.Lock()

    def register_student(student_id):
        nonlocal success_count, fail_count
        try:
            # Connect per thread
            thread_conn = get_connection()
            # Need to mock the auth.uid() context for the SECURITY DEFINER function to work
            # Normally done by Supabase PostgREST, we set it manually for the session
            with thread_conn.cursor() as cur:
                # Set local variable for the transaction
                cur.execute(f"SET LOCAL request.jwt.claims = '{{\"sub\": \"{student_id}\"}}';")
                
                # Execute the plpgsql function which handles locking and capacity checks
                cur.execute("SELECT register_for_event(%s);", (event_id,))
                
                with lock:
                    success_count += 1
            thread_conn.commit()
        except psycopg2.Error as e:
            thread_conn.rollback()
            with lock:
                fail_count += 1
        finally:
            thread_conn.close()

    threads = []
    for sid in student_ids:
        t = threading.Thread(target=register_student, args=(sid,))
        threads.append(t)
        t.start()
        
    for t in threads:
        t.join()
        
    print(f"\nResults:")
    print(f"Successful Registrations: {success_count} (Should be exactly 10)")
    print(f"Failed Registrations: {fail_count} (Should be 40)")
    
    # Verify final count in DB
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM event_registrations WHERE event_id = %s", (event_id,))
        final_count = cur.fetchone()[0]
        print(f"Final Count in DB: {final_count}")
        
        if final_count == 10:
            print("✅ TEST PASSED: Capacity strictly enforced via Row-Level Locks (SELECT FOR UPDATE).")
        else:
            print("❌ TEST FAILED: Race condition occurred.")

    conn.close()

if __name__ == "__main__":
    benchmark_indexes()
    concurrent_registration_test()
