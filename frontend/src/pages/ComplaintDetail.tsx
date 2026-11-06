import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import type { Complaint, Department, CommunityCommentItem } from "../types";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { StatusBadge } from "../components/StatusBadge";
import { AIAnalysisCard } from "../components/AIAnalysisCard";
import { SHAPFeatureChart } from "../components/SHAPFeatureChart";
import { RecommendationCard } from "../components/RecommendationCard";
import { InteractiveMap } from "../components/InteractiveMap";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  SlidersHorizontal,
  Star,
  Send,
  User,
  Building2,
  ExternalLink,
  Check,
  X,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Layers,
  Shield,
  ShieldAlert,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Grid,
  CheckCircle,
} from "lucide-react";

export const ComplaintDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Admin delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Citizen appeal / reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenEvidenceFile, setReopenEvidenceFile] = useState<File | null>(null);
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  // Officer override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState("");
  const [overridePriority, setOverridePriority] = useState("");
  const [overrideDeptId, setOverrideDeptId] = useState<number | undefined>(undefined);
  const [overrideReason, setOverrideReason] = useState("");

  // Resolve modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [actionTaken, setActionTaken] = useState("");
  const [remarks, setRemarks] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // Citizen feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Privacy: Admin reveal identity modal
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealReason, setRevealReason] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedData, setRevealedData] = useState<{
    citizen_id: number;
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  // Community support & comments
  const [supportCount, setSupportCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isSupporting, setIsSupporting] = useState(false);
  const [comments, setComments] = useState<CommunityCommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadComplaintData(parseInt(id));
      loadDepartments();
    }
  }, [id]);

  const loadComplaintData = async (complaintId: number) => {
    setIsLoading(true);
    try {
      const data = await apiClient.getComplaintDetail(complaintId);
      setComplaint(data);
      setOverrideCategory(data.category || "");
      setOverridePriority(data.priority);
      setOverrideDeptId(data.department_id);
      setSupportCount(data.affected_count || data.supports_count || 1);
      setComments(data.comments || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not load complaint details.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiClient.getDepartments();
      setDepartments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const formattedId = complaint ? `NAGRIK-2026-${String(complaint.id).padStart(5, "0")}` : "";

  const handleCopyId = () => {
    if (!complaint) return;
    navigator.clipboard.writeText(formattedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!complaint) return;
    try {
      await apiClient.updateStatus(complaint.id, newStatus);
      loadComplaintData(complaint.id);
    } catch (err: any) {
      alert("Failed to update status.");
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      await apiClient.overrideComplaint(complaint.id, {
        category: overrideCategory || undefined,
        priority: overridePriority || undefined,
        department_id: overrideDeptId,
        reason: overrideReason || undefined,
      });
      setShowOverrideModal(false);
      loadComplaintData(complaint.id);
    } catch (err: any) {
      alert("Failed to save override.");
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      let evUrl: string | undefined = undefined;
      if (evidenceFile) {
        const up = await apiClient.uploadFile(evidenceFile);
        evUrl = up.url;
      }

      await apiClient.resolveComplaint(complaint.id, {
        action_taken: actionTaken,
        remarks: remarks || undefined,
        evidence_url: evUrl,
      });

      setShowResolveModal(false);
      loadComplaintData(complaint.id);
    } catch (err: any) {
      alert("Failed to resolve grievance.");
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    try {
      await apiClient.submitFeedback(complaint.id, {
        rating,
        comment: feedbackComment,
        is_satisfied: rating >= 3,
      });
      setFeedbackSuccess(true);
      loadComplaintData(complaint.id);
    } catch (err: any) {
      alert("Failed to submit feedback.");
    }
  };

  const handleDeleteComplaint = async () => {
    if (!complaint) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteComplaint(complaint.id);
      navigate(user?.role === "ADMIN" ? "/officer" : "/citizen");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete grievance record.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !reopenReason.trim()) return;
    setIsSubmittingReopen(true);
    try {
      let evUrl: string | undefined = undefined;
      if (reopenEvidenceFile) {
        const up = await apiClient.uploadFile(reopenEvidenceFile);
        evUrl = up.url;
      }
      await apiClient.reopenComplaint(complaint.id, {
        reason: reopenReason,
        evidence_url: evUrl,
      });
      setShowReopenModal(false);
      setReopenReason("");
      setReopenEvidenceFile(null);
      loadComplaintData(complaint.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reopen grievance.");
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const handleRevealIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !revealReason.trim()) return;
    setIsRevealing(true);
    try {
      const data = await apiClient.revealIdentity(complaint.id, revealReason);
      setRevealedData(data);
      setShowRevealModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reveal identity.");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleSupportToggle = async () => {
    if (!complaint || isSupporting) return;
    setIsSupporting(true);
    try {
      const res = await apiClient.supportComplaint(complaint.id);
      setIsSupported(res.supported);
      setSupportCount(res.affected_count);
    } catch (err: any) {
      alert("Could not register support.");
    } finally {
      setIsSupporting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const added = await apiClient.addComment(complaint.id, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment("");
    } catch (err: any) {
      alert("Failed to submit comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <CivicSidebar />
        <div className="flex-1 flex items-center justify-center py-24 space-y-3 flex-col">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-600">Retrieving NagrikAI municipal dossier & diagnostics...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <CivicSidebar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-sm font-bold">
              {error || "Grievance record not found"}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Return to Operations Command
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOfficerOrAdmin = user?.role === "OFFICER" || user?.role === "ADMIN";
  const isCitizenOwner = user?.role === "CITIZEN" && user?.id === complaint.citizen_id;

  // 6-step progress calculation
  const getTimelineStep = () => {
    if (complaint.status === "RESOLVED") return 6;
    if (complaint.status === "IN_PROGRESS") return 5;
    if (complaint.department_id) return 4;
    if (complaint.ai_analysis) return 3;
    return 1;
  };

  const currentStep = getTimelineStep();

  const timelineSteps = [
    { num: 1, label: t("complaint_detail.step_1", "Submitted"), desc: t("complaint_detail.step_1_desc", "Citizen filing logged") },
    { num: 2, label: t("complaint_detail.step_2", "AI Analyzed"), desc: t("complaint_detail.step_2_desc", "Multi-model diagnostics") },
    { num: 3, label: t("complaint_detail.step_3", "Assigned"), desc: t("complaint_detail.step_3_desc", "Department auto-routed") },
    { num: 4, label: t("complaint_detail.step_4", "Officer Reviewing"), desc: t("complaint_detail.step_4_desc", "Squad assigned") },
    { num: 5, label: t("complaint_detail.step_5", "In Progress"), desc: t("complaint_detail.step_5_desc", "Work order active") },
    { num: 6, label: t("complaint_detail.step_6", "Resolved"), desc: t("complaint_detail.step_6_desc", "Closure verified") },
  ];

  const beforeImage = complaint.before_image_url || complaint.image_url;
  const afterImage = complaint.after_image_url || complaint.resolutions?.[0]?.evidence_url;

  const parsedYolo = (() => {
    if (!complaint?.yolo_detections) return [];
    if (Array.isArray(complaint.yolo_detections)) return complaint.yolo_detections;
    try {
      const res = JSON.parse(complaint.yolo_detections);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Zone 1: Left Command Sidebar */}
      <CivicSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <TopSearchBar />
          <UserHeader />
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          
          {/* Top Breadcrumb & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-xs cursor-pointer"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">{formattedId}</span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                    title="Copy Reference ID"
                  >
                    {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Registered {new Date(complaint.created_at).toLocaleString()} • NagrikAI Municipal Audit Record
                </p>
              </div>
            </div>

            {/* Status Badges & Officer Controls */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <StatusBadge type="priority" value={complaint.priority} />
              <StatusBadge type="status" value={complaint.status} />

              {complaint.is_identity_protected && (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Citizen – Identity Protected
                </span>
              )}

              {complaint.zone_name && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1">
                  <Grid className="w-3.5 h-3.5 text-blue-600" />
                  {complaint.zone_name} ({complaint.grid_cell_id || "Cell"})
                </span>
              )}

              {complaint.is_escalated && (
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
                  Escalated
                </span>
              )}

              {complaint.incident_id && (
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  Cluster #{complaint.incident_id}
                </span>
              )}

              {complaint.status === "RESOLVED" && ((user?.role === "CITIZEN" && user?.id === complaint.citizen_id) || user?.role === "ADMIN") && (
                <button
                  onClick={() => setShowReopenModal(true)}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                  title="Appeal resolution and request case reopening"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t("complaint_detail.btn_reopen", "Reopen / Appeal")}</span>
                </button>
              )}

              {isOfficerOrAdmin && (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">{t("complaint_detail.btn_override", "Human Override")}</span>
                  </button>

                  {complaint.status === "OPEN" && (
                    <button
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {t("officer_dashboard.btn_start_work", "Start Work")}
                    </button>
                  )}

                  {complaint.status !== "RESOLVED" && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t("complaint_detail.btn_resolve", "Resolve")}</span>
                    </button>
                  )}

                  {user?.role === "ADMIN" && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                      title="Permanently delete this grievance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t("complaint_detail.btn_purge", "Delete")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Privacy Protection Banner for Admins */}
          {complaint.is_identity_protected && user?.role === "ADMIN" && !revealedData && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Citizen Identity Shielded</h4>
                  <p className="text-xs text-emerald-800">
                    Complainant details are masked across officer views. Administrators may decrypt under documented audit justification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRevealModal(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Authorized Identity Disclosure</span>
              </button>
            </div>
          )}

          {/* Disclosed Identity Card */}
          {revealedData && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Identity Disclosed Under Municipal Security Audit (Audit ID: NAGRIK-AUD-{Date.now()})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-amber-200">
                <div>
                  <span className="text-slate-500 font-medium">Citizen Name:</span>
                  <p className="font-bold text-slate-900">{revealedData.name}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Verified Email:</span>
                  <p className="font-bold text-slate-900">{revealedData.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Contact Phone:</span>
                  <p className="font-bold text-slate-900">{revealedData.phone || "Not provided"}</p>
                </div>
              </div>
            </div>
          )}

          {/* 6-Step Resolution Lifecycle Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> {t("complaint_detail.status_timeline", "Resolution Lifecycle Progress")}
              </h2>
              <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Stage {currentStep} / 6
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {timelineSteps.map((step) => {
                const isCompleted = step.num <= currentStep;
                const isCurrent = step.num === currentStep;

                return (
                  <div
                    key={step.num}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      isCurrent
                        ? "bg-blue-50/90 border-blue-300 shadow-xs"
                        : isCompleted
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          isCompleted
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isCompleted && step.num < currentStep ? "✓" : step.num}
                      </span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                      )}
                    </div>

                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? "text-blue-950" : "text-slate-900"}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 7 Cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Grievance Statement Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Citizen Grievance Submission
                    </span>
                    {complaint.language && complaint.language !== "English" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {complaint.language} Input
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                    {complaint.title}
                  </h2>
                </div>

                {complaint.reopen_count && complaint.reopen_count > 0 ? (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      <span>Citizen Appeal / Reopening Notice (Cycle #{complaint.reopen_count})</span>
                    </div>
                    <p className="text-amber-800">{complaint.appeal_reason || "Citizen reported that the problem persists."}</p>
                  </div>
                ) : null}

                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                  {complaint.description}
                </div>

                {complaint.audio_transcript && (
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-blue-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Speech-to-Text Audio Transcription
                    </span>
                    <p className="text-slate-700 italic">"{complaint.audio_transcript}"</p>
                  </div>
                )}

                {complaint.translated_text && complaint.language !== "English" && (
                  <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700">
                      AI Multilingual Semantic Normalization ({complaint.language} → English)
                    </span>
                    <p className="text-slate-700 italic">{complaint.translated_text}</p>
                  </div>
                )}

                {/* Submitter and Location Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>
                      Filed by:{" "}
                      <strong className="text-slate-900 font-bold">
                        {complaint.is_identity_protected && !revealedData
                          ? "Verified Citizen (Identity Protected)"
                          : complaint.citizen_name || "Verified Citizen"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Date: <strong className="text-slate-900 font-bold">{new Date(complaint.created_at).toLocaleDateString()}</strong></span>
                  </div>
                  {complaint.location_text && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Reported Location: <strong className="text-slate-900 font-bold">{complaint.location_text}</strong></span>
                    </div>
                  )}
                  {complaint.landmark && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>Nearby Landmark: <strong className="text-slate-800">{complaint.landmark}</strong></span>
                    </div>
                  )}
                </div>

                {/* YOLO Object Detections Tagging */}
                {parsedYolo.length > 0 && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      YOLO Civic Defect Detection Engine
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsedYolo.map((det: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-white border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {det.class || det.class_name} ({Math.round((det.confidence || 0.8) * 100)}% match)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Before & After Photo Comparison */}
              {(beforeImage || afterImage) && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Visual Resolution Verification (Before / After)
                    </h3>
                    {complaint.status === "RESOLVED" && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Remediation Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Image */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 uppercase tracking-wider">Before (Reported Defect)</span>
                        <span className="text-[10px] text-slate-500 font-medium">Citizen Photo</span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                        {beforeImage ? (
                          <img
                            src={beforeImage}
                            alt="Before State"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No initial photo uploaded</span>
                        )}
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-800 uppercase tracking-wider">After (Remediated State)</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Officer Proof</span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-emerald-200 aspect-video bg-emerald-50/50 flex items-center justify-center">
                        {afterImage ? (
                          <img
                            src={afterImage}
                            alt="After Remediation"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-xs text-slate-400">Resolution proof will appear upon squad closure</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Multi-Model Diagnostics Card */}
              {complaint.ai_analysis && (
                <AIAnalysisCard analysis={complaint.ai_analysis} />
              )}

              {/* Explainable AI (SHAP TreeExplainer Feature Attributions) */}
              {complaint.ai_analysis?.explanations && complaint.ai_analysis.explanations.length > 0 && (
                <SHAPFeatureChart
                  explanations={complaint.ai_analysis.explanations}
                  priority={complaint.priority}
                />
              )}

              {/* Generative AI SOP Recommendation Card */}
              {complaint.ai_analysis?.recommendation && (
                <RecommendationCard recommendation={complaint.ai_analysis.recommendation} />
              )}

              {/* Semantic Similar Complaints in Ward */}
              {complaint.similar_complaints && complaint.similar_complaints.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Semantically Similar Complaints in Area
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {complaint.similar_complaints.length} Matched Incidents
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {complaint.similar_complaints.map((sim) => (
                      <div
                        key={sim.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 truncate">{sim.title || `Complaint #${sim.similar_complaint_id}`}</p>
                          <p className="text-[11px] text-slate-500 font-mono">NAGRIK-2026-{String(sim.similar_complaint_id).padStart(5, "0")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {(sim.similarity_score * 100).toFixed(0)}% sim
                          </span>
                          <Link
                            to={`/complaints/${sim.similar_complaint_id}`}
                            className="p-1 text-slate-400 hover:text-blue-600"
                            title="View dossier"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NagrikAI Community Discussion & Public Support */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      NagrikAI Community Discussion & Citizen Backing
                    </h3>
                  </div>
                  <button
                    onClick={handleSupportToggle}
                    disabled={isSupporting}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSupported
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{isSupported ? "Supported" : "I am also affected"} ({supportCount})</span>
                  </button>
                </div>

                {/* Comment Thread */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No comments yet. Be the first citizen or authority to chime in.</p>
                  ) : (
                    comments.map((comm) => (
                      <div
                        key={comm.id}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          comm.is_official_response
                            ? "bg-blue-50/80 border-blue-200 text-blue-950"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{comm.user_name}</span>
                            {comm.is_official_response && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                Municipal Authority Response
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(comm.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="leading-relaxed font-normal">{comm.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add verified feedback or local condition update..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>

              {/* Official Municipal Resolution Record */}
              {complaint.resolutions && complaint.resolutions.length > 0 && (
                <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-800 border-b border-slate-200 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {t("complaint_detail.resolution_record_title", "Official Municipal Resolution Record")}
                    </h3>
                  </div>

                  {complaint.resolutions.map((res) => (
                    <div key={res.id} className="space-y-3">
                      <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t("complaint_detail.action_taken", "Action Taken:")}</p>
                        <p className="text-sm font-semibold text-slate-900">{res.action_taken}</p>
                        {res.remarks && (
                          <p className="text-xs text-slate-600 italic pt-1 font-normal">
                            {t("complaint_detail.remarks", "Officer Remarks:")} "{res.remarks}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                        <span>{t("complaint_detail.resolution_by", "Authorized Officer:")} <strong className="text-slate-900 font-bold">{res.officer_name || "Assigned Field Officer"}</strong></span>
                        <span>Closed on: <strong className="text-slate-900 font-bold">{new Date(res.resolved_at).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* RIGHT 5 Cols */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Geospatial Map */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Geospatial Location Intelligence
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    GPS Coordinates
                  </span>
                </div>

                <InteractiveMap
                  markers={[
                    {
                      id: complaint.id,
                      title: complaint.title,
                      category: complaint.category,
                      priority: complaint.priority,
                      status: complaint.status,
                      latitude: complaint.latitude || 18.5204,
                      longitude: complaint.longitude || 73.8567,
                      location_text: complaint.location_text,
                    },
                  ]}
                  center={
                    complaint.latitude && complaint.longitude
                      ? [complaint.latitude, complaint.longitude]
                      : [18.5204, 73.8567]
                  }
                  zoom={14}
                  height="280px"
                />

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Coordinates:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {complaint.latitude?.toFixed(4) || "18.5204"}, {complaint.longitude?.toFixed(4) || "73.8567"}
                    </span>
                  </div>
                  {complaint.zone_name && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>Municipal Zone:</span>
                      <span className="font-bold text-blue-900">{complaint.zone_name}</span>
                    </div>
                  )}
                  {complaint.grid_cell_id && (
                    <div className="flex items-center justify-between">
                      <span>Spatial Grid Cell:</span>
                      <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {complaint.grid_cell_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Department Routing Scope */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3.5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Building2 className="w-4 h-4 text-blue-600" /> Municipal Squad Scope
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Assigned Department:</span>
                    <span className="font-bold text-blue-900">{complaint.department_name || "Municipal Ward Operations"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Category Classification:</span>
                    <span className="font-semibold text-slate-800">{complaint.category || "General"}</span>
                  </div>
                  {complaint.subcategory && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Subcategory:</span>
                      <span className="font-semibold text-slate-800">{complaint.subcategory}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Predicted Resolution SLA:</span>
                    <span className="font-bold text-slate-900">{complaint.predicted_resolution_days || 2.0} days</span>
                  </div>
                  {complaint.sla_deadline && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">SLA Resolution Target:</span>
                      <span className="font-bold text-blue-900 font-mono">
                        {new Date(complaint.sla_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Citizen 5-Star Feedback Loop */}
              {complaint.status === "RESOLVED" && isCitizenOwner && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {t("complaint_detail.feedback_heading", "Citizen Feedback on Resolution")}
                  </h3>

                  {feedbackSuccess || complaint.feedback ? (
                    <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200 text-center space-y-2">
                      <CheckCircle2 className="w-7 h-7 text-blue-600 mx-auto" />
                      <p className="text-xs font-bold text-blue-950">{t("complaint_detail.feedback_thanks", "Thank you for your rating!")}</p>
                      <p className="text-[11px] text-slate-600 font-normal">
                        Your rating helps calibrate our machine learning SLA estimation models and squad performance metrics.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                      <div className="flex items-center justify-center gap-2.5 py-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setRating(s)}
                            className="cursor-pointer transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        rows={2}
                        placeholder={t("complaint_detail.feedback_prompt", "Was the issue resolved satisfactorily? Share your experience...")}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900"
                      />

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t("complaint_detail.btn_submit_feedback", "Submit Citizen Feedback")}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Admin Identity Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-slate-900">Authorize Identity Disclosure</h3>
              </div>
              <button
                onClick={() => setShowRevealModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This grievance has active privacy protection. Access to verified citizen credentials is restricted under municipal data protection standards and requires a formal audit justification.
            </p>

            <form onSubmit={handleRevealIdentity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Mandatory Legal / Audit Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900 font-medium"
                  placeholder="e.g. Legal inquiry, emergency safety response, or dispute verification..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRevealModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRevealing || !revealReason.trim()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isRevealing ? "Decrypting..." : "Decrypt & Log Audit"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Resolve Grievance with Proof</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Action Taken <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900 font-medium"
                  placeholder="Detail the municipal action taken on the ground to resolve this issue..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Officer Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900 font-medium"
                  placeholder="e.g. Inspected and repaired wiring; light verified operational."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Upload Completion Evidence Photo (After State)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEvidenceFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  Confirm & Close Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Human Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">Human-in-the-Loop Override</h3>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Override Category
                </label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
                >
                  <option value="Roads and Infrastructure">Roads and Infrastructure</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Drainage and Sanitation">Drainage and Sanitation</option>
                  <option value="Electricity and Streetlights">Electricity and Streetlights</option>
                  <option value="Public Safety">Public Safety</option>
                  <option value="Environment">Environment</option>
                  <option value="Public Transport">Public Transport</option>
                  <option value="Parks and Public Spaces">Parks and Public Spaces</option>
                  <option value="Other Civic Issues">Other Civic Issues</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Override Priority
                </label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Re-Route Municipal Department
                </label>
                <select
                  value={overrideDeptId || ""}
                  onChange={(e) => setOverrideDeptId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Reason for Human Override (Audit Logged)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800"
                  placeholder="e.g. Field inspection revealed high voltage risk requiring expedited priority."
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Human Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">
                  Confirm Grievance Deletion
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete grievance <span className="font-mono font-bold text-slate-900">{formattedId}</span>?
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900 truncate">{complaint.title}</div>
              <div className="text-slate-500 line-clamp-2">{complaint.description}</div>
            </div>

            <p className="text-[11px] text-rose-600 font-semibold">
              Warning: This action will permanently remove this record, its AI diagnostic telemetry, resolution audits, and similarity linkages from the municipal database. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteComplaint}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citizen Reopen / Appeal Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">
                  Appeal Resolution / Reopen Case
                </h3>
              </div>
              <button
                onClick={() => setShowReopenModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If the reported issue has recurred or was not resolved to your satisfaction, you can appeal. The grievance will be re-assigned to the department squad with your appeal notes.
            </p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Reason for Appeal / Unresolved Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. The leak was patched temporarily but water is leaking again across the road."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Attach New Evidence (Optional Photo)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReopenEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  disabled={isSubmittingReopen}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReopen}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isSubmittingReopen ? "Submitting Appeal..." : "Submit Appeal & Reopen"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
