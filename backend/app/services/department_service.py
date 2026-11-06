from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.models.department import Department

STANDARD_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "Roads and Infrastructure": {
        "department": "Road Maintenance",
        "subcategories": ["Potholes", "Damaged roads", "Broken footpaths", "Damaged bridges", "Defective dividers"],
        "sla_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96}
    },
    "Waste Management": {
        "department": "Sanitation Department",
        "subcategories": ["Garbage accumulation", "Overflowing dustbins", "Illegal dumping", "Dead animal removal", "Biohazard waste"],
        "sla_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 36, "LOW": 72}
    },
    "Water Supply": {
        "department": "Water Department",
        "subcategories": ["Water leakage", "Water shortage", "Contaminated water", "Pipeline burst", "Low water pressure"],
        "sla_hours": {"CRITICAL": 8, "HIGH": 24, "MEDIUM": 48, "LOW": 72}
    },
    "Drainage and Sanitation": {
        "department": "Drainage Department",
        "subcategories": ["Blocked drainage", "Overflowing sewage", "Flooding", "Open drain hazard", "Septic tank leak"],
        "sla_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 72}
    },
    "Electricity and Streetlights": {
        "department": "Electrical Department",
        "subcategories": ["Broken streetlights", "Power-related public infrastructure issues", "Exposed electrical wires", "Damaged transformer", "Flickering streetlights"],
        "sla_hours": {"CRITICAL": 8, "HIGH": 18, "MEDIUM": 36, "LOW": 72}
    },
    "Public Safety": {
        "department": "Public Safety",
        "subcategories": ["Damaged public structures", "Dangerous open manholes", "Unsafe public areas", "Stray animal aggression", "Fire hazard"],
        "sla_hours": {"CRITICAL": 6, "HIGH": 12, "MEDIUM": 24, "LOW": 48}
    },
    "Environment": {
        "department": "Environment Department",
        "subcategories": ["Air pollution", "Noise pollution", "Tree damage", "Illegal tree cutting", "Chemical discharge"],
        "sla_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96}
    },
    "Public Transport": {
        "department": "Public Transport Department",
        "subcategories": ["Damaged bus stops", "Public transport infrastructure problems", "Broken traffic signals", "Illegal transit parking"],
        "sla_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96}
    },
    "Parks and Public Spaces": {
        "department": "Parks & Recreation Department",
        "subcategories": ["Damaged playgrounds", "Park maintenance", "Public property damage", "Broken park lights", "Unkept green cover"],
        "sla_hours": {"CRITICAL": 24, "HIGH": 48, "MEDIUM": 72, "LOW": 120}
    },
    "Other Civic Issues": {
        "department": "General Administration",
        "subcategories": ["General civic grievance", "Permit & licensing inquiry", "Public nuisance", "Civic facility inquiry"],
        "sla_hours": {"CRITICAL": 24, "HIGH": 48, "MEDIUM": 72, "LOW": 120}
    }
}

# Alias map to seamlessly bridge existing models and test cases
CATEGORY_ALIASES = {
    "Roads": "Roads and Infrastructure",
    "Sanitation": "Waste Management",
    "Water": "Water Supply",
    "Drainage": "Drainage and Sanitation",
    "Electricity": "Electricity and Streetlights",
    "Public Safety": "Public Safety",
    "Traffic": "Public Transport",
    "Environment": "Environment",
    "Parks": "Parks and Public Spaces",
    "General Administration": "Other Civic Issues",
    "Other": "Other Civic Issues"
}

DEFAULT_DEPARTMENTS = [
    {"name": "Electrical Department", "description": "Street lighting, power grid faults, transformer and wiring issues.", "contact": "electric@nagrikai.gov"},
    {"name": "Water Department", "description": "Drinking water supply, pipeline leakages, contamination and water pressure.", "contact": "water@nagrikai.gov"},
    {"name": "Road Maintenance", "description": "Potholes, road resurfacing, asphalt defects, road dividers.", "contact": "roads@nagrikai.gov"},
    {"name": "Sanitation Department", "description": "Garbage disposal, waste collection, public cleanliness, dead animal removal.", "contact": "sanitation@nagrikai.gov"},
    {"name": "Drainage Department", "description": "Sewage overflow, stormwater drains, blocked gutters and flooding.", "contact": "drainage@nagrikai.gov"},
    {"name": "Public Transport Department", "description": "Bus stops, transit hubs, traffic lights, road signals, traffic congestion.", "contact": "transport@nagrikai.gov"},
    {"name": "Public Safety", "description": "Public hazard prevention, stray animal packs, unsafe structures, open manholes.", "contact": "safety@nagrikai.gov"},
    {"name": "Environment Department", "description": "Air/noise pollution monitoring, tree hazards, eco-conservation.", "contact": "environment@nagrikai.gov"},
    {"name": "Parks & Recreation Department", "description": "Playground maintenance, public gardens, community recreational spaces.", "contact": "parks@nagrikai.gov"},
    {"name": "General Administration", "description": "Miscellaneous civic inquiries, permits, noise complaints and public services.", "contact": "admin@nagrikai.gov"},
]

CATEGORY_TO_DEPT_MAP = {
    "Roads and Infrastructure": "Road Maintenance",
    "Roads": "Road Maintenance",
    "Waste Management": "Sanitation Department",
    "Sanitation": "Sanitation Department",
    "Water Supply": "Water Department",
    "Water": "Water Department",
    "Drainage and Sanitation": "Drainage Department",
    "Drainage": "Drainage Department",
    "Electricity and Streetlights": "Electrical Department",
    "Electricity": "Electrical Department",
    "Public Safety": "Public Safety",
    "Environment": "Environment Department",
    "Public Transport": "Public Transport Department",
    "Traffic": "Public Transport Department",
    "Parks and Public Spaces": "Parks & Recreation Department",
    "Other Civic Issues": "General Administration",
    "General Administration": "General Administration",
    "Other": "General Administration"
}

def canonicalize_category(cat: Optional[str]) -> str:
    if not cat:
        return "Other Civic Issues"
    c = cat.strip()
    return CATEGORY_ALIASES.get(c, c if c in STANDARD_CATEGORIES else "Other Civic Issues")

def seed_default_departments(db: Session):
    for dept_data in DEFAULT_DEPARTMENTS:
        existing = db.query(Department).filter(Department.name == dept_data["name"]).first()
        if not existing:
            dept = Department(**dept_data)
            db.add(dept)
    db.commit()

def get_department_by_category(db: Session, category: str) -> Optional[Department]:
    dept_name = CATEGORY_TO_DEPT_MAP.get(category)
    if not dept_name:
        canon = canonicalize_category(category)
        dept_name = CATEGORY_TO_DEPT_MAP.get(canon, "General Administration")
    
    dept = db.query(Department).filter(Department.name == dept_name).first()
    if not dept:
        dept = db.query(Department).first()
    return dept
