import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_login_citizen():
    res = client.post("/api/auth/login", json={
        "email": "citizen@civicai.gov",
        "password": "citizen123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CITIZEN"

def test_login_officer():
    res = client.post("/api/auth/login", json={
        "email": "officer@civicai.gov",
        "password": "officer123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "OFFICER"

def test_login_admin():
    res = client.post("/api/auth/login", json={
        "email": "admin@civicai.gov",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["role"] == "ADMIN"

def test_ai_analyze_endpoint():
    res = client.post("/api/ai/analyze", json={
        "complaint": "The street light near my college has been off for 5 days and it is becoming unsafe at night."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Electricity"
    assert data["subcategory"] == "Street Light"
    assert data["sentiment"] == "Concerned"
    assert data["priority"] in ["HIGH", "CRITICAL"]
    assert len(data["explanations"]) > 0
    assert data["recommendation"] is not None

def test_complaint_submission_workflow():
    # 1. Login citizen
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@civicai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Submit complaint
    comp_res = client.post("/api/complaints", headers=headers, json={
        "title": "Severe pothole near Wakad Bridge",
        "description": "A deep crater pothole near Wakad Bridge is causing heavy traffic congestion and accidents.",
        "location_text": "Wakad Bridge",
        "category": "Roads"
    })
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    complaint_id = comp_data["id"]
    assert comp_data["category"] == "Roads"
    assert comp_data["status"] == "OPEN"
    assert comp_data["department_name"] == "Road Maintenance"

    # 3. Login officer
    off_login = client.post("/api/auth/login", json={
        "email": "officer@civicai.gov",
        "password": "officer123"
    })
    off_token = off_login.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    # 4. Officer status update to IN_PROGRESS
    st_res = client.post(f"/api/officer/complaints/{complaint_id}/status?new_status=IN_PROGRESS", headers=off_headers)
    assert st_res.status_code == 200

    # 5. Officer human-in-the-loop override
    ov_res = client.post(f"/api/officer/complaints/{complaint_id}/override", headers=off_headers, json={
        "priority": "CRITICAL",
        "reason": "Safety hazard near bridge intersection"
    })
    assert ov_res.status_code == 200
    assert ov_res.json()["priority"] == "CRITICAL"

    # 6. Officer resolves complaint
    res_res = client.post(f"/api/officer/complaints/{complaint_id}/resolve", headers=off_headers, json={
        "action_taken": "Filled and compacted asphalt using vibratory roller.",
        "remarks": "Surface leveling verified flush."
    })
    assert res_res.status_code == 200

    # 7. Citizen submits feedback
    fb_res = client.post(f"/api/complaints/{complaint_id}/feedback", headers=headers, json={
        "rating": 5,
        "comment": "Super quick response and excellent patch work!",
        "is_satisfied": True
    })
    assert fb_res.status_code == 200
    assert fb_res.json()["rating"] == 5

def test_admin_analytics():
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@civicai.gov",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/admin/analytics", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["kpis"]["total_complaints"] > 0
    assert len(data["category_distribution"]) > 0
    assert len(data["department_workloads"]) > 0
    assert "model_metrics" in data

def test_multilingual_ai_analysis():
    # 1. Test Hindi complaint
    hindi_res = client.post("/api/ai/analyze", json={
        "complaint": "हमारे इलाके में पानी की पाइपलाइन फूट गई है और बहुत जल व्यर्थ हो रहा है"
    })
    assert hindi_res.status_code == 200
    hindi_data = hindi_res.json()
    assert hindi_data["language"] == "Hindi"
    assert hindi_data["category"] == "Water"
    assert hindi_data["original_text"] is not None

    # 2. Test Marathi complaint
    marathi_res = client.post("/api/ai/analyze", json={
        "complaint": "रस्त्यावर खूप मोठा खड्डा पडला आहे आणि अपघात होण्याचा धोका आहे कृपया दुरुस्ती करा"
    })
    assert marathi_res.status_code == 200
    marathi_data = marathi_res.json()
    assert marathi_data["language"] == "Marathi"
    assert marathi_data["category"] == "Roads"
    assert marathi_data["priority"] in ["MEDIUM", "HIGH", "CRITICAL"]

def test_notifications_workflow():
    # Citizen login
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@civicai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get notifications
    notif_res = client.get("/api/notifications", headers=headers)
    assert notif_res.status_code == 200
    data = notif_res.json()
    assert "notifications" in data
    assert "unread_count" in data

    # Mark all read
    read_all = client.post("/api/notifications/read-all", headers=headers)
    assert read_all.status_code == 200

def test_incident_management_workflow():
    # Officer login
    off_login = client.post("/api/auth/login", json={
        "email": "officer@civicai.gov",
        "password": "officer123"
    })
    token = off_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create incident
    inc_res = client.post("/api/incidents", headers=headers, json={
        "title": "Substation Power Surge Cluster",
        "category": "Electricity",
        "priority": "HIGH",
        "location_text": "Shivajinagar Station",
        "latitude": 18.5314,
        "longitude": 73.8446
    })
    assert inc_res.status_code == 200
    inc_data = inc_res.json()
    inc_id = inc_data["id"]

    # 2. List incidents
    list_res = client.get("/api/incidents", headers=headers)
    assert list_res.status_code == 200
    assert any(i["id"] == inc_id for i in list_res.json())

def test_citizen_appeal_and_reopen_workflow():
    # Citizen login
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@civicai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit complaint
    comp_res = client.post("/api/complaints", headers=headers, json={
        "title": "Foul smell from open garbage bin",
        "description": "Garbage dump opposite school is overflowing with severe odor and fly infestation.",
        "location_text": "Shivajinagar Market",
        "category": "Sanitation"
    })
    assert comp_res.status_code == 200
    c_id = comp_res.json()["id"]

    # Officer resolves it
    off_login = client.post("/api/auth/login", json={
        "email": "officer@civicai.gov",
        "password": "officer123"
    })
    off_token = off_login.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    client.post(f"/api/officer/complaints/{c_id}/resolve", headers=off_headers, json={
        "action_taken": "Waste clearing squad deployed and container disinfected.",
        "remarks": "Cleared fully."
    })

    # Citizen appeals & reopens
    reopen_res = client.post(f"/api/complaints/{c_id}/reopen", headers=headers, json={
        "reason": "Waste truck cleared only half the pile; garbage still overflowing."
    })
    assert reopen_res.status_code == 200
    reopen_data = reopen_res.json()
    assert reopen_data["status"] == "REOPENED"
    assert reopen_data["reopen_count"] == 1
    assert "half the pile" in reopen_data["appeal_reason"]

def test_image_relevance_and_upload_security():
    # Citizen login
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@civicai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Invalid file extension rejection
    bad_upload = client.post(
        "/api/uploads",
        headers=headers,
        files={"file": ("malicious.exe", b"fake binary executable content", "application/octet-stream")}
    )
    assert bad_upload.status_code == 400
    assert "not permitted" in bad_upload.json()["detail"]

    # 2. Image relevance evaluation
    rel_res = client.post("/api/uploads/verify-relevance", headers=headers, json={
        "image_url": "/uploads/sample_pothole.jpg",
        "category": "Roads",
        "description": "Deep crater pothole causing vehicle tire punctures."
    })
    assert rel_res.status_code == 200
    rel_data = rel_res.json()
    assert rel_data["is_relevant"] is True
    assert rel_data["relevance_score"] > 0.70

def test_sla_escalation_engine():
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@civicai.gov",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.post("/api/admin/escalations/check", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "scanned_count" in data
    assert "escalated_count" in data

def test_privacy_first_citizen_identity():
    # 1. Citizen submits complaint with Protect My Identity enabled
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@nagrikai.gov",
        "password": "citizen123"
    })
    c_token = login_res.json()["access_token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}

    comp_res = client.post("/api/complaints", headers=c_headers, json={
        "title": "Confidential sewer overflow concern",
        "description": "Raw sewage overflowing near residential gate, reporting anonymously to avoid neighborhood confrontation.",
        "location_text": "Kothrud Ward 12",
        "category": "Drainage and Sanitation",
        "is_identity_protected": True
    })
    assert comp_res.status_code == 200
    c_id = comp_res.json()["id"]

    # 2. Officer views complaints - citizen personal information must be masked
    off_login = client.post("/api/auth/login", json={
        "email": "officer@nagrikai.gov",
        "password": "officer123"
    })
    off_token = off_login.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    off_list = client.get("/api/officer/complaints?all_departments=true", headers=off_headers)
    assert off_list.status_code == 200
    matched = next((item for item in off_list.json() if item["id"] == c_id), None)
    assert matched is not None
    assert matched["is_identity_protected"] is True
    assert "Verified Citizen – Identity Protected" in matched["citizen_badge"]
    assert "Aarav Sharma" not in matched["citizen_name"] # Officer must NOT see real name

    # 3. Admin authorized identity disclosure workflow with mandatory reason logging
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@nagrikai.gov",
        "password": "admin123"
    })
    adm_token = admin_login.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    reveal_res = client.post(
        f"/api/complaints/{c_id}/reveal-identity",
        headers=adm_headers,
        json={"reason": "Statutory health inspector safety audit requiring complainant contact."}
    )
    assert reveal_res.status_code == 200
    assert reveal_res.json()["audit_recorded"] is True
    assert "Aarav Sharma" in reveal_res.json()["name"]

def test_yolo_civic_image_detection():
    # Citizen login
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@nagrikai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/uploads/detect-yolo", headers=headers, json={
        "image_url": "/uploads/test_pothole.jpg",
        "category_hint": "Roads and Infrastructure",
        "text_context": "Deep asphalt crater on bridge"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["detected"] is True
    assert "pothole" in data["primary_class"]
    assert data["confidence"] > 0.70
    assert len(data["objects"]) > 0
    assert data["annotated_image_url"] is not None

def test_municipal_grid_zones_analytics():
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@nagrikai.gov",
        "password": "admin123"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/admin/grid-zones", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["grid_cells"]) == 16 # 4x4 grid
    assert len(data["zones"]) > 0
    assert "red_cells_count" in data
    assert "total_active_complaints" in data

def test_nagrikai_community_feed_and_interactions():
    # 1. Citizen login & submit public complaint
    login_res = client.post("/api/auth/login", json={
        "email": "citizen@nagrikai.gov",
        "password": "citizen123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    comp_res = client.post("/api/complaints", headers=headers, json={
        "title": "Community Park swing broken",
        "description": "Children's playground swing chain is snapped creating an injury risk.",
        "location_text": "Shivajinagar Garden",
        "category": "Parks and Public Spaces",
        "is_public": True
    })
    c_id = comp_res.json()["id"]

    # 2. Public community feed retrieval
    feed_res = client.get("/api/complaints/community")
    assert feed_res.status_code == 200
    assert any(c["id"] == c_id for c in feed_res.json())

    # 3. Community upvote / support toggle
    supp_res = client.post(f"/api/complaints/{c_id}/support", headers=headers)
    assert supp_res.status_code == 200
    assert supp_res.json()["supported"] is True

    # 4. Add official comment by officer
    off_login = client.post("/api/auth/login", json={
        "email": "officer@nagrikai.gov",
        "password": "officer123"
    })
    off_token = off_login.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    cmt_res = client.post(f"/api/complaints/{c_id}/comments", headers=off_headers, json={
        "comment": "Park maintenance squad has barricaded the swing and replacement hardware is ordered."
    })
    assert cmt_res.status_code == 200
    assert cmt_res.json()["is_official_response"] is True


