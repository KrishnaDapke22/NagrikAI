from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from backend.app.database.session import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.incident import Incident
from backend.app.models.ai_analysis import AIAnalysis
from backend.app.models.similar_complaint import SimilarComplaint
from backend.app.models.feedback import Feedback
from backend.app.models.department import Department
from backend.app.models.user import User
from backend.app.models.community import CommunitySupport, CommunityComment
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintReopenRequest,
    CommunityCommentItem
)
from backend.app.schemas.feedback import FeedbackCreate, FeedbackResponse
from backend.app.schemas.ai_analysis import AIAnalysisResponse
from backend.app.auth.dependencies import get_current_user
from backend.app.ai.pipeline import civic_pipeline
from backend.app.services.geocoding_service import geocode_location
from backend.app.services.department_service import get_department_by_category, STANDARD_CATEGORIES, canonicalize_category
from backend.app.services.audit_service import log_audit
from backend.app.services.notification_service import create_notification, notify_officers_of_department
from backend.app.services.grid_service import get_grid_cell_for_coordinates
from backend.app.services.spam_service import evaluate_spam_risk

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def format_complaint_response(c: Complaint, viewer: Optional[User] = None) -> dict:
    # Privacy protection logic
    is_protected = bool(c.is_identity_protected)
    
    # Complainant name and badge resolution
    if is_protected:
        # Check if viewer is the author
        if viewer and viewer.id == c.citizen_id:
            citizen_name = f"{c.citizen.name} (You - Protected to Authorities)"
            citizen_badge = "Verified Citizen – Identity Protected"
        elif viewer and viewer.role == "ADMIN":
            citizen_name = f"{c.citizen.name} (Identity Protected - Admin Access)"
            citizen_badge = "Verified Citizen – Identity Protected"
        else:
            # Mask completely from officers and public feeds
            citizen_name = "Verified Citizen – Identity Protected"
            citizen_badge = "Verified Citizen – Identity Protected"
    else:
        citizen_name = c.citizen.name if c.citizen else "Citizen"
        citizen_badge = "Verified Citizen"

    supports_cnt = len(c.community_supports) if c.community_supports else 0
    comments_cnt = len(c.community_comments) if c.community_comments else 0
    has_supp = False
    if viewer and c.community_supports:
        has_supp = any(s.user_id == viewer.id for s in c.community_supports)

    return {
        "id": c.id,
        "citizen_id": c.citizen_id,
        "citizen_name": citizen_name,
        "citizen_badge": citizen_badge,
        "is_identity_protected": is_protected,
        "title": c.title,
        "description": c.description,
        "original_text": c.original_text or c.description,
        "translated_text": c.translated_text,
        "category": c.category,
        "subcategory": c.subcategory,
        "language": c.language or "English",
        "sentiment": c.sentiment,
        "severity": c.severity,
        "priority": c.priority,
        "status": c.status,
        "department_id": c.department_id,
        "department_name": c.department.name if c.department else None,
        "incident_id": c.incident_id,
        "location_text": c.location_text,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "landmark": c.landmark,
        "grid_cell_id": c.grid_cell_id,
        "zone_name": c.zone_name,
        "image_url": c.image_url,
        "before_image_url": c.before_image_url,
        "after_image_url": c.after_image_url,
        "media_type": c.media_type or "IMAGE",
        "audio_transcript": c.audio_transcript,
        "yolo_detections": c.yolo_detections,
        "is_public": bool(c.is_public),
        "is_emergency": bool(c.is_emergency),
        "affected_count": c.affected_count or 1,
        "spam_risk_score": c.spam_risk_score or 0.0,
        "duplicate_count": c.duplicate_count or 0,
        "predicted_resolution_days": c.predicted_resolution_days,
        "sla_deadline": c.sla_deadline,
        "is_escalated": bool(c.is_escalated),
        "appeal_reason": c.appeal_reason,
        "reopen_count": c.reopen_count or 0,
        "supports_count": supports_cnt,
        "comments_count": comments_cnt,
        "has_supported": has_supp,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
        "resolved_at": c.resolved_at
    }

