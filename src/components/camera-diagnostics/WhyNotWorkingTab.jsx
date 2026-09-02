import {
  AlertTriangle,
  ExternalLink,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Play,
  Lock,
  Laptop
} from "lucide-react";
import { getSafeCurrentUrl } from "../../utils/environment";

export const WhyNotWorkingTab = ({
  isInIframe,
  detectedCameras,
  permissionStatus,
  isCheckingDevices,
  onRescanDevices,
  onRunDirectCameraTest,
  manualTestStatus,
  manualTestMessage,
  manualVideoRef
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* IFRAME PREVIEW ALERT */}
      {isInIframe && (
        <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/50 shadow-lg text-amber-200 animate-in fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <p className="font-bold text-white text-sm">
                #1 Cause: App is running in the Google AI Studio Preview iFrame
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Modern web browsers frequently block or suppress camera access prompts when web applications run inside an embedded <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">&lt;iframe&gt;</code> sandbox.
              </p>
              <div className="pt-2">
                <a
                  href={getSafeCurrentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open App in New Browser Tab (Direct Access)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED HARDWARE & PERMISSION LIVE SCAN */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Live Hardware & Permission Scan</span>
          </h4>
          <button
            onClick={onRescanDevices}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingDevices ? "animate-spin" : ""}`} />
            <span>Rescan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Physical Cameras */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Physical Video Capture Devices</span>
              {detectedCameras.length > 0 ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{detectedCameras.length} Detected</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>0 Detected</span>
                </span>
              )}
            </div>
            {detectedCameras.length > 0 ? (
              <ul className="text-[11px] text-slate-300 font-mono space-y-0.5">
                {detectedCameras.map((c, i) => (
                  <li key={i} className="truncate text-indigo-200">
                    • {c.label || `Video Input Device #${i + 1}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-rose-300/90 leading-tight mt-1">
                No webcam hardware detected by OS. Check USB connection or laptop camera switch.
              </p>
            )}
          </div>

          {/* Browser Permission State */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[11px]">Browser Permission Status</span>
              {permissionStatus === "granted" ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Allowed</span>
                </span>
              ) : permissionStatus === "denied" ? (
                <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Blocked</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Prompt / Waiting</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">
              {permissionStatus === "granted"
                ? "Your browser has granted camera permission to this domain."
                : permissionStatus === "denied"
                ? "Camera is blocked in browser settings. See unblock instructions below."
                : 'Browser is waiting for user to click "Allow" in address bar prompt.'}
            </p>
          </div>
        </div>
      </div>

      {/* DIRECT MANUAL TEST CARD */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Live Direct Camera Stream Test</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Attempts a fresh hardware test to isolate whether the browser or hardware is responding.
            </p>
          </div>

          <button
            onClick={onRunDirectCameraTest}
            disabled={manualTestStatus === "testing"}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
          >
            {manualTestStatus === "testing" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{manualTestStatus === "testing" ? "Testing..." : "Run Test Now"}</span>
          </button>
        </div>

        {manualTestStatus !== "idle" && (
          <div
            className={`p-3 rounded-xl border text-xs ${
              manualTestStatus === "success"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                : manualTestStatus === "error"
                ? "bg-rose-950/60 border-rose-500/40 text-rose-200"
                : "bg-indigo-950/60 border-indigo-500/40 text-indigo-200"
            }`}
          >
            <p className="font-semibold mb-2">{manualTestMessage}</p>
            {manualTestStatus === "success" && (
              <div className="mt-2 w-48 aspect-video rounded-lg overflow-hidden border border-emerald-500/40 bg-black">
                <video
                  ref={manualVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP-BY-STEP UNBLOCKING GUIDE */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <h4 className="font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>How to Unblock Camera in Your Browser</span>
        </h4>

        <div className="space-y-2 text-[11px] text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <strong className="text-white block mb-0.5">Google Chrome & Microsoft Edge:</strong>
            1. Look at the left side of your browser URL/address bar for the <strong>Padlock 🔒</strong> or <strong>Site settings / Tune 🎚️</strong> icon.<br />
            2. Click it, find <strong>Camera</strong>, and change it from <em>Block</em> to <strong className="text-emerald-400">Allow</strong>.<br />
            3. Click the <strong>"Restart Camera Hardware"</strong> button below or refresh the page.
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <strong className="text-white block mb-0.5">Apple Safari (macOS / iOS):</strong>
            1. On macOS: Click <strong>Safari</strong> in the top menu bar &gt; <strong>Settings for This Website...</strong><br />
            2. Next to <strong>Camera</strong>, select <strong className="text-emerald-400">Allow</strong>.<br />
            3. Also check: Apple System Settings &gt; Privacy &amp; Security &gt; Camera &gt; ensure Safari is toggled ON.
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <strong className="text-white block mb-0.5">Windows 10 / 11 Privacy Settings:</strong>
            1. Open Windows <strong>Settings</strong> (Win + I) &gt; <strong>Privacy &amp; Security</strong> &gt; <strong>Camera</strong>.<br />
            2. Ensure <strong>"Camera access"</strong> is toggled <strong className="text-emerald-400">ON</strong>.<br />
            3. Ensure <strong>"Let desktop apps access your camera"</strong> and your browser are allowed.
          </div>
        </div>
      </div>

      {/* COMMON PHYSICAL CONFLICTS */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
        <h4 className="font-bold text-white flex items-center space-x-2">
          <Laptop className="w-4 h-4 text-cyan-400" />
          <span>Other Common Hardware &amp; App Conflicts</span>
        </h4>

        <ul className="space-y-2 text-[11px] text-slate-300">
          <li className="flex items-start space-x-2">
            <span className="text-indigo-400 font-bold">•</span>
            <div>
              <strong className="text-white">Physical Privacy Shutter / Slider:</strong> Many modern laptops have a tiny mechanical slide covering the webcam lens. Check for a red dot or physical cover above your screen.
            </div>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-400 font-bold">•</span>
            <div>
              <strong className="text-white">Laptop Keyboard Hotkey / Mute Switch:</strong> Some laptops have a camera killswitch button on the keyboard (typically F8, F10, or a side switch).
            </div>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-indigo-400 font-bold">•</span>
            <div>
              <strong className="text-white">Exclusive Camera Lock by Other Apps:</strong> Webcams can only be used by one application at a time. Close Zoom, Teams, OBS, Discord, or FaceTime and retry.
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
