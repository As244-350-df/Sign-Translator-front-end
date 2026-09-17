import { useState } from "react";
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Volume2, ShieldCheck, AlertCircle } from "lucide-react";

export const LiveSessionFloatingVideoControls = ({
  isMuted,
  onToggleMute,
  isCameraOff,
  onToggleCamera,
  onDisconnect,
  perspective = "client"
}) => {
  const [showTooltip, setShowTooltip] = useState(null);

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-3 bg-slate-950/85 backdrop-blur-xl px-5 py-3 rounded-full border border-slate-700/80 shadow-2xl transition-all duration-300 hover:border-slate-500">
      {/* 1. Mute / Unmute Microphone Button */}
      <div className="relative group">
        <button
          onClick={onToggleMute}
          onMouseEnter={() => setShowTooltip("mic")}
          onMouseLeave={() => setShowTooltip(null)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
            isMuted
              ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 shadow-rose-900/40"
              : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 hover:text-white border border-slate-600/60"
          }`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-white animate-pulse" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Mute</span>
            </>
          )}
        </button>
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-900 text-[10px] text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 whitespace-nowrap shadow-lg">
          {isMuted ? "Microphone is muted (M)" : "Mute your microphone (M)"}
        </div>
      </div>

      {/* 2. Camera Toggle Button */}
      <div className="relative group">
        <button
          onClick={onToggleCamera}
          onMouseEnter={() => setShowTooltip("camera")}
          onMouseLeave={() => setShowTooltip(null)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
            isCameraOff
              ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 shadow-rose-900/40"
              : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 hover:text-white border border-slate-600/60"
          }`}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? (
            <>
              <CameraOff className="w-4 h-4 text-white animate-pulse" />
              <span>Camera On</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Camera Off</span>
            </>
          )}
        </button>
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-900 text-[10px] text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 whitespace-nowrap shadow-lg">
          {isCameraOff ? "Camera is disabled (C)" : "Turn off your camera (C)"}
        </div>
      </div>

      <div className="w-[1px] h-6 bg-slate-700/80 mx-1" />

      {/* 3. Disconnect / End Call Button */}
      <div className="relative group">
        <button
          onClick={onDisconnect}
          onMouseEnter={() => setShowTooltip("disconnect")}
          onMouseLeave={() => setShowTooltip(null)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full font-bold text-xs bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-lg shadow-rose-900/50 border border-rose-500/50 cursor-pointer"
          aria-label="Disconnect session"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-900 text-[10px] text-rose-300 px-2.5 py-1 rounded-md border border-rose-800/60 whitespace-nowrap shadow-lg">
          Leave and end session (Esc)
        </div>
      </div>
    </div>
  );
};
