import React, { useState } from "react";
import type { AIRecommendation } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  Wrench,
  AlertTriangle,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

interface RecommendationCardProps {
  recommendation: AIRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { t } = useLanguage();
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(recommendation.citizen_response_draft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-command-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-stone-900 tracking-wider uppercase">
              {t("recommendation.card_title", "Recommended Resolution Playbook")}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {t("recommendation.card_subtitle", "Generative AI decision-support synthesis & municipal SOP guidelines")}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200 self-start sm:self-auto flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
          <span>{t("recommendation.sop_badge", "Municipal SOP")}</span>
        </span>
      </div>

      {/* Summary Box */}
      <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200/80 text-xs text-stone-800 font-normal leading-relaxed">
        <strong className="text-indigo-950 font-bold">{t("recommendation.synopsis_prefix", "Executive Synopsis:")} </strong>
        {recommendation.summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recommended Action Steps */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-700" /> {t("recommendation.action_steps_title", "Recommended Action Steps")}
          </h4>
          <ol className="space-y-2.5 text-xs text-stone-800 list-decimal list-inside">
            {recommendation.action_steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                <span className="font-semibold text-stone-900">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Verification Checklist */}
        <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-700" /> {t("recommendation.verification_title", "Pre-Closure Verification Checklist")}
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-800">
            {recommendation.verification_checklist.map((item, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <li
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="flex items-start gap-2.5 cursor-pointer select-none group"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-700 focus:ring-0 border-stone-300 cursor-pointer"
                  />
                  <span className={isChecked ? "line-through text-stone-400" : "text-stone-800 font-medium"}>
                    {item}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Root Causes & Citizen Response Draft */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        {/* Hypotheses */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> Potential Root Causes (Hypotheses)
          </h4>
          <ul className="space-y-1.5 text-xs text-stone-800 list-disc list-inside">
            {recommendation.possible_causes.map((cause, idx) => (
              <li key={idx}>{cause}</li>
            ))}
          </ul>
        </div>

        {/* Citizen Response Draft */}
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-700" /> {t("recommendation.draft_title", "Citizen Communication Draft")}
              </h4>
              <button
                type="button"
                onClick={handleCopyDraft}
                className="text-[11px] font-bold text-indigo-800 hover:text-indigo-950 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDraft ? t("recommendation.copied_badge", "Copied") : t("recommendation.btn_copy_draft", "Copy")}</span>
              </button>
            </div>
            <p className="text-xs text-stone-800 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-indigo-100">
              "{recommendation.citizen_response_draft}"
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Operational Disclaimer */}
      <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500 flex flex-wrap items-center justify-between gap-2">
        <span>AI-generated recommendation based on historical civic resolution patterns.</span>
        <span className="font-semibold text-stone-800">Final action determined by authorized field officer.</span>
      </div>
    </div>
  );
};
