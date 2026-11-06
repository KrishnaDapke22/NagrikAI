from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KPIStats(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    critical_priority_complaints: int
    high_priority_complaints: int
    avg_resolution_days: float
    sla_compliance_rate: Optional[float] = 92.4
    escalated_complaints: Optional[int] = 0
    reopened_complaints: Optional[int] = 0
    active_incidents: Optional[int] = 0

class CategoryCount(BaseModel):
    category: str
    count: int

class DepartmentWorkload(BaseModel):
    department_id: int
    department_name: str
    total: int
    open: int
    resolved: int
    avg_resolution_days: float

class PriorityCount(BaseModel):
    priority: str
    count: int

class TimeTrendPoint(BaseModel):
    date: str
    count: int

class ClusterPoint(BaseModel):
    cluster_id: int
    cluster_name: str
    size: int
    sample_complaints: List[str]
    dominant_category: str

class AnalyticsOverview(BaseModel):
    kpis: KPIStats
    category_distribution: List[CategoryCount]
    department_workloads: List[DepartmentWorkload]
    priority_distribution: List[PriorityCount]
    complaints_trend: List[TimeTrendPoint]
    clusters: List[ClusterPoint]
    model_metrics: Dict[str, Any]
