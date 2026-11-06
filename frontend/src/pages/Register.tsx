import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [protectDefault, setProtectDefault] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-stone-200" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", width: "w-1/4" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500", width: "w-2/4" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-sky-500", width: "w-3/4" };
    return { score: 4, label: "Strong", color: "bg-emerald-600", width: "w-full" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (!acceptTerms) {
      setError("Please agree to the Citizen Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.register({
        name,
        email,
        password,
        phone: phone || undefined,
        role: "CITIZEN",
        protect_identity_default: protectDefault
      });
      await login(email, password);
      navigate("/citizen");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please verify your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAF9F6]">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT 45%: NagrikAI Branding */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E3A8A] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>

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

            <div className="space-y-2 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Civic Engagement Platform
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                Join NagrikAI as a <br />
                <span className="text-blue-300">Verified Citizen.</span>
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed pt-1 font-normal">
                Report municipal issues directly, track real-time remediation SLAs, and hold departments accountable with transparent verification.
              </p>
            </div>

            <div className="space-y-2.5 pt-4">
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Optional "Protect My Identity" Anonymous Mode</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI-Powered Categorization & YOLO Visual Inspection</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-200 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Immutable Resolution Audits & Before/After Proof</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/15 text-[11px] text-stone-300 flex items-center justify-between">
            <span>Verified Citizen Security</span>
            <span className="text-blue-400 font-mono font-bold">SHA-256 / Bcrypt</span>
          </div>
        </div>

        {/* RIGHT 55%: Register Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-4 bg-white">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">Create Citizen Account</h1>
            <p className="text-xs text-stone-500 font-medium">
              Register with your contact details to begin filing and tracking grievances.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="aarav@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 00000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white text-stone-900"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white text-stone-900"
                  />
                </div>
              </div>
            </div>

            {password && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-stone-500">
                  <span>Password Security:</span>
                  <span className="font-bold">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}></div>
                </div>
              </div>
            )}

            {/* Privacy Feature Option */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={protectDefault}
                  onChange={(e) => setProtectDefault(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-stone-300 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-700" />
                    Protect My Identity by Default (Anonymous to Field Officers)
                  </span>
                  <p className="text-[11px] text-stone-500 font-normal leading-snug">
                    When enabled, municipal field officers and public feeds will only see your verified status without your real name, email, or phone number.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-700 focus:ring-blue-600 border-stone-300 cursor-pointer"
              />
              <label htmlFor="terms" className="text-stone-600 font-medium">
                I agree to the NagrikAI Citizen Charter and acknowledge that submissions undergo automated duplicate and spam verification.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating Citizen Profile..." : "Complete Registration"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-stone-500 pt-1 font-medium">
            Already have a NagrikAI account?{" "}
            <Link to="/login" className="font-bold text-blue-700 hover:text-blue-900 hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
