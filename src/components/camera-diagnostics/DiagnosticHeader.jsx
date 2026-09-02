import { Activity, X } from "lucide-react";

export const DiagnosticHeader = ({ onClose }) => {
  return (
    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white">Camera Hardware Diagnostics</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
              Live Stream Inspector
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitor for hardware permissions, resolution negotiation, and frame delivery
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="Close diagnostic overlay"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
