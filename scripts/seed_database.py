import os
import sys
import random
from datetime import datetime, timedelta

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal, Base, engine
from backend.app.models.user import User
from backend.app.models.department import Department
from backend.app.models.complaint import Complaint
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.models.resolution import Resolution
from backend.app.models.feedback import Feedback
from backend.app.models.audit_log import AuditLog
from backend.app.models.community import CommunitySupport, CommunityComment
from backend.app.auth.security import hash_password
from backend.app.services.department_service import seed_default_departments, canonicalize_category
from backend.app.services.geocoding_service import geocode_location
from backend.app.services.grid_service import get_grid_cell_for_coordinates
from backend.app.services.audit_service import log_audit
import pandas as pd
import json

def seed():
    print("Starting NagrikAI database seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed departments
    seed_default_departments(db)
    departments = db.query(Department).all()
    dept_map = {d.name: d.id for d in departments}

    # 2. Seed Users (Both @nagrikai.gov and @civicai.gov for backward compatibility)
    print("Seeding users...")
    demo_users = [
        # NagrikAI Official Personas
        {"name": "Aarav Sharma (Citizen)", "email": "citizen@nagrikai.gov", "role": "CITIZEN", "password_hash": hash_password("citizen123"), "phone": "+91 98220 12345", "protect_identity_default": False, "department_id": None},
        {"name": "Priya Deshmukh (Officer)", "email": "officer@nagrikai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 54321", "protect_identity_default": False, "department_id": dept_map.get("Electrical Department")},
        {"name": "Rajesh Kulkarni (Admin)", "email": "admin@nagrikai.gov", "role": "ADMIN", "password_hash": hash_password("admin123"), "phone": "+91 98220 99999", "protect_identity_default": False, "department_id": None},
        {"name": "Sunita Verma (Water Officer)", "email": "water.officer@nagrikai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 33333", "protect_identity_default": False, "department_id": dept_map.get("Water Department")},
        {"name": "Vikas Patil (Road Officer)", "email": "road.officer@nagrikai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 44444", "protect_identity_default": False, "department_id": dept_map.get("Road Maintenance")},

        # CivicAI Aliases
        {"name": "Aarav Sharma (Citizen)", "email": "citizen@civicai.gov", "role": "CITIZEN", "password_hash": hash_password("citizen123"), "phone": "+91 98220 12345", "protect_identity_default": False, "department_id": None},
        {"name": "Priya Deshmukh (Officer)", "email": "officer@civicai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 54321", "protect_identity_default": False, "department_id": dept_map.get("Electrical Department")},
        {"name": "Rajesh Kulkarni (Admin)", "email": "admin@civicai.gov", "role": "ADMIN", "password_hash": hash_password("admin123"), "phone": "+91 98220 99999", "protect_identity_default": False, "department_id": None},
        {"name": "Sunita Verma (Water Officer)", "email": "water.officer@civicai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 33333", "protect_identity_default": False, "department_id": dept_map.get("Water Department")},
        {"name": "Vikas Patil (Road Officer)", "email": "road.officer@civicai.gov", "role": "OFFICER", "password_hash": hash_password("officer123"), "phone": "+91 98220 44444", "protect_identity_default": False, "department_id": dept_map.get("Road Maintenance")},
    ]

    for u_data in demo_users:
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if not existing:
            user = User(**u_data)
            db.add(user)
    db.commit()

    citizen_user = db.query(User).filter(User.email == "citizen@nagrikai.gov").first() or db.query(User).filter(User.email == "citizen@civicai.gov").first()
    officer_user = db.query(User).filter(User.email == "officer@nagrikai.gov").first() or db.query(User).filter(User.email == "officer@civicai.gov").first()

    # 3. Load dataset records to create realistic complaint records
    csv_path = os.path.join(os.path.dirname(__file__), "..", "ml", "data", "complaints_dataset.csv")
    df = pd.read_csv(csv_path)

    existing_count = db.query(Complaint).count()
    if existing_count < 100:
        print(f"Seeding complaints from dataset (current count: {existing_count})...")
        sample_df = df.sample(n=160, random_state=42)

        statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "RESOLVED", "RESOLVED", "REOPENED"]
        landmarks = ["Near Metro Station", "Opposite Government Hospital", "Next to Bus Depot", "Near Junction Signal", "Behind Public School", "Near City Market"]
        now = datetime.utcnow()

        for idx, row in sample_df.iterrows():
            days_ago = random.randint(1, 30)
            created_time = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            status = random.choice(statuses)

            lat, lng = geocode_location(row["location"])
            canon_cat = canonicalize_category(row["category"])
            dept_id = dept_map.get(canon_cat) or dept_map.get(row["category"]) or departments[0].id
            grid_cell_id, zone_name = get_grid_cell_for_coordinates(lat, lng)

            # 25% of complaints have citizen identity protected
            is_protected = (random.random() < 0.25)

            complaint = Complaint(
                citizen_id=citizen_user.id,
                title=f"{canon_cat}: {row['subcategory']} issue at {row['location']}",
                description=str(row["text"]),
                category=canon_cat,
                subcategory=str(row["subcategory"]),
                language="English",
                sentiment=str(row["sentiment"]),
                severity=str(row["severity"]),
                priority=str(row["priority"]),
                status=status,
                department_id=dept_id,
                location_text=str(row["location"]),
                landmark=random.choice(landmarks),
                latitude=lat,
                longitude=lng,
                grid_cell_id=grid_cell_id,
                zone_name=zone_name,
                image_url=None,
                before_image_url=None,
                after_image_url=None,
                media_type="IMAGE",
                is_identity_protected=is_protected,
                is_public=True,
                is_emergency=(str(row["priority"]) == "CRITICAL" and random.random() < 0.3),
                affected_count=random.randint(1, 18),
                spam_risk_score=round(random.uniform(0.01, 0.15), 2),
                is_flagged_spam=False,
                duplicate_count=int(row["duplicate_count"]),
                predicted_resolution_days=float(row["actual_resolution_days"]),
                sla_deadline=created_time + timedelta(hours=int(float(row["actual_resolution_days"]) * 24)),
                created_at=created_time,
                updated_at=created_time + timedelta(hours=random.randint(1, 12)),
                resolved_at=created_time + timedelta(days=int(row["actual_resolution_days"])) if status == "RESOLVED" else None
            )
            db.add(complaint)
            db.commit()
            db.refresh(complaint)

            # Add AI Analysis
            ai_analysis = AIAnalysis(
                complaint_id=complaint.id,
                category=complaint.category,
                category_confidence=round(random.uniform(0.88, 0.98), 3),
                subcategory=complaint.subcategory,
                subcategory_confidence=round(random.uniform(0.85, 0.96), 3),
                sentiment=complaint.sentiment,
                sentiment_confidence=round(random.uniform(0.82, 0.95), 3),
                severity=complaint.severity,
                severity_confidence=round(random.uniform(0.82, 0.94), 3),
                priority=complaint.priority,
                priority_confidence=round(random.uniform(0.86, 0.97), 3),
                duplicate_probability=round(random.uniform(0.1, 0.85), 2),
                location_confidence=0.92,
                model_version="v2.0-nagrik",
                explanation_json=json.dumps([
                    {"feature": "Safety Hazard", "impact": 32.5, "direction": "INCREASES_PRIORITY", "description": "Acute safety hazard identified"},
                    {"feature": "Severity Level", "impact": 28.0, "direction": "INCREASES_PRIORITY", "description": f"Assessed severity is {complaint.severity}"},
                    {"feature": "Duplicate Count", "impact": 18.5, "direction": "INCREASES_PRIORITY", "description": f"{complaint.duplicate_count} related complaints nearby"},
                    {"feature": "Days Unresolved", "impact": 12.0, "direction": "INCREASES_PRIORITY", "description": "Days reported unresolved"}
                ]),
                recommendation_json=json.dumps({
                    "summary": f"Municipal squad dispatched for {complaint.category} at {complaint.location_text}.",
                    "action_steps": [
                        "Dispatch technical crew for physical site inspection.",
                        "Isolate affected civic infrastructure safely.",
                        "Replace defective components and execute load testing.",
                        "Verify restoration with area residents."
                    ],
                    "possible_causes": ["Material fatigue or wear", "Surge overload or weather impact"],
                    "verification_checklist": ["Pre-repair inspection documented", "Post-repair performance test verified"],
                    "citizen_response_draft": f"Your complaint regarding {complaint.title} has been logged and is under active municipal resolution."
                }),
                created_at=created_time
            )
            db.add(ai_analysis)

            # If resolved, add resolution and feedback
            if status == "RESOLVED":
                resolution = Resolution(
                    complaint_id=complaint.id,
                    officer_id=officer_user.id,
                    action_taken=f"Technician squad resolved the {complaint.subcategory.lower()} at {complaint.location_text}.",
                    remarks="All functional safety checks cleared.",
                    evidence_url=None,
                    actual_resolution_days=float(row["actual_resolution_days"]),
                    resolved_at=complaint.resolved_at
                )
                db.add(resolution)

                # Add feedback
                if random.random() < 0.75:
                    rating = random.choice([4, 5, 5, 4, 3])
                    fb = Feedback(
                        complaint_id=complaint.id,
                        citizen_id=citizen_user.id,
                        rating=rating,
                        comment=random.choice([
                            "Promptly resolved by the NagrikAI municipal team. Excellent work!",
                            "Appreciate the quick action taken.",
                            "Work was completed satisfactorily.",
                            "Thank you for fixing this issue quickly."
                        ]),
                        is_satisfied=True,
                        created_at=complaint.resolved_at + timedelta(hours=2)
                    )
                    db.add(fb)

            # Add sample community comments / upvotes
            if random.random() < 0.40:
                supp = CommunitySupport(complaint_id=complaint.id, user_id=citizen_user.id)
                db.add(supp)

            if random.random() < 0.25:
                cmt = CommunityComment(
                    complaint_id=complaint.id,
                    user_id=officer_user.id,
                    comment="Municipal maintenance unit has inspected the site and scheduled restoration work.",
                    is_official_response=True,
                    created_at=created_time + timedelta(hours=6)
                )
                db.add(cmt)

            # Log audit trail
            log_audit(
                db=db,
                complaint_id=complaint.id,
                user_id=citizen_user.id,
                action="COMPLAINT_CREATED",
                field_name="status",
                old_value=None,
                new_value="OPEN"
            )

        db.commit()
        print(f"Successfully seeded database with {sample_df.shape[0]} complaints, resolutions, and community interactions!")
    else:
        # Ensure nagrik demo users exist
        print(f"Database already contains {existing_count} complaints. Checking demo users...")
        for u_data in demo_users:
            existing = db.query(User).filter(User.email == u_data["email"]).first()
            if not existing:
                user = User(**u_data)
                db.add(user)
        db.commit()

    db.close()

if __name__ == "__main__":
    seed()
