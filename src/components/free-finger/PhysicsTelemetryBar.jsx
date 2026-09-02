import { useState, useEffect } from "react";
import { Flame, Shield, Gauge } from "lucide-react";

export const PhysicsTelemetryBar = ({ handTracker, onTriggerImpulse }) => {
  const [telemetry, setTelemetry] = useState(() => handTracker.getPhysicsTelemetry());

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(handTracker.getPhysicsTelemetry());
    }, 800);
    return () => clearInterval(interval);
  }, [handTracker]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
      <div className="flex items-center space-x-3 text-slate-300">
        <span className="flex items-center space-x-1 text-amber-400">
          <Flame className="w-3 h-3" />
          <span>Kinetic: {telemetry.kineticEnergy} mJ</span>
        </span>
        <span className="flex items-center space-x-1 text-cyan-400">
          <Gauge className="w-3 h-3" />
          <span>Tendon Strain: {telemetry.tendonTension}%</span>
        </span>
        <span className="flex items-center space-x-1 text-emerald-400">
          <Shield className="w-3 h-3" />
          <span>Settlement: {telemetry.springSettlement}%</span>
        </span>
      </div>

      {/* Shockwave Flick Impulses */}
      <div className="flex items-center space-x-1.5">
        <span className="text-[10px] text-slate-400 font-sans font-bold">Impulses:</span>
        <button
          onClick={() => onTriggerImpulse("all")}
          className="px-2 py-0.5 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer"
          title="Apply shockwave to all 21 hand joints"
        >
          All Joints 💥
        </button>
        <button
          onClick={() => onTriggerImpulse("index")}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
        >
          Index ⚡
        </button>
        <button
          onClick={() => onTriggerImpulse("thumb")}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
        >
          Thumb ⚡
        </button>
      </div>
    </div>
  );
};
