import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  FileCheck2,
  HelpCircle,
  LogOut,
  Users,
} from "lucide-react";

export const CitizenSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/citizen", icon: LayoutDashboard },
    { label: "Submit Grievance", path: "/submit", icon: PlusCircle },
    { label: "NagrikAI Community", path: "/community", icon: Users },
    { label: "Track Status", path: "/#track", icon: Search },
    { label: "Citizen Charter", path: "/#features", icon: FileCheck2 },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between space-y-6">
      <div className="space-y-4">
        {/* User Identity Box */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Citizen"}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || "citizen@nagrikai.gov"}</p>
            <span className="inline-block mt-0.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Verified Citizen
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Citizen Portal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-xs border-r-3 border-blue-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Citizen Helpline Support */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[11px] space-y-1.5">
          <p className="font-bold text-blue-700 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Need Assistance?
          </p>
          <p className="text-slate-600 leading-relaxed">
            Direct Municipal Helpline: <strong className="text-slate-900 font-mono">1800-NAGRIK-AI</strong>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
