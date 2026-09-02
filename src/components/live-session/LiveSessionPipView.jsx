import { forwardRef } from "react";
import { CameraOff, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

export const LiveSessionPipView = forwardRef(({
  isCameraOff,
  useRealCameraLocal,
  cameraZoom,
  cameraPan,
  onZoomIn,
  onZoomOut,
  onToggleMainViewMode
}, ref) => {
  return (
    <div className="absolute bottom-28 right-6 w-36 sm:w-48 h-28 sm:h-36 rounded-2xl bg-slate-950 border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
      {isCameraOff ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
          <CameraOff className="w-6 h-6 mb-1" />
          <span className="text-[10px]">Camera Off</span>
        </div>
      ) : useRealCameraLocal ? (
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
      ) : (
        <div className="relative w-full h-full">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
            alt="You"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-white">
            You (Signer)
          </div>
        </div>
      )}

      {/* Floating Zoom & Controls on PiP */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-1 rounded-lg">
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
        <button
          onClick={onToggleMainViewMode}
          className="p-0.5 rounded text-slate-300 hover:text-white cursor-pointer"
          title="Swap Main / PiP view"
        >
          <RefreshCw className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
});

LiveSessionPipView.displayName = "LiveSessionPipView";