@router.post("", response_model=ComplaintDetailResponse)
def submit_complaint(
    complaint_in: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch recent complaints for semantic duplicate detection
    recent = db.query(Complaint).order_by(Complaint.id.desc()).limit(150).all()
    recent_list = [
        {"id": r.id, "title": r.title, "description": r.description, "category": r.category, "status": r.status, "created_at": r.created_at}
        for r in recent
    ]

    # 2. Run real AI/ML Pipeline
    ai_result = civic_pipeline.analyze_complaint(
        complaint_text=complaint_in.description,
        title=complaint_in.title,
        location_override=complaint_in.location_text,
        existing_complaints=recent_list
    )

    # 3. Location handling & Spatial Grid Partition
    final_loc_text = complaint_in.location_text or ai_result.get("location_extracted") or "Pune Municipal Ward"
    lat, lng = complaint_in.latitude, complaint_in.longitude
    if lat is None or lng is None:
        lat, lng = geocode_location(final_loc_text)

    grid_cell_id, zone_name = get_grid_cell_for_coordinates(lat, lng)

    # 4. Department routing
    category = complaint_in.category or ai_result["category"]
    subcategory = complaint_in.subcategory or ai_result.get("subcategory")
    dept = get_department_by_category(db, category)
    dept_id = dept.id if dept else None

    # 5. Anti-Spam & Fraud Scoring
    spam_score, spam_flags, is_flagged = evaluate_spam_risk(
        db=db,
        citizen_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        latitude=lat,
        longitude=lng
    )

    # 6. SLA deadline calculation
    canon_cat = canonicalize_category(category)
    cat_info = STANDARD_CATEGORIES.get(canon_cat, {})
    sla_hours_map = cat_info.get("sla_hours", {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96})
    priority = "CRITICAL" if complaint_in.is_emergency else ai_result["priority"]
    target_hours = sla_hours_map.get(priority, 48)
    sla_deadline = datetime.utcnow() + timedelta(hours=target_hours)

    # 7. Check for strong duplicate match to automatically group into an Incident
    incident_id = None
    if ai_result.get("similar_complaints"):
        top_sim = ai_result["similar_complaints"][0]
        if top_sim.get("similarity_score", 0) >= 0.70:
            existing_match = db.query(Complaint).filter(Complaint.id == top_sim["id"]).first()
            if existing_match:
                if existing_match.incident_id:
                    incident_id = existing_match.incident_id
                    inc = db.query(Incident).filter(Incident.id == incident_id).first()
                    if inc:
                        inc.affected_citizen_count += (complaint_in.affected_count or 1)
                        inc.updated_at = datetime.utcnow()
                else:
                    new_inc = Incident(
                        title=f"Incident Cluster: {existing_match.title[:80]}",
                        category=category,
                        department_id=dept_id,
                        status="OPEN",
                        priority=priority,
                        severity=ai_result["severity"],
                        primary_complaint_id=existing_match.id,
                        latitude=lat,
                        longitude=lng,
                        location_text=final_loc_text,
                        affected_citizen_count=1 + (complaint_in.affected_count or 1)
                    )
                    db.add(new_inc)
                    db.commit()
                    db.refresh(new_inc)
                    existing_match.incident_id = new_inc.id
                    incident_id = new_inc.id

    # 8. Create Complaint entity
    is_protected = bool(complaint_in.is_identity_protected or current_user.protect_identity_default)

    complaint = Complaint(
        citizen_id=current_user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        original_text=ai_result.get("original_text", complaint_in.description),
        translated_text=ai_result.get("translated_text", ""),
        category=category,
        subcategory=subcategory,
        language=ai_result["language"],
        sentiment=ai_result["sentiment"],
        severity=ai_result["severity"],
        priority=priority,
        status="OPEN",
        department_id=dept_id,
        incident_id=incident_id,
        location_text=final_loc_text,
        latitude=lat,
        longitude=lng,
        landmark=complaint_in.landmark,
        grid_cell_id=grid_cell_id,
        zone_name=zone_name,
        image_url=complaint_in.image_url,
        before_image_url=complaint_in.before_image_url or complaint_in.image_url,
        media_type=complaint_in.media_type or "IMAGE",
        audio_transcript=complaint_in.audio_transcript,
        yolo_detections=complaint_in.yolo_detections,
        is_identity_protected=is_protected,
        is_public=complaint_in.is_public if complaint_in.is_public is not None else True,
        is_emergency=bool(complaint_in.is_emergency),
        affected_count=complaint_in.affected_count or 1,
        spam_risk_score=spam_score,
        is_flagged_spam=is_flagged,
        duplicate_count=ai_result["duplicate_count"],
        predicted_resolution_days=ai_result["predicted_resolution_days"],
        sla_deadline=sla_deadline
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 9. Save AI Analysis record
    ai_record = AIAnalysis(
        complaint_id=complaint.id,
        category=category,
        category_confidence=ai_result["category_confidence"],
        subcategory=subcategory,
        subcategory_confidence=ai_result["subcategory_confidence"],
        sentiment=ai_result["sentiment"],
        sentiment_confidence=ai_result["sentiment_confidence"],
        severity=ai_result["severity"],
        severity_confidence=ai_result["severity_confidence"],
        priority=priority,
        priority_confidence=ai_result["priority_confidence"],
        duplicate_probability=ai_result["duplicate_probability"],
        location_confidence=ai_result["location_confidence"],
        model_version=ai_result["model_version"],
        explanation_json=json.dumps(ai_result["explanations"]),
        recommendation_json=json.dumps(ai_result["recommendation"])
    )
    db.add(ai_record)

    # 10. Save Similar Complaints links
    for sim in ai_result.get("similar_complaints", []):
        if sim.get("similar_complaint_id"):
            link = SimilarComplaint(
                complaint_id=complaint.id,
                similar_complaint_id=sim["similar_complaint_id"],
                similarity_score=sim["similarity_score"]
            )
            db.add(link)

    db.commit()

    # 11. Log Audit
    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="COMPLAINT_CREATED",
        field_name="status",
        old_value=None,
        new_value=f"OPEN [Protected: {is_protected}, SpamScore: {spam_score}]"
    )

    # 12. Send In-App Notifications
    ref_id = f"NAGRIK-{str(complaint.id).zfill(5)}"
    dept_label = dept.name if dept else "General Administration"
    create_notification(
        db=db,
        user_id=current_user.id,
        title="Grievance Registered Successfully",
        message=f"Your grievance {ref_id} has been registered and auto-routed to {dept_label} with {priority} priority. {'Identity Protected' if is_protected else ''}",
        event_type="COMPLAINT_SUBMITTED",
        complaint_id=complaint.id
    )

    notify_officers_of_department(
        db=db,
        department_id=dept_id,
        title=f"New Grievance Filed: {ref_id}",
        message=f"A new {priority} priority complaint '{complaint.title}' has been dispatched to {dept_label}.",
        event_type="COMPLAINT_SUBMITTED",
        complaint_id=complaint.id
    )

    return get_complaint_detail(complaint.id, current_user, db)

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    department_id: Optional[int] = None,
    grid_cell_id: Optional[str] = None,
    zone_name: Optional[str] = None,
    search: Optional[str] = None,
    my_complaints: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    if my_complaints or current_user.role == "CITIZEN":
        query = query.filter(Complaint.citizen_id == current_user.id)

    if status:
        query = query.filter(Complaint.status == status.upper())
    if priority:
        query = query.filter(Complaint.priority == priority.upper())
    if category:
        canon = canonicalize_category(category)
        query = query.filter((Complaint.category == category) | (Complaint.category == canon))
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if grid_cell_id:
        query = query.filter(Complaint.grid_cell_id == grid_cell_id)
    if zone_name:
        query = query.filter(Complaint.zone_name.ilike(f"%{zone_name}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.title.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.location_text.ilike(s)) |
            (Complaint.landmark.ilike(s))
        )

    complaints = query.order_by(Complaint.created_at.desc()).limit(200).all()
    return [format_complaint_response(c, current_user) for c in complaints]

@router.get("/community", response_model=List[ComplaintResponse])
def get_community_feed(
    category: Optional[str] = None,
    zone_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    NagrikAI Community: Public Civic Issue Stream (Twitter/X style).
    Displays verified civic grievances with citizen identities strictly protected when requested.
    """
    query = db.query(Complaint).filter(
        Complaint.is_public == True,
        Complaint.is_flagged_spam == False
    )

    if category:
        canon = canonicalize_category(category)
        query = query.filter((Complaint.category == category) | (Complaint.category == canon))
    if zone_name:
        query = query.filter(Complaint.zone_name.ilike(f"%{zone_name}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Complaint.title.ilike(s)) |
            (Complaint.description.ilike(s)) |
            (Complaint.location_text.ilike(s))
        )

    complaints = query.order_by(Complaint.created_at.desc()).limit(100).all()
    return [format_complaint_response(c, None) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Authorization check for citizens
    if current_user.role == "CITIZEN" and complaint.citizen_id != current_user.id:
        # If public, citizen can view in public view mode
        if not complaint.is_public:
            raise HTTPException(status_code=403, detail="Not authorized to view this grievance.")

    data = format_complaint_response(complaint, current_user)

    # Format AI Analysis
    ai_resp = None
    if complaint.ai_analysis:
        an = complaint.ai_analysis
        explanations = json.loads(an.explanation_json) if an.explanation_json else []
        recommendation = json.loads(an.recommendation_json) if an.recommendation_json else None
        ai_resp = {
            "id": an.id,
            "complaint_id": an.complaint_id,
            "category": an.category or complaint.category,
            "category_confidence": an.category_confidence,
            "subcategory": an.subcategory,
            "subcategory_confidence": an.subcategory_confidence,
            "sentiment": an.sentiment,
            "sentiment_confidence": an.sentiment_confidence,
            "severity": an.severity,
            "severity_confidence": an.severity_confidence,
            "priority": an.priority,
            "priority_confidence": an.priority_confidence,
            "duplicate_probability": an.duplicate_probability,
            "duplicate_count": complaint.duplicate_count,
            "location_extracted": complaint.location_text,
            "location_confidence": an.location_confidence,
            "department": complaint.department.name if complaint.department else "General Administration",
            "predicted_resolution_days": complaint.predicted_resolution_days or 2.0,
            "model_version": an.model_version or "v1.0",
            "explanations": explanations,
            "recommendation": recommendation,
            "created_at": an.created_at
        }

    # Format Similar Complaints
    sim_items = []
    for sc in complaint.similar_complaints:
        sim_c = sc.similar
        if sim_c:
            sim_items.append({
                "id": sc.id,
                "similar_complaint_id": sc.similar_complaint_id,
                "title": sim_c.title,
                "similarity_score": sc.similarity_score,
                "status": sim_c.status,
                "category": sim_c.category,
                "created_at": sc.created_at
            })

    # Format Resolutions
    res_items = [
        {
            "id": r.id,
            "officer_name": r.officer.name if r.officer else "Assigned Officer",
            "action_taken": r.action_taken,
            "remarks": r.remarks,
            "evidence_url": r.evidence_url,
            "actual_resolution_days": r.actual_resolution_days,
            "resolved_at": r.resolved_at
        }
        for r in complaint.resolutions
    ]

    # Format Feedback
    fb_item = None
    if complaint.feedback:
        fb = complaint.feedback
        fb_item = {
            "id": fb.id,
            "rating": fb.rating,
            "comment": fb.comment,
            "is_satisfied": fb.is_satisfied,
            "created_at": fb.created_at
        }

    # Format Community Comments
    comment_items = [
        {
            "id": cmt.id,
            "user_id": cmt.user_id,
            "user_name": "Municipal Official" if cmt.is_official_response else (cmt.user.name if not complaint.is_identity_protected or cmt.user_id != complaint.citizen_id else "Verified Citizen"),
            "user_role": cmt.user.role if cmt.user else "CITIZEN",
            "is_official_response": bool(cmt.is_official_response),
            "comment": cmt.comment,
            "created_at": cmt.created_at
        }
        for cmt in complaint.community_comments
    ]

    data["ai_analysis"] = ai_resp
    data["similar_complaints"] = sim_items
    data["resolutions"] = res_items
    data["feedback"] = fb_item
    data["comments"] = comment_items

    return data

@router.post("/{complaint_id}/support")
def toggle_complaint_support(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    NagrikAI Community: 'I am affected too' / Support button.
    Increases citizen affected count and updates community engagement.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    existing = db.query(CommunitySupport).filter(
        CommunitySupport.complaint_id == complaint_id,
        CommunitySupport.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        complaint.affected_count = max(1, (complaint.affected_count or 1) - 1)
        db.commit()
        return {"supported": False, "affected_count": complaint.affected_count}
    else:
        supp = CommunitySupport(complaint_id=complaint_id, user_id=current_user.id)
        db.add(supp)
        complaint.affected_count = (complaint.affected_count or 1) + 1
        db.commit()
        return {"supported": True, "affected_count": complaint.affected_count}

@router.post("/{complaint_id}/comments")
def add_complaint_comment(
    complaint_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    NagrikAI Community: Adds a public comment or official response.
    """
    comment_text = payload.get("comment", "").strip()
    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment text cannot be empty.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_official = current_user.role in ["OFFICER", "ADMIN"]
    comment = CommunityComment(
        complaint_id=complaint_id,
        user_id=current_user.id,
        comment=comment_text,
        is_official_response=is_official
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # If official, notify filing citizen
    if is_official and complaint.citizen_id != current_user.id:
        create_notification(
            db=db,
            user_id=complaint.citizen_id,
            title="Official Response on Your Grievance",
            message=f"An official municipal authority posted an update on #{complaint.id}: '{comment_text[:80]}...'",
            event_type="OFFICIAL_RESPONSE",
            complaint_id=complaint.id
        )

    return {
        "id": comment.id,
        "user_name": "Municipal Authority" if is_official else current_user.name,
        "comment": comment.comment,
        "is_official_response": is_official,
        "created_at": comment.created_at.isoformat()
    }

@router.post("/{complaint_id}/reveal-identity")
def reveal_protected_identity(
    complaint_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Privacy-First Authorized Access: Allows authorized Administrator to view protected citizen identity.
    Enforces mandatory reason recording and immutable audit logging.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only administrators can request protected identity disclosure.")

    reason = payload.get("reason", "").strip()
    if len(reason) < 10:
        raise HTTPException(status_code=400, detail="A valid administrative reason (minimum 10 characters) is required for audit logging.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Record immutable audit log
    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="AUDIT_PROTECTED_IDENTITY_VIEW",
        field_name="is_identity_protected",
        old_value="PROTECTED",
        new_value=f"VIEWED_BY_ADMIN_{current_user.id}: {reason}"
    )

    citizen = complaint.citizen
    return {
        "complaint_id": complaint.id,
        "citizen_id": citizen.id,
        "name": citizen.name,
        "email": citizen.email,
        "phone": citizen.phone or "Not provided",
        "created_at": citizen.created_at.isoformat(),
        "audit_recorded": True
    }

@router.post("/{complaint_id}/feedback", response_model=FeedbackResponse)
def submit_complaint_feedback(
    complaint_id: int,
    fb_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the submitting citizen can provide feedback.")

    existing = db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback has already been submitted for this complaint.")

    feedback = Feedback(
        complaint_id=complaint_id,
        citizen_id=current_user.id,
        rating=fb_in.rating,
        comment=fb_in.comment,
        is_satisfied=fb_in.is_satisfied
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    log_audit(
        db=db,
        complaint_id=complaint_id,
        user_id=current_user.id,
        action="FEEDBACK_SUBMITTED",
        field_name="rating",
        old_value=None,
        new_value=str(fb_in.rating)
    )

    return feedback

@router.post("/{complaint_id}/reopen", response_model=ComplaintDetailResponse)
def reopen_complaint(
    complaint_id: int,
    reopen_in: ComplaintReopenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role != "ADMIN" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the filing citizen or an administrator can reopen this grievance.")

    if complaint.status != "RESOLVED":
        raise HTTPException(status_code=400, detail="Only resolved complaints can be appealed or reopened.")

    old_status = complaint.status
    complaint.status = "REOPENED"
    complaint.resolved_at = None
    complaint.appeal_reason = reopen_in.reason
    complaint.reopen_count = (complaint.reopen_count or 0) + 1
    complaint.updated_at = datetime.utcnow()
    if reopen_in.evidence_url:
        complaint.image_url = reopen_in.evidence_url

    db.commit()

    ref_id = f"NAGRIK-{str(complaint.id).zfill(5)}"

    log_audit(
        db=db,
        complaint_id=complaint.id,
        user_id=current_user.id,
        action="COMPLAINT_REOPENED",
        field_name="status",
        old_value=old_status,
        new_value=f"REOPENED (Reason: {reopen_in.reason})"
    )

    notify_officers_of_department(
        db=db,
        department_id=complaint.department_id,
        title=f"⚠️ Grievance Reopened: {ref_id}",
        message=f"Citizen has appealed resolution for {ref_id}. Reason: {reopen_in.reason}",
        event_type="REOPENED",
        complaint_id=complaint.id
    )

    return get_complaint_detail(complaint.id, current_user, db)
