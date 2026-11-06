from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.session import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    status = Column(String(50), default="OPEN", index=True)  # OPEN, IN_PROGRESS, RESOLVED, REOPENED
    priority = Column(String(50), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    severity = Column(String(50), default="MEDIUM")
    primary_complaint_id = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_text = Column(String(255), nullable=True)
    affected_citizen_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    department = relationship("Department")
    complaints = relationship("Complaint", back_populates="incident")
