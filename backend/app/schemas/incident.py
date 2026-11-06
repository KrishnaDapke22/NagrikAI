from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IncidentLinkedComplaintItem(BaseModel):
    id: int
    title: str
    description: str
    citizen_name: Optional[str] = None
    priority: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: int
    title: str
    category: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    status: str
    priority: str
    severity: str
    primary_complaint_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_text: Optional[str] = None
    affected_citizen_count: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    linked_complaints: Optional[List[IncidentLinkedComplaintItem]] = []

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str
    category: str
    department_id: Optional[int] = None
    priority: Optional[str] = "MEDIUM"
    severity: Optional[str] = "MEDIUM"
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    primary_complaint_id: Optional[int] = None

class IncidentStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None
