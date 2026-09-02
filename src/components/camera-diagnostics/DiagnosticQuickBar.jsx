import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info, Tv, Activity, Moon, Sun } from "lucide-react";

export const DiagnosticQuickBar = ({
  permissionStatus,
  reportedWidth,
  reportedHeight,
  trackState,
  trackMuted,
  isLuminanceDark,
  sampledLuminance
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/60 border-b border-slate-800/80">
      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>Permission</span>
        </span>
        <div className="mt-1 flex items-center space-x-1.5">
          {permissionStatus === "granted" ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Granted</span>
            </>
          ) : permissionStatus === "denied" ? (
            <>
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">Denied</span>
            </>
          ) : permissionStatus === "prompt" ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Awaiting</span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{permissionStatus}</span>
            </>
          )}
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
          <Tv className="w-3 h-3 text-indigo-400" />
          <span>Stream Res</span>
        </span>
        <div className="mt-1">
          <p className="text-xs font-mono font-bold text-white">
            {reportedWidth > 0 && reportedHeight > 0
              ? `${reportedWidth} × ${reportedHeight}`
              : "0 × 0 (Offline)"}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {reportedWidth >= 1280 ? "720p HD" : reportedWidth > 0 ? "Standard" : "No signal"}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
          <Activity className="w-3 h-3 text-indigo-400" />
          <span>Track State</span>
        </span>
        <div className="mt-1 flex items-center space-x-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              trackState === "live" && !trackMuted
                ? "bg-emerald-400 animate-pulse"
                : trackMuted
                ? "bg-amber-400"
                : "bg-rose-400"
            }`}
          />
          <span
            className={`text-xs font-bold uppercase ${
              trackState === "live" && !trackMuted
                ? "text-emerald-400"
                : trackMuted
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {trackMuted ? "Muted by OS" : trackState || "Ended"}
          </span>
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
        <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
          {isLuminanceDark ? (
            <Moon className="w-3 h-3 text-amber-400" />
          ) : (
            <Sun className="w-3 h-3 text-amber-400" />
          )}
          <span>Luminance</span>
        </span>
        <div className="mt-1 flex items-center space-x-1.5">
          <span className="text-xs font-mono font-bold text-white">
            {sampledLuminance !== null ? `${sampledLuminance}%` : "N/A"}
          </span>
          {isLuminanceDark && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              Dark
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
