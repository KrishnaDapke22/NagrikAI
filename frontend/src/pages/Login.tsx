import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiClient } from "../api/client";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

export const Login: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === "ADMIN") navigate("/admin");
      else if (loggedInUser.role === "OFFICER") navigate("/officer");
      else navigate("/citizen");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Invalid email or password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsSendingForgot(true);
    setForgotMsg(null);
    try {
      const res = await apiClient.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg("Password reset request submitted. Check your inbox.");
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAF9F6]">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT 45%: NagrikAI Navy & Electric Blue Branding */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E3A8A] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>
          
          {/* Ambient Glows */}
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                <img src="/nagrikai-icon.svg" alt="NagrikAI Logo" className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  Nagrik<span className="text-blue-400">AI</span>
                </span>
                <span className="text-[10px] text-stone-300 block -mt-1 font-medium tracking-wide uppercase">
                  Your Voice • Your City • Our Responsibility
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Civic Technology Intelligence
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Empowering Citizens. <br />
                <span className="text-blue-300">Modernizing Cities.</span>
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed pt-1 font-normal">
                Report municipal defects, track real-time resolution SLAs, inspect neighborhood grid zones, and engage in the verified NagrikAI Community.
              </p>
            </div>

            {/* Platform Trust Pills */}
            <div className="space-y-2.5 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Privacy-First Citizen Identity Protection</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>YOLO Visual Issue Detection & Bounding Boxes</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Geospatial Grid Zoning & Automated SLA Escalations</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/15 text-[11px] text-stone-300 flex items-center justify-between">
            <span>High-Assurance Civic Tech</span>
            <span className="text-blue-400 font-mono font-bold">Production v2.0</span>
          </div>
        </div>

        {/* RIGHT 55%: Sign In Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-white">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {t("auth.login_title", "Sign in to NagrikAI")}
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Access your citizen dashboard, operational squad queue, or municipal command center.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                {t("auth.email_label", "Email Address")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium text-stone-900 placeholder-stone-400"
                  placeholder="name@nagrikai.gov"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                {t("auth.password_label", "Password")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-stone-900 placeholder-stone-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-stone-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-stone-300 cursor-pointer"
                />
                <span>Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Authenticating Session..." : "Sign In to NagrikAI"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Personas */}
          <div className="pt-4 border-t border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                1-Click Ready-to-Use Demo Personas
              </p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Pre-seeded Data
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("citizen@nagrikai.gov", "citizen123")}
                className="p-3 rounded-2xl bg-stone-50 hover:bg-blue-50 border border-stone-200 hover:border-blue-300 text-xs font-bold text-stone-800 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <UserCheck className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
                <span>Citizen</span>
                <span className="text-[9px] text-stone-400 font-normal">citizen@nagrikai</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("officer@nagrikai.gov", "officer123")}
                className="p-3 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-xs font-bold text-stone-800 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <Shield className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Field Officer</span>
                <span className="text-[9px] text-stone-400 font-normal">Power Squad</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("water.officer@nagrikai.gov", "officer123")}
                className="p-3 rounded-2xl bg-stone-50 hover:bg-cyan-50 border border-stone-200 hover:border-cyan-300 text-xs font-bold text-stone-800 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <Shield className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                <span>Water Squad</span>
                <span className="text-[9px] text-stone-400 font-normal">Pipeline Div</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("admin@nagrikai.gov", "admin123")}
                className="p-3 rounded-2xl bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 text-xs font-bold text-stone-800 text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <Lock className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" />
                <span>Admin</span>
                <span className="text-[9px] text-stone-400 font-normal">Municipal HQ</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-stone-500 pt-1 font-medium">
            New to NagrikAI?{" "}
            <Link to="/register" className="font-bold text-blue-700 hover:text-blue-900 hover:underline">
              Create a Verified Citizen Account
            </Link>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setForgotMsg(null);
              }}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-stone-900">Reset Your Password</h3>
            <p className="text-xs text-stone-500">
              Enter your registered email address and we'll send password recovery instructions.
            </p>
            {forgotMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-medium">
                {forgotMsg}
              </div>
            )}
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="name@nagrikai.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={isSendingForgot}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {isSendingForgot ? "Dispatching..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
