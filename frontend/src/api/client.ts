import axios from "axios";
import type {
  User,
  Complaint,
  AIAnalysis,
  Department,
  AnalyticsOverview,
  AuditLog,
  Feedback,
  Resolution,
  NotificationItem,
  Incident,
  GridAnalyticsResponse,
  AssignmentRecommendation,
  YOLODetectionResult,
} from "../types";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nagrikai_token") || localStorage.getItem("civicai_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>("/auth/login", { email, password });
    return res.data;
  },
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    department_id?: number;
    protect_identity_default?: boolean;
  }) => {
    const res = await api.post<User>("/auth/register", data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },
  updatePrivacyPreferences: async (protect_identity_default: boolean) => {
    const res = await api.put<User>("/auth/privacy-preferences", { protect_identity_default });
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<{ message: string; email: string }>("/auth/forgot-password", { email });
    return res.data;
  },
  resetPassword: async (email: string, new_password: string) => {
    const res = await api.post<{ message: string }>("/auth/reset-password", { email, new_password });
    return res.data;
  },

  analyzeComplaint: async (complaint: string, location?: string) => {
    const res = await api.post<AIAnalysis>("/ai/analyze", { complaint, location });
    return res.data;
  },

  getComplaints: async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    department_id?: number;
    grid_cell_id?: string;
    zone_name?: string;
    search?: string;
    my_complaints?: boolean;
  }) => {
    const res = await api.get<Complaint[]>("/complaints", { params });
    return res.data;
  },
  getComplaintDetail: async (id: number) => {
    const res = await api.get<Complaint>(`/complaints/${id}`);
    return res.data;
  },
  submitComplaint: async (data: {
    title: string;
    description: string;
    location_text?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    category?: string;
    subcategory?: string;
    image_url?: string;
    before_image_url?: string;
    media_type?: string;
    audio_transcript?: string;
    yolo_detections?: string;
    is_identity_protected?: boolean;
    is_public?: boolean;
    is_emergency?: boolean;
    affected_count?: number;
  }) => {
    const res = await api.post<Complaint>("/complaints", data);
    return res.data;
  },
  submitFeedback: async (complaintId: number, data: { rating: number; comment?: string; is_satisfied?: boolean }) => {
    const res = await api.post<Feedback>(`/complaints/${complaintId}/feedback`, data);
    return res.data;
  },

  // NagrikAI Community
  getCommunityFeed: async (params?: { category?: string; zone_name?: string; search?: string }) => {
    const res = await api.get<Complaint[]>("/complaints/community", { params });
    return res.data;
  },
  supportComplaint: async (complaintId: number) => {
    const res = await api.post<{ supported: boolean; affected_count: number }>(`/complaints/${complaintId}/support`);
    return res.data;
  },
  addComment: async (complaintId: number, comment: string) => {
    const res = await api.post<any>(`/complaints/${complaintId}/comments`, { comment });
    return res.data;
  },
  revealIdentity: async (complaintId: number, reason: string) => {
    const res = await api.post<any>(`/complaints/${complaintId}/reveal-identity`, { reason });
    return res.data;
  },

  // Officer Queues & Actions
  getOfficerQueue: async (params?: {
    status?: string;
    priority?: string;
    category?: string;
    department_id?: number;
    all_departments?: boolean;
    search?: string;
  }) => {
    const res = await api.get<Complaint[]>("/officer/complaints", { params });
    return res.data;
  },
  updateStatus: async (complaintId: number, newStatus: string, remarks?: string) => {
    const res = await api.post(`/officer/complaints/${complaintId}/status`, null, {
      params: { new_status: newStatus, remarks },
    });
    return res.data;
  },
  overrideComplaint: async (
    complaintId: number,
    data: { category?: string; priority?: string; severity?: string; department_id?: number; reason?: string }
  ) => {
    const res = await api.post<Complaint>(`/officer/complaints/${complaintId}/override`, data);
    return res.data;
  },
  resolveComplaint: async (
    complaintId: number,
    data: { action_taken: string; remarks?: string; evidence_url?: string }
  ) => {
    const res = await api.post<Resolution>(`/officer/complaints/${complaintId}/resolve`, data);
    return res.data;
  },

  // Admin Analytics & Grid Mapping
  getAnalytics: async () => {
    const res = await api.get<AnalyticsOverview>("/admin/analytics");
    return res.data;
  },
  getGridZones: async () => {
    const res = await api.get<GridAnalyticsResponse>("/admin/grid-zones");
    return res.data;
  },
  getAssignmentRecommendations: async () => {
    const res = await api.get<AssignmentRecommendation[]>("/admin/assignment-recommendations");
    return res.data;
  },
  getMapMarkers: async () => {
    const res = await api.get<any[]>("/admin/map");
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get<AuditLog[]>("/admin/audit-logs");
    return res.data;
  },
  getSpamQueue: async () => {
    const res = await api.get<any[]>("/admin/spam-queue");
    return res.data;
  },
  moderateSpam: async (complaintId: number, action: "APPROVE" | "REJECT") => {
    const res = await api.post<any>(`/admin/spam-queue/${complaintId}/moderate`, { action });
    return res.data;
  },
  resetDemoData: async () => {
    const res = await api.post<any>("/admin/reset-demo-data");
    return res.data;
  },

  // Categories & Departments
  getDepartments: async () => {
    const res = await api.get<Department[]>("/departments");
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<{ categories: any[] }>("/departments/categories");
    return res.data;
  },

  // File Upload & Multimodal
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string; filename: string; size_bytes: number; media_type: string }>("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  detectYOLO: async (imageUrl: string, categoryHint?: string, textContext?: string) => {
    const res = await api.post<YOLODetectionResult>("/uploads/detect-yolo", {
      image_url: imageUrl,
      category_hint: categoryHint,
      text_context: textContext,
    });
    return res.data;
  },
  transcribeAudio: async (audioUrl: string) => {
    const res = await api.post<{ audio_url: string; transcript: string; detected_language: string; confidence: number }>(
      "/uploads/transcribe-audio",
      { audio_url: audioUrl }
    );
    return res.data;
  },

  deleteComplaint: async (complaintId: number) => {
    const res = await api.delete<{ message: string }>(`/admin/complaints/${complaintId}`);
    return res.data;
  },

  // Citizen Appeals & Reopen
  reopenComplaint: async (complaintId: number, data: { reason: string; evidence_url?: string }) => {
    const res = await api.post<Complaint>(`/complaints/${complaintId}/reopen`, data);
    return res.data;
  },

  // In-App Notifications
  getNotifications: async () => {
    const res = await api.get<{ notifications: NotificationItem[]; unread_count: number }>("/notifications");
    return res.data;
  },
  markNotificationRead: async (notificationId: number) => {
    const res = await api.post<{ message: string }>(`/notifications/${notificationId}/read`);
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await api.post<{ message: string }>("/notifications/read-all");
    return res.data;
  },

  // Incident Groups
  getIncidents: async (params?: { status?: string; category?: string }) => {
    const res = await api.get<Incident[]>("/incidents", { params });
    return res.data;
  },
  getIncidentDetail: async (incidentId: number) => {
    const res = await api.get<Incident>(`/incidents/${incidentId}`);
    return res.data;
  },
  createIncident: async (data: any) => {
    const res = await api.post<Incident>("/incidents", data);
    return res.data;
  },
  linkComplaintToIncident: async (incidentId: number, complaintId: number) => {
    const res = await api.post<{ message: string }>(`/incidents/${incidentId}/link/${complaintId}`);
    return res.data;
  },
  unlinkComplaintFromIncident: async (incidentId: number, complaintId: number) => {
    const res = await api.post<{ message: string }>(`/incidents/${incidentId}/unlink/${complaintId}`);
    return res.data;
  },
  updateIncidentStatus: async (incidentId: number, status: string, remarks?: string) => {
    const res = await api.post<{ message: string }>(`/incidents/${incidentId}/status`, { status, remarks });
    return res.data;
  },

  // Escalation & SLA Engine
  runEscalationCheck: async () => {
    const res = await api.post<{ escalated_count: number; escalated_complaints: any[]; scanned_count: number }>("/admin/escalations/check");
    return res.data;
  },
  escalateComplaint: async (complaintId: number, reason?: string) => {
    const res = await api.post<{ message: string; is_escalated: boolean }>(`/officer/complaints/${complaintId}/escalate`, null, {
      params: { reason },
    });
    return res.data;
  },

  // Officer Workload
  getOfficerWorkload: async () => {
    const res = await api.get<any[]>("/officer/workload");
    return res.data;
  },

  // Evidence Relevance
  verifyImageRelevance: async (imageUrl: string, category?: string, description?: string) => {
    const res = await api.post<{
      apparent_subject: string;
      is_relevant: boolean;
      relevance_score: number;
      confidence: number;
      detected_features: string[];
      notes: string;
    }>("/uploads/verify-relevance", {
      image_url: imageUrl,
      category,
      description,
    });
    return res.data;
  },
};

export default api;
