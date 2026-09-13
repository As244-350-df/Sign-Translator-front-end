import React, { useState, useEffect } from "react";
import {
  Cpu,
  Bot,
  Radio,
  Layers,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Activity
} from "lucide-react";
import { useSystemInitStatus } from "../hooks/useSystemInitStatus";

export const LoadingOverlay = ({ onReady, onDismiss }) => {
  const { status, progress, currentStepMessage, allReady, elapsedTime } = useSystemInitStatus();

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [forceBypassed, setForceBypassed] = useState(false);

  // When all systems are confirmed ready, hold 550ms for visual confirmation then trigger fade-out
  useEffect(() => {
    if (allReady || forceBypassed) {
      const holdTimer = setTimeout(() => {
        setIsFadingOut(true);
        if (onReady) onReady();
      }, 550);

      // Once opacity fade completes (700ms), unmount from DOM completely
      const unmountTimer = setTimeout(() => {
        setIsRemoved(true);
        if (onDismiss) onDismiss();
      }, 1300);

      return () => {
        clearTimeout(holdTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [allReady, forceBypassed, onReady, onDismiss]);

  if (isRemoved) {
    return null;
  }

  const handleManualLaunch = () => {
    setForceBypassed(true);
  };

  return (
    <div
      id="system-loading-overlay"
      aria-live="polite"
      aria-busy={!allReady}
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-2xl text-slate-100 transition-opacity duration-700 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80">
        {/* Header Branding */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  SignLink AI Runtime
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-mono text-slate-400">
                  v2.0.0
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Initializing System Engine
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <span className={`w-2 h-2 rounded-full ${allReady ? "bg-emerald-400 shadow-xs shadow-emerald-400" : "bg-amber-400 animate-ping"}`} />
            <span>{elapsedTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* Progress Bar & Status Text */}
        <div className="mb-6 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[78%]">
              {currentStepMessage}
            </span>
            <span className="font-mono text-base sm:text-lg font-bold text-white">
              {progress}%
            </span>
          </div>

          {/* Smooth Linear Progress Track */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                allReady
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Subsystem Readiness Checklist */}
        <div className="space-y-2 mb-6">
          {/* 1. Vision Web Worker */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              status.mediaPipeWorker.ready
                ? "bg-slate-800/60 border-emerald-500/30 text-slate-200"
                : "bg-slate-800/30 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  status.mediaPipeWorker.ready
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {status.mediaPipeWorker.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {status.mediaPipeWorker.detail}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {status.mediaPipeWorker.ready ? (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Connecting</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. MediaPipe Hand Landmarks Model */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              status.mediaPipeEngine.ready
                ? "bg-slate-800/60 border-emerald-500/30 text-slate-200"
                : "bg-slate-800/30 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  status.mediaPipeEngine.ready
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {status.mediaPipeEngine.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {status.mediaPipeEngine.detail}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {status.mediaPipeEngine.ready ? (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading WASM</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. AI Processing Web Worker */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              status.aiWorker.ready
                ? "bg-slate-800/60 border-emerald-500/30 text-slate-200"
                : "bg-slate-800/30 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  status.aiWorker.ready
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {status.aiWorker.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {status.aiWorker.detail}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {status.aiWorker.ready ? (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Spawning</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Gemini AI Stream SSE Connection */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              status.aiStream.ready
                ? "bg-slate-800/60 border-emerald-500/30 text-slate-200"
                : "bg-slate-800/30 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  status.aiStream.ready
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {status.aiStream.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {status.aiStream.detail}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {status.aiStream.ready ? (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Handshake</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Lexicon & Kinematics */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
              status.lexicon.ready
                ? "bg-slate-800/60 border-emerald-500/30 text-slate-200"
                : "bg-slate-800/30 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0 pr-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  status.lexicon.ready
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {status.lexicon.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {status.lexicon.detail}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {status.lexicon.ready ? (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Caching</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info and bypass option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Worker threads offload heavy inference from UI thread.</span>
          </div>

          <button
            onClick={handleManualLaunch}
            className="inline-flex items-center justify-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 py-1.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 cursor-pointer self-end sm:self-auto"
            title="Launch application immediately without waiting"
          >
            <span>Skip Wait & Launch</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
