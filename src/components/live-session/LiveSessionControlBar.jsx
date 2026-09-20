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
  MessageSquare,
  Sparkles,
  Loader2
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
  onToggleChat,
  geminiAiActive = true,
  onToggleGeminiAi = null,
  isGeminiTranslating = false,
  autoChatSigns = true,
  onToggleAutoChat = null,
  unreadChatCount = 0
}) => {
  return (
    <div className="px-2 sm:px-4 py-2 sm:py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 sm:gap-3 overflow-x-auto no-scrollbar shrink-0 z-30">
      {/* Left Action Toggles */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <button
          onClick={onToggleSignDeck}
          className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer shrink-0 ${
            showSignDeck
              ? "bg-emerald-600 border-emerald-500 text-white shadow-xs"
              : "bg-slate-900 border-slate-800 text-emerald-400 hover:text-white hover:bg-slate-800"
          }`}
          title="Toggle Live Hand Signs Recognition Deck"
        >
          <HandMetal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="font-bold">Sign Deck</span>
        </button>

        <button
          onClick={onToggleLandmarkOverlay}
          className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0 ${
            showLandmarkOverlay
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
          title="Toggle 21-point AI Hand Skeleton"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Skeleton</span>
        </button>

        {onToggleGeminiAi && (
          <button
            onClick={onToggleGeminiAi}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer shrink-0 ${
              geminiAiActive
                ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                : "bg-slate-900 border-slate-800 text-indigo-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Toggle Live Gemini AI Landmark Translation"
          >
            {isGeminiTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Gemini AI</span>
          </button>
        )}

        {/* Camera Zoom & Alignment */}
        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={onToggleAutoCenter}
            className={`p-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
              isAutoCentering ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
            title="Toggle Real-Time Hand Auto-Centering"
          >
            <Crosshair className="w-3 h-3" />
            <span className="hidden md:inline">Auto</span>
          </button>
          <button
            onClick={onZoomOut}
            disabled={cameraZoom <= 1 || isAutoCentering}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Camera Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-indigo-400 font-bold px-0.5 sm:px-1">
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
        <div className="hidden lg:flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
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

      {/* Center Main Media Controls: Mute, Camera Toggle, Disconnect */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Mute / Unmute Microphone Button */}
        <button
          onClick={onToggleMute}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
            isMuted
              ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 shadow-rose-900/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-100"
          }`}
          title={isMuted ? "Unmute Microphone (M)" : "Mute Microphone (M)"}
        >
          {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-white" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          <span className="text-xs font-bold hidden md:inline">{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center space-x-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
            isCameraOff
              ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 shadow-rose-900/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-100"
          }`}
          title={isCameraOff ? "Turn Camera On (C)" : "Turn Camera Off (C)"}
        >
          {isCameraOff ? <CameraOff className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-white" /> : <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />}
          <span className="text-xs font-bold hidden md:inline">{isCameraOff ? "Camera On" : "Camera Off"}</span>
        </button>

        {/* Hand Raise Toggle */}
        <button
          onClick={onToggleHandRaised}
          className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
            isHandRaised
              ? "bg-amber-500 text-white hover:bg-amber-600 animate-bounce"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
          title="Raise Hand for Turn-Taking"
        >
          <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Session Recording Toggle */}
        <button
          onClick={onToggleRecording}
          className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md cursor-pointer active:scale-95 shrink-0 ${
            isRecording
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
          title={isRecording ? "Stop Recording" : "Record Session (WebM)"}
        >
          <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Disconnect Button */}
        <button
          onClick={onEndCall}
          className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 sm:space-x-2 shadow-lg shadow-rose-600/40 transition-all active:scale-95 cursor-pointer ring-1 ring-rose-500 shrink-0"
          title="Disconnect from session (Esc)"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Disconnect</span>
        </button>
      </div>

      {/* Right Side Text / Chat Toggle & Socket Translation */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {onToggleAutoChat && (
          <button
            onClick={onToggleAutoChat}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 border cursor-pointer shrink-0 ${
              autoChatSigns
                ? "bg-emerald-600/90 border-emerald-500 text-white shadow-xs"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Toggle broadcasting recognized signs and translated messages over socket to other user"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Socket Translate</span>
          </button>
        )}

        <button
          onClick={onToggleChat}
          className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center space-x-1.5 sm:space-x-2 border cursor-pointer relative shrink-0 ${
            showChat
              ? "bg-indigo-600 border-indigo-500 text-white shadow-xs ring-2 ring-indigo-400/40"
              : "bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800"
          }`}
          title="Toggle In-Call Live Text Transcript & Chat"
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Text</span>
          {unreadChatCount > 0 && !showChat && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};
