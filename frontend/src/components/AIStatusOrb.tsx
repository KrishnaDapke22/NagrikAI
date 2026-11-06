import React from "react";
import { Sparkles, Activity } from "lucide-react";

export const AIStatusOrb: React.FC = () => {
  return (
    <div className="relative w-full max-w-[340px] h-[260px] flex items-center justify-center select-none">
      
      {/* Background soft ambient radial aura */}
      <div className="absolute inset-0 bg-radial from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>

      {/* Outer Orbital Ring 1 */}
      <div className="absolute w-60 h-60 rounded-full border border-dashed border-indigo-200/80 animate-[spin_40s_linear_infinite] pointer-events-none">
        {/* Orbiting Satellite Node A */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500 shadow-xs ring-4 ring-amber-100"></div>
        {/* Orbiting Satellite Node B */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-600 shadow-xs ring-4 ring-cyan-100"></div>
      </div>

      {/* Middle Orbital Ring 2 (Reversed Spin) */}
      <div className="absolute w-44 h-44 rounded-full border border-stone-200 animate-[spin_25s_linear_infinite_reverse] pointer-events-none">
        <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100"></div>
      </div>

      {/* Floating Telemetry Badge 1: Top Left */}
      <div className="absolute top-2 left-0 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 shadow-command-sm text-[10px] font-bold text-stone-700 flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Analyzing Complaints</span>
      </div>

      {/* Floating Telemetry Badge 2: Top Right */}
      <div className="absolute top-4 right-0 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 shadow-command-sm text-[10px] font-bold text-stone-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
        <span>Routing Wards</span>
      </div>

      {/* Floating Telemetry Badge 3: Bottom Left */}
      <div className="absolute bottom-3 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 shadow-command-sm text-[10px] font-bold text-stone-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>City Anomaly Triage</span>
      </div>

      {/* Floating Telemetry Badge 4: Bottom Right */}
      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-stone-200 shadow-command-sm text-[10px] font-bold text-stone-700 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
        <span>Tracking Closures</span>
      </div>

      {/* Central Pulsing AI Core */}
      <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-br from-white via-indigo-50/50 to-stone-100 border-2 border-indigo-200/80 shadow-command flex flex-col items-center justify-center text-center p-2 group hover:scale-105 transition-transform cursor-pointer">
        <div className="relative mb-1">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <p className="text-xs font-black text-stone-900 tracking-tight leading-none">CivicAI</p>
        <p className="text-[10px] font-bold text-indigo-700 mt-0.5 tracking-wider uppercase">is Active</p>
        <div className="flex items-center gap-1 mt-1">
          <Activity className="w-2.5 h-2.5 text-stone-400" />
          <span className="text-[9px] font-mono font-semibold text-stone-500">Live ML</span>
        </div>
      </div>

    </div>
  );
};
