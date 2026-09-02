import { Film, HandMetal, Camera, CameraOff, Sparkles, X } from "lucide-react";
import { CameraStreamErrorOverlay } from "./CameraStreamErrorOverlay";
import { CameraZoomFramingMenu } from "./CameraZoomFramingMenu";
import { LiveGestureOverlayHUD } from "../LiveGestureOverlayHUD";
import { RecordingDurationPill } from "../RecordingDurationPill";

export const CameraFeedStage = ({
  isCameraActive,
  setIsCameraActive,
  tracking,
  isInIframe,
  settings,
  isRecording,
  recorder,
  onCommitSign,
  onOpenDiagnostics,
  onToggleAutoCenter,
  onZoomIn,
  onZoomOut,
  onSetZoom,
  onResetZoom,
  onPanNudge
}) => {
  return (
    <div className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
      {tracking.cameraNoticeMessage && tracking.inputSourceMode === "webcam" && (
        <div className="absolute top-3 left-3 right-3 z-40 p-2.5 bg-indigo-950/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl shadow-xl flex items-center justify-between text-xs text-indigo-200 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px] sm:text-xs truncate sm:whitespace-normal">
              {tracking.cameraNoticeMessage}
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                tracking.setCameraNoticeMessage(null);
                tracking.handleRetryCamera();
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] sm:text-xs transition-colors cursor-pointer"
            >
              Retry Webcam
            </button>
            <button
              onClick={() => tracking.setCameraNoticeMessage(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {isCameraActive ? (
        <>
          {tracking.inputSourceMode !== "simulator" ? (
            <>
              <video
                ref={tracking.videoRef}
                autoPlay
                muted
                playsInline
                loop={tracking.inputSourceMode === "video_upload"}
                style={{
                  transform:
                    tracking.inputSourceMode === "webcam"
                      ? `scaleX(-${Number(tracking.cameraZoom) || 1}) scaleY(${Number(tracking.cameraZoom) || 1}) translate(${(Number(tracking.cameraPan?.x) || 0) * 12}%, ${(Number(tracking.cameraPan?.y) || 0) * 12}%)`
                      : `scale(${Number(tracking.cameraZoom) || 1}) translate(${(Number(tracking.cameraPan?.x) || 0) * 12}%, ${(Number(tracking.cameraPan?.y) || 0) * 12}%)`,
                  transformOrigin: "center center"
                }}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-out ${
                  tracking.inputSourceMode === "webcam" && tracking.cameraStreamStatus !== "active"
                    ? "opacity-20 filter blur-xs"
                    : "opacity-100"
                }`}
              />

              {tracking.inputSourceMode === "video_upload" && !tracking.uploadedVideoUrl && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center">
                  <Film className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-white mb-1">No Video File Selected</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    Upload an MP4, WebM, or MOV video of sign language to track hands and recognize gestures.
                  </p>
                </div>
              )}

              {tracking.inputSourceMode === "demo_clips" && (
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center space-x-2 shadow-lg">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Demo Feed: {tracking.activeDemoId}</span>
                </div>
              )}

              <CameraStreamErrorOverlay
                cameraStreamStatus={tracking.cameraStreamStatus}
                cameraError={tracking.cameraError}
                isInIframe={isInIframe}
                onRetryCamera={tracking.handleRetryCamera}
                onSelectInputMode={tracking.handleSelectInputMode}
                onShowDiagnostics={onOpenDiagnostics}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-44 h-44 rounded-full bg-indigo-500/10 animate-ping absolute pointer-events-none" />
              <div className="text-center z-0 opacity-80 mb-3">
                <HandMetal className="w-14 h-14 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-mono font-bold text-indigo-300">
                  TensorFlow Neural Kinematics Simulation Mode
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Generating 21 3D spatial hand landmarks with anatomical physics.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 z-10">
                <button
                  onClick={() => tracking.handleSelectInputMode("webcam")}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Switch to Live Webcam Feed</span>
                </button>
                <button
                  onClick={() => tracking.handleSelectInputMode("demo_clips")}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
                >
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>Sign Video Library</span>
                </button>
              </div>
            </div>
          )}

          <canvas
            ref={tracking.canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 animate-scan pointer-events-none" />

          <CameraZoomFramingMenu
            cameraZoom={tracking.cameraZoom}
            cameraPan={tracking.cameraPan}
            calibrationScale={tracking.calibrationScale}
            isAutoCentering={tracking.isAutoCentering}
            showAlignmentGuide={tracking.showAlignmentGuide}
            showZoomMenu={tracking.showZoomMenu}
            onToggleAutoCenter={onToggleAutoCenter}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onSetZoom={onSetZoom}
            onResetZoom={onResetZoom}
            onPanNudge={onPanNudge}
            onSetCalibrationScale={tracking.setCalibrationScale}
            onToggleAlignmentGuide={() => tracking.setShowAlignmentGuide(!tracking.showAlignmentGuide)}
            onToggleZoomMenu={() => tracking.setShowZoomMenu(!tracking.showZoomMenu)}
          />

          <LiveGestureOverlayHUD
            tracker={tracking.handTrackerRef.current}
            useRealWebcam={tracking.useRealWebcam}
            cameraStreamStatus={tracking.cameraStreamStatus}
            primarySignLanguage={settings.primarySignLanguage}
            activeStreamResolution={tracking.activeStreamResolution}
            hardwarePermissionStatus={tracking.hardwarePermissionStatus}
            onShowDiagnostics={onOpenDiagnostics}
            onCommitSign={onCommitSign}
          />
          <div className="absolute top-4 right-4 z-20 pointer-events-auto">
            <RecordingDurationPill recorder={recorder} isRecording={isRecording} />
          </div>
        </>
      ) : (
        <div className="text-center p-8">
          <CameraOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold mb-1">Camera Feed Paused</p>
          <p className="text-xs text-slate-500 max-w-xs mb-4">
            Enable camera to start live sign language landmark tracking and translation.
          </p>
          <button
            onClick={() => setIsCameraActive(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Start Translation Camera
          </button>
        </div>
      )}
    </div>
  );
};
