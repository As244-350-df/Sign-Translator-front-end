import { forwardRef } from "react";
import { CameraOff, ZoomIn, ZoomOut, RefreshCw, Sparkles, User } from "lucide-react";

export const LiveSessionPipView = forwardRef(({
  isCameraOff,
  useRealCameraLocal,
  cameraZoom = 1,
  cameraPan = { x: 0, y: 0 },
  onZoomIn,
  onZoomOut,
  onToggleMainViewMode,
  mainViewMode = "interpreter",
  interpreter = null,
  pipCanvasRef = null,
  showLandmarkOverlay = true
}, ref) => {
  const isInterpreterInPip = mainViewMode === "camera";

  return (
    <div className="absolute bottom-28 right-6 w-40 sm:w-56 h-30 sm:h-40 rounded-2xl bg-slate-950 border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
      {isInterpreterInPip ? (
        // PiP shows Interpreter when user has full camera on main stage
        <div className="relative w-full h-full bg-slate-900">
          <img
            src={interpreter?.coverImage || interpreter?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"}
            alt={interpreter?.name || "Interpreter"}
            className="w-full h-full object-cover filter contrast-105"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs border border-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center space-x-1">
            <User className="w-2.5 h-2.5 text-indigo-400" />
            <span className="truncate max-w-[90px] sm:max-w-[120px]">{interpreter?.name?.split(",")[0] || "Interpreter"}</span>
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
            <span>You (Signer)</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full bg-slate-950">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
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
            You (Signer)
          </div>
        </div>
      )}

      {/* Floating Zoom & Controls on PiP */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-1 rounded-lg backdrop-blur-xs border border-slate-700">
        {!isInterpreterInPip && (
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
          className="p-1 rounded bg-indigo-600/60 hover:bg-indigo-600 text-white cursor-pointer transition-colors"
          title={isInterpreterInPip ? "Swap to Interpreter on Main Screen" : "Swap to Camera on Main Screen"}
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
});

LiveSessionPipView.displayName = "LiveSessionPipView";
