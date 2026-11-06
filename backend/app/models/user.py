from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="CITIZEN")  # CITIZEN, OFFICER, ADMIN
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True)
    protect_identity_default = Column(Boolean, default=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department", back_populates="officers")
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    resolutions = relationship("Resolution", back_populates="officer")
    feedbacks = relationship("Feedback", back_populates="citizen")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    community_supports = relationship("CommunitySupport", back_populates="user", cascade="all, delete-orphan")
    community_comments = relationship("CommunityComment", back_populates="user", cascade="all, delete-orphan")
