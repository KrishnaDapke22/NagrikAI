from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    original_text = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    subcategory = Column(String(100), nullable=True)
    language = Column(String(50), default="English")
    sentiment = Column(String(50), nullable=True)
    severity = Column(String(50), default="MEDIUM", index=True)      # LOW, MEDIUM, HIGH, CRITICAL
    priority = Column(String(50), default="MEDIUM", index=True)      # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", index=True)          # OPEN, IN_PROGRESS, RESOLVED, REJECTED, REOPENED
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    location_text = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    landmark = Column(String(255), nullable=True)
    grid_cell_id = Column(String(50), nullable=True, index=True)
    zone_name = Column(String(100), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    before_image_url = Column(String(500), nullable=True)
    after_image_url = Column(String(500), nullable=True)
    media_type = Column(String(50), default="IMAGE")                # IMAGE, VIDEO, AUDIO, DOCUMENT
    audio_transcript = Column(Text, nullable=True)
    yolo_detections = Column(Text, nullable=True)
    is_identity_protected = Column(Boolean, default=False, index=True)
    is_public = Column(Boolean, default=True, index=True)
    is_emergency = Column(Boolean, default=False, index=True)
    affected_count = Column(Integer, default=1)
    spam_risk_score = Column(Float, default=0.0)
    is_flagged_spam = Column(Boolean, default=False, index=True)
    duplicate_count = Column(Integer, default=0)
    predicted_resolution_days = Column(Float, nullable=True)
    sla_deadline = Column(DateTime, nullable=True, index=True)
    is_escalated = Column(Boolean, default=False, index=True)
    appeal_reason = Column(Text, nullable=True)
    reopen_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="complaints")
    incident = relationship("Incident", back_populates="complaints")
    ai_analysis = relationship("AIAnalysis", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    similar_complaints = relationship("SimilarComplaint", back_populates="complaint", foreign_keys="SimilarComplaint.complaint_id", cascade="all, delete-orphan")
    resolutions = relationship("Resolution", back_populates="complaint", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="complaint", cascade="all, delete-orphan")
    community_supports = relationship("CommunitySupport", back_populates="complaint", cascade="all, delete-orphan")
    community_comments = relationship("CommunityComment", back_populates="complaint", cascade="all, delete-orphan")
