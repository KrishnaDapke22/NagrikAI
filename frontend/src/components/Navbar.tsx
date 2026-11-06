import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  LogOut,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  BarChart3,
  Globe,
  Menu,
  X,
  ChevronDown,
  Users,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // On workspace routes, CivicSidebar & UserHeader provide in-app navigation
  const isWorkspace =
    location.pathname.startsWith("/citizen") ||
    location.pathname.startsWith("/officer") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/submit") ||
    location.pathname.startsWith("/community") ||
    location.pathname.startsWith("/complaints");

  if (isWorkspace) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const activeLangConfig = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Left: NagrikAI Brand Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
              <path d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10zm0 14a4 4 0 110-8 4 4 0 010 8z" fill="#3B82F6" />
              <path d="M12 9l8 10M12 19V9m8 0v10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tracking-tight text-slate-900">{t("brand.name", "Nagrik")}</span>
              <span className="text-xl font-black tracking-tight text-blue-600">{t("brand.suffix", "AI")}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 block -mt-1 tracking-tight">
              {t("brand.motto", "Your Voice. Your City. Our Responsibility.")}
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-xl transition-all ${
              isActive("/")
                ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                : "hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {t("nav.command_center", "Home")}
          </Link>
          <a
            href="/#features"
            className="px-3.5 py-2 rounded-xl transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            {t("nav.features", "Capabilities")}
          </a>
          <a
            href="/#track"
            className="px-3.5 py-2 rounded-xl transition-all hover:text-slate-900 hover:bg-slate-100"
          >
            {t("nav.track_status", "Track Grievance")}
          </a>

          {/* Public Community Section */}
          <Link
            to="/community"
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              isActive("/community")
                ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                : "hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Community</span>
          </Link>

          {user && (
            <>
              {user.role === "CITIZEN" && (
                <>
                  <div className="h-4 w-px bg-slate-300 mx-1"></div>
                  <Link
                    to="/citizen"
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive("/citizen")
                        ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-blue-700" /> {t("nav.command_center", "Workspace")}
                  </Link>
                  <Link
                    to="/submit"
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive("/submit")
                        ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs font-black"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" /> {t("nav.submit_grievance", "Report Issue")}
                  </Link>
                </>
              )}

              {user.role === "OFFICER" && (
                <>
                  <div className="h-4 w-px bg-slate-300 mx-1"></div>
                  <Link
                    to="/officer"
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive("/officer")
                        ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> {t("nav.officer_queue", "Officer Queue")}
                  </Link>
                </>
              )}

              {user.role === "ADMIN" && (
                <>
                  <div className="h-4 w-px bg-slate-300 mx-1"></div>
                  <Link
                    to="/admin"
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive("/admin")
                        ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-700" /> {t("nav.civic_analytics", "Analytics")}
                  </Link>
                  <Link
                    to="/officer"
                    className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                      isActive("/officer")
                        ? "text-blue-900 bg-blue-50 border border-blue-200/80 shadow-xs"
                        : "hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> {t("nav.officer_queue", "Queue")}
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right: Language Selector & Auth */}
        <div className="flex items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors border border-slate-200 shadow-xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeLangConfig.short}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs font-semibold">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer ${
                      language === l.code ? "text-blue-900 font-bold bg-blue-50/70" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {l.short}
                      </span>
                      <span>{l.nativeName}</span>
                    </div>
                    {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                title={t("nav.sign_out", "Logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-blue-900 px-4 py-2 rounded-xl transition-colors hover:bg-slate-100 cursor-pointer"
              >
                {t("nav.sign_in", "Sign In")}
              </Link>
              <Link
                to="/register"
                className="text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {t("nav.register", "Get Started")}
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-bold text-slate-800 hover:text-blue-900"
          >
            {t("nav.command_center", "Home")}
          </Link>
          <a
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-bold text-slate-800 hover:text-blue-900"
          >
            {t("nav.features", "Capabilities")}
          </a>
          <a
            href="/#track"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-bold text-slate-800 hover:text-blue-900"
          >
            {t("nav.track_status", "Track Grievance")}
          </a>
          <Link
            to="/community"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-bold text-blue-700"
          >
            NagrikAI Community
          </Link>

          {user && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-500">Signed in as {user.name} ({user.role})</p>
              {user.role === "CITIZEN" && (
                <>
                  <Link
                    to="/citizen"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-xs font-bold text-blue-900"
                  >
                    {t("nav.command_center", "Command Center")}
                  </Link>
                  <Link
                    to="/submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-xs font-bold text-blue-600"
                  >
                    {t("nav.submit_grievance", "Report Grievance")}
                  </Link>
                </>
              )}
              {user.role === "OFFICER" && (
                <Link
                  to="/officer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-xs font-bold text-blue-900"
                >
                  {t("nav.officer_queue", "Officer Queue")}
                </Link>
              )}
              {user.role === "ADMIN" && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-xs font-bold text-blue-900"
                  >
                    {t("nav.civic_analytics", "Civic Analytics")}
                  </Link>
                  <Link
                    to="/officer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-xs font-bold text-blue-900"
                  >
                    {t("nav.officer_queue", "All Grievances")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
