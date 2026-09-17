import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import text
from app.db.session import engine

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN membership_type VARCHAR(50);"))
        conn.execute(text("ALTER TABLE users ADD COLUMN membership_expires_at TIMESTAMP WITH TIME ZONE;"))
        print("Migration successful.")
    except Exception as e:
        print(f"Error: {e}")
