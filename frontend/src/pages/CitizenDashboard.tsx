import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiClient } from "../api/client";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { AIStatusOrb } from "../components/AIStatusOrb";
import { AIInsightsPanel } from "../components/AIInsightsPanel";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";
import { InteractiveMap } from "../components/InteractiveMap";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Map as MapIcon,
  Percent,
  Shield,
  Users,
  Check,
} from "lucide-react";

export const CitizenDashboard: React.FC = () => {
  const { user, updatePrivacy } = useAuth();
  const { t, getCategoryLabel, getStatusLabel } = useLanguage();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Privacy preference state
  const [protectDefault, setProtectDefault] = useState(user?.protect_identity_default ?? false);
  const [privacySaved, setPrivacySaved] = useState(false);

  useEffect(() => {
    fetchMyComplaints();
    if (user) {
      setProtectDefault(user.protect_identity_default ?? false);
    }
  }, [user]);

  const fetchMyComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error("Failed to load citizen complaints:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const newVal = !protectDefault;
    setProtectDefault(newVal);
    try {
      await updatePrivacy(newVal);
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2500);
    } catch (err) {
      alert("Failed to update privacy preferences.");
      setProtectDefault(!newVal);
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
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.location_text && c.location_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(c.id).includes(searchQuery);

    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesCategory = categoryFilter
      ? (c.category || "").toLowerCase() === categoryFilter.toLowerCase()
      : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Zone 1: Left Command Sidebar */}
      <CivicSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Floating Action Bar */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <TopSearchBar />
          <UserHeader />
        </header>

        {/* Zone 2: Central Main Command Workspace */}
        <div className="flex-1 flex flex-col xl:flex-row gap-6 p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
          
          <main className="flex-1 min-w-0 space-y-6">
            
            {/* Asymmetric Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-md">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Hero Content */}
                <div className="space-y-4 max-w-xl text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span>NAGRIKAI CITIZEN SUITE • ACTIVE DISPATCH</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                    {getGreeting()},{" "}
                    <span className="text-blue-400">
                      {user?.name ? user.name.split(" ")[0] : "Citizen"}
                    </span>{" "}
                    👋
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                    {t("citizen_dashboard.hero_desc", "Report public grievances with autonomous NLP triage, verify live field dispatch timelines, and monitor spatial civic health across your municipality.")}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {/* Primary CTA */}
                    <Link
                      to="/submit"
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      <span>{t("citizen_dashboard.btn_report", "Report a Grievance")}</span>
                    </Link>

                    {/* Community Feed Shortcut */}
                    <Link
                      to="/community"
                      className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-blue-300" />
                      <span>NagrikAI Community</span>
                    </Link>

                    {/* Secondary Track Button */}
                    <button
                      type="button"
                      onClick={() => {
                        scrollToSection("grievance-dossiers");
                        searchInputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-slate-300" />
                      <span>{t("citizen_dashboard.btn_track", "Track Status")}</span>
                    </button>
                  </div>
                </div>

                {/* Right Hero: Orbital AI Signature */}
                <div className="shrink-0 flex items-center justify-center p-2">
                  <AIStatusOrb />
                </div>
              </div>
            </div>

            {/* Privacy Preference Setting Pill */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Privacy-First Citizen Protection
                    </h3>
                    {privacySaved && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 animate-fadeIn">
                        <Check className="w-3 h-3" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    When enabled, municipal officers and public feeds see only <strong>"Verified Citizen – Identity Protected"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    protectDefault ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      protectDefault ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-700">
                  {protectDefault ? "Protected by Default" : "Public Name"}
                </span>
              </div>
            </div>

            {/* 5 Distinct KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KPICard
                title={t("citizen_dashboard.kpi_total", "Total Grievances")}
                value={total}
                icon={FileText}
                color="indigo"
                subtitle={t("citizen_dashboard.kpi_total_sub", "Filed by you")}
                trend={total > 0 ? `${total} logged` : undefined}
                widgetType="sparkline"
              />
              <KPICard
                title={t("citizen_dashboard.kpi_review", "Under Review")}
                value={openCount}
                icon={AlertCircle}
                color="red"
                subtitle={t("citizen_dashboard.kpi_review_sub", "Awaiting dispatch")}
                widgetType="pulse"
              />
              <KPICard
                title={t("citizen_dashboard.kpi_in_progress", "In Progress")}
                value={inProgCount}
                icon={Clock}
                color="amber"
                subtitle={t("citizen_dashboard.kpi_in_progress_sub", "Field crews active")}
                widgetType="progress"
              />
              <KPICard
                title={t("citizen_dashboard.kpi_resolved", "Resolved")}
                value={resolvedCount}
                icon={CheckCircle2}
                color="emerald"
                subtitle={t("citizen_dashboard.kpi_resolved_sub", "Verified closures")}
                widgetType="check"
              />
              <KPICard
                title={t("citizen_dashboard.kpi_rate", "Resolution Rate")}
                value={`${resolutionRate}%`}
                icon={Percent}
                color="purple"
                subtitle={t("citizen_dashboard.kpi_rate_sub", "Closure efficiency")}
                widgetType="donut"
              />
            </div>

            {/* Geospatial Map Section */}
            <div id="gis-map-view" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-blue-600" />
                    <span>{t("citizen_dashboard.map_heading", "Ward Spatial Intelligence & Grievance Density")}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {t("citizen_dashboard.map_subheading", "Live geospatial coordinates rendered on high-contrast CartoDB Voyager tiles")}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{complaints.filter(c => c.latitude && c.longitude).length} Geolocated Incidents</span>
                </div>
              </div>

              <InteractiveMap markers={complaints} showFilters={true} height="360px" />
            </div>

            {/* Complaints Dossiers Section */}
            <div id="grievance-dossiers" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
              {/* Header with Search and Category Filter */}
              <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>{t("citizen_dashboard.dossiers_heading", "Grievance Dossiers")}</span>
                    <span className="text-[11px] font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {filteredComplaints.length} Records
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("citizen_dashboard.dossiers_subheading", "Search by ID, keyword, or ward location with live AI diagnostic tags")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("citizen_dashboard.search_dossiers", "Search ID, title, ward...")}
                      className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white w-48 sm:w-56 font-medium"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">{t("status.all_statuses", "All Statuses")}</option>
                      <option value="OPEN">{getStatusLabel("OPEN")}</option>
                      <option value="IN_PROGRESS">{getStatusLabel("IN_PROGRESS")}</option>
                      <option value="RESOLVED">{getStatusLabel("RESOLVED")}</option>
                      <option value="REJECTED">{getStatusLabel("REJECTED")}</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
                </div>
              </div>

              {/* Complaints List */}
              <div className="p-6 pt-0">
                {isLoading ? (
                  <div className="py-20 text-center text-xs text-slate-500 space-y-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-semibold text-slate-600">Querying municipal records & AI pipeline...</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{t("citizen_dashboard.no_grievances", "No grievances found matching criteria.")}</p>
                    </div>
                    <Link
                      to="/submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{t("citizen_dashboard.btn_report", "Report New Grievance")}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.map((c) => (
                      <div
                        key={c.id}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/60 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-2.5 flex-1">
                          {/* Reference ID and Meta tags */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">
                              NAGRIK-2026-{String(c.id).padStart(5, "0")}
                            </span>
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                              {getCategoryLabel(c.category) || c.category || "General"}
                            </span>
                            {c.is_identity_protected && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-emerald-600" /> Protected
                              </span>
                            )}
                            {c.zone_name && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {c.zone_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-950 transition-colors leading-snug">
                            {c.title}
                          </h3>

                          {/* Location details */}
                          {c.location_text && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{c.location_text}</span>
                            </p>
                          )}
                        </div>

                        {/* Status & Action */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="flex items-center gap-2">
                            <StatusBadge type="priority" value={c.priority} />
                            <StatusBadge type="status" value={c.status} />
                          </div>

                          <Link
                            to={`/complaints/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                          >
                            <span>{t("citizen_dashboard.view_dossier", "View Dossier")}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </main>

          {/* Zone 3: Right Side AI Intelligence Panel */}
          <div className="shrink-0">
            <AIInsightsPanel />
          </div>

        </div>

      </div>
    </div>
  );
};
