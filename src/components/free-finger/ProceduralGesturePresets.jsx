import { Sparkles, RotateCcw } from "lucide-react";

export const ProceduralGesturePresets = ({
  activePreset,
  onTriggerAnimation,
  onApplyPreset,
  onResetToOpen
}) => {
  return (
    <div className="py-3 border-b border-slate-800/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Dynamic Fluid Animations & Gestures</span>
        </span>
        <button
          onClick={onResetToOpen}
          className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Fingers</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* Animated Wave Actions */}
        <button
          onClick={() => onTriggerAnimation("wave")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activePreset === "wave" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"}`}
        >
          <span>🌊</span>
          <span>Fluid Wave</span>
        </button>

        <button
          onClick={() => onTriggerAnimation("wiggle")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activePreset === "wiggle" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"}`}
        >
          <span>✨</span>
          <span>Finger Wiggle</span>
        </button>

        <button
          onClick={() => onTriggerAnimation("tap")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${activePreset === "tap" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"}`}
        >
          <span>🎹</span>
          <span>Piano Tap</span>
        </button>

        {/* Quick Static Posture Presets */}
        <button
          onClick={() => onApplyPreset("open", { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0.5, tension: 0.9 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "open" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          🖐️ Open (50% Spread)
        </button>

        <button
          onClick={() => onApplyPreset("fist", { thumb: 0.05, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05, spread: 0.15, tension: 1 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "fist" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          ✊ Tight Fist
        </button>

        <button
          onClick={() => onApplyPreset("peace", { thumb: 0.1, index: 1, middle: 1, ring: 0.05, pinky: 0.05, spread: 0.45, tension: 0.95 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "peace" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          ✌️ Crisp Peace (V)
        </button>

        <button
          onClick={() => onApplyPreset("ily", { thumb: 1, index: 1, middle: 0.05, ring: 0.05, pinky: 1, spread: 0.65, tension: 0.95 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "ily" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          🤟 Love (ILY)
        </button>

        <button
          onClick={() => onApplyPreset("point", { thumb: 0.15, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05, spread: 0.3, tension: 0.95 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "point" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          ☝️ Crisp Point / 1
        </button>

        <button
          onClick={() => onApplyPreset("ok", { thumb: 0.35, index: 0.35, middle: 1, ring: 1, pinky: 1, spread: 0.5, tension: 0.95 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "ok" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          👌 OK / ASL F
        </button>

        <button
          onClick={() => onApplyPreset("shaka", { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1, spread: 0.7, tension: 0.95 })}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePreset === "shaka" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
        >
          🤙 Shaka / ASL Y
        </button>
      </div>
    </div>
  );
};
