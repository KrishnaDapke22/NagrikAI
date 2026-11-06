import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import type {
  AnalyticsOverview,
  AuditLog,
  Department,
  GridAnalyticsResponse,
  GridCellData,
  AssignmentRecommendation,
} from "../types";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { KPICard } from "../components/KPICard";
import { InteractiveMap } from "../components/InteractiveMap";
import { CIVIC_HOTSPOTS, AI_CIVIC_INSIGHTS } from "../config/demoData";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  MapPin,
  UserPlus,
  X,
  Sparkles,
  Flame,
  Activity,
  History,
  AlertTriangle,
  Layers,
  Grid,
  Download,
  RotateCcw,
  ShieldCheck,
  Check,
  Ban,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedMapCategory, setSelectedMapCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "grid_zones" | "assignments" | "spam_queue" | "audit">("overview");

  // Grid Zones State
  const [gridData, setGridData] = useState<GridAnalyticsResponse | null>(null);
  const [selectedCell, setSelectedCell] = useState<GridCellData | null>(null);

  // Assignments State
  const [assignments, setAssignments] = useState<AssignmentRecommendation[]>([]);

  // Spam Queue State
  const [spamQueue, setSpamQueue] = useState<any[]>([]);
  const [moderatingId, setModeratingId] = useState<number | null>(null);

  // Reset Demo Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Add Officer Modal State
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [officerName, setOfficerName] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");
  const [officerDeptId, setOfficerDeptId] = useState<number | undefined>(undefined);
  const [officerSuccess, setOfficerSuccess] = useState<string | null>(null);
  const [officerError, setOfficerError] = useState<string | null>(null);
  const [isSubmittingOfficer, setIsSubmittingOfficer] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [anData, mapData, logsData, deptsData, gData, recData, spData] = await Promise.all([
        apiClient.getAnalytics(),
        apiClient.getMapMarkers(),
        apiClient.getAuditLogs(),
        apiClient.getDepartments(),
        apiClient.getGridZones().catch(() => null),
        apiClient.getAssignmentRecommendations().catch(() => []),
        apiClient.getSpamQueue().catch(() => []),
      ]);
      setAnalytics(anData);
      setMapMarkers(mapData);
      setAuditLogs(logsData);
      setDepartments(deptsData);
      setGridData(gData);
      setAssignments(recData);
      setSpamQueue(spData);
      if (deptsData.length > 0) {
        setOfficerDeptId(deptsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem("nagrikai_token");
    const url = `/api/admin/export-csv${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(url, "_blank");
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      await apiClient.resetDemoData();
      setShowResetModal(false);
      alert("Demo database successfully re-seeded with 160 realistic civic cases!");
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to reset demo data.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleModerateSpam = async (complaintId: number, action: "APPROVE" | "REJECT") => {
    setModeratingId(complaintId);
    try {
      await apiClient.moderateSpam(complaintId, action);
      setSpamQueue((prev) => prev.filter((item) => item.id !== complaintId));
      loadAllAdminData();
    } catch (err) {
      alert("Failed to moderate complaint.");
    } finally {
      setModeratingId(null);
    }
  };

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError(null);
    setOfficerSuccess(null);
    setIsSubmittingOfficer(true);
    try {
      await apiClient.register({
        name: officerName,
        email: officerEmail,
        password: officerPassword,
        role: "OFFICER",
        department_id: officerDeptId,
      });
      setOfficerSuccess(`Officer ${officerName} successfully created and assigned!`);
      setOfficerName("");
      setOfficerEmail("");
      setOfficerPassword("");
      setTimeout(() => {
        setOfficerSuccess(null);
        setShowOfficerModal(false);
      }, 1800);
    } catch (err: any) {
      setOfficerError(err.response?.data?.detail || "Failed to create officer account.");
    } finally {
      setIsSubmittingOfficer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <CivicSidebar />
        <div className="flex-1 flex items-center justify-center py-24 space-y-3 flex-col">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-600">Loading NagrikAI Municipal Intelligence Platform...</p>
        </div>
      </div>
    );
  }

  const kpis = analytics?.kpis || {
    total_complaints: 0,
    open_complaints: 0,
    in_progress_complaints: 0,
    resolved_complaints: 0,
    critical_priority_complaints: 0,
    high_priority_complaints: 0,
    avg_resolution_days: 0,
  };

  const filteredMarkers =
    selectedMapCategory === "All"
      ? mapMarkers
      : mapMarkers.filter((m) => (m.category || "").toLowerCase() === selectedMapCategory.toLowerCase());

  const getCellColorClass = (status: string) => {
    switch (status) {
      case "RED":
        return "bg-rose-500/20 border-rose-500 text-rose-900 hover:bg-rose-500/30";
      case "ORANGE":
        return "bg-amber-500/20 border-amber-500 text-amber-900 hover:bg-amber-500/30";
      case "GREEN":
      default:
        return "bg-emerald-500/20 border-emerald-500 text-emerald-900 hover:bg-emerald-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <CivicSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <TopSearchBar />
          <UserHeader />
        </header>

        <div className="p-4 sm:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          {/* Executive Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  NagrikAI Municipal Command Suite
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  • Executive Operations, Spatial Grids & Anti-Fraud Hub
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Civic Intelligence & Zone Command
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                4×4 municipal spatial grid analytics, automated YOLO/NLP triage, and dynamic officer workload distribution.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Export all grievance data as CSV report"
              >
                <Download className="w-4 h-4 text-blue-300" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowResetModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Reset demo seed database"
              >
                <RotateCcw className="w-4 h-4 text-rose-300" />
                <span>Reset Demo Data</span>
              </button>

              <button
                onClick={() => setShowOfficerModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Officer</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: "overview", label: "Executive Analytics", icon: Activity },
              { id: "grid_zones", label: "4×4 Municipal Spatial Grid", icon: Grid },
              { id: "assignments", label: "AI Workload Balancer", icon: Layers },
              { id: "spam_queue", label: `Anti-Fraud Queue (${spamQueue.length})`, icon: ShieldAlert },
              { id: "audit", label: "Immutable Audit Trail", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Operational Health Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
                    ✓
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SLA Compliance Rate</p>
                    <p className="text-sm font-black text-slate-900">{kpis.sla_compliance_rate || 94.2}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 font-bold flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Escalated Cases</p>
                    <p className="text-sm font-black text-slate-900">{kpis.escalated_complaints || 0} active</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                    <Layers className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Clusters</p>
                    <p className="text-sm font-black text-slate-900">{kpis.active_incidents || 0} clusters</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center">
                    ↻
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reopened Appeals</p>
                    <p className="text-sm font-black text-slate-900">{kpis.reopened_complaints || 0} cases</p>
                  </div>
                </div>
              </div>

              {/* Executive KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <KPICard title={t("admin_dashboard.kpi_system_total", "Total Analyzed")} value={kpis.total_complaints} icon={FileText} color="indigo" subtitle="NLP processed" widgetType="sparkline" />
                <KPICard title={t("citizen_dashboard.kpi_review", "Open Issues")} value={kpis.open_complaints} icon={AlertCircle} color="red" subtitle="Pending action" widgetType="pulse" />
                <KPICard title={t("citizen_dashboard.kpi_in_progress", "In Progress")} value={kpis.in_progress_complaints} icon={Clock} color="amber" subtitle="Active field crew" widgetType="progress" />
                <KPICard title={t("citizen_dashboard.kpi_resolved", "Resolved")} value={kpis.resolved_complaints} icon={CheckCircle2} color="emerald" subtitle="Verified closed" widgetType="check" />
                <KPICard title={t("priority.CRITICAL", "Critical Issues")} value={kpis.critical_priority_complaints} icon={ShieldAlert} color="red" subtitle="Immediate risk" widgetType="pulse" />
                <KPICard title={t("admin_dashboard.kpi_avg_sla", "Avg Res. SLA")} value={`${kpis.avg_resolution_days ? kpis.avg_resolution_days.toFixed(1) : "0.0"}d`} icon={TrendingUp} color="blue" subtitle="Turnaround target" />
              </div>

              {/* Geospatial Map */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" /> Civic Issue Intelligence Map
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Identify complaint clusters, recurring geographic hotspots, and active field assignments across city wards.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {["All", "Roads and Infrastructure", "Waste Management", "Water Supply", "Drainage and Sanitation", "Electricity and Streetlights"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedMapCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          selectedMapCategory === cat
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {cat === "All" ? "All" : cat.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <InteractiveMap markers={filteredMarkers} height="420px" zoom={12} />
              </div>

              {/* Hotspots & AI Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-600" />
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Geographic Complaint Hotspots
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      High Density Clusters
                    </span>
                  </div>

                  <div className="space-y-3">
                    {CIVIC_HOTSPOTS.map((spot, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{spot.area}</p>
                            <p className="text-[11px] text-slate-500">
                              Primary: <strong className="text-blue-900">{spot.primaryCategory}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-slate-900">{spot.count} complaints</span>
                          <p className="text-[10px] font-bold text-blue-700">{spot.trend}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        AI Civic Insights & Telemetry
                      </h2>
                    </div>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Machine Synthesized
                    </span>
                  </div>

                  <div className="space-y-3">
                    {AI_CIVIC_INSIGHTS.map((insight, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 text-xs text-slate-900 flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-normal">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 4×4 MUNICIPAL SPATIAL GRID */}
          {activeTab === "grid_zones" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Zone Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gridData?.zones.map((zn) => (
                  <div
                    key={zn.zone_name}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-900">{zn.zone_name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          zn.status === "RED"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : zn.status === "ORANGE"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}
                      >
                        {zn.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-2xl font-black text-slate-900 font-mono">{zn.total_active_complaints}</p>
                      <p className="text-xs text-slate-500 font-medium">Active Grievances in Zone</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                      <span>Top Domain:</span>
                      <strong className="text-blue-900 truncate max-w-[130px]">{zn.dominant_category}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4x4 Grid Matrix Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual 4x4 Matrix */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Grid className="w-4 h-4 text-blue-600" />
                        4×4 Municipal Spatial Cell Matrix
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click on any coordinate cell to inspect regional load, critical cases, and assigned squads.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/50 border border-rose-500"></span> Red</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500"></span> Orange</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/50 border border-emerald-500"></span> Green</span>
                    </div>
                  </div>

                  {/* 4x4 Grid Representation */}
                  <div className="grid grid-cols-4 gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {gridData?.grid_cells.map((cell) => {
                      const isSelected = selectedCell?.cell_id === cell.cell_id;
                      return (
                        <button
                          key={cell.cell_id}
                          onClick={() => setSelectedCell(cell)}
                          className={`p-3.5 rounded-xl border-2 transition-all text-left flex flex-col justify-between aspect-square cursor-pointer ${getCellColorClass(
                            cell.status || cell.status_color || "GREEN"
                          )} ${isSelected ? "ring-2 ring-blue-600 scale-102" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black">{cell.cell_id}</span>
                            {cell.critical_count > 0 && (
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                            )}
                          </div>

                          <div>
                            <div className="text-xl font-black font-mono">{cell.active_complaints}</div>
                            <div className="text-[10px] font-bold opacity-80 truncate">{cell.zone_name.split(" ")[0]}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Cell Inspector */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Grid Cell Inspector
                    </h3>
                    {selectedCell && (
                      <span className="font-mono font-bold text-xs bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {selectedCell.cell_id}
                      </span>
                    )}
                  </div>

                  {selectedCell ? (
                    <div className="space-y-4 text-xs animate-fadeIn">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Zone Affiliation:</span>
                          <strong className="text-slate-900">{selectedCell.zone_name}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Zone Health Status:</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            selectedCell.status === "RED" ? "bg-rose-100 text-rose-800" :
                            selectedCell.status === "ORANGE" ? "bg-amber-100 text-amber-800" :
                            "bg-emerald-100 text-emerald-800"
                          }`}>
                            {selectedCell.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total Active Complaints:</span>
                          <strong className="text-slate-900 font-mono text-sm">{selectedCell.active_complaints}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Critical Priority Cases:</span>
                          <strong className="text-rose-600 font-mono text-sm">{selectedCell.critical_count}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Primary Squad Domain:</span>
                          <strong className="text-blue-900">{selectedCell.primary_department}</strong>
                        </div>
                      </div>

                      {selectedCell.top_categories && selectedCell.top_categories.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                            Dominant Issues in Cell
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCell.top_categories.map((cat: string, i: number) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-xs font-semibold border border-blue-200"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCell.lat_min !== undefined && (
                        <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-600 text-[11px]">
                          Spatial Bounds: Lat {selectedCell.lat_min?.toFixed(3)}–{selectedCell.lat_max?.toFixed(3)} • Lng {selectedCell.lng_min?.toFixed(3)}–{selectedCell.lng_max?.toFixed(3)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 space-y-2 text-xs">
                      <Grid className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>Select any grid cell on the matrix to view high-resolution regional telemetry.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI WORKLOAD ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 animate-fadeIn">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    AI Squad Workload Balancing & Deployment Recommendations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Machine learning recommendation engine maps field officers to highest-density spatial grid sectors to minimize SLA delays.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                  {assignments.length} Municipal Officers Analyzed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5">Officer Name</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Active Workload</th>
                      <th className="px-6 py-3.5">Recommended Zone</th>
                      <th className="px-6 py-3.5">Target Grid Cell</th>
                      <th className="px-6 py-3.5">Pending in Cell</th>
                      <th className="px-6 py-3.5">AI Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                    {assignments.map((rec) => (
                      <tr key={rec.officer_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div>{rec.officer_name}</div>
                          <span className="text-[11px] text-slate-400 font-normal">{rec.email}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-blue-900">{rec.department_name}</td>
                        <td className="px-6 py-4 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded-md ${
                            (rec.current_workload ?? 0) > 8 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-800"
                          }`}>
                            {rec.current_workload ?? 0} active
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{rec.recommended_zone}</td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-700 bg-blue-50/50">{rec.recommended_cell}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{rec.pending_in_recommended}</td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">{rec.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ANTI-FRAUD & SPAM QUEUE */}
          {activeTab === "spam_queue" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 animate-fadeIn">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Anti-Fraud & Automated Spam Quarantine
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Grievances scoring elevated risk for spam, duplicate flood attacks, or abusive content are isolated here for administrative clearance.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                  {spamQueue.length} Flagged Reports
                </span>
              </div>

              {spamQueue.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 space-y-2 max-w-sm mx-auto">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm text-slate-900">Quarantine is Clear</p>
                  <p>No grievances are currently flagged for suspicious or fraudulent activity.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <th className="px-6 py-3.5">Ref ID</th>
                        <th className="px-6 py-3.5">Grievance Title & Text</th>
                        <th className="px-6 py-3.5">Spam Score</th>
                        <th className="px-6 py-3.5">Risk Reason</th>
                        <th className="px-6 py-3.5 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                      {spamQueue.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-blue-900">
                            NAGRIK-{String(item.id).padStart(5, "0")}
                          </td>
                          <td className="px-6 py-4 max-w-sm">
                            <p className="font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-slate-500 line-clamp-2 text-[11px]">{item.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold font-mono text-xs">
                              {Math.round((item.spam_risk_score || 0.75) * 100)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-rose-700 font-medium">
                            {item.spam_reason || "Repetitive submission pattern / keyword risk"}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleModerateSpam(item.id, "APPROVE")}
                              disabled={moderatingId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Clear / Approve</span>
                            </button>
                            <button
                              onClick={() => handleModerateSpam(item.id, "REJECT")}
                              disabled={moderatingId === item.id}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Quarantine</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 animate-fadeIn">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Immutable Municipal Audit Trail
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  {auditLogs.length} Events Logged
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Complaint Ref</th>
                      <th className="px-6 py-3.5">Action</th>
                      <th className="px-6 py-3.5">Field / Attribute</th>
                      <th className="px-6 py-3.5">Old Value</th>
                      <th className="px-6 py-3.5">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                    {auditLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-blue-900">
                          NAGRIK-2026-{String(log.complaint_id).padStart(5, "0")}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{log.action}</td>
                        <td className="px-6 py-3.5 text-[11px] text-slate-500">{log.field_name || "—"}</td>
                        <td className="px-6 py-3.5 text-[11px] text-rose-600 font-mono">{log.old_value || "—"}</td>
                        <td className="px-6 py-3.5 text-[11px] text-blue-900 font-mono font-bold">{log.new_value || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboard Officer Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Onboard Department Officer
              </h3>
              <button onClick={() => setShowOfficerModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {officerSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {officerSuccess}
              </div>
            )}

            {officerError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" /> {officerError}
              </div>
            )}

            <form onSubmit={handleCreateOfficer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Officer Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Official Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  required
                  placeholder="ramesh@nagrikai.gov"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Initial Temporary Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={officerPassword}
                  onChange={(e) => setOfficerPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Assigned Municipal Department <span className="text-rose-600">*</span>
                </label>
                <select
                  value={officerDeptId}
                  onChange={(e) => setOfficerDeptId(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.description || "Ward Unit"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-4 py-2.5 font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOfficer}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingOfficer ? "Creating Officer..." : "Create & Dispatch Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Demo Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Reset Demo Database</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will reset the municipal database to the official demo state, creating 160 realistic geocoded civic complaints distributed across the 4×4 spatial grid, sample community interactions, and verified demo accounts.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetDemoData}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Confirm Re-Seed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
