import { Sliders } from "lucide-react";

export const FingerSlidersGrid = ({ pose, onUpdateFinger }) => {
  const fingersConfig = [
    { key: "thumb", label: "Thumb", icon: "👍", color: "from-amber-500 to-orange-500" },
    { key: "index", label: "Index", icon: "☝️", color: "from-cyan-500 to-blue-500" },
    { key: "middle", label: "Middle", icon: "🖕", color: "from-indigo-500 to-purple-500" },
    { key: "ring", label: "Ring", icon: "💍", color: "from-purple-500 to-pink-500" },
    { key: "pinky", label: "Pinky", icon: "🤙", color: "from-rose-500 to-red-500" }
  ];

  return (
    <div className="py-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Independent 5-Finger Articulation Controls</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-mono font-bold">
          0% (Curled Tight) ➔ 100% (Straight)
        </span>
      </div>

      {/* 5 Finger Flexion Bars & Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {fingersConfig.map((f) => {
          const val = pose[f.key];
          const pct = Math.round(val * 100);
          return (
            <div key={f.key} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {pct}%
                </span>
              </div>

              {/* Vertical Gauge Preview */}
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${f.color} transition-all duration-75`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Range Input */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={val}
                onChange={(e) => onUpdateFinger(f.key, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />

              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                <button
                  onClick={() => onUpdateFinger(f.key, 0.05)}
                  className="hover:text-amber-400 cursor-pointer font-medium"
                >
                  Tight
                </button>
                <button
                  onClick={() => onUpdateFinger(f.key, 0.5)}
                  className="hover:text-indigo-400 cursor-pointer font-medium"
                >
                  Half
                </button>
                <button
                  onClick={() => onUpdateFinger(f.key, 1)}
                  className="hover:text-emerald-400 cursor-pointer font-medium"
                >
                  Full
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Hand Spread, Wrist Angle & Joint Tension Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Finger Spread / Abduction */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <span>↔️</span>
              <span>Finger Spread</span>
            </div>
            <p className="text-[10px] text-slate-400">Cohesive alignment</p>
          </div>
          <div className="flex items-center space-x-2 min-w-[100px]">
            <input
              type="range"
              min="0.1"
              max="1.1"
              step="0.05"
              value={pose.spread}
              onChange={(e) => onUpdateFinger("spread", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-xs font-mono font-bold text-cyan-400 w-7 text-right">
              {Math.round(pose.spread * 100)}%
            </span>
          </div>
        </div>

        {/* Joint Tension / Grip Firmness */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <span>🔒</span>
              <span>Joint Tension</span>
            </div>
            <p className="text-[10px] text-slate-400">Firm grip & tightness</p>
          </div>
          <div className="flex items-center space-x-2 min-w-[100px]">
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={pose.tension ?? 0.9}
              onChange={(e) => onUpdateFinger("tension", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-xs font-mono font-bold text-emerald-400 w-7 text-right">
              {Math.round((pose.tension ?? 0.9) * 100)}%
            </span>
          </div>
        </div>

        {/* Wrist Angle & Tilt */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <span>🔄</span>
              <span>Wrist Pitch</span>
            </div>
            <p className="text-[10px] text-slate-400">Rotates hand base</p>
          </div>
          <div className="flex items-center space-x-2 min-w-[100px]">
            <input
              type="range"
              min="-45"
              max="45"
              step="1"
              value={pose.wristAngle}
              onChange={(e) => onUpdateFinger("wristAngle", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-xs font-mono font-bold text-pink-400 w-7 text-right">
              {pose.wristAngle}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
