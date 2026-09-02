import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const DarkFeedTroubleshooterTab = ({
  permissionStatus,
  isLuminanceDark,
  trackMuted,
  reportedWidth,
  reportedHeight,
  cameraError
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-300">
        <p className="font-bold text-indigo-300 mb-1">
          Diagnosing Black or Dark Video Feeds:
        </p>
        <p className="leading-relaxed">
          If the stream status shows "Camera Active" or "TensorFlow Camera HD", but the visual feed is completely black, follow the automated checklist below to identify the root cause.
        </p>
      </div>

      {/* Automated Troubleshooting Checklist */}
      <div className="space-y-2.5">
        {/* Step 1: Permission */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
          {permissionStatus === "granted" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">1. Browser Hardware Permission</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  permissionStatus === "granted" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {permissionStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {permissionStatus === "granted"
                ? "Passed: The browser allows this site to access camera hardware."
                : 'Blocked: Click the lock or camera icon next to the address bar and change Camera to "Allow".'}
            </p>
          </div>
        </div>

        {/* Step 2: Physical Shutter / Lens Cover */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
          {isLuminanceDark ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">2. Physical Privacy Shutter / Lens Slider</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  isLuminanceDark ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {isLuminanceDark ? "PITCH DARK DETECTED" : "LIGHT DETECTED"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {isLuminanceDark
                ? "The camera stream is receiving 0% light. Most modern laptops and webcams have a physical mechanical slider or red dot shutter over the lens."
                : "Passed: Sensor is receiving ambient light."}
            </p>
          </div>
        </div>

        {/* Step 3: Track Muted by Operating System */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
          {trackMuted ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">3. Hardware Switch / Function Key Mute</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  trackMuted ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {trackMuted ? "MUTED BY SYSTEM" : "UNMUTED"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {trackMuted
                ? "The operating system reports the video track is muted. Look for a camera key (often F8, F10, or a side switch) on your laptop keyboard."
                : "Passed: MediaStreamTrack is receiving frames from device driver."}
            </p>
          </div>
        </div>

        {/* Step 4: Resolution & Pipeline Buffer */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
          {reportedWidth > 0 && reportedHeight > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">4. Frame Buffer Resolution</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  reportedWidth > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {reportedWidth > 0 ? `${reportedWidth}×${reportedHeight}` : "0×0"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {reportedWidth > 0
                ? `Passed: Hardware stream is rendering at ${reportedWidth}×${reportedHeight} resolution.`
                : 'Failed: No frame resolution received. Click "Restart Camera Hardware" below.'}
            </p>
          </div>
        </div>

        {/* Step 5: Hardware Mutex / In Use by Another App */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
          {cameraError?.type === "in_use" ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">5. Exclusive Lock / Other Apps</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  cameraError?.type === "in_use" ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {cameraError?.type === "in_use" ? "HARDWARE LOCKED" : "EXCLUSIVE ACCESS"}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {cameraError?.type === "in_use"
                ? "Another program (Zoom, Teams, OBS, FaceTime) has an exclusive lock on your camera. Close those applications and retry."
                : "Passed: Camera hardware is not locked by another process."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
