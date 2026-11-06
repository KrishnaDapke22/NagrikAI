import React from "react";
import type { AIAnalysis } from "../types";
import { StatusBadge } from "./StatusBadge";
import { useLanguage } from "../context/LanguageContext";
import {
  Sparkles,
  MapPin,
  Clock,
  Copy,
  ShieldAlert,
  Smile,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ analysis }) => {
  const { t, getCategoryLabel } = useLanguage();
  const isConfidenceLow = analysis.category_confidence < 0.65;
  const isHighDuplicate = analysis.duplicate_count > 3 || analysis.duplicate_probability > 0.7;

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-command-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-stone-900 tracking-wider uppercase">
                {t("ai_analysis.card_title", "CivicAI Multi-Model Diagnostics")}
              </h3>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                {analysis.model_version || "v1.0-prod"}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              {t("ai_analysis.card_subtitle", "Real-time NLP feature extraction, semantic similarity & risk ranking")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfidenceLow ? (
            <span className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {t("ai_analysis.low_confidence", "Low AI Confidence")}
            </span>
          ) : (
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {t("ai_analysis.inference_complete", "Inference Complete")}
            </span>
          )}
        </div>
      </div>

      {/* Duplicate Warning if applicable */}
      {isHighDuplicate && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-amber-950 rounded-2xl text-xs flex items-center gap-2.5 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>{t("ai_analysis.duplicate_alert_title", "Potential Duplicate Grievance:")}</strong>{" "}
            {analysis.duplicate_count} {t("ai_analysis.duplicate_alert_desc", "similar complaints detected in this ward. Auto-grouped for dispatch efficiency.")} ({(analysis.duplicate_probability * 100).toFixed(0)}% semantic match).
          </span>
        </div>
      )}

      {/* 4 Core Intelligence Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* 1. Category */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t("ai_analysis.detected_category", "Detected Category")}
          </p>
          <p className="text-base font-extrabold text-stone-900 truncate">
            {getCategoryLabel(analysis.category) || analysis.category}
          </p>
          <p className="text-xs text-stone-500 font-medium truncate">
            {t("ai_analysis.sub_category", "Sub:")} {analysis.subcategory || t("ai_analysis.general", "General")}
          </p>
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>{t("ai_analysis.confidence", "Confidence")}</span>
              <span className="font-mono font-bold text-indigo-700">{(analysis.category_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-700 h-full rounded-full transition-all"
                style={{ width: `${Math.round(analysis.category_confidence * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 2. Sentiment */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-stone-400" /> {t("ai_analysis.citizen_sentiment", "Sentiment")}
          </p>
          <p className="text-base font-extrabold text-stone-900 truncate">
            {analysis.sentiment}
          </p>
          <p className="text-xs text-stone-500 font-medium">
            {t("ai_analysis.citizen_sentiment", "Citizen Tone")}
          </p>
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>{t("ai_analysis.confidence", "Confidence")}</span>
              <span className="font-mono font-bold text-sky-700">{(analysis.sentiment_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-600 h-full rounded-full transition-all"
                style={{ width: `${Math.round(analysis.sentiment_confidence * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 3. Severity */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-stone-400" /> {t("ai_analysis.hazard_severity", "Hazard Severity")}
          </p>
          <div>
            <StatusBadge type="severity" value={analysis.severity} />
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {t("ai_analysis.hazard_severity", "Safety Risk")}
          </p>
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>{t("ai_analysis.confidence", "Confidence")}</span>
              <span className="font-mono font-bold text-stone-900">{(analysis.severity_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all"
                style={{ width: `${Math.round(analysis.severity_confidence * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 4. Model Priority */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-700" /> {t("ai_analysis.calculated_priority", "Triage Rank")}
          </p>
          <div>
            <StatusBadge type="priority" value={analysis.priority} />
          </div>
          <p className="text-xs text-stone-500 font-medium">
            {t("ai_analysis.calculated_priority", "SLA Priority")}
          </p>
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>{t("ai_analysis.confidence", "Confidence")}</span>
              <span className="font-mono font-bold text-indigo-700">{(analysis.priority_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-700 h-full rounded-full transition-all"
                style={{ width: `${Math.round(analysis.priority_confidence * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Signals: Location, Semantic Duplicates, Target Department & SLA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
        
        <div className="flex items-center gap-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-900">
          <MapPin className="w-4 h-4 text-indigo-700 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-stone-500">
              {t("submit.location_label", "Location Extraction")}
            </p>
            <p className="font-semibold truncate">{analysis.location_extracted || "Municipal Ward Center"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-900">
          <Copy className="w-4 h-4 text-sky-700 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-stone-500">
              {t("ai_analysis.ward_duplicates", "Ward Similarity")}
            </p>
            <p className="font-semibold truncate">{analysis.duplicate_count} related ({(analysis.duplicate_probability * 100).toFixed(0)}% sim)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-900">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-stone-500">
              {t("ai_analysis.estimated_sla", "Predicted Resolution SLA")}
            </p>
            <p className="font-semibold truncate">
              {analysis.predicted_resolution_days > 0
                ? `${analysis.predicted_resolution_days} ${t("ai_analysis.days", "days")}`
                : `2.0 ${t("ai_analysis.days", "days")}`}
            </p>
          </div>
        </div>

      </div>

      {/* Target Department Routing Banner */}
      {analysis.department && (
        <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-stone-900">
            <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>
              {t("ai_analysis.target_squad", "Target Municipal Department")}:{" "}
              <strong className="text-indigo-950 font-bold">{analysis.department}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-800 bg-white px-2.5 py-1 rounded-full border border-indigo-200 uppercase tracking-wider shadow-xs">
            {t("ai_analysis.auto_routed", "Auto-Dispatched")}
          </span>
        </div>
      )}
    </div>
  );
};
