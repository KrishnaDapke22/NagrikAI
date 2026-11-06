import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  FileCheck2,
  ShieldCheck,
  BarChart3,
  HelpCircle,
  LogOut,
  FolderKanban,
  Users,
} from "lucide-react";

export const CivicSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "OFFICER") return "/officer";
    return "/citizen";
  };

  return (
    <aside className="w-full lg:w-64 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-6 shrink-0">
      <div className="space-y-6">
        
        {/* NagrikAI Logo */}
        <Link to="/" className="flex items-center gap-3 group px-1">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10zm0 14a4 4 0 110-8 4 4 0 010 8z" fill="#3B82F6" />
              <path d="M12 9l8 10M12 19V9m8 0v10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-black tracking-tight text-slate-900">{t("brand.name", "Nagrik")}</span>
              <span className="text-lg font-black tracking-tight text-blue-600">{t("brand.suffix", "AI")}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block -mt-1 tracking-tight">
              {t("brand.motto", "Your Voice. Your City. Our Responsibility.")}
            </span>
          </div>
        </Link>

        {/* Navigation Sections */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t("nav.operations_portal", "Operations Portal")}
          </p>

          <Link
            to={getDashboardPath()}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive(getDashboardPath())
                ? "bg-blue-50/90 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${isActive(getDashboardPath()) ? "text-blue-600" : "text-slate-400"}`} />
            <span>{t("nav.command_center", "Command Center")}</span>
          </Link>

          <Link
            to="/submit"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive("/submit")
                ? "bg-blue-50 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <PlusCircle className={`w-4 h-4 ${isActive("/submit") ? "text-blue-600" : "text-slate-400"}`} />
            <span>{t("nav.submit_grievance", "Submit Grievance")}</span>
          </Link>

          {/* NagrikAI Community */}
          <Link
            to="/community"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isActive("/community")
                ? "bg-blue-50/90 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Users className={`w-4 h-4 ${isActive("/community") ? "text-blue-600" : "text-slate-400"}`} />
            <span>NagrikAI Community</span>
          </Link>

          {user?.role === "CITIZEN" && (
            <Link
              to="/citizen"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/citizen")
                  ? "bg-blue-50/90 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FolderKanban className={`w-4 h-4 ${isActive("/citizen") ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t("nav.my_grievances", "My Grievances")}</span>
            </Link>
          )}

          <a
            href="/#track"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>{t("nav.track_status", "Track Status")}</span>
          </a>

          {(user?.role === "OFFICER" || user?.role === "ADMIN") && (
            <Link
              to="/officer"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/officer")
                  ? "bg-blue-50/90 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isActive("/officer") ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t("nav.officer_queue", "Officer Queue")}</span>
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive("/admin")
                  ? "bg-blue-50/90 text-blue-950 border-l-3 border-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${isActive("/admin") ? "text-blue-600" : "text-slate-400"}`} />
              <span>{t("nav.civic_analytics", "Civic Analytics")}</span>
            </Link>
          )}

          <a
            href="/#features"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-slate-400" />
            <span>{t("nav.citizen_charter", "Citizen Charter")}</span>
          </a>
        </nav>
      </div>

      {/* User Information & Municipal Hotline */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        {user ? (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
                {user.role}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">{t("brand.public_mode", "Public Portal Mode")}</p>
            <Link
              to="/login"
              className="block w-full text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              {t("nav.sign_in", "Sign In")}
            </Link>
          </div>
        )}

        {/* 24x7 Helpline Support */}
        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/80 text-[11px] space-y-1">
          <p className="font-bold text-blue-950 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> {t("brand.hotline", "Municipal Hotline")}
          </p>
          <p className="text-slate-600 leading-snug">
            {t("brand.toll_free", "Toll-Free")}: <strong className="text-slate-900 font-mono">{t("brand.helpline_number", "1800-NAGRIK-AI")}</strong>
          </p>
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("nav.sign_out", "Sign Out")}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
