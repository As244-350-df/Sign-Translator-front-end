import {
  Camera,
  CameraOff,
  RefreshCw,
  ShieldAlert,
  VideoOff,
  AlertCircle,
  ExternalLink,
  HandMetal,
  Film,
  HelpCircle,
  Loader2
} from "lucide-react";
import { getSafeCurrentUrl } from "../../utils/environment";

export const CameraStreamErrorOverlay = ({
  cameraStreamStatus,
  cameraError,
  isInIframe,
  onRetryCamera,
  onSelectInputMode,
  onShowDiagnostics
}) => {
  if (cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission") {
    return (
      <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Camera className="w-8 h-8 animate-pulse" />
          </div>
          <div
            className="absolute -inset-2 rounded-2xl border-2 border-dashed border-indigo-400/40 animate-spin"
            style={{ animationDuration: "6s" }}
          />
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          <span>
            {cameraStreamStatus === "requesting_permission"
              ? "Awaiting Camera Permission..."
              : "Connecting Camera to AI Engine..."}
          </span>
        </div>

        <h4 className="text-base font-bold text-white mb-1.5 max-w-sm">
          {cameraStreamStatus === "requesting_permission"
            ? 'Please click "Allow" in your browser prompt'
            : "Connecting video hardware to TensorFlow tracking engine..."}
        </h4>

        <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
          {cameraStreamStatus === "requesting_permission"
            ? "Your browser may show a permission dialog near the address bar. Grant access to begin real-time sign recognition."
            : "Initializing video frames, frame buffers, and neural hand landmark detection pipeline."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {isInIframe && (
            <a
              href={getSafeCurrentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
          )}

          <button
            onClick={onShowDiagnostics}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Why isn't Webcam Working?</span>
          </button>

          <button
            onClick={onRetryCamera}
            className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-colors cursor-pointer flex items-center space-x-1 shadow-sm"
            title="Force Re-attempt Camera"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>

          <button
            onClick={() => onSelectInputMode("simulator")}
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <HandMetal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Switch to 3D Simulator</span>
          </button>
        </div>
      </div>
    );
  }

  if (cameraStreamStatus === "error" && cameraError) {
    return (
      <div className="absolute inset-0 z-30 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
          {cameraError.type === "permission_denied" ? (
            <ShieldAlert className="w-8 h-8" />
          ) : cameraError.type === "not_found" ? (
            <VideoOff className="w-8 h-8" />
          ) : cameraError.type === "in_use" ? (
            <AlertCircle className="w-8 h-8" />
          ) : (
            <CameraOff className="w-8 h-8" />
          )}
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{cameraError.title}</span>
        </div>

        <h4 className="text-base font-bold text-white mb-2 max-w-md">{cameraError.message}</h4>

        <div className="p-3.5 my-2 max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs text-slate-300 leading-relaxed shadow-inner">
          <span className="font-bold text-amber-400 flex items-center space-x-1.5 mb-1">
            <span>💡 Alternatives & Fixes:</span>
          </span>
          <p className="text-slate-300">{cameraError.tips}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
          {cameraError.canRetry && (
            <button
              onClick={onRetryCamera}
              disabled={cameraStreamStatus === "requesting_permission"}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  cameraStreamStatus === "requesting_permission" ? "animate-spin" : ""
                }`}
              />
              <span>
                {cameraStreamStatus === "requesting_permission"
                  ? "Connecting to Camera..."
                  : "Retry Camera Stream"}
              </span>
            </button>
          )}

          {isInIframe && (
            <a
              href={getSafeCurrentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab (Bypass iFrame)</span>
            </a>
          )}

          <button
            onClick={() => onSelectInputMode("simulator")}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md"
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>Switch to 3D Simulator (No Webcam)</span>
          </button>

          <button
            onClick={() => onSelectInputMode("demo_clips")}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Play Demo Sign Video</span>
          </button>

          <button
            onClick={onShowDiagnostics}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Camera Diagnostic</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
