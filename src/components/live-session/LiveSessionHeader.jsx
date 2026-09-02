import { ShieldCheck, Circle, Clock, DollarSign, Activity } from "lucide-react";

export const LiveSessionHeader = ({
  interpreter,
  primarySignLanguage,
  isRecording,
  recordedDuration = 0,
  currentTotalCost,
  callDuration,
  formatTime,
  showDiagnostics,
  onToggleDiagnostics
}) => {
  return (
    <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between">
      {/* Interpreter Info & Rate */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={interpreter.avatar}
            alt={interpreter.name}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h2 className="font-bold text-sm text-white">{interpreter.name}</h2>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">
            Live Certified Human Interpreter • {primarySignLanguage}
          </p>
        </div>
      </div>

      {/* Call Metadata, Metered Billing & Recording Indicators */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Recording Badge */}
        {isRecording && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-700 text-xs font-mono font-bold text-rose-300 animate-pulse">
            <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
            <span>REC {formatTime(recordedDuration)}</span>
          </div>
        )}

        {/* Metered Cost Ticker */}
        <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-emerald-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span>${currentTotalCost.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 font-normal">
            (${interpreter.ratePerMinute}/min)
          </span>
        </div>

        {/* Call Timer */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-slate-200">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{formatTime(callDuration)}</span>
        </div>

        {/* Diagnostics Inspector Button */}
        <button
          onClick={onToggleDiagnostics}
          className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
            showDiagnostics
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800"
          }`}
          title="Toggle WebRTC SFU Telemetry"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">SFU 60FPS</span>
        </button>
      </div>
    </div>
  );
};
