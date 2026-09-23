import { useState } from "react";
import {
  User,
  Headphones,
  Circle,
  ShieldCheck,
  Clock,
  Activity,
  PhoneOff,
  Columns,
  Maximize2,
  MessageSquare,
  Copy,
  Radio,
  Sparkles,
  CheckCircle2,
  BellRing
} from "lucide-react";

export const LiveSessionHeader = ({
  perspective = "client",
  isInterpreterView = false,
  onChangePerspective,
  isRecording = false,
  recordedDuration = 0,
  currentTotalCost = 0,
  interpreter,
  callDuration = 0,
  showDiagnostics = false,
  onToggleDiagnostics,
  onDisconnect,
  layoutMode = "pip",
  onToggleLayoutMode = null,
  roomId = "room-4927",
  onCopyRoomLink = null,
  onRingInterpreters = null,
  showChat = false,
  onToggleChat = null,
  autoChatSigns = true,
  onToggleAutoChat = null
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [ringSent, setRingSent] = useState(false);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white z-30 flex-wrap gap-2">
      {/* Perspective Switcher & Layout Mode Selector */}
      <div className="flex items-center space-x-2">
        {onChangePerspective && (
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => onChangePerspective("client")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                !isInterpreterView
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Client View: Large stage displays Interpreter; your camera in PiP/split"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Client View</span>
              <span className="md:hidden">Client</span>
            </button>
            <button
              onClick={() => onChangePerspective("interpreter")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                isInterpreterView
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Interpreter View: Large stage displays Client signing; your camera in PiP/split"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Interpreter View</span>
              <span className="md:hidden">Interpreter</span>
            </button>
          </div>
        )}

        {/* Layout Mode Toggle: PiP vs Split Screen */}
        {onToggleLayoutMode && (
          <button
            onClick={onToggleLayoutMode}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
              layoutMode === "split"
                ? "bg-indigo-600/90 border-indigo-500 text-white"
                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-white"
            }`}
            title="Toggle between Picture-in-Picture and 50/50 Side-by-Side Split Screen"
          >
            {layoutMode === "split" ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">PiP Mode</span>
              </>
            ) : (
              <>
                <Columns className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Side-by-Side (50/50)</span>
              </>
            )}
          </button>
        )}

        {/* Room ID Badge & 1-Click Copy */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-white text-[11px] font-bold">{roomId}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            title="Copy Room Code / Number"
            className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1 p-0.5 flex items-center space-x-1"
          >
            {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedCode && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
          </button>
        </div>

        {/* Ring Available Interpreters to this Room */}
        {onRingInterpreters && perspective === "client" && (
          <button
            type="button"
            onClick={async () => {
              setIsRinging(true);
              try {
                await onRingInterpreters();
                setRingSent(true);
                setTimeout(() => setRingSent(false), 3000);
              } catch {}
              setIsRinging(false);
            }}
            disabled={isRinging}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              ringSent
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                : "bg-indigo-600/25 border-indigo-500/60 text-indigo-300 hover:bg-indigo-600 hover:text-white"
            }`}
            title={`Send real-time alert with room code ${roomId} to interpreters across network`}
          >
            <BellRing className="w-3.5 h-3.5 text-indigo-400" />
            <span>{ringSent ? "Alert Sent to Interpreters!" : isRinging ? "Ringing..." : "Ring Interpreters"}</span>
          </button>
        )}

        {/* Text / Chat Drawer Toggle */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showChat
                ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title="Toggle Live In-Call Text & Transcript"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Text Toggle</span>
          </button>
        )}

        {/* Socket Auto-Translate Toggle */}
        {onToggleAutoChat && (
          <button
            onClick={onToggleAutoChat}
            className={`hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
              autoChatSigns
                ? "bg-emerald-950/80 border-emerald-600 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Toggle sending translated signs automatically over socket to other user"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Socket Translate: {autoChatSigns ? "ON" : "OFF"}</span>
          </button>
        )}
      </div>

      {/* Call Metadata, Metered Billing & Recording Indicators */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Recording Badge */}
        {isRecording && (
          <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-950/90 border border-rose-700 text-xs font-mono font-bold text-rose-300 animate-pulse">
            <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
            <span>REC {formatTime(recordedDuration)}</span>
          </div>
        )}

        {/* Free Accessibility Badge */}
        <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900/80 border border-emerald-700/60 text-xs font-mono font-bold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Free Access</span>
          <span className="text-[10px] text-slate-400 font-normal">
            (Community Support)
          </span>
        </div>

        {/* Call Timer */}
        <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-slate-200">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formatTime(callDuration)}</span>
        </div>

        {/* Diagnostics Inspector Button */}
        <button
          onClick={onToggleDiagnostics}
          className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
            showDiagnostics
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800"
          }`}
          title="Toggle WebRTC SFU Telemetry"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="hidden lg:inline">SFU 60FPS</span>
        </button>

        {/* Header Disconnect Button */}
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-900/30 cursor-pointer ring-1 ring-rose-500/60"
            title="Disconnect & Leave Session"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        )}
      </div>
    </div>
  );
};
