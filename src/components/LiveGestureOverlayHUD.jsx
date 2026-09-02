import { useState, useEffect, memo } from "react";
import {
  Activity,
  HelpCircle,
  Plus,
  Sparkles,
  Zap,
  CheckCircle2
} from "lucide-react";

/**
 * Isolated Real-Time Overlay HUD for Live Translation View.
 * Renders top stream diagnostic status and bottom active sign translation card.
 * Throttled to isolate high-frequency telemetry away from the main 2000-line translation view.
 */
const LiveGestureOverlayHUD = memo(({
  tracker,
  useRealWebcam,
  cameraStreamStatus,
  primarySignLanguage,
  activeStreamResolution,
  hardwarePermissionStatus,
  onShowDiagnostics,
  onCommitSign,
  isRecording,
  recorder
}) => {
  const [activeSign, setActiveSign] = useState(() => tracker?.getCurrentSignMeaning?.() || {
    symbol: "🖐️",
    signName: "HELLO",
    translatedText: "Hello",
    meaning: "Standard friendly greeting",
    category: "greetings",
    confidence: 0.98
  });
  const [isRealHand, setIsRealHand] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    if (!tracker) return;
    let isMounted = true;
    let lastSignKey = "";

    const interval = setInterval(() => {
      if (!isMounted) return;
      try {
        const sign = tracker.getCurrentSignMeaning?.();
        const real = tracker.isRealHandDetected || false;
        const progress = tracker.getHoldProgress?.() || 0;

        setIsRealHand(real);
        setHoldProgress(progress);

        if (sign && sign.signName !== lastSignKey) {
          lastSignKey = sign.signName;
          setActiveSign(sign);
        }
      } catch (err) {
        // Silently continue
      }
    }, 180);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tracker]);

  return (
    <>
      {/* Top Overlay Badges & Diagnostic Quick Bar */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20 pointer-events-auto">
        <button
          onClick={onShowDiagnostics}
          className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg cursor-pointer transition-colors"
          title="Click to inspect camera hardware, resolution, and permission diagnostics"
        >
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              useRealWebcam
                ? cameraStreamStatus === "active" && isRealHand
                  ? "bg-emerald-400 animate-ping"
                  : cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission"
                  ? "bg-amber-400 animate-pulse"
                  : cameraStreamStatus === "error"
                  ? "bg-rose-400"
                  : "bg-emerald-400"
                : "bg-indigo-400 animate-pulse"
            }`}
          />
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${
              useRealWebcam
                ? cameraStreamStatus === "active"
                  ? "text-emerald-400"
                  : cameraStreamStatus === "error"
                  ? "text-rose-400"
                  : "text-amber-400"
                : "text-indigo-400"
            }`}
          >
            {useRealWebcam
              ? cameraStreamStatus === "active"
                ? isRealHand
                  ? "TensorFlow Camera HD"
                  : "Camera Active"
                : cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission"
                ? "Starting Camera..."
                : cameraStreamStatus === "error"
                ? "Camera Offline"
                : "Webcam"
              : "AI Simulation Mode"}{" "}
            • {primarySignLanguage || "ASL"}
          </span>
        </button>

        {/* Quick Resolution & Hardware Permission Pill */}
        {useRealWebcam && (
          <button
            onClick={onShowDiagnostics}
            className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80 text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
            title="Camera Resolution & Permission Diagnostics"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-white font-bold">
              {activeStreamResolution ? `${activeStreamResolution.width}×${activeStreamResolution.height}` : "720p HD"}
            </span>
            <span className="text-slate-600">|</span>
            <span className={hardwarePermissionStatus === "granted" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {hardwarePermissionStatus === "granted" ? "Perm: OK" : `Perm: ${hardwarePermissionStatus}`}
            </span>
          </button>
        )}

        {/* Troubleshoot / Why Webcam Isn't Working Direct Pill */}
        <button
          onClick={onShowDiagnostics}
          className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-lg"
          title="Why is Webcam Not Working? Click for instant hardware scan, iframe checks, and fixes"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Webcam Help</span>
        </button>
      </div>

      {/* Bottom Active Translation Card */}
      {(!useRealWebcam || cameraStreamStatus === "active") && activeSign && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 animate-in fade-in duration-200 pointer-events-auto">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-2xl shadow-inner relative">
              <span>{activeSign.symbol}</span>
              {holdProgress > 0 && holdProgress < 1 && (
                <div
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400 transition-all opacity-80"
                  style={{ clipPath: `inset(${Math.round((1 - holdProgress) * 100)}% 0 0 0)` }}
                />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                  {activeSign.signName}
                </span>
                {activeSign.isCustom && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-extrabold">
                    Custom Sign
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {Math.round((activeSign.confidence || 0.95) * 100)}% Match
                </span>
              </div>
              <p className="text-lg font-black text-white tracking-wide mt-0.5">
                "{activeSign.translatedText}"
              </p>
              <p className="text-[11px] text-slate-300 line-clamp-1 max-w-md">
                {activeSign.meaning}
              </p>
            </div>
          </div>

          {/* Commit & Auto Progress indicator */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={() => onCommitSign && onCommitSign(activeSign)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Commit this translated sign immediately to the sentence"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Text</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export { LiveGestureOverlayHUD };
