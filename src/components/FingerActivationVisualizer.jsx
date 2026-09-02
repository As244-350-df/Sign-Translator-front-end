import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Hand,
  Sparkles,
  Vibrate,
  Volume2,
  VolumeX,
  Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  FINGER_METADATA,
  getFingerProfileForSign,
  triggerHapticFeedback
} from "../utils/fingerMapping";
import { SkeletalHandVisualizer } from "./SkeletalHandVisualizer";

const FingerActivationVisualizer = ({
  currentSignName,
  onFingerSelect,
  selectedFingerFilter = null,
  className = ""
}) => {
  const profile = useMemo(() => getFingerProfileForSign(currentSignName), [currentSignName]);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState("skeleton");
  const [velocityMode, setVelocityMode] = useState("auto");
  const [currentVelocityMetrics, setCurrentVelocityMetrics] = useState({
    velocityScore: 0.5,
    effectiveStiffness: 420,
    effectiveDamping: 28,
    effectiveMass: 0.75,
    label: "🎯 Balanced Kinematics"
  });

  const lastSignNameRef = useRef(currentSignName);

  const handleVelocityCalculated = useCallback((metrics) => {
    setCurrentVelocityMetrics(prev => {
      if (
        prev.effectiveStiffness === metrics.effectiveStiffness &&
        prev.effectiveDamping === metrics.effectiveDamping &&
        prev.label === metrics.label
      ) {
        return prev;
      }
      return metrics;
    });
  }, []);

  useEffect(() => {
    if (hapticsEnabled || soundEnabled) {
      triggerHapticFeedback(profile.hapticPattern, profile.soundPitch, soundEnabled);
    }
  }, [profile, hapticsEnabled, soundEnabled]);

  const fingerKeys = ["thumb", "index", "middle", "ring", "pinky"];
  const activeSpringConfig = useMemo(() => ({
    type: "spring",
    stiffness: currentVelocityMetrics.effectiveStiffness,
    damping: currentVelocityMetrics.effectiveDamping,
    mass: currentVelocityMetrics.effectiveMass
  }), [currentVelocityMetrics.effectiveStiffness, currentVelocityMetrics.effectiveDamping, currentVelocityMetrics.effectiveMass]);
  return <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all ${className}`}>
      
      {
    /* Header & Status */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
            <Hand className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Kinetic Skeletal Hand
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold">
                {profile.primaryFingers.length} Active {profile.primaryFingers.length === 1 ? "Finger" : "Fingers"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Velocity-scaled spring physics for sign "{currentSignName}"
            </p>
          </div>
        </div>

        {
    /* View Mode & Haptic/Sound Toggles */
  }
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
          {
    /* Velocity Tuning Preset Switcher */
  }
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
            <button
    onClick={() => setVelocityMode("auto")}
    className={`px-2 py-1 rounded-md transition-all ${velocityMode === "auto" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
    title="Dynamic: Automatically scales physics from typing speed & gesture delta"
  >
              Auto Velocity
            </button>
            <button
    onClick={() => setVelocityMode("snappy")}
    className={`px-2 py-1 rounded-md transition-all ${velocityMode === "snappy" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
    title="Snappy: High stiffness, low damping for ultra-fast spring snaps"
  >
              Snappy
            </button>
            <button
    onClick={() => setVelocityMode("deliberate")}
    className={`px-2 py-1 rounded-md transition-all ${velocityMode === "deliberate" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
    title="Deliberate: Lower stiffness, high damping with biomechanical inertia"
  >
              Deliberate
            </button>
          </div>

          {
    /* View Mode Switcher */
  }
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
            <button
    onClick={() => setViewMode("skeleton")}
    className={`px-2 py-1 rounded-md transition-all ${viewMode === "skeleton" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
              Skeleton
            </button>
            <button
    onClick={() => setViewMode("gauges")}
    className={`px-2 py-1 rounded-md transition-all ${viewMode === "gauges" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
              Gauges
            </button>
            <button
    onClick={() => setViewMode("split")}
    className={`px-2 py-1 rounded-md transition-all ${viewMode === "split" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
              Dual
            </button>
          </div>

          <button
    onClick={() => setHapticsEnabled(!hapticsEnabled)}
    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${hapticsEnabled ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
    title="Toggle Haptic Vibration Feedback"
  >
            <Vibrate className="w-3.5 h-3.5" />
          </button>
          <button
    onClick={() => setSoundEnabled(!soundEnabled)}
    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${soundEnabled ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
    title="Toggle Tactile Audio Click"
  >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {
    /* Dynamic Velocity Telemetry HUD Bar */
  }
      <div className="my-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1">
            <Gauge className="w-3 h-3 text-indigo-500" />
            <span>{currentVelocityMetrics.label}</span>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 dark:text-slate-400">
            Speed Score: {Math.round(currentVelocityMetrics.velocityScore * 100)}%
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Stiffness: <strong className="text-indigo-600 dark:text-indigo-400">{currentVelocityMetrics.effectiveStiffness}</strong>
          </span>
          <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Damping: <strong className="text-cyan-600 dark:text-cyan-400">{currentVelocityMetrics.effectiveDamping}</strong>
          </span>
          <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            Mass: <strong className="text-purple-600 dark:text-purple-400">{currentVelocityMetrics.effectiveMass}</strong>
          </span>
        </div>
      </div>

      {
    /* Main Hand Representation Container */
  }
      <div className="py-2">
        {
    /* 1. Skeletal Vector Mode */
  }
        {(viewMode === "skeleton" || viewMode === "split") && <div className="relative bg-slate-950/90 rounded-2xl p-3 border border-slate-800/80 shadow-inner mb-3 overflow-hidden">
            <div className="absolute top-2.5 left-3 flex items-center space-x-1 text-[10px] font-mono text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>21-JOINT VELOCITY KINEMATICS</span>
            </div>

            <div className="absolute top-2.5 right-3 text-[10px] font-mono text-slate-400">
              {currentVelocityMetrics.effectiveStiffness}k • {currentVelocityMetrics.effectiveDamping}d • {currentVelocityMetrics.effectiveMass}m
            </div>

            <SkeletalHandVisualizer
    profile={profile}
    selectedFingerFilter={selectedFingerFilter}
    onFingerSelect={onFingerSelect}
    velocityMode={velocityMode}
    onVelocityCalculated={handleVelocityCalculated}
  />
          </div>}

        {
    /* 2. 5-Finger Articulation Columns (Interactive Lift & Pulse Stage) */
  }
        {(viewMode === "gauges" || viewMode === "split") && <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end min-h-[170px] pt-3 pb-2 px-1">
            {fingerKeys.map((fKey) => {
    const meta = FINGER_METADATA[fKey];
    const state = profile.fingers[fKey];
    const isPrimary = profile.primaryFingers.includes(fKey);
    const isSelectedFilter = selectedFingerFilter === fKey;
    const flexionPct = Math.round(state.flexion * 100);
    const liftPixels = isPrimary ? state.isLifted ? -16 : -8 : state.flexion > 0.4 ? -4 : 0;
    return <div
      key={fKey}
      onClick={() => onFingerSelect && onFingerSelect(fKey)}
      className={`relative flex flex-col items-center justify-end cursor-pointer group transition-transform ${isSelectedFilter ? "ring-2 ring-indigo-500 rounded-2xl p-1 bg-indigo-50/50 dark:bg-indigo-950/30" : ""}`}
    >
                  {
      /* Dynamic Floating Pulse Badge above active finger tip */
    }
                  <AnimatePresence>
                    {isPrimary && <motion.div
      key={`pulse-${fKey}-${currentSignName}`}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={activeSpringConfig}
      className="absolute -top-7 flex flex-col items-center z-20 pointer-events-none"
    >
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-mono font-black shadow-md uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>LIFT</span>
                        </span>
                        <div className="w-1.5 h-1.5 rotate-45 bg-slate-900 dark:bg-white -mt-0.5" />
                      </motion.div>}
                  </AnimatePresence>

                  {
      /* Finger Pillar Column with Kinetic Lift Animation */
    }
                  <motion.div
      key={`finger-col-${fKey}`}
      animate={{
        y: liftPixels,
        scale: isPrimary ? 1.05 : 1
      }}
      transition={activeSpringConfig}
      className={`w-full flex flex-col items-center relative transition-all`}
    >
                    {
      /* Fingertip Oval with Halo Glow */
    }
                    <div className="relative mb-1">
                      <div
      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-sm shadow-md transition-all ${isPrimary ? `bg-gradient-to-tr ${meta.color} text-white ring-4 ring-indigo-500/20 scale-105` : state.flexion > 0.3 ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60"}`}
    >
                        <span>{meta.icon}</span>
                      </div>

                      {
      /* Active Ripple Wave Ring */
    }
                      {isPrimary && <motion.div
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: 1.4, opacity: 0 }}
      transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
      className="absolute inset-0 rounded-2xl border-2 border-indigo-400 pointer-events-none"
    />}
                    </div>

                    {
      /* Joint Column Gauge (Phalanges) */
    }
                    <div className="w-5 sm:w-6 h-16 sm:h-20 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 flex flex-col justify-end border border-slate-200/80 dark:border-slate-700/80 overflow-hidden relative shadow-inner">
                      {
      /* Articulation joint dividers */
    }
                      <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-slate-300 dark:border-slate-600/50 z-10" />
                      <div className="absolute inset-x-0 top-2/3 border-b border-dashed border-slate-300 dark:border-slate-600/50 z-10" />

                      {
      /* Dynamic Flexion Level Fill */
    }
                      <motion.div
      initial={{ height: 0 }}
      animate={{ height: `${flexionPct}%` }}
      transition={activeSpringConfig}
      className={`w-full rounded-lg transition-colors ${isPrimary ? `bg-gradient-to-t ${meta.color} shadow-md` : state.flexion > 0.3 ? "bg-slate-400 dark:bg-slate-600" : "bg-slate-300 dark:bg-slate-700"}`}
    />
                    </div>
                  </motion.div>

                  {
      /* Finger Name & Status Label */
    }
                  <div className="mt-2 text-center w-full">
                    <span className={`text-[11px] font-bold block truncate ${isPrimary ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                      {meta.name}
                    </span>
                    <span className={`text-[10px] font-mono font-bold block ${isPrimary ? meta.textColor : "text-slate-400 dark:text-slate-500"}`}>
                      {flexionPct}%
                    </span>
                  </div>
                </div>;
  })}
          </div>}

        {
    /* Anatomical Palm Base Bar */
  }
        <div className="mt-1 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs px-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Hand Palm Base:
            </span>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {profile.movementType.toUpperCase()} MOVEMENT
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400 font-medium">Kinetic Motion:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {profile.description}
            </span>
          </div>
        </div>
      </div>

      {
    /* Primary Active Fingers Summary Pills */
  }
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
          Engaged Fingers:
        </span>
        {profile.primaryFingers.map((fKey) => {
    const meta = FINGER_METADATA[fKey];
    return <span
      key={fKey}
      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 border shadow-xs ${meta.bgLight} ${meta.bgDark}`}
    >
              <span>{meta.icon}</span>
              <span>{meta.name} Active</span>
            </span>;
  })}
        {profile.primaryFingers.length === 0 && <span className="text-xs text-slate-400 italic">No specific isolated fingers (Full fist shape)</span>}
      </div>

    </div>;
};
export {
  FingerActivationVisualizer
};
