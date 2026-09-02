import {
  HandMetal,
  Layers,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Target,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Hand,
  Circle,
  PhoneOff,
  MessageSquare
} from "lucide-react";

export const LiveSessionControlBar = ({
  showSignDeck,
  onToggleSignDeck,
  showLandmarkOverlay,
  onToggleLandmarkOverlay,
  isAutoCentering,
  onToggleAutoCenter,
  cameraZoom,
  onZoomIn,
  onZoomOut,
  showAlignmentGuide,
  onToggleAlignmentGuide,
  signSpeed,
  onChangeSignSpeed,
  isMuted,
  onToggleMute,
  isCameraOff,
  onToggleCamera,
  isHandRaised,
  onToggleHandRaised,
  isRecording,
  onToggleRecording,
  onEndCall,
  showChat,
  onToggleChat
}) => {
  return (
    <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
      {/* Left Action Toggles */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSignDeck}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
            showSignDeck
              ? "bg-emerald-600 border-emerald-500 text-white shadow-xs"
              : "bg-slate-900 border-slate-800 text-emerald-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Toggle Live Hand Signs Recognition Deck"
        >
          <HandMetal className="w-4 h-4" />
          <span className="font-bold">Sign Deck</span>
        </button>

        <button
          onClick={onToggleLandmarkOverlay}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
            showLandmarkOverlay
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
          title="Toggle 21-point AI Hand Skeleton"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Skeleton</span>
        </button>

        {/* Camera Zoom & Alignment */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={onToggleAutoCenter}
            className={`p-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
              isAutoCentering ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
            title="Toggle Real-Time Hand Auto-Centering"
          >
            <Crosshair className="w-3 h-3" />
            <span>Auto</span>
          </button>
          <button
            onClick={onZoomOut}
            disabled={cameraZoom <= 1 || isAutoCentering}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Camera Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-indigo-400 font-bold px-1">
            {cameraZoom.toFixed(1)}x
          </span>
          <button
            onClick={onZoomIn}
            disabled={cameraZoom >= 3.5 || isAutoCentering}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Camera Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleAlignmentGuide}
            className={`p-1 rounded text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer ${
              showAlignmentGuide ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Toggle Hand Alignment Target Reticle"
          >
            <Target className="w-3 h-3" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[0.75, 1, 1.25].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSignSpeed(spd)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                signSpeed === spd
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Center Main Media Controls */}
      <div className="flex items-center space-x-3 mx-auto">
        <button
          onClick={onToggleMute}
          className={`p-3.5 rounded-2xl transition-all shadow-md cursor-pointer ${
            isMuted
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-3.5 rounded-2xl transition-all shadow-md cursor-pointer ${
            isCameraOff
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </button>

        <button
          onClick={onToggleHandRaised}
          className={`p-3.5 rounded-2xl transition-all shadow-md cursor-pointer ${
            isHandRaised
              ? "bg-amber-500 text-white hover:bg-amber-600 animate-bounce"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title="Raise Hand for Turn-Taking"
        >
          <Hand className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleRecording}
          className={`p-3.5 rounded-2xl transition-all shadow-md cursor-pointer ${
            isRecording
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200"
          }`}
          title={isRecording ? "Stop Recording" : "Record Session (WebM)"}
        >
          <Circle className="w-5 h-5" />
        </button>

        <button
          onClick={onEndCall}
          className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call & Review</span>
        </button>
      </div>

      {/* Right Side Chat Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleChat}
          className={`p-3 rounded-2xl transition-colors border cursor-pointer ${
            showChat
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
          }`}
          title="Toggle Notes & Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
