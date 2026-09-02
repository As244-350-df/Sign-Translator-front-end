import { ShieldCheck, Tv, AlertTriangle } from "lucide-react";

export const HardwareMetricsTab = ({
  isLuminanceDark,
  streamStatus,
  reportedWidth,
  reportedHeight,
  aspectLabel,
  permissionStatus,
  trackSettings,
  videoDimensions,
  readyStateLabels,
  trackState,
  mediaStream
}) => {
  return (
    <div className="space-y-4">
      {/* Pitch Dark Alert Banner */}
      {isLuminanceDark && streamStatus === "active" && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start space-x-3 text-amber-200 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-300">
              Camera Feed is Delivering Pitch Dark Frames (Luminance &lt; 3%)
            </p>
            <p className="text-slate-300 leading-relaxed">
              The video track is active and streaming at{" "}
              <strong className="text-white font-mono">
                {reportedWidth}×{reportedHeight}
              </strong>
              , but the sensor is registering black pixels. Check if your camera has a{" "}
              <strong>physical privacy shutter / slider</strong> covering the lens or a{" "}
              <strong>hardware switch / function key</strong> toggled off.
            </p>
          </div>
        </div>
      )}

      {/* Hardware Permission Details Table */}
      <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Browser & OS Permission Status</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Hardware Permission Query</span>
            <span className="font-mono font-bold text-white text-sm">
              {permissionStatus.toUpperCase()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {permissionStatus === "granted"
                ? "Browser has authorized camera hardware access."
                : permissionStatus === "denied"
                ? "Blocked in browser permissions. Click lock icon in URL bar."
                : "Browser has not yet received user authorization."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">MediaDevices API Support</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
                ? "SUPPORTED"
                : "UNAVAILABLE"}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              HTML5 getUserMedia is fully ready for WebRTC & TensorFlow vision.
            </p>
          </div>
        </div>
      </div>

      {/* Video Stream & Resolution Table */}
      <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Tv className="w-4 h-4 text-indigo-400" />
          <span>Stream Resolution & Video Element Pipeline</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Negotiated Stream Res</span>
            <span className="text-white font-bold">
              {reportedWidth} × {reportedHeight}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Aspect Ratio</span>
            <span className="text-indigo-300 font-bold">{aspectLabel}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Track Frame Rate</span>
            <span className="text-emerald-400 font-bold">
              {trackSettings?.frameRate ? `${Math.round(trackSettings.frameRate)} fps` : "30 fps (Target)"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Video Native Buffer</span>
            <span className="text-white font-bold">
              {videoDimensions.width} × {videoDimensions.height}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Video readyState</span>
            <span className="text-indigo-300 font-bold">
              {readyStateLabels[videoDimensions.readyState] || videoDimensions.readyState}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 text-[10px] block font-sans">Track Hardware State</span>
            <span className={`font-bold ${trackState === "live" ? "text-emerald-400" : "text-rose-400"}`}>
              {trackState || "None"}
            </span>
          </div>
        </div>

        {mediaStream?.getVideoTracks()[0]?.label && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] block">Hardware Device Label:</span>
            <span className="text-white font-bold font-mono">
              {mediaStream.getVideoTracks()[0].label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
