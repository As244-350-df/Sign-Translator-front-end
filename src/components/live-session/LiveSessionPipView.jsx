import { forwardRef } from "react";
import { Camera, CameraOff, Mic, MicOff, ZoomIn, ZoomOut, RefreshCw, Sparkles, User, Headphones } from "lucide-react";

export const LiveSessionPipView = forwardRef(({
  isCameraOff,
  isMuted = false,
  onToggleMute = null,
  onToggleCamera = null,
  useRealCameraLocal,
  cameraZoom = 1,
  cameraPan = { x: 0, y: 0 },
  onZoomIn,
  onZoomOut,
  onToggleMainViewMode,
  mainViewMode = "interpreter",
  perspective = "client",
  interpreter = null,
  clientUser = null,
  pipCanvasRef = null,
  showLandmarkOverlay = true
}, ref) => {
  // If mainViewMode === 'camera', the local user is on the main stage,
  // so the second person (remote participant) sits in the PiP!
  const isRemoteInPip = mainViewMode === "camera";
  const isInterpreterView = perspective === "interpreter";

  // Remote participant identity depending on perspective
  const remotePerson = isInterpreterView
    ? {
        name: clientUser?.name || "Client (Signer)",
        avatar: clientUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        label: "Client (Signer)"
      }
    : {
        name: interpreter?.name || "Interpreter",
        avatar: interpreter?.coverImage || interpreter?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300",
        label: "Interpreter (Certified)"
      };

  return (
    <div className="absolute bottom-28 right-6 w-40 sm:w-56 h-30 sm:h-40 rounded-2xl bg-slate-950 border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
      {isRemoteInPip ? (
        // PiP shows Remote Participant when user has chosen to expand their own camera to main stage
        <div className="relative w-full h-full bg-slate-900">
          <img
            src={remotePerson.avatar}
            alt={remotePerson.name}
            className="w-full h-full object-cover filter contrast-105"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center space-x-1">
            {isInterpreterView ? <User className="w-2.5 h-2.5 text-indigo-400" /> : <Headphones className="w-2.5 h-2.5 text-indigo-400" />}
            <span className="truncate max-w-[90px] sm:max-w-[120px]">{remotePerson.name.split(",")[0]}</span>
          </div>
        </div>
      ) : isCameraOff ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
          <CameraOff className="w-6 h-6 mb-1 text-slate-500" />
          <span className="text-[10px] font-medium">Camera Off</span>
        </div>
      ) : useRealCameraLocal ? (
        <div className="relative w-full h-full bg-slate-950">
          <video
            ref={ref}
            autoPlay
            muted
            playsInline
            style={{
              transform: `scaleX(-${cameraZoom}) scaleY(${cameraZoom}) translate(${cameraPan.x * 12}%, ${cameraPan.y * 12}%)`,
              transformOrigin: "center center"
            }}
            className="w-full h-full object-cover transition-transform duration-150 ease-out"
          />
          {/* Overlay canvas for real-time 21-point hand landmarks in PiP */}
          {pipCanvasRef && (
            <canvas
              ref={pipCanvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
                showLandmarkOverlay ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs border border-emerald-500/30 text-[9px] font-bold text-emerald-300 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isInterpreterView ? "You (Interpreter)" : "You (Signer)"}</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-950">
          <img
            src={
              isInterpreterView
                ? (interpreter?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300")
                : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
            }
            alt="You"
            className="w-full h-full object-cover"
          />
          {pipCanvasRef && (
            <canvas
              ref={pipCanvasRef}
              width={640}
              height={480}
              className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
                showLandmarkOverlay ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-white">
            {isInterpreterView ? "You (Interpreter)" : "You (Signer)"}
          </div>
        </div>
      )}

      {/* Floating Zoom & Media Controls on PiP */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-1 rounded-lg backdrop-blur-xs border border-slate-700">
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isMuted ? "bg-rose-600 text-white" : "text-slate-300 hover:text-white"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5" />}
          </button>
        )}
        {onToggleCamera && (
          <button
            onClick={onToggleCamera}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isCameraOff ? "bg-rose-600 text-white" : "text-slate-300 hover:text-white"
            }`}
            title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isCameraOff ? <CameraOff className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
          </button>
        )}
        {!isRemoteInPip && (
          <>
            <button
              onClick={onZoomOut}
              disabled={cameraZoom <= 1}
              className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-2.5 h-2.5" />
            </button>
            <span className="text-[9px] font-mono text-indigo-400 font-bold px-0.5">
              {cameraZoom.toFixed(1)}x
            </span>
            <button
              onClick={onZoomIn}
              disabled={cameraZoom >= 3.5}
              className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-2.5 h-2.5" />
            </button>
          </>
        )}
        <button
          onClick={onToggleMainViewMode}
          className="p-1 rounded bg-indigo-600/70 hover:bg-indigo-600 text-white cursor-pointer transition-colors"
          title={isRemoteInPip ? "Swap to Remote Participant on Main Screen" : "Swap to Camera on Main Screen"}
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Persistent Audio/Video State Badges on PiP */}
      <div className="absolute top-2 left-2 flex items-center space-x-1 pointer-events-none">
        {isMuted && (
          <span className="px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white text-[9px] font-bold flex items-center space-x-0.5 shadow-xs">
            <MicOff className="w-2.5 h-2.5" />
            <span>Muted</span>
          </span>
        )}
        {isCameraOff && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-600/90 text-white text-[9px] font-bold flex items-center space-x-0.5 shadow-xs">
            <CameraOff className="w-2.5 h-2.5" />
            <span>Cam Off</span>
          </span>
        )}
      </div>
    </div>
  );
});

LiveSessionPipView.displayName = "LiveSessionPipView";
