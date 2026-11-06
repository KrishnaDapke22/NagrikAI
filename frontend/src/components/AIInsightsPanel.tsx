import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  TrendingUp,
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

export const AIInsightsPanel: React.FC = () => {
  const { t } = useLanguage();

  const telemetryFeeds = [
    {
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      accent: "#EA580C",
      message: "Street-light complaints increased 18% this week across transit corridors.",
      timestamp: `12${t("nav.minutes_ago", "m ago")}`,
      metric: "+18% Inflow",
    },
    {
      icon: GitMerge,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      accent: "#4338CA",
      message: "7 complaints appear related to the same primary distribution junction near Ward 4.",
      timestamp: `35${t("nav.minutes_ago", "m ago")}`,
      metric: "Merged Cluster",
    },
    {
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      accent: "#DC2626",
      message: "Road maintenance currently has the highest unresolved workload across municipal sectors.",
      timestamp: `1${t("nav.hours_ago", "h ago")}`,
      metric: "Action Required",
    },
    {
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      accent: "#059669",
      message: "Average resolution time for electricity complaints has decreased to 1.8 days.",
      timestamp: `2${t("nav.hours_ago", "h ago")}`,
      metric: "-30% SLA Time",
    },
  ];

  return (
    <aside className="w-full lg:w-80 bg-white rounded-3xl border border-stone-200 p-5 shadow-command-sm flex flex-col justify-between space-y-6 shrink-0">
      <div className="space-y-5">
        
        {/* Panel Header */}
        <div className="border-b border-stone-200 pb-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> {t("ai_panel.title", "AI Civic Insights")}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[10px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{t("ai_panel.live_analysis", "Live Analysis")}</span>
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            {t("ai_panel.subtitle", "Real-time insights from city sensor & grievance telemetry")}
          </p>
        </div>

        {/* Vertical Intelligence Feed Timeline */}
        <div className="relative pl-5 space-y-4">
          {/* Vertical connecting line */}
          <div className="absolute left-2 top-2 bottom-3 w-0.5 bg-gradient-to-b from-indigo-300 via-stone-200 to-amber-200 rounded-full"></div>

          {telemetryFeeds.map((feed, idx) => {
            const Icon = feed.icon;
            return (
              <div key={idx} className="relative group">
                {/* Timeline node anchor */}
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-xs group-hover:scale-125 transition-transform"></div>

                <div className="p-3 bg-stone-50/70 hover:bg-stone-50 rounded-2xl border border-stone-200/90 transition-all space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${feed.color}`}>
                      {feed.metric}
                    </span>
                    <span className="font-mono text-stone-400">{feed.timestamp}</span>
                  </div>

                  <p className="text-xs text-stone-800 font-medium leading-relaxed">
                    {feed.message}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 pt-0.5">
                    <Icon className="w-3 h-3" />
                    <span>Cross-Ward Pattern Detected</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom AI TRIAGE Call to Action Card */}
      <div className="relative p-0.5 rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 shadow-command glow-amber group">
        <div className="p-4 bg-white rounded-[22px] space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {t("ai_panel.cta_title", "AI TRIAGE & INGESTION")}
            </span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-black text-stone-900 tracking-tight">
              {t("ai_panel.cta_title", "AI Grievance Triage Engine")}
            </h4>
            <p className="text-[11px] text-stone-500 leading-snug">
              {t("ai_panel.cta_desc", "Multi-model natural language pipeline active across all municipal wards.")}
            </p>
          </div>

          <Link
            to="/submit"
            className="w-full py-2.5 px-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{t("ai_panel.cta_btn", "Deploy AI Intake Model")}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
