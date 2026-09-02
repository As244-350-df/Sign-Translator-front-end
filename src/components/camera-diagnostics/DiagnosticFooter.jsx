import { RefreshCw, RotateCcw, Layers } from "lucide-react";

export const DiagnosticFooter = ({
  onRetryCamera,
  handleSwitchFacing,
  facingMode,
  onToggleWebcamMode,
  useRealWebcam,
  onClose
}) => {
  return (
    <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <button
          onClick={onRetryCamera}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restart Camera Hardware</span>
        </button>

        <button
          onClick={handleSwitchFacing}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
          title="Flip between Front and Back Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Flip ({facingMode === "user" ? "Front" : "Back"})</span>
        </button>

        <button
          onClick={onToggleWebcamMode}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{useRealWebcam ? "Switch to AI Simulator" : "Switch to Webcam"}</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
      >
        Done
      </button>
    </div>
  );
};
