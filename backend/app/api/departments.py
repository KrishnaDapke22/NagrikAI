from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.database.session import get_db
from backend.app.models.department import Department
from backend.app.schemas.department import DepartmentResponse
from backend.app.services.department_service import STANDARD_CATEGORIES

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/categories")
def list_categories():
    """
    Returns the 10 standard NagrikAI civic grievance categories, subcategories, and SLA targets.
    """
    return {
        "categories": [
            {
                "name": name,
                "department": data["department"],
                "subcategories": data["subcategories"],
                "sla_hours": data["sla_hours"]
            }
            for name, data in STANDARD_CATEGORIES.items()
        ]
    }
