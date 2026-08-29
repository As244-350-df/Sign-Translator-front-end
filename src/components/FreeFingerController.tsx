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
  Check,
  Flame,
  Wind,
  Shield,
  Gauge
} from 'lucide-react';
import { FingerPoseState, RealtimeHandTracker, HandPhysicsConfig, PhysicsTelemetry, PHYSICS_PRESETS } from '../utils/handTracker';

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

  const [physicsConfig, setPhysicsConfig] = useState<HandPhysicsConfig>(handTracker.getPhysicsConfig());
  const [physicsTelemetry, setPhysicsTelemetry] = useState<PhysicsTelemetry>(handTracker.getPhysicsTelemetry());
  const [showPhysicsAdvanced, setShowPhysicsAdvanced] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('open');
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCompact);

  // Sync with tracker state & poll telemetry periodically
  useEffect(() => {
    if (currentPose) {
      setPose(currentPose);
    }
  }, [currentPose]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhysicsTelemetry(handTracker.getPhysicsTelemetry());
    }, 150);
    return () => clearInterval(interval);
  }, [handTracker]);

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

  const handlePhysicsPreset = (preset: HandPhysicsConfig['preset']) => {
    handTracker.setPhysicsPreset(preset);
    setPhysicsConfig(handTracker.getPhysicsConfig());
  };

  const updatePhysicsField = (field: keyof HandPhysicsConfig, value: any) => {
    const updated = {
      ...physicsConfig,
      [field]: value
    };
    setPhysicsConfig(updated);
    handTracker.setPhysicsConfig(updated);
  };

  const triggerImpulse = (target: 'all' | 'thumb' | 'index' | 'middle' | 'ring' | 'pinky' | 'wrist') => {
    handTracker.applyPhysicsImpulse(target, (Math.random() - 0.5) * 30, -25, 12);
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

      {/* Biomechanical Hand Physics Toolbar & Presets */}
      <div className="py-3 border-b border-slate-800/80 bg-slate-950/40 -mx-4 px-4 sm:-mx-5 sm:px-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Biomechanical Physics Presets & Live Telemetry</span>
          </span>
          <button
            onClick={() => setShowPhysicsAdvanced(!showPhysicsAdvanced)}
            className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1 font-bold"
          >
            <Sliders className="w-3 h-3" />
            <span>{showPhysicsAdvanced ? 'Hide Tuners' : 'Tune Springs & Tendons'}</span>
          </button>
        </div>

        {/* Physics Preset Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
          <button
            onClick={() => handlePhysicsPreset('biological')}
            className={`p-2 rounded-xl text-left border transition-all ${
              physicsConfig.preset === 'biological'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-xs font-bold flex items-center space-x-1">
              <span>🧬</span>
              <span>Biological Realism</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">Tendon coupling & tissue resistance</p>
          </button>

          <button
            onClick={() => handlePhysicsPreset('snappy')}
            className={`p-2 rounded-xl text-left border transition-all ${
              physicsConfig.preset === 'snappy'
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-xs font-bold flex items-center space-x-1">
              <span>⚡</span>
              <span>Snappy Spring</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">Instant rebound & low inertia</p>
          </button>

          <button
            onClick={() => handlePhysicsPreset('fluid')}
            className={`p-2 rounded-xl text-left border transition-all ${
              physicsConfig.preset === 'fluid'
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-xs font-bold flex items-center space-x-1">
              <span>🌊</span>
              <span>Fluid Organic</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">Viscous damping & smooth arcs</p>
          </button>

          <button
            onClick={() => handlePhysicsPreset('precision')}
            className={`p-2 rounded-xl text-left border transition-all ${
              physicsConfig.preset === 'precision'
                ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-xs font-bold flex items-center space-x-1">
              <span>🦾</span>
              <span>Precision Studio</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5">Zero lag & maximum sharpness</p>
          </button>
        </div>

        {/* Live Telemetry Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="flex items-center space-x-1 text-amber-400">
              <Flame className="w-3 h-3" />
              <span>Kinetic: {physicsTelemetry.kineticEnergy} mJ</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <Gauge className="w-3 h-3" />
              <span>Tendon Strain: {physicsTelemetry.tendonTension}%</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <Shield className="w-3 h-3" />
              <span>Settlement: {physicsTelemetry.springSettlement}%</span>
            </span>
          </div>

          {/* Shockwave Flick Impulses */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-400 font-sans font-bold">Impulses:</span>
            <button
              onClick={() => triggerImpulse('all')}
              className="px-2 py-0.5 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-xs"
              title="Apply shockwave to all 21 hand joints"
            >
              💥 All
            </button>
            <button
              onClick={() => triggerImpulse('index')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all"
              title="Flick index finger tip"
            >
              ☝️ Index
            </button>
            <button
              onClick={() => triggerImpulse('thumb')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all"
              title="Flick thumb"
            >
              🖐️ Thumb
            </button>
          </div>
        </div>

        {/* Advanced Physics Tuning Sliders */}
        {showPhysicsAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-800">
            {/* Stiffness */}
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
                onChange={(e) => updatePhysicsField('stiffness', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Damping */}
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
                onChange={(e) => updatePhysicsField('damping', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Tendon Coupling */}
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
                onChange={(e) => updatePhysicsField('tendonCoupling', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Mass Inertia */}
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
                onChange={(e) => updatePhysicsField('massInertia', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Procedural Animation / Wave Presets */}
      <div className="py-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dynamic Fluid Animations & Gestures</span>
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

