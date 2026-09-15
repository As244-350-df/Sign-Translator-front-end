import { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Gauge,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Compass
} from "lucide-react";
import { speakText } from "../../utils/speech";

/**
 * SignIllustrationPlayer
 * An interactive player that renders animated gesture illustrations and kinematic clips.
 * Supports play/pause, scrub slider, 0.5x slow-mo, step breakdown, and perspective flips.
 */
export const SignIllustrationPlayer = ({
  sign,
  onPracticeInCamera,
  primarySignLanguage = "ASL",
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5, 1.0, 1.5
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [activeTab, setActiveTab] = useState("clip"); // "clip", "steps", "biomechanics"
  const [isMirrored, setIsMirrored] = useState(false); // Signer vs Viewer perspective
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const clipDurationMs = (sign?.clipDuration || 2.4) * 1000;

  // Animation Loop for continuous clip playback
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = performance.now();
      return;
    }

    const animate = (currentTime) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setProgress((prev) => {
        const next = prev + (deltaMs / clipDurationMs) * 100 * playbackSpeed;
        if (next >= 100) {
          return 0; // Loop automatically
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, clipDurationMs]);

  // Sync step frame if in step mode
  useEffect(() => {
    if (activeTab === "steps") {
      const stepCount = sign?.illustration?.keyframes?.length || 3;
      const calculatedIndex = Math.min(
        stepCount - 1,
        Math.floor((progress / 100) * stepCount)
      );
      setActiveStepIndex(calculatedIndex);
    }
  }, [progress, activeTab, sign]);

  const handlePronounce = () => {
    setIsSpeaking(true);
    speakText(sign.name);
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const restartClip = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  // Compute animated coordinates from keyframes or mathematical motion curve
  const currentPose = useMemo(() => {
    const keyframes = sign?.illustration?.keyframes || [
      { handY: 50, handX: 50, rot: 0 },
      { handY: 45, handX: 55, rot: 10 },
      { handY: 50, handX: 50, rot: 0 }
    ];

    const numSegments = keyframes.length - 1;
    if (numSegments <= 0) return keyframes[0];

    const t = progress / 100;
    const segment = Math.min(numSegments - 1, Math.floor(t * numSegments));
    const segmentT = (t * numSegments) - segment;

    // Smooth cosine interpolation
    const easeT = (1 - Math.cos(segmentT * Math.PI)) / 2;

    const k1 = keyframes[segment];
    const k2 = keyframes[segment + 1] || keyframes[0];

    const handX = k1.handX + (k2.handX - k1.handX) * easeT;
    const handY = k1.handY + (k2.handY - k1.handY) * easeT;
    const rot = k1.rot + (k2.rot - k1.rot) * easeT;

    return { handX, handY, rot };
  }, [progress, sign]);

  const fingerFlexions = sign?.fingerFlexions || {
    thumb: 0.8,
    index: 0.8,
    middle: 0.8,
    ring: 0.8,
    pinky: 0.8
  };

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 ${className}`}
    >
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">{sign?.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {sign?.gloss || sign?.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {primarySignLanguage}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
              {sign?.handshape}
            </p>
          </div>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("clip")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeTab === "clip"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Motion Clip</span>
          </button>
          <button
            onClick={() => setActiveTab("steps")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeTab === "steps"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Step Breakdown</span>
          </button>
          <button
            onClick={() => setActiveTab("biomechanics")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
              activeTab === "biomechanics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Joints & Blueprint</span>
          </button>
        </div>
      </div>

      {/* Main Canvas / Illustration Stage */}
      <div className="relative w-full aspect-video min-h-[260px] sm:min-h-[320px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden select-none">
        {/* Subtle Ambient Studio Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(to right, #818cf8 1px, transparent 1px)",
              backgroundSize: "32px 32px"
            }}
          />
        </div>

        {/* Signer Body & Head Silhouettes for Spatial Reference */}
        <svg
          viewBox="0 0 400 300"
          className={`absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 ${
            isMirrored ? "scale-x-[-1]" : ""
          }`}
        >
          <defs>
            <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="boneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <marker
              id="motionArrowHead"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Torso & Head Silhouette */}
          <g opacity="0.35">
            {/* Head */}
            <ellipse cx="200" cy="95" rx="38" ry="48" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            {/* Neck */}
            <rect x="188" y="140" width="24" height="25" rx="4" fill="#1e293b" />
            {/* Shoulders & Chest */}
            <path
              d="M 90 270 C 100 180, 160 160, 200 160 C 240 160, 300 180, 310 270 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Anatomical guide markers (forehead, chin, chest) */}
            <circle cx="200" cy="78" r="3" fill="#64748b" />
            <text x="210" y="82" fill="#64748b" fontSize="8" fontFamily="monospace">Forehead</text>

            <circle cx="200" cy="138" r="3" fill="#64748b" />
            <text x="210" y="142" fill="#64748b" fontSize="8" fontFamily="monospace">Chin</text>

            <circle cx="200" cy="205" r="3" fill="#64748b" />
            <text x="210" y="209" fill="#64748b" fontSize="8" fontFamily="monospace">Chest</text>
          </g>

          {/* Kinematic Motion Trail / Arc */}
          {activeTab === "clip" && (
            <g opacity="0.75">
              {sign?.illustration?.motionPath === "salute_arc" && (
                <path
                  d="M 235 90 C 265 80, 300 75, 330 70"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  markerEnd="url(#motionArrowHead)"
                />
              )}
              {sign?.illustration?.motionPath === "chin_forward" && (
                <path
                  d="M 200 140 C 220 160, 250 180, 280 200"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  markerEnd="url(#motionArrowHead)"
                />
              )}
              {sign?.illustration?.motionPath === "chest_circle" && (
                <ellipse
                  cx="200"
                  cy="205"
                  rx="30"
                  ry="24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}
              {sign?.illustration?.motionPath === "wrist_nod" && (
                <path
                  d="M 240 180 C 245 160, 245 220, 240 190"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  markerEnd="url(#motionArrowHead)"
                />
              )}
            </g>
          )}

          {/* The Dynamic Animated Hand Illustration */}
          <g
            transform={`translate(${currentPose.handX * 3.8 - 40}, ${
              currentPose.handY * 2.8 - 30
            }) rotate(${currentPose.rot}, 50, 50)`}
          >
            {/* Hand Aura Glow */}
            <circle cx="50" cy="50" r="42" fill="url(#stageGlow)" />

            {/* Hand Palm Plate */}
            <rect
              x="30"
              y="32"
              width="40"
              height="38"
              rx="12"
              fill="url(#handGradient)"
              stroke="#b45309"
              strokeWidth="2"
              className="drop-shadow-lg"
            />

            {/* Palm Crease Lines */}
            <path d="M 38 48 Q 50 56 62 48" stroke="#d97706" strokeWidth="1.5" fill="none" />
            <path d="M 40 58 Q 50 62 60 56" stroke="#d97706" strokeWidth="1.5" fill="none" />

            {/* Thumb */}
            <g
              transform={`translate(26, 44) rotate(${
                fingerFlexions.thumb > 0.6 ? -35 : 15
              }, 6, 6)`}
            >
              <rect
                x="0"
                y="0"
                width="12"
                height={fingerFlexions.thumb > 0.6 ? "24" : "14"}
                rx="6"
                fill="#fde047"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="6" cy="6" r="2.5" fill="#ca8a04" />
            </g>

            {/* Index Finger */}
            <g
              transform={`translate(32, ${
                fingerFlexions.index > 0.5 ? 6 : 24
              })`}
            >
              <rect
                x="0"
                y="0"
                width="8.5"
                height={fingerFlexions.index > 0.5 ? "28" : "12"}
                rx="4.25"
                fill="#fde047"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="4.25" cy="5" r="2" fill="#ca8a04" />
            </g>

            {/* Middle Finger */}
            <g
              transform={`translate(42.5, ${
                fingerFlexions.middle > 0.5 ? 4 : 24
              })`}
            >
              <rect
                x="0"
                y="0"
                width="8.5"
                height={fingerFlexions.middle > 0.5 ? "30" : "12"}
                rx="4.25"
                fill="#fde047"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="4.25" cy="5" r="2" fill="#ca8a04" />
            </g>

            {/* Ring Finger */}
            <g
              transform={`translate(53, ${
                fingerFlexions.ring > 0.5 ? 7 : 24
              })`}
            >
              <rect
                x="0"
                y="0"
                width="8.5"
                height={fingerFlexions.ring > 0.5 ? "27" : "12"}
                rx="4.25"
                fill="#fde047"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="4.25" cy="5" r="2" fill="#ca8a04" />
            </g>

            {/* Pinky Finger */}
            <g
              transform={`translate(63.5, ${
                fingerFlexions.pinky > 0.5 ? 12 : 24
              })`}
            >
              <rect
                x="0"
                y="0"
                width="7.5"
                height={fingerFlexions.pinky > 0.5 ? "22" : "11"}
                rx="3.75"
                fill="#fde047"
                stroke="#b45309"
                strokeWidth="1.5"
              />
              <circle cx="3.75" cy="5" r="1.8" fill="#ca8a04" />
            </g>

            {/* Biomechanical Joint Dots Overlay (when active) */}
            {activeTab === "biomechanics" && (
              <g>
                <circle cx="50" cy="65" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                <circle cx="36" cy="30" r="3.5" fill="#38bdf8" />
                <circle cx="47" cy="28" r="3.5" fill="#38bdf8" />
                <circle cx="57" cy="30" r="3.5" fill="#38bdf8" />
                <circle cx="67" cy="34" r="3.5" fill="#38bdf8" />
                <circle cx="28" cy="46" r="3.5" fill="#38bdf8" />

                {/* Bone links */}
                <line x1="50" y1="65" x2="36" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="50" y1="65" x2="47" y2="28" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="50" y1="65" x2="57" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                <line x1="50" y1="65" x2="67" y2="34" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
              </g>
            )}

            {/* Direction Indicator Badge */}
            <g transform="translate(50, 85)">
              <rect x="-24" y="0" width="48" height="14" rx="7" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <text x="0" y="10" fill="#94a3b8" fontSize="7" textAnchor="middle" fontWeight="bold">
                {sign?.orientation || "PALM FRONT"}
              </text>
            </g>
          </g>
        </svg>

        {/* Floating Parameter HUD Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1.5 pointer-events-none">
          <div className="flex items-center space-x-1.5 backdrop-blur-md bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/80 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>LOC: {sign?.location}</span>
          </div>
          <div className="flex items-center space-x-1.5 backdrop-blur-md bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/80 text-[10px] font-mono text-indigo-300">
            <span>ORIENT: {sign?.orientation}</span>
          </div>
        </div>

        {/* View Perspective Toggle (Signer vs Observer) */}
        <button
          onClick={() => setIsMirrored((prev) => !prev)}
          className="absolute top-3 right-3 flex items-center space-x-1.5 backdrop-blur-md bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
          title="Toggle between Observer View and Signer's Own Mirror View"
        >
          <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isMirrored ? "Signer's View" : "Viewer's View"}</span>
        </button>

        {/* Non-manual signal / facial grammar callout */}
        {sign?.nonManualSignals && (
          <div className="absolute bottom-3 left-3 max-w-[260px] sm:max-w-xs backdrop-blur-md bg-slate-950/85 px-3 py-1.5 rounded-2xl border border-slate-700/80 text-[11px] text-slate-300 shadow-lg">
            <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider block">
              Facial & Non-Manual Marker
            </span>
            <p className="line-clamp-2 leading-tight mt-0.5">
              {sign?.nonManualSignals}
            </p>
          </div>
        )}

        {/* Pronounce Button */}
        <button
          onClick={handlePronounce}
          className={`absolute bottom-3 right-3 p-2.5 rounded-2xl backdrop-blur-md border transition-all cursor-pointer shadow-lg ${
            isSpeaking
              ? "bg-indigo-600 text-white border-indigo-400 scale-105"
              : "bg-slate-900/90 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-800"
          }`}
          title="Speak sign pronunciation"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Step Breakdown Cards (if Step Breakdown Tab selected) */}
      {activeTab === "steps" && (
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Step-by-Step Kinematic Sequence
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click frame to scrub
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(sign?.illustration?.keyframes || []).map((step, idx) => {
              const isSelected = activeStepIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setProgress((idx / ((sign?.illustration?.keyframes?.length || 3) - 1)) * 100);
                    setIsPlaying(false);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-500/80 text-white shadow-md ring-1 ring-indigo-500/40"
                      : "bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      Step {idx + 1}: {step.label}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-snug">
                    {step.note}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Biomechanical Finger Activation Gauges (if Joint Blueprint tab selected) */}
      {activeTab === "biomechanics" && (
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Finger Extension Ratios (MediaPipe Hand Kinematics)
          </span>

          <div className="grid grid-cols-5 gap-2">
            {[
              { name: "Thumb", val: fingerFlexions.thumb },
              { name: "Index", val: fingerFlexions.index },
              { name: "Middle", val: fingerFlexions.middle },
              { name: "Ring", val: fingerFlexions.ring },
              { name: "Pinky", val: fingerFlexions.pinky }
            ].map((f) => {
              const isExtended = f.val > 0.5;
              return (
                <div
                  key={f.name}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {f.name}
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full my-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExtended ? "bg-cyan-400" : "bg-slate-600"
                      }`}
                      style={{ width: `${Math.round(f.val * 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      isExtended ? "text-cyan-300" : "text-slate-500"
                    }`}
                  >
                    {isExtended ? "EXTENDED" : "CURLED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Timeline Controls Bar */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex flex-col space-y-2.5">
        {/* Progress Timeline Slider */}
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md"
            title={isPlaying ? "Pause clip" : "Play clip"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={restartClip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="Restart clip from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Timeline Scrubber */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={progress}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
          </div>

          <span className="text-[11px] font-mono text-slate-400 min-w-[42px] text-right">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Speed Controls & Practice Trigger */}
        <div className="flex items-center justify-between pt-1">
          {/* Playback Speed Toggles */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-400" />
              Speed:
            </span>
            {[
              { label: "0.5x Slow", speed: 0.5 },
              { label: "1.0x Normal", speed: 1.0 },
              { label: "1.5x Fast", speed: 1.5 }
            ].map((s) => (
              <button
                key={s.speed}
                onClick={() => setPlaybackSpeed(s.speed)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  playbackSpeed === s.speed
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Practice in Camera Callback Button */}
          {onPracticeInCamera && (
            <button
              onClick={() => onPracticeInCamera(sign)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>Practice in Camera</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
