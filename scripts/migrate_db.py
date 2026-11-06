import sqlite3
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import engine, Base
import backend.app.models

# Create any missing tables (incidents, notifications, community tables, etc.)
Base.metadata.create_all(bind=engine)

# Connect to the actual database configured in engine
with engine.connect() as conn:
    from sqlalchemy import text
    
    # 1. Update complaints table
    result = conn.execute(text("PRAGMA table_info(complaints)")).fetchall()
    cols = [r[1] for r in result]
    print("Current complaints columns:", cols)

    new_complaint_cols = [
        ("original_text", "TEXT"),
        ("translated_text", "TEXT"),
        ("incident_id", "INTEGER"),
        ("is_escalated", "BOOLEAN DEFAULT 0"),
        ("appeal_reason", "TEXT"),
        ("reopen_count", "INTEGER DEFAULT 0"),
        ("landmark", "VARCHAR(255)"),
        ("grid_cell_id", "VARCHAR(50)"),
        ("zone_name", "VARCHAR(100)"),
        ("before_image_url", "VARCHAR(500)"),
        ("after_image_url", "VARCHAR(500)"),
        ("media_type", "VARCHAR(50) DEFAULT 'IMAGE'"),
        ("audio_transcript", "TEXT"),
        ("yolo_detections", "TEXT"),
        ("is_identity_protected", "BOOLEAN DEFAULT 0"),
        ("is_public", "BOOLEAN DEFAULT 1"),
        ("is_emergency", "BOOLEAN DEFAULT 0"),
        ("affected_count", "INTEGER DEFAULT 1"),
        ("spam_risk_score", "FLOAT DEFAULT 0.0"),
        ("is_flagged_spam", "BOOLEAN DEFAULT 0"),
        ("sla_deadline", "DATETIME")
    ]

    for col_name, col_type in new_complaint_cols:
        if col_name not in cols:
            print(f"Adding column '{col_name}' ({col_type}) to complaints...")
            conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}"))

    # 2. Update users table
    u_result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
    u_cols = [r[1] for r in u_result]
    new_user_cols = [
        ("phone", "VARCHAR(50)"),
        ("avatar_url", "VARCHAR(500)"),
        ("is_verified", "BOOLEAN DEFAULT 1"),
        ("protect_identity_default", "BOOLEAN DEFAULT 0")
    ]
    for col_name, col_type in new_user_cols:
        if col_name not in u_cols:
            print(f"Adding column '{col_name}' ({col_type}) to users...")
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
    
    conn.commit()

    # List tables
    tables = [r[0] for r in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()]
    print("Database tables verified:", tables)

print("Migration completed successfully.")
