import { PhoneOff, X, AlertTriangle, Clock, User, ShieldCheck } from "lucide-react";

export const DisconnectModal = ({
  isOpen,
  onClose,
  onConfirmDisconnect,
  interpreterName = "Interpreter",
  callDuration = 0,
  currentTotalCost = 0,
  formatTime = (s) => `${s}s`
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-6 text-white animate-in zoom-in-95 duration-200">
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <PhoneOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Disconnect Session?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to leave the live interpreting session?
            </p>
          </div>
        </div>

        {/* Session Stats Brief */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 mb-6 text-xs text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Interpreter:</span>
            <span className="font-semibold text-white">{interpreterName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Session Elapsed:</span>
            <span className="font-mono font-semibold text-emerald-400">{formatTime(callDuration)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Access Fee:</span>
            <span className="font-semibold text-emerald-400">$0.00 (100% Free Accessibility)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Stay in Call
          </button>
          <button
            onClick={onConfirmDisconnect}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center space-x-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Disconnect & Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
