import { useState } from "react";
import {
  Sparkles,
  Zap,
  Radio,
  Camera,
  Cpu,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  PlayCircle,
  ShieldCheck,
  Film
} from "lucide-react";
import { isInsideIframe, getSafeCurrentUrl } from "../../utils/environment";

export const ResourceConnectionGate = ({
  resourceStatus,
  onSelectSimulator,
  onSelectDemoClip,
  onRetryCamera,
  onProceedImmediately,
  cameraError
}) => {
  const isInIframe = isInsideIframe();
  const [retrying, setRetrying] = useState(false);

  const mediaPipe = resourceStatus?.mediaPipe || {
    status: "connecting",
    label: "MediaPipe 21 Hand Landmarks",
    detail: "Initializing neural vision worker..."
  };

  const aiStream = resourceStatus?.aiStream || {
    status: "connecting",
    label: "Gemini AI Stream Engine",
    detail: "Establishing SSE stream & Web Worker..."
  };

  const camera = resourceStatus?.camera || {
    status: "connecting",
    label: "Camera Video Capture",
    detail: "Requesting video stream access..."
  };

  const progress = resourceStatus?.progress ?? 25;
  const statusMessage = resourceStatus?.statusMessage || "Connecting AI Stream & MediaPipe Vision...";

  const handleRetry = async () => {
    setRetrying(true);
    if (onRetryCamera) {
      await onRetryCamera();
    }
    setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <div
      id="resource-connection-gate"
      className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/30 flex flex-col justify-between p-5 sm:p-7 text-white select-none transition-all duration-300"
    >
      {/* Background ambient glow effect */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-ping" />
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Preparing Neural Pipeline
              </h3>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Resource Gate
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">
              Camera view and features will reveal once AI stream & vision models are connected.
            </p>
          </div>
        </div>

        {/* Live Progress Pill */}
        <div className="text-right shrink-0">
          <span className="font-mono text-xs sm:text-sm font-black text-cyan-300">
            {progress}%
          </span>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Status
          </p>
        </div>
      </div>

      {/* Middle: 3 Resource Status Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto py-2">
        {/* Resource 1: MediaPipe Hand Landmarker */}
        <div
          className={`p-3 rounded-2xl border transition-all duration-300 ${
            mediaPipe.status === "ready"
              ? "bg-slate-900/80 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-xl ${
                  mediaPipe.status === "ready" ? "bg-emerald-500/20 text-emerald-300" : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200 truncate">MediaPipe 3D</span>
            </div>
            {mediaPipe.status === "ready" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                mediaPipe.status === "ready" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span
              className={`text-[11px] font-semibold truncate ${
                mediaPipe.status === "ready" ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              {mediaPipe.status === "ready" ? "Connected (Worker)" : "Loading 21 Landmarks..."}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
            {mediaPipe.detail || "Zero-latency 3D hand tracking"}
          </p>
        </div>

        {/* Resource 2: Gemini AI Stream */}
        <div
          className={`p-3 rounded-2xl border transition-all duration-300 ${
            aiStream.status === "ready"
              ? "bg-slate-900/80 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-xl ${
                  aiStream.status === "ready" ? "bg-emerald-500/20 text-emerald-300" : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200 truncate">AI Stream Engine</span>
            </div>
            {aiStream.status === "ready" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                aiStream.status === "ready" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span
              className={`text-[11px] font-semibold truncate ${
                aiStream.status === "ready" ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              {aiStream.status === "ready" ? "SSE Stream Connected" : "Connecting Pipeline..."}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
            {aiStream.detail || "Gemini streaming token deserializer"}
          </p>
        </div>

        {/* Resource 3: Camera Capture Hardware */}
        <div
          className={`p-3 rounded-2xl border transition-all duration-300 ${
            camera.status === "ready" || camera.status === "simulator"
              ? "bg-slate-900/80 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
              : camera.status === "denied" || camera.status === "error"
              ? "bg-amber-950/40 border-amber-500/50"
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={`p-1.5 rounded-xl ${
                  camera.status === "ready" || camera.status === "simulator"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : camera.status === "denied" || camera.status === "error"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-indigo-500/20 text-indigo-300"
                }`}
              >
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200 truncate">Video Stream</span>
            </div>
            {camera.status === "ready" || camera.status === "simulator" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : camera.status === "denied" || camera.status === "error" ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
          </div>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                camera.status === "ready" || camera.status === "simulator"
                  ? "bg-emerald-400"
                  : camera.status === "denied" || camera.status === "error"
                  ? "bg-amber-400"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span
              className={`text-[11px] font-semibold truncate ${
                camera.status === "ready" || camera.status === "simulator"
                  ? "text-emerald-300"
                  : camera.status === "denied" || camera.status === "error"
                  ? "text-amber-300"
                  : "text-slate-300"
              }`}
            >
              {camera.status === "ready"
                ? "Video Active"
                : camera.status === "simulator"
                ? "Simulated Feed"
                : camera.status === "denied"
                ? "Access Blocked"
                : "Acquiring Stream..."}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
            {camera.detail || "Direct hardware video pipeline"}
          </p>
        </div>
      </div>

      {/* Camera permission prompt or iframe notice */}
      {(camera.status === "denied" || camera.status === "error") && (
        <div className="relative z-10 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] leading-tight truncate sm:whitespace-normal">
              {isInIframe
                ? "Browser security restricts camera prompts inside embedded preview."
                : cameraError?.message || "Camera access requires permission in your browser."}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            {isInIframe && (
              <a
                href={getSafeCurrentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open New Tab</span>
              </a>
            )}
            <button
              onClick={onSelectSimulator}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
            >
              <PlayCircle className="w-3 h-3" />
              <span>Use Simulated Hand</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom: Progress Bar & Bypass Options */}
      <div className="relative z-10 space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusMessage}</span>
            </span>
            <span className="font-mono text-indigo-300 font-semibold">{progress}%</span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out shadow-sm shadow-cyan-500/50"
              style={{ width: `${Math.max(10, progress)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons to ensure instant accessibility */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onSelectSimulator}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
              title="Launch instantly with simulated hand kinematic coordinates"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch Simulated Hand (Instant)</span>
            </button>

            <button
              type="button"
              onClick={onSelectDemoClip}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
              title="Run with recorded demo footage"
            >
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Demo Clip</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {onProceedImmediately && (
              <button
                type="button"
                onClick={onProceedImmediately}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold border border-emerald-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                title="Enter live translate now"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enter Live Translate</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${retrying ? "animate-spin" : ""}`} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
