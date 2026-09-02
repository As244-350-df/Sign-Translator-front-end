import { useState, useEffect } from "react";
import { Hand, Activity } from "lucide-react";
import { PhysicsPresetTuner } from "./free-finger/PhysicsPresetTuner";
import { ProceduralGesturePresets } from "./free-finger/ProceduralGesturePresets";
import { FingerSlidersGrid } from "./free-finger/FingerSlidersGrid";

const FreeFingerController = ({
  handTracker,
  currentPose,
  onPoseChange,
  className = "",
  isCompact = false
}) => {
  const [pose, setPose] = useState({
    thumb: 1,
    index: 1,
    middle: 1,
    ring: 1,
    pinky: 1,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.9,
    isFreeMotion: true,
    proceduralAnimation: "none"
  });
  const [physicsConfig, setPhysicsConfig] = useState(() => handTracker.getPhysicsConfig());
  const [showPhysicsAdvanced, setShowPhysicsAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState("open");

  useEffect(() => {
    if (currentPose) {
      setPose(currentPose);
    }
  }, [currentPose]);

  const updateFinger = (fingerKey, val) => {
    const updated = {
      ...pose,
      [fingerKey]: val,
      isFreeMotion: true,
      proceduralAnimation: "none"
    };
    setPose(updated);
    setActivePreset("custom");
    handTracker.setFreePose(updated);
    if (onPoseChange) onPoseChange(updated);
  };

  const applyPreset = (name, presetValues) => {
    setActivePreset(name);
    const updated = {
      ...pose,
      thumb: presetValues.thumb,
      index: presetValues.index,
      middle: presetValues.middle,
      ring: presetValues.ring,
      pinky: presetValues.pinky,
      spread: presetValues.spread ?? pose.spread,
      wristAngle: presetValues.wristAngle ?? 0,
      tension: presetValues.tension ?? pose.tension ?? 0.9,
      isFreeMotion: true,
      proceduralAnimation: "none"
    };
    setPose(updated);
    handTracker.setFreePose(updated);
    if (onPoseChange) onPoseChange(updated);
  };

  const handlePhysicsPreset = (preset) => {
    handTracker.setPhysicsPreset(preset);
    setPhysicsConfig(handTracker.getPhysicsConfig());
  };

  const updatePhysicsField = (field, value) => {
    const updated = {
      ...physicsConfig,
      [field]: value
    };
    setPhysicsConfig(updated);
    handTracker.setPhysicsConfig(updated);
  };

  const triggerImpulse = (target) => {
    handTracker.applyPhysicsImpulse(target, (Math.random() - 0.5) * 30, -25, 12);
  };

  const triggerAnimation = (animName) => {
    setActivePreset(animName);
    handTracker.setProceduralAnimation(animName);
    const updated = {
      ...pose,
      isFreeMotion: true,
      proceduralAnimation: animName
    };
    setPose(updated);
    if (onPoseChange) onPoseChange(updated);
  };

  const resetToOpen = () => {
    applyPreset("open", { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0.5, wristAngle: 0, tension: 0.9 });
  };

  const toggleFreeMotionMode = (enabled) => {
    const updated = {
      ...pose,
      isFreeMotion: enabled,
      proceduralAnimation: "none"
    };
    setPose(updated);
    handTracker.enableFreeMotionMode(enabled);
    if (onPoseChange) onPoseChange(updated);
  };

  return (
    <div className={`bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl text-white ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md">
            <Hand className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <span>Free Finger Articulation Studio</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                MASS-SPRING 3D
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Multi-joint biomechanics with mass-spring-damper kinetics & tendon cross-coupling
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Free Motion Mode Switcher */}
          <button
            onClick={() => toggleFreeMotionMode(!pose.isFreeMotion)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${pose.isFreeMotion ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            title="Toggle between Free Form Motion vs Snapped Sign Mode"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pose.isFreeMotion ? "Free Motion: ON" : "Classifier Mode"}</span>
          </button>
        </div>
      </div>

      {/* Biomechanical Hand Physics Toolbar & Presets */}
      <PhysicsPresetTuner
        handTracker={handTracker}
        physicsConfig={physicsConfig}
        showPhysicsAdvanced={showPhysicsAdvanced}
        setShowPhysicsAdvanced={setShowPhysicsAdvanced}
        onPhysicsPreset={handlePhysicsPreset}
        onUpdatePhysicsField={updatePhysicsField}
        onTriggerImpulse={triggerImpulse}
      />

      {/* Procedural Animation / Wave Presets */}
      <ProceduralGesturePresets
        activePreset={activePreset}
        onTriggerAnimation={triggerAnimation}
        onApplyPreset={applyPreset}
        onResetToOpen={resetToOpen}
      />

      {/* Individual Finger Flexion Sliders */}
      <FingerSlidersGrid pose={pose} onUpdateFinger={updateFinger} />
    </div>
  );
};

export { FreeFingerController };
