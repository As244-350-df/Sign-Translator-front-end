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
  recorder,
  isGeminiStreaming = false,
  geminiStreamTokens = "",
  geminiVisionResult = null,
  isGeminiVisionLoading = false,
  onCaptureGeminiVision,
  onClearGeminiVision
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
                  ? "MediaPipe + Gemini AI"
                  : "MediaPipe Ready"
                : cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission"
                ? "Starting Camera..."
                : cameraStreamStatus === "error"
                ? "Camera Offline"
                : "Webcam"
              : "MediaPipe Simulation"}{" "}
            • {primarySignLanguage || "ASL"}
          </span>
        </button>

        {/* Gemini AI Live Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold shadow-lg backdrop-blur-md transition-all ${
            isGeminiStreaming
              ? "bg-indigo-950/90 text-indigo-300 border-indigo-500/60 animate-pulse"
              : "bg-slate-900/80 text-slate-300 border-slate-700/80"
          }`}
          title="Server-side Gemini 3.8 Flash real-time streaming recognition active"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeminiStreaming ? "text-indigo-400 animate-spin" : "text-indigo-400"}`} />
          <span>{isGeminiStreaming ? "Gemini Streaming..." : "Gemini AI 3.8 Flash"}</span>
        </div>

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
              {hardwarePermissionStatus === "granted" ? "OK" : hardwarePermissionStatus}
            </span>
          </button>
        )}

        {/* MediaPipe Hands 21 3D Landmark Tracking Badge & Worker Status */}
        <div
          className={`flex items-center space-x-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-full border text-[11px] font-bold shadow-lg transition-all ${
            isRealHand
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/60"
              : "bg-slate-900/80 text-slate-300 border-slate-700/80"
          }`}
          title="MediaPipe Hands 21 3D Landmark detection offloaded to dedicated Web Worker"
        >
          <Zap className={`w-3.5 h-3.5 ${isRealHand ? "text-emerald-400 animate-pulse" : "text-emerald-400"}`} />
          <span>
            {isRealHand
              ? `MediaPipe Hands: 21 Landmarks ${tracker?.workerReady ? "(Web Worker)" : ""}`
              : `MediaPipe Hands: ${tracker?.workerReady ? "Web Worker Ready" : "Ready"}`}
          </span>
        </div>
      </div>

      {/* Gemini Vision Inspection Result Card */}
      {geminiVisionResult && (
        <div className="absolute top-16 left-4 right-4 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/50 shadow-2xl z-30 animate-in fade-in zoom-in-95 pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Gemini AI Landmark Translation
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {Math.round(((geminiVisionResult.confidence ?? 0.96) * 100))}% Confidence
                  </span>
                  {geminiVisionResult.grammaticalCategory && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                      {geminiVisionResult.grammaticalCategory}
                    </span>
                  )}
                </div>
                <h4 className="text-base font-black text-white mt-0.5">
                  Sign: "{geminiVisionResult.label || geminiVisionResult.signName || "DETECTED"}" → {geminiVisionResult.englishTranslation || geminiVisionResult.translation}
                </h4>
                {(geminiVisionResult.handshape || geminiVisionResult.handShapeDescription) && (
                  <p className="text-xs text-slate-300 mt-1">
                    <strong className="text-indigo-200">Hand Shape:</strong> {geminiVisionResult.handshape || geminiVisionResult.handShapeDescription}
                  </p>
                )}
                {geminiVisionResult.movement && (
                  <p className="text-xs text-slate-300 mt-0.5">
                    <strong className="text-indigo-200">Movement:</strong> {geminiVisionResult.movement}
                  </p>
                )}
                {(geminiVisionResult.explanation || geminiVisionResult.grammaticalNotes) && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong className="text-slate-300">Context:</strong> {geminiVisionResult.explanation || geminiVisionResult.grammaticalNotes}
                  </p>
                )}
                {Array.isArray(geminiVisionResult.alternativeLabels) && geminiVisionResult.alternativeLabels.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Alternatives:</span>
                    {geminiVisionResult.alternativeLabels.map((alt, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {alt.label || alt.sign} ({Math.round((alt.confidence || 0.1) * 100)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  if (onCommitSign) {
                    const primarySign = geminiVisionResult.label || geminiVisionResult.signName || "GEMINI";
                    onCommitSign({
                      symbol: "✨",
                      signName: primarySign,
                      translatedText: geminiVisionResult.englishTranslation || geminiVisionResult.translation || primarySign,
                      meaning: geminiVisionResult.explanation || geminiVisionResult.meaning || "Gemini Landmark Translation",
                      confidence: geminiVisionResult.confidence || 0.98
                    });
                  }
                  if (onClearGeminiVision) onClearGeminiVision();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply</span>
              </button>
              <button
                onClick={onClearGeminiVision}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Active Translation Card */}
      {(!useRealWebcam || cameraStreamStatus === "active") && activeSign && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 animate-in fade-in duration-200 pointer-events-auto">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-2xl shadow-inner relative shrink-0">
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
                  {Math.round((activeSign.confidence || 0.95) * 100)}% MediaPipe Match
                </span>
              </div>

              <div className="flex items-baseline space-x-2 mt-0.5">
                <p className="text-lg font-black text-white tracking-wide">
                  "{activeSign.translatedText}"
                </p>
                {geminiStreamTokens && (
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60 animate-pulse">
                    AI: {geminiStreamTokens}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-300 line-clamp-1 max-w-md">
                {activeSign.meaning}
              </p>
            </div>
          </div>

          {/* Action buttons: Gemini Vision Translate & Commit */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={() => onCaptureGeminiVision && onCaptureGeminiVision(activeSign.signName)}
              disabled={isGeminiVisionLoading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-900/40 transition-all cursor-pointer disabled:opacity-50"
              title="Snap current video frame and translate with Gemini 3.8 Flash Vision"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeminiVisionLoading ? "animate-spin" : ""}`} />
              <span>{isGeminiVisionLoading ? "Translating..." : "Gemini Vision"}</span>
            </button>

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
