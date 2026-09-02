import {
  Camera,
  CameraOff,
  Layers,
  RefreshCw,
  Volume2,
  VolumeX,
  Activity,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Target,
  HandMetal,
  Keyboard,
  HelpCircle
} from "lucide-react";
import { RecordingControls } from "../RecordingControls";

export const CameraToolbar = ({
  isCameraActive,
  onToggleCameraActive,
  useRealWebcam,
  cameraStreamStatus,
  onSwitchInputMode,
  onRetryCamera,
  showMesh,
  onToggleMesh,
  autoSpeakOnCommit,
  onToggleAutoSpeak,
  isRecording,
  onToggleRecording,
  recorder,
  showDiagnosticsOverlay,
  onOpenDiagnostics,
  isDarkFeedWarning,
  activeStreamResolution,
  isAutoCentering,
  onToggleAutoCenter,
  cameraZoom,
  onZoomIn,
  onZoomOut,
  onOpenZoomMenu,
  showAlignmentGuide,
  onToggleAlignmentGuide,
  showFreeFingerStudio,
  onToggleFreeFingerStudio,
  onOpenKeyboard,
  onOpenTutorial
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleCameraActive}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            isCameraActive
              ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          }`}
        >
          {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          <span>{isCameraActive ? "Camera On" : "Camera Off"}</span>
        </button>

        <button
          onClick={onSwitchInputMode}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            useRealWebcam
              ? cameraStreamStatus === "error"
                ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                : "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            {useRealWebcam
              ? cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission"
                ? "Connecting..."
                : cameraStreamStatus === "error"
                ? "Webcam Error"
                : "Using Webcam"
              : "Simulation Mode"}
          </span>
        </button>

        {cameraStreamStatus === "error" && useRealWebcam && (
          <button
            onClick={onRetryCamera}
            disabled={cameraStreamStatus === "requesting_permission"}
            className="px-2.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            title="Retry Camera Initialization"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${cameraStreamStatus === "requesting_permission" ? "animate-spin" : ""}`}
            />
            <span>Retry</span>
          </button>
        )}

        <button
          onClick={onToggleMesh}
          className={`p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            showMesh
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500"
          }`}
          title="Toggle 21-point Hand Landmarks Skeleton Mesh"
        >
          Mesh {showMesh ? "ON" : "OFF"}
        </button>

        {/* Auto Speak on Commit */}
        <button
          onClick={onToggleAutoSpeak}
          className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            autoSpeakOnCommit
              ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}
          title="Automatically speak each committed sign out loud"
        >
          {autoSpeakOnCommit ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Auto TTS {autoSpeakOnCommit ? "ON" : "OFF"}</span>
        </button>

        {/* Record Translation Video Button */}
        <RecordingControls
          isRecording={isRecording}
          onToggleRecording={onToggleRecording}
          recorder={recorder}
        />

        {/* Camera Hardware Diagnostics & Stream Resolution Inspector */}
        <button
          onClick={onOpenDiagnostics}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
            showDiagnosticsOverlay
              ? "bg-indigo-600 text-white shadow-xs"
              : isDarkFeedWarning
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-500/50 animate-pulse"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          }`}
          title="Inspect Camera Hardware, Permissions, Resolution & Darkness Troubleshooting"
        >
          <Activity
            className={`w-3.5 h-3.5 ${
              isDarkFeedWarning
                ? "text-amber-600 dark:text-amber-400"
                : "text-indigo-500 dark:text-indigo-400"
            }`}
          />
          <span>Diagnostics</span>
          {activeStreamResolution && (
            <span className="hidden sm:inline text-[10px] font-mono opacity-75">
              ({activeStreamResolution.width}×{activeStreamResolution.height})
            </span>
          )}
        </button>

        {/* Zoom, Auto-Center & Alignment Controls */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
          <button
            onClick={onToggleAutoCenter}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              isAutoCentering
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"
            }`}
            title="Toggle Real-Time Hand Auto-Centering (Computer Vision)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Auto-Center</span>
          </button>
          <button
            onClick={onZoomOut}
            disabled={cameraZoom <= 1 || isAutoCentering}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out Camera (0.25x step)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenZoomMenu}
            className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs hover:bg-slate-50 transition-colors flex items-center space-x-1 cursor-pointer"
            title="Adjust Camera Zoom & Alignment Settings"
          >
            <span>{cameraZoom.toFixed(2)}x</span>
          </button>
          <button
            onClick={onZoomIn}
            disabled={cameraZoom >= 3.5 || isAutoCentering}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In Camera (0.25x step)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleAlignmentGuide}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              showAlignmentGuide
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"
            }`}
            title="Toggle Hand Alignment Guide Reticle"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
        </div>

        {/* Free Finger Motion Studio Toggle */}
        <button
          onClick={onToggleFreeFingerStudio}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
            showFreeFingerStudio
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/30"
          }`}
          title="Open Free Finger Articulation & Dynamic Motion Studio"
        >
          <HandMetal className="w-4 h-4" />
          <span>Free Fingers Studio {showFreeFingerStudio ? "▲" : "▼"}</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenKeyboard}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>Sign Keyboard</span>
        </button>

        <button
          onClick={onOpenTutorial}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-700 transition-colors cursor-pointer"
          title="How to Sign Tutorial"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
