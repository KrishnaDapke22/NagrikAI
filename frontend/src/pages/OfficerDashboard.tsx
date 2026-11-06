import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiClient } from "../api/client";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  MapPin,
  Flame,
  Trash2,
  X,
  Layers,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { Complaint, Department, Incident } from "../types";

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, getStatusLabel, getPriorityLabel, getCategoryLabel } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [viewMode, setViewMode] = useState<"queue" | "incidents">("queue");
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Delete State
  const [deleteConfirmComplaint, setDeleteConfirmComplaint] = useState<Complaint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchComplaints();
    fetchIncidents();
  }, [statusFilter, priorityFilter, categoryFilter, departmentFilter]);

  const fetchIncidents = async () => {
    try {
      const data = await apiClient.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmComplaint) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteComplaint(deleteConfirmComplaint.id);
      setDeleteConfirmComplaint(null);
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete complaint.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiClient.getDepartments();
      setDepartments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const isAllDepts = departmentFilter === "all";
      const isMyDept = departmentFilter === "my";
      const targetDeptId = isMyDept
        ? (user?.department_id || undefined)
        : (!isAllDepts && departmentFilter !== "" ? parseInt(departmentFilter) : undefined);

      const data = await apiClient.getOfficerQueue({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        department_id: targetDeptId,
        all_departments: isAllDepts,
        search: searchQuery || undefined,
      });
      setComplaints(data || []);
    } catch (err) {
      console.error("Failed to load officer queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleQuickStatusChange = async (complaintId: number, newStatus: string) => {
    try {
      await apiClient.updateStatus(complaintId, newStatus);
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Status update failed.");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("citizen_dashboard.greeting_morning", "Good morning");
    if (hour < 17) return t("citizen_dashboard.greeting_afternoon", "Good afternoon");
    return t("citizen_dashboard.greeting_evening", "Good evening");
  };

  // KPIs
  const total = complaints.length;
  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const inProgCount = complaints.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;
  const highPriorityCount = complaints.filter(
    (c) => c.priority === "HIGH" || c.priority === "CRITICAL"
  ).length;

  const urgentComplaints = complaints.filter(
    (c) => (c.priority === "CRITICAL" || c.priority === "HIGH") && c.status !== "RESOLVED"
  );

  const avgResolution = 2.4;

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

        {/* Content Workspace */}
        <div className="p-4 sm:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          
          {/* Operational Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  NagrikAI Municipal Operations Hub
                </span>
                {user?.department_id && (
                  <span className="text-xs text-slate-300 font-medium">
                    • Squad: {departments.find((d) => d.id === user.department_id)?.name || "Assigned Department"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {getGreeting()}, Officer.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-normal">
                {t("officer_dashboard.urgent_subheading", "Review automated multi-model triage, manage ward emergency queues, and execute verified resolution workflows.")}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-xs font-bold text-white bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Duty: <strong className="text-blue-300">{complaints.length} in Queue</strong></span>
              </div>
            </div>
          </div>

          {/* Operational KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <KPICard title={t("citizen_dashboard.kpi_total", "Total Records")} value={total} icon={FileText} color="indigo" widgetType="sparkline" />
            <KPICard title={t("citizen_dashboard.kpi_review", "Open Intake")} value={openCount} icon={AlertCircle} color="red" widgetType="pulse" />
            <KPICard title={t("citizen_dashboard.kpi_in_progress", "In Progress")} value={inProgCount} icon={Clock} color="amber" widgetType="progress" />
            <KPICard title={t("citizen_dashboard.kpi_resolved", "Resolved")} value={resolvedCount} icon={CheckCircle2} color="emerald" widgetType="check" />
            <KPICard title={t("priority.CRITICAL", "High/Critical")} value={highPriorityCount} icon={ShieldAlert} color="red" widgetType="pulse" />
            <KPICard title={t("admin_dashboard.kpi_avg_sla", "Avg SLA")} value={`${avgResolution}d`} icon={TrendingUp} color="blue" />
          </div>

          {/* Urgent Grievances Spotlight */}
          {urgentComplaints.length > 0 && (
            <div className="bg-white rounded-3xl border border-rose-200 shadow-xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {t("officer_dashboard.urgent_heading", "Urgent Grievances Requiring Immediate Dispatch")}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {t("officer_dashboard.urgent_subheading", "Flagged by AI severity models & citizen safety escalation triggers")}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {urgentComplaints.length} {t("officer_dashboard.critical_items", "Critical Items")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {urgentComplaints.slice(0, 3).map((uc) => (
                  <div
                    key={uc.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/60">
                          NAGRIK-2026-{String(uc.id).padStart(5, "0")}
                        </span>
                        <StatusBadge type="priority" value={uc.priority} />
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {uc.title}
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        {uc.location_text && (
                          <p className="flex items-center gap-1.5 truncate text-blue-700 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{uc.location_text}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Estimated SLA: {uc.predicted_resolution_days || 2.0} {t("ai_analysis.days", "days")}</span>
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/complaints/${uc.id}`}
                      className="w-full py-2.5 bg-slate-900 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>{t("officer_dashboard.review_triage", "Review & Triage Dossier")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grievance title, description, ward location, or NAGRIK reference..."
                  className="w-full pl-10 pr-4 py-3 text-xs rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                {t("officer_dashboard.btn_filter", "Filter Queue")}
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t("officer_dashboard.filter_status", "Status")}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="">{t("status.all_statuses", "All Statuses")}</option>
                  <option value="OPEN">{getStatusLabel("OPEN")}</option>
                  <option value="IN_PROGRESS">{getStatusLabel("IN_PROGRESS")}</option>
                  <option value="RESOLVED">{getStatusLabel("RESOLVED")}</option>
                  <option value="REOPENED">{getStatusLabel("REOPENED")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t("officer_dashboard.filter_priority", "Priority")}
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="">{t("priority.all_priorities", "All Priorities")}</option>
                  <option value="CRITICAL">{getPriorityLabel("CRITICAL")}</option>
                  <option value="HIGH">{getPriorityLabel("HIGH")}</option>
                  <option value="MEDIUM">{getPriorityLabel("MEDIUM")}</option>
                  <option value="LOW">{getPriorityLabel("LOW")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t("officer_dashboard.filter_category", "Category")}
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="">{t("category.all_categories", "All Categories")}</option>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t("officer_dashboard.filter_dept", "Department Scope")}
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                >
                  <option value="all">{t("officer_dashboard.all_departments", "All Departments (Jurisdiction-Wide)")}</option>
                  {user?.department_id && (
                    <option value="my">{t("officer_dashboard.my_department", "My Department Only")}</option>
                  )}
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Operational Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{t("officer_dashboard.workspace_heading", "Operations Workspace")}</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-2 bg-slate-100 p-1 rounded-2xl w-fit">
                  <button
                    type="button"
                    onClick={() => setViewMode("queue")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "queue"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {t("officer_dashboard.tab_queue", "Grievance Queue")} ({complaints.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("incidents")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === "incidents"
                        ? "bg-white text-blue-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t("officer_dashboard.tab_incidents", "Incident Clusters")} ({incidents.length})</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user?.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await apiClient.runEscalationCheck();
                      alert(`SLA Escalation Check complete! Scanned ${res.scanned_count} active complaints, flagged ${res.escalated_count} cases.`);
                      fetchComplaints();
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>{t("officer_dashboard.btn_sla_scan", "Run SLA Escalation Scan")}</span>
                  </button>
                )}
                {departmentFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setDepartmentFilter("all")}
                    className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer ml-1"
                  >
                    Show All Departments
                  </button>
                )}
              </div>
            </div>

            {viewMode === "incidents" ? (
              <div className="p-6 space-y-4">
                {incidents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                    <Layers className="w-10 h-10 text-blue-400 mx-auto" />
                    <p className="font-bold text-sm text-slate-900">No Incident Clusters Logged</p>
                    <p>Complaints with high spatial and semantic similarity will be automatically linked into incident groups.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100/70 px-2.5 py-0.5 rounded-lg">
                            CLUSTER #{inc.id}
                          </span>
                          <StatusBadge type="priority" value={inc.priority} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{inc.title}</h3>
                        <p className="text-xs text-slate-500">
                          {inc.department_name} • {inc.location_text || "Ward Area"}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600">
                          <span className="font-semibold text-blue-900">
                            👥 {inc.affected_citizen_count} Citizen Reports Linked
                          </span>
                          <span className="text-[11px] font-bold uppercase text-slate-500">
                            Status: {inc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isLoading ? (
              <div className="py-20 text-center text-xs text-slate-500 space-y-2">
                <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-semibold">Loading officer queue...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2 max-w-sm mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-slate-900">Queue is Clear</p>
                <p>No complaints currently match the selected filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3.5">{t("officer_dashboard.col_reference", "ID")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.col_title_cat", "Grievance Details")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.filter_category", "Category")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.col_priority", "Priority")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.col_status", "Status")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.col_location", "Location")}</th>
                      <th className="px-5 py-3.5">{t("officer_dashboard.filter_dept", "Department")}</th>
                      <th className="px-5 py-3.5 text-right">{t("officer_dashboard.col_actions", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-5 py-4 font-mono font-bold text-blue-900">
                          <div>NAGRIK-{String(c.id).padStart(5, "0")}</div>
                          {c.is_escalated && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-900 border border-orange-200 mt-1">
                              ESCALATED
                            </span>
                          )}
                          {c.incident_id && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-900 border border-blue-200 mt-1">
                              INC #{c.incident_id}
                            </span>
                          )}
                          {c.is_identity_protected && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1">
                              <Shield className="w-2.5 h-2.5 text-emerald-600" /> PROTECTED
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 max-w-xs">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors block truncate"
                          >
                            {c.title}
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                            {c.description}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-semibold text-[11px] border border-slate-200">
                            {getCategoryLabel(c.category || "") || c.category || "General"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge type="priority" value={c.priority} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge type="status" value={c.status} />
                        </td>

                        <td className="px-5 py-4 text-[11px] text-slate-600 truncate max-w-[140px]">
                          <div>{c.location_text || "Ward Region"}</div>
                          {c.zone_name && (
                            <span className="text-[10px] text-blue-700 font-bold block">{c.zone_name}</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-[11px] font-semibold text-slate-600">
                          {c.department_name || "Unassigned"}
                        </td>

                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          {c.status === "OPEN" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(c.id, "IN_PROGRESS")}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              {t("officer_dashboard.btn_start_work", "Start Work")}
                            </button>
                          )}

                          <Link
                            to={`/complaints/${c.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-[11px] font-bold transition-colors border border-blue-200 cursor-pointer"
                          >
                            <span>{t("officer_dashboard.btn_dossier", "Dossier")}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {user?.role === "ADMIN" && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmComplaint(c)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold transition-colors border border-rose-200 cursor-pointer"
                              title="Permanently Delete (Admin Only)"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("officer_dashboard.btn_delete", "Delete")}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal (Admin Only) */}
      {deleteConfirmComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">{t("officer_dashboard.confirm_delete_title", "Delete Grievance Record")}</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmComplaint(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 space-y-1">
                <p className="font-bold">{t("officer_dashboard.confirm_delete_title", "Are you sure you want to permanently delete this complaint?")}</p>
                <p className="text-[11px] text-rose-700 font-medium">
                  {t("officer_dashboard.confirm_delete_desc", "This will remove the complaint dossier, its AI diagnostic telemetry, and all linked duplicate similarity mappings.")}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-blue-900">
                    NAGRIK-{String(deleteConfirmComplaint.id).padStart(5, "0")}
                  </span>
                  <StatusBadge type="status" value={deleteConfirmComplaint.status} />
                </div>
                <p className="font-bold text-slate-900">{deleteConfirmComplaint.title}</p>
                <p className="text-slate-500 line-clamp-2">{deleteConfirmComplaint.description}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmComplaint(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {t("officer_dashboard.btn_cancel", "Cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirmed}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : t("officer_dashboard.btn_confirm_delete", "Permanently Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
