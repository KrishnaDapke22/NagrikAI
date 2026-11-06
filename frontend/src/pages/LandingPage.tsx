import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { AIStatusOrb } from "../components/AIStatusOrb";
import {
  FALLBACK_PLATFORM_STATS,
  type PlatformStats,
} from "../config/demoData";
import {
  ArrowRight,
  Search,
  Clock,
  ChevronRight,
  AlertTriangle,
  Zap,
  Users,
  Eye,
  Shield,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>(FALLBACK_PLATFORM_STATS);
  const [trackId, setTrackId] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const fetchLiveStats = async () => {
    try {
      const data = await apiClient.getAnalytics();
      if (data && data.kpis && data.kpis.total_complaints !== undefined) {
        setStats({
          totalAnalyzed: data.kpis.total_complaints || FALLBACK_PLATFORM_STATS.totalAnalyzed,
          resolved: data.kpis.resolved_complaints || FALLBACK_PLATFORM_STATS.resolved,
          avgResolutionDays:
            data.kpis.avg_resolution_days > 0
              ? parseFloat(data.kpis.avg_resolution_days.toFixed(1))
              : FALLBACK_PLATFORM_STATS.avgResolutionDays,
          satisfactionRate: FALLBACK_PLATFORM_STATS.satisfactionRate,
        });
      }
    } catch (e) {
      setStats(FALLBACK_PLATFORM_STATS);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;

    const cleaned = trackId.trim().replace(/^[^\d]*/, "");
    const parsedId = parseInt(cleaned, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      setTrackError("Please enter a valid complaint reference (e.g. 1 or NAGRIK-2026-00001)");
      return;
    }

    setTrackError(null);
    navigate(`/complaints/${parsedId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-slate-200 bg-white">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-100/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>NAGRIKAI PLATFORM • YOUR VOICE. YOUR CITY. OUR RESPONSIBILITY.</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Empowering Citizens. <br />
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Transforming Municipal Governance.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Report civic grievances with privacy protection and multimodal AI. NagrikAI classifies issues via YOLO computer vision and multilingual IndicBERT, detects duplicates, balances squad workloads across a 4×4 spatial grid, and verifies remediation with before/after photo proof.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-2">
                <Link
                  to={user ? "/submit" : "/login?redirect=/submit"}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-white fill-white" />
                  <span>{t("citizen_dashboard.btn_report", "Report a Grievance")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/community"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all border border-slate-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Explore Community Feed</span>
                </Link>

                <a
                  href="#track"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all border border-slate-200 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-slate-500" />
                  <span>Track Status</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Privacy-First Verified Citizen Identity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>YOLO Civic Visual Defect Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>4×4 Municipal Spatial Grid Mapping</span>
                </div>
              </div>

            </div>

            {/* Right Hero Orbital Signature (5 Cols) */}
            <div className="lg:col-span-5 flex items-center justify-center py-6">
              <div className="relative p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-white">
                <AIStatusOrb />
                <div className="mt-6 text-center space-y-1 border-t border-slate-800 pt-4">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-400">Autonomous Inference Engine</p>
                  <p className="text-[11px] text-slate-400 font-medium">Multilingual NLP + YOLO Defect Detection + 4×4 Spatial Grid</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PLATFORM STATISTICS COUNTER STRIP */}
      <section className="bg-white border-b border-slate-200 py-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <p className="text-3xl sm:text-4xl font-black text-blue-900 font-mono">
                {stats.totalAnalyzed.toLocaleString()}+
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Complaints Ingested
              </p>
              <span className="inline-block text-[10px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Multimodal AI
              </span>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <p className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono">
                {stats.resolved.toLocaleString()}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grievances Resolved
              </p>
              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Before / After Verified
              </span>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                {stats.avgResolutionDays} <span className="text-xl font-bold text-slate-500">days</span>
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Avg Resolution Time
              </p>
              <span className="inline-block text-[10px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                SLA Compliance: 94.2%
              </span>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <p className="text-3xl sm:text-4xl font-black text-amber-600 font-mono">
                {stats.satisfactionRate}%
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Citizen Satisfaction
              </p>
              <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                5-Star Verified
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* 3. THREE FEATURE PILLARS */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-700">
            Intelligent Public Governance
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How NagrikAI Transforms Civic Grievance Management
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Equipped with privacy protection, YOLO defect detection, speech-to-text, 4×4 spatial grids, and community backing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Feature 1: MULTIMODAL & PRIVACY */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Multimodal & Privacy-First</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Submit grievances via photo, video, audio voice notes (with automated speech-to-text), or text in English, Hindi, and Marathi. Toggle "Protect My Identity" to shield your personal details from field squads.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Voice • Vision • Privacy Shield</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Feature 2: YOLO & SPATIAL GRIDS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. YOLO Vision & 4×4 Spatial Grid</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                YOLO computer vision accurately labels potholes, garbage accumulation, and infrastructure damage with bounding boxes. Regional complaints map onto a 4×4 spatial grid with Red/Orange/Green health statuses.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>YOLOv8 + 4×4 Municipal Matrix</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Feature 3: COMMUNITY & RESOLUTION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs hover:border-blue-300 transition-all space-y-5 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. Civic Community & Before/After Proof</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Fellow citizens can support issues ("I am also affected") and join discussion threads. Resolutions require side-by-side Before/After photographic evidence verified before ticket closure.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Community Backing + Proof of Work</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. WORKFLOW PIPELINE STRIP */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Transparent Municipal Pipeline
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              From Citizen Filing to Verified Municipal Closure
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">1</span>
              <p className="text-xs font-bold text-slate-900">Citizen</p>
              <p className="text-[10px] text-slate-500">Filing + Privacy</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-800 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">2</span>
              <p className="text-xs font-bold text-slate-900">YOLO + NLP</p>
              <p className="text-[10px] text-slate-500">Defect Detection</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">3</span>
              <p className="text-xs font-bold text-slate-900">Spatial Grid</p>
              <p className="text-[10px] text-slate-500">4×4 Zone Routing</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-sky-700 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">4</span>
              <p className="text-xs font-bold text-slate-900">AI Balancer</p>
              <p className="text-[10px] text-slate-500">Squad Assigned</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">5</span>
              <p className="text-xs font-bold text-slate-900">Dispatch</p>
              <p className="text-[10px] text-slate-500">Field Remediation</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-xs">✓</span>
              <p className="text-xs font-bold text-emerald-900">Verified Close</p>
              <p className="text-[10px] text-emerald-700">Before/After Photo</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE GRIEVANCE TRACKER CARD */}
      <section id="track" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" /> Track Grievance in Real-Time
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Enter your complaint reference code to view live AI classification, assigned squad, and resolution timeline.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="e.g. NAGRIK-2026-00001 or 1"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Track Progress</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {trackError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {trackError}
              </p>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span>Try sample reference:</span>
              <button
                type="button"
                onClick={() => setTrackId("1")}
                className="text-blue-700 font-bold underline cursor-pointer"
              >
                NAGRIK-2026-00001 (#1)
              </button>
              <span>•</span>
              <span className="italic">Or any registered complaint ID</span>
            </div>
          </form>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto bg-slate-950 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
                    <path d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10zm0 14a4 4 0 110-8 4 4 0 010 8z" fill="#93C5FD" />
                    <path d="M12 9l8 10M12 19V9m8 0v10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-lg font-black tracking-tight">NagrikAI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your Voice. Your City. Our Responsibility. Empowering municipal governance with machine learning, privacy protection, and civic accountability.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Portals</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><Link to="/citizen" className="hover:text-white transition-colors">Citizen Workspace</Link></li>
                <li><Link to="/submit" className="hover:text-white transition-colors">Report Grievance</Link></li>
                <li><Link to="/community" className="hover:text-white transition-colors">Community Feed</Link></li>
                <li><Link to="/officer" className="hover:text-white transition-colors">Officer Work Queue</Link></li>
                <li><Link to="/admin" className="hover:text-white transition-colors">Admin Command</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Core Technology</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><span>YOLO Civic Defect Detection</span></li>
                <li><span>Multilingual IndicBERT NLP</span></li>
                <li><span>4×4 Municipal Spatial Grid</span></li>
                <li><span>Before / After Photo Remediation</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Municipal Hotline</p>
              <p className="text-xs text-slate-400">Toll-Free Grievance Helpline:</p>
              <p className="text-sm font-bold text-white font-mono">1800-NAGRIK-AI (1800-624-7452)</p>
              <p className="text-[11px] text-slate-500">Hours: 24×7 Automated Ingestion</p>
            </div>

          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>© 2026 NagrikAI Municipal Technology Platform. All rights reserved.</p>
            <p>Your Voice. Your City. Our Responsibility.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
