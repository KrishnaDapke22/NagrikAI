import React from "react";
import type { ExplanationItem } from "../types";
import { TrendingUp, TrendingDown, HelpCircle, Sparkles } from "lucide-react";

interface SHAPFeatureChartProps {
  explanations: ExplanationItem[];
  priority: string;
}

export const SHAPFeatureChart: React.FC<SHAPFeatureChartProps> = ({ explanations, priority }) => {
  if (!explanations || explanations.length === 0) {
    return (
      <div className="text-xs text-stone-500 italic p-6 bg-stone-50 rounded-3xl border border-stone-200">
        Explainable AI attribution metrics currently being computed for this grievance.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-command-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
        <div>
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span>Why is this {priority} Priority?</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200">
              Explainable AI (XAI)
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            SHAP TreeExplainer feature attributions quantifying factors driving model triage rank
          </p>
        </div>
        <div className="text-xs bg-indigo-50 text-indigo-900 px-3 py-1 rounded-full font-bold border border-indigo-200 flex items-center gap-1.5 self-start sm:self-auto">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-700" />
          <span>Attribution Weights</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {explanations.map((item, idx) => {
          const isIncrease = item.direction === "INCREASES_PRIORITY";
          const barWidth = Math.min(100, Math.max(10, Math.round(item.impact)));

          return (
            <div key={idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900 flex items-center gap-2">
                  {isIncrease ? (
                    <span className="p-1 rounded-lg bg-rose-100 text-rose-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span>{item.feature.toUpperCase()}</span>
                </span>
                
                <span
                  className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg ${
                    isIncrease
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-indigo-50 text-indigo-900 border border-indigo-200"
                  }`}
                >
                  {isIncrease ? "+" : "-"}
                  {item.impact}% impact
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isIncrease ? "bg-rose-600" : "bg-gradient-to-r from-indigo-700 to-cyan-600"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
        <span>Attributions computed in real time via game-theoretic Shapley values over 500+ tree estimators.</span>
      </div>
    </div>
  );
};
