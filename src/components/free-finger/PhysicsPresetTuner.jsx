import { Zap, Sliders } from "lucide-react";
import { PhysicsTelemetryBar } from "./PhysicsTelemetryBar";

export const PhysicsPresetTuner = ({
  handTracker,
  physicsConfig,
  showPhysicsAdvanced,
  setShowPhysicsAdvanced,
  onPhysicsPreset,
  onUpdatePhysicsField,
  onTriggerImpulse
}) => {
  return (
    <div className="py-3 border-b border-slate-800/80 bg-slate-950/40 -mx-4 px-4 sm:-mx-5 sm:px-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Biomechanical Physics Presets & Live Telemetry</span>
        </span>
        <button
          onClick={() => setShowPhysicsAdvanced(!showPhysicsAdvanced)}
          className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 font-bold cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
          <span>{showPhysicsAdvanced ? "Hide Tuners" : "Tune Springs & Tendons"}</span>
        </button>
      </div>

      {/* Physics Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
        <button
          onClick={() => onPhysicsPreset("biological")}
          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${physicsConfig.preset === "biological" ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm" : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"}`}
        >
          <div className="text-xs font-bold flex items-center space-x-1">
            <span>🧬</span>
            <span>Biological Realism</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">Tendon coupling & tissue resistance</p>
        </button>

        <button
          onClick={() => onPhysicsPreset("snappy")}
          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${physicsConfig.preset === "snappy" ? "bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm" : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"}`}
        >
          <div className="text-xs font-bold flex items-center space-x-1">
            <span>⚡</span>
            <span>Snappy Spring</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">Instant rebound & low inertia</p>
        </button>

        <button
          onClick={() => onPhysicsPreset("fluid")}
          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${physicsConfig.preset === "fluid" ? "bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm" : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"}`}
        >
          <div className="text-xs font-bold flex items-center space-x-1">
            <span>🌊</span>
            <span>Fluid Organic</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">Viscous damping & smooth arcs</p>
        </button>

        <button
          onClick={() => onPhysicsPreset("precision")}
          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${physicsConfig.preset === "precision" ? "bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm" : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"}`}
        >
          <div className="text-xs font-bold flex items-center space-x-1">
            <span>🦾</span>
            <span>Precision Studio</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">Zero lag & maximum sharpness</p>
        </button>
      </div>

      {/* Live Telemetry Bar */}
      <PhysicsTelemetryBar handTracker={handTracker} onTriggerImpulse={onTriggerImpulse} />

      {/* Advanced Physics Tuning Sliders */}
      {showPhysicsAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-300">
              <span>Spring Stiffness</span>
              <span className="text-cyan-400 font-mono">{physicsConfig.stiffness}x</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.05"
              value={physicsConfig.stiffness}
              onChange={(e) => onUpdatePhysicsField("stiffness", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-300">
              <span>Viscous Damping</span>
              <span className="text-emerald-400 font-mono">{physicsConfig.damping}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={physicsConfig.damping}
              onChange={(e) => onUpdatePhysicsField("damping", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-300">
              <span>Tendon Coupling</span>
              <span className="text-purple-400 font-mono">{Math.round(physicsConfig.tendonCoupling * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.05"
              value={physicsConfig.tendonCoupling}
              onChange={(e) => onUpdatePhysicsField("tendonCoupling", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-300">
              <span>Mass & Inertia</span>
              <span className="text-amber-400 font-mono">{physicsConfig.massInertia}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.05"
              value={physicsConfig.massInertia}
              onChange={(e) => onUpdatePhysicsField("massInertia", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
