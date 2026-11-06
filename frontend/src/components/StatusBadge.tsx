import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface StatusBadgeProps {
  type: "status" | "priority" | "severity";
  value: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  const { getStatusLabel, getPriorityLabel } = useLanguage();
  const val = (value || "").toUpperCase();

  let bgClass = "bg-slate-50 text-slate-600 border-slate-200";
  let dotColor = "bg-slate-400";
  let displayLabel = val.replace(/_/g, " ");

  if (type === "priority" || type === "severity") {
    displayLabel = getPriorityLabel(val) || val;
    switch (val) {
      case "CRITICAL":
        bgClass = "bg-rose-50 text-rose-700 border-rose-200/80 font-bold";
        dotColor = "bg-rose-500 shadow-xs shadow-rose-500/50";
        break;
      case "HIGH":
        bgClass = "bg-orange-50 text-orange-700 border-orange-200/80 font-bold";
        dotColor = "bg-orange-500 shadow-xs shadow-orange-500/50";
        break;
      case "MEDIUM":
        bgClass = "bg-amber-50 text-amber-700 border-amber-200/80 font-semibold";
        dotColor = "bg-amber-500";
        break;
      case "LOW":
        bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold";
        dotColor = "bg-emerald-500";
        break;
    }
  } else if (type === "status") {
    displayLabel = getStatusLabel(val) || val.replace(/_/g, " ");
    switch (val) {
      case "OPEN":
        bgClass = "bg-rose-50 text-rose-700 border-rose-200/80 font-bold";
        dotColor = "bg-rose-500 animate-pulse";
        break;
      case "IN_PROGRESS":
        bgClass = "bg-amber-50 text-amber-700 border-amber-200/80 font-bold";
        dotColor = "bg-amber-500 animate-pulse";
        break;
      case "RESOLVED":
        bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold";
        dotColor = "bg-emerald-500";
        break;
      case "REOPENED":
        bgClass = "bg-purple-50 text-purple-700 border-purple-200/80 font-bold";
        dotColor = "bg-purple-500";
        break;
      case "REJECTED":
        bgClass = "bg-slate-100 text-slate-600 border-slate-200";
        dotColor = "bg-slate-400";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border tracking-wider uppercase shadow-xs ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></span>
      <span>{displayLabel}</span>
    </span>
  );
};
