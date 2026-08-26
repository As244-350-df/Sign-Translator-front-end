import React, { useState, useEffect } from 'react';
import { 
  Hand, 
  Sparkles, 
  RotateCcw, 
  Play, 
  Pause, 
  Sliders, 
  Activity, 
  Zap, 
  Layers, 
  Maximize2,
  Minimize2,
  X,
  Radio,
  Check
} from 'lucide-react';
import { FingerPoseState, RealtimeHandTracker } from '../utils/handTracker';

interface FreeFingerControllerProps {
  handTracker: RealtimeHandTracker;
  currentPose?: FingerPoseState;
  onPoseChange?: (pose: FingerPoseState) => void;
  className?: string;
  isCompact?: boolean;
}

export const FreeFingerController: React.FC<FreeFingerControllerProps> = ({
  handTracker,
  currentPose,
  onPoseChange,
  className = '',
  isCompact = false
}) => {
  const [pose, setPose] = useState<FingerPoseState>({
    thumb: 1.0,
    index: 1.0,
    middle: 1.0,
    ring: 1.0,
    pinky: 1.0,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.90,
    isFreeMotion: true,
    proceduralAnimation: 'none'
  });

  const [activePreset, setActivePreset] = useState<string>('open');
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);

  // Sync with tracker state
  useEffect(() => {
    if (currentPose) {
      setPose(currentPose);
    }
  }, [currentPose]);

  const updateFinger = (fingerKey: keyof FingerPoseState, val: number) => {
    const updated = {
      ...pose,
      [fingerKey]: val,
      isFreeMotion: true,
      proceduralAnimation: 'none'
    };
    setPose(updated);
    setActivePreset('custom');
    handTracker.setFreePose(updated);
    if (onPoseChange) onPoseChange(updated);
  };

  const applyPreset = (
    name: string,
    presetValues: {
      thumb: number;
      index: number;
      middle: number;
      ring: number;
      pinky: number;
      spread?: number;
      wristAngle?: number;
      tension?: number;
    }
  ) => {
    setActivePreset(name);
    const updated: FingerPoseState = {
      ...pose,
      thumb: presetValues.thumb,
      index: presetValues.index,
      middle: presetValues.middle,
      ring: presetValues.ring,
      pinky: presetValues.pinky,
      spread: presetValues.spread ?? pose.spread,
      wristAngle: presetValues.wristAngle ?? 0,
      tension: presetValues.tension ?? pose.tension ?? 0.90,
      isFreeMotion: true,
      proceduralAnimation: 'none'
    };
    setPose(updated);
    handTracker.setFreePose(updated);
    if (onPoseChange) onPoseChange(updated);
  };

  const triggerAnimation = (animName: 'wave' | 'wiggle' | 'tap' | 'breathe') => {
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
    applyPreset('open', { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0, spread: 0.50, wristAngle: 0, tension: 0.90 });
  };

  const toggleFreeMotionMode = (enabled: boolean) => {
    const updated = {
      ...pose,
      isFreeMotion: enabled,
      proceduralAnimation: 'none'
    };
    setPose(updated);
    handTracker.enableFreeMotionMode(enabled);
    if (onPoseChange) onPoseChange(updated);
  };

  const fingersConfig = [
    { key: 'thumb' as const, label: 'Thumb', icon: '🖐️', color: 'from-amber-500 to-orange-500' },
    { key: 'index' as const, label: 'Index', icon: '☝️', color: 'from-cyan-500 to-blue-500' },
    { key: 'middle' as const, label: 'Middle', icon: '🖕', color: 'from-indigo-500 to-purple-500' },
    { key: 'ring' as const, label: 'Ring', icon: '💍', color: 'from-purple-500 to-pink-500' },
    { key: 'pinky' as const, label: 'Pinky', icon: '🤙', color: 'from-rose-500 to-red-500' }
  ];

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
                MULTI-JOINT 3D
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Move each finger freely, test joint angles, or activate fluid wave motion
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Free Motion Mode Switcher */}
          <button
            onClick={() => toggleFreeMotionMode(!pose.isFreeMotion)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              pose.isFreeMotion
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle between Free Form Motion vs Snapped Sign Mode"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pose.isFreeMotion ? 'Free Motion: ON' : 'Classifier Mode'}</span>
          </button>
        </div>
      </div>

      {/* Procedural Animation / Wave Presets */}
      <div className="py-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dynamic Fluid Animations & Presets</span>
          </span>
          <button
            onClick={resetToOpen}
            className="text-[10px] text-slate-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Fingers</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {/* Animated Wave Actions */}
          <button
            onClick={() => triggerAnimation('wave')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePreset === 'wave'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🌊</span>
            <span>Fluid Wave</span>
          </button>

          <button
            onClick={() => triggerAnimation('wiggle')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePreset === 'wiggle'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>✨</span>
            <span>Finger Wiggle</span>
          </button>

          <button
            onClick={() => triggerAnimation('tap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePreset === 'tap'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🎹</span>
            <span>Piano Tap</span>
          </button>

          {/* Quick Static Posture Presets with Tight Anatomical Calibration */}
          <button
            onClick={() => applyPreset('open', { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0, spread: 0.50, tension: 0.90 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'open' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🖐️ Open (50% Spread)
          </button>

          <button
            onClick={() => applyPreset('fist', { thumb: 0.05, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05, spread: 0.15, tension: 1.0 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'fist' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ✊ Tight Fist
          </button>

          <button
            onClick={() => applyPreset('peace', { thumb: 0.1, index: 1.0, middle: 1.0, ring: 0.05, pinky: 0.05, spread: 0.45, tension: 0.95 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'peace' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ✌️ Crisp Peace (V)
          </button>

          <button
            onClick={() => applyPreset('ily', { thumb: 1.0, index: 1.0, middle: 0.05, ring: 0.05, pinky: 1.0, spread: 0.65, tension: 0.95 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'ily' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🤟 Love (ILY)
          </button>

          <button
            onClick={() => applyPreset('point', { thumb: 0.15, index: 1.0, middle: 0.05, ring: 0.05, pinky: 0.05, spread: 0.30, tension: 0.95 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'point' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ☝️ Crisp Point / 1
          </button>

          <button
            onClick={() => applyPreset('ok', { thumb: 0.35, index: 0.35, middle: 1.0, ring: 1.0, pinky: 1.0, spread: 0.50, tension: 0.95 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'ok' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            👌 OK / ASL F
          </button>

          <button
            onClick={() => applyPreset('shaka', { thumb: 1.0, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1.0, spread: 0.70, tension: 0.95 })}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'shaka' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🤙 Shaka / ASL Y
          </button>
        </div>
      </div>

      {/* Individual Finger Flexion Sliders */}
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
          {fingersConfig.map(f => {
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
                  onChange={(e) => updateFinger(f.key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                />

                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                  <button 
                    onClick={() => updateFinger(f.key, 0.05)}
                    className="hover:text-amber-400 cursor-pointer font-medium"
                  >
                    Tight
                  </button>
                  <button 
                    onClick={() => updateFinger(f.key, 0.5)}
                    className="hover:text-indigo-400 cursor-pointer font-medium"
                  >
                    Half
                  </button>
                  <button 
                    onClick={() => updateFinger(f.key, 1.0)}
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
                onChange={(e) => updateFinger('spread', parseFloat(e.target.value))}
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
                value={pose.tension ?? 0.90}
                onChange={(e) => updateFinger('tension', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-7 text-right">
                {Math.round((pose.tension ?? 0.90) * 100)}%
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
                onChange={(e) => updateFinger('wristAngle', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="text-xs font-mono font-bold text-pink-400 w-7 text-right">
                {pose.wristAngle}°
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
