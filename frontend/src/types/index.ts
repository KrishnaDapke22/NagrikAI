export type UserRole = "CITIZEN" | "OFFICER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  protect_identity_default?: boolean;
  department_id?: number | null;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  contact?: string;
  created_at: string;
}

export interface ExplanationItem {
  feature: string;
  impact: number;
  direction: "INCREASES_PRIORITY" | "DECREASES_PRIORITY";
  description: string;
}

export interface AIRecommendation {
  summary: string;
  action_steps: string[];
  possible_causes: string[];
  verification_checklist: string[];
  citizen_response_draft: string;
}

export interface AIAnalysis {
  id?: number;
  complaint_id?: number;
  category: string;
  category_confidence: number;
  subcategory?: string;
  subcategory_confidence?: number;
  sentiment: string;
  sentiment_confidence: number;
  severity: string;
  severity_confidence: number;
  priority: string;
  priority_confidence: number;
  duplicate_probability: number;
  duplicate_count: number;
  location_extracted?: string;
  location_confidence: number;
  department?: string;
  predicted_resolution_days: number;
  model_version: string;
  original_text?: string;
  normalized_text?: string;
  translated_text?: string;
  requires_human_review?: boolean;
  confidence_scores?: Record<string, number>;
  explanations: ExplanationItem[];
  recommendation?: AIRecommendation;
  created_at?: string;
}

export interface SimilarComplaint {
  id: number;
  similar_complaint_id: number;
  title?: string;
  similarity_score: number;
  status?: string;
  category?: string;
  created_at: string;
}

export interface Resolution {
  id: number;
  complaint_id: number;
  officer_id: number;
  officer_name?: string;
  action_taken: string;
  remarks?: string;
  evidence_url?: string;
  actual_resolution_days?: number;
  resolved_at: string;
}

export interface Feedback {
  id: number;
  complaint_id: number;
  citizen_id: number;
  rating: number;
  comment?: string;
  is_satisfied: boolean;
  created_at: string;
}

export interface CommunityCommentItem {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  is_official_response: boolean;
  comment: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  citizen_id: number;
  citizen_name?: string;
  citizen_badge?: string;
  is_identity_protected?: boolean;
  title: string;
  description: string;
  original_text?: string;
  translated_text?: string;
  category?: string;
  subcategory?: string;
  language: string;
  sentiment?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED" | "REOPENED";
  department_id?: number;
  department_name?: string;
  incident_id?: number;
  location_text?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  grid_cell_id?: string;
  zone_name?: string;
  image_url?: string;
  before_image_url?: string;
  after_image_url?: string;
  media_type?: string;
  audio_transcript?: string;
  yolo_detections?: string | any[];
  is_public?: boolean;
  is_emergency?: boolean;
  affected_count?: number;
  spam_risk_score?: number;
  duplicate_count: number;
  predicted_resolution_days?: number;
  sla_deadline?: string;
  is_escalated?: boolean;
  appeal_reason?: string;
  reopen_count?: number;
  support_count?: number;
  supports_count?: number;
  comments_count?: number;
  has_supported?: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  ai_analysis?: AIAnalysis;
  similar_complaints?: SimilarComplaint[];
  resolutions?: Resolution[];
  feedback?: Feedback;
  comments?: CommunityCommentItem[];
}

export interface KPIStats {
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  critical_priority_complaints: number;
  high_priority_complaints: number;
  avg_resolution_days: number;
  sla_compliance_rate?: number;
  escalated_complaints?: number;
  reopened_complaints?: number;
  active_incidents?: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  complaint_id?: number;
  event_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface IncidentLinkedComplaint {
  id: number;
  title: string;
  description: string;
  citizen_name?: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface Incident {
  id: number;
  title: string;
  category: string;
  department_id?: number;
  department_name?: string;
  status: string;
  priority: string;
  severity: string;
  primary_complaint_id?: number;
  latitude?: number;
  longitude?: number;
  location_text?: string;
  affected_citizen_count: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  linked_complaints?: IncidentLinkedComplaint[];
}

export interface ClusterPoint {
  cluster_id: number;
  cluster_name: string;
  size: number;
  sample_complaints: string[];
  dominant_category: string;
}

export interface AnalyticsOverview {
  kpis: KPIStats;
  category_distribution: { category: string; count: number }[];
  department_workloads: {
    department_id: number;
    department_name: string;
    total: number;
    open: number;
    resolved: number;
    avg_resolution_days: number;
  }[];
  priority_distribution: { priority: string; count: number }[];
  complaints_trend: { date: string; count: number }[];
  clusters: ClusterPoint[];
  model_metrics: Record<string, any>;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  complaint_id: number;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface GridCellData {
  cell_id: string;
  row?: number;
  col?: number;
  zone_name: string;
  bounds?: [number, number][];
  center?: [number, number];
  lat_min?: number;
  lat_max?: number;
  lng_min?: number;
  lng_max?: number;
  total_complaints?: number;
  active_complaints?: number;
  pending_count?: number;
  in_progress_count?: number;
  resolved_count?: number;
  critical_count: number;
  primary_department?: string;
  categories?: Record<string, number>;
  top_categories?: string[];
  status?: "RED" | "ORANGE" | "GREEN";
  status_color?: "RED" | "ORANGE" | "GREEN";
  status_label?: string;
  avg_resolution_days?: number;
  assigned_officer_count?: number;
}

export interface ZoneData {
  zone_name: string;
  total_complaints?: number;
  total_active_complaints?: number;
  pending_count?: number;
  in_progress_count?: number;
  resolved_count?: number;
  critical_count?: number;
  dominant_category?: string;
  status?: "RED" | "ORANGE" | "GREEN";
  cells_count?: number;
  categories?: Record<string, number>;
  hotspot_cells?: string[];
}

export interface GridAnalyticsResponse {
  grid_cells: GridCellData[];
  zones: ZoneData[];
  total_cells?: number;
  total_active_complaints?: number;
  red_cells_count?: number;
  orange_cells_count?: number;
  green_cells_count?: number;
}

export interface AssignmentRecommendation {
  complaint_id?: number;
  title?: string;
  category?: string;
  priority?: string;
  grid_cell_id?: string;
  zone_name?: string;
  created_at?: string;
  recommended_officer_id?: number;
  recommended_officer_name?: string;
  officer_id?: number;
  officer_name?: string;
  email?: string;
  department_id?: number;
  department_name?: string;
  current_workload?: number;
  officer_current_workload?: number;
  recommended_zone?: string;
  recommended_cell?: string;
  pending_in_recommended?: number;
  reason?: string;
  match_confidence?: number;
  requires_admin_authorization?: boolean;
  rationale?: string;
}

export interface YOLODetectedObject {
  class_name: string;
  display_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  category: string;
  color: string;
}

export interface YOLODetectionResult {
  detected: boolean;
  objects: YOLODetectedObject[];
  primary_class?: string;
  primary_label?: string;
  recommended_category?: string;
  confidence: number;
  annotated_image_url?: string;
  objects_count?: number;
  summary?: string;
}
