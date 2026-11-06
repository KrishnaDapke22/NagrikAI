import React from "react";
import type { LucideIcon } from "lucide-react";

export type WidgetType = "sparkline" | "pulse" | "progress" | "check" | "donut" | "line";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  color?: "blue" | "emerald" | "amber" | "red" | "teal" | "indigo" | "purple";
  widgetType?: WidgetType;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "indigo",
  widgetType,
}) => {
  const colorMap: Record<string, { bg: string; icon: string; border: string; accent: string }> = {
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-700",
      border: "border-indigo-100",
      accent: "text-indigo-700",
    },
    blue: {
      bg: "bg-sky-50",
      icon: "text-sky-600",
      border: "border-sky-100",
      accent: "text-sky-600",
    },
    teal: {
      bg: "bg-cyan-50",
      icon: "text-cyan-600",
      border: "border-cyan-100",
      accent: "text-cyan-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: "border-emerald-100",
      accent: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      border: "border-amber-100",
      accent: "text-amber-600",
    },
    red: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      border: "border-rose-100",
      accent: "text-rose-600",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-700",
      border: "border-purple-100",
      accent: "text-purple-700",
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  // Distinct visual widgets per category / type
  const renderVisualMetric = () => {
    const type = widgetType || (
      color === "indigo" ? "sparkline" :
      color === "red" ? "pulse" :
      color === "amber" ? "progress" :
      color === "emerald" ? "check" :
      color === "purple" ? "donut" :
      color === "blue" ? "line" : undefined
    );

    if (type === "sparkline") {
      return (
        <div className="flex items-end gap-1 h-6 pt-1">
          <div className="w-1.5 h-3 bg-indigo-200 rounded-xs"></div>
          <div className="w-1.5 h-4 bg-indigo-300 rounded-xs"></div>
          <div className="w-1.5 h-2 bg-indigo-200 rounded-xs"></div>
          <div className="w-1.5 h-5 bg-indigo-400 rounded-xs"></div>
          <div className="w-1.5 h-6 bg-indigo-600 rounded-xs"></div>
        </div>
      );
    }
    if (type === "pulse") {
      return (
        <div className="relative flex items-center justify-center w-6 h-6">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping opacity-75"></span>
          <span className="absolute w-2 h-2 rounded-full bg-rose-600"></span>
        </div>
      );
    }
    if (type === "progress" || type === "donut") {
      return (
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="#E7E5E4" strokeWidth="3" />
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke={type === "donut" ? "#7C3AED" : "#EA580C"}
            strokeWidth="3"
            strokeDasharray="56"
            strokeDashoffset="16"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    if (type === "check") {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs">
          ✓
        </div>
      );
    }
    if (type === "line") {
      return (
        <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-sky-600 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-command-sm hover-lift hover:border-stone-300 transition-all space-y-2.5 group">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          {title}
        </p>
        <div className={`p-2 rounded-xl border ${scheme.bg} ${scheme.border} ${scheme.icon} shadow-xs group-hover:scale-105 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-mono">
          {value}
        </p>
        {renderVisualMetric()}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
        {subtitle && (
          <span className="text-stone-500 font-medium truncate">
            {subtitle}
          </span>
        )}
        {trend && (
          <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
