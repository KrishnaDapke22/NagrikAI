import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  PlusCircle,
  Users,
  MapPin,
  ShieldCheck,
  BarChart3,
  User as UserIcon,
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getHomePath = () => {
    if (!user) return "/";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "OFFICER") return "/officer";
    return "/citizen";
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 shadow-lg flex items-center justify-around">
      <Link
        to={getHomePath()}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          isActive(getHomePath())
            ? "text-blue-600 font-bold"
            : "text-stone-500 hover:text-stone-900"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Dashboard</span>
      </Link>

      <Link
        to="/community"
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          isActive("/community")
            ? "text-blue-600 font-bold"
            : "text-stone-500 hover:text-stone-900"
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">Community</span>
      </Link>

      {/* Primary Center Action - Submit / Report */}
      <Link
        to="/submit"
        className="flex flex-col items-center -mt-5 group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-blue-700 mt-1">Report</span>
      </Link>

      {user?.role === "OFFICER" ? (
        <Link
          to="/officer"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isActive("/officer")
              ? "text-blue-600 font-bold"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">Queue</span>
        </Link>
      ) : user?.role === "ADMIN" ? (
        <Link
          to="/admin"
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            isActive("/admin")
              ? "text-blue-600 font-bold"
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </Link>
      ) : (
        <a
          href="/#track"
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-stone-500 hover:text-stone-900 transition-all"
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px]">Track</span>
        </a>
      )}

      <Link
        to={user ? "/citizen" : "/login"}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          isActive("/login") || isActive("/register")
            ? "text-blue-600 font-bold"
            : "text-stone-500 hover:text-stone-900"
        }`}
      >
        <UserIcon className="w-5 h-5" />
        <span className="text-[10px]">{user ? "Profile" : "Sign In"}</span>
      </Link>
    </nav>
  );
};
