import { useState, useEffect, memo } from "react";
import { Zap, BookOpen } from "lucide-react";

/**
 * Isolated Real-Time Overlay HUD for Live Video Call Sessions.
 * Eliminates high-frequency parent re-renders by polling tracking state at 150ms.
 */
const LiveSessionOverlayHUD = memo(({
  tracker,
  onCommitSign,
  onOpenSignDeck
}) => {
  const [activeSign, setActiveSign] = useState(() => tracker?.getCurrentSignMeaning?.() || null);
  const [holdProgress, setHoldProgress] = useState(0);

  useEffect(() => {
    if (!tracker) return;
    let isMounted = true;
    let lastSignKey = "";

    const interval = setInterval(() => {
      if (!isMounted) return;
      try {
        const sign = tracker.getCurrentSignMeaning?.();
        const progress = tracker.getHoldProgress?.() || 0;
        setHoldProgress(progress);

        if (sign && sign.signName !== lastSignKey) {
          lastSignKey = sign.signName;
          setActiveSign(sign);
        }
      } catch {
        // Silently continue
      }
    }, 150);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tracker]);

  if (!activeSign) return null;

  return (
    <div className="w-full max-w-3xl bg-slate-950/90 backdrop-blur-md border border-indigo-500/40 rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative flex-shrink-0">
          <span className="text-2xl">{activeSign.symbol}</span>
          {holdProgress > 0 && holdProgress < 1 && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">
              {Math.round(holdProgress * 100)}%
            </div>
          )}
        </div>
        <div className="truncate">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm truncate">{activeSign.signName}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 font-mono text-[10px] font-bold">
              {Math.round((activeSign.confidence || 0.96) * 100)}% MATCH
            </span>
            {activeSign.isCustom && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-900/60 text-purple-300 text-[10px] font-bold">
                CUSTOM SIGN
              </span>
            )}
          </div>
          <p className="text-slate-300 text-[11px] truncate">
            Meaning: <span className="text-emerald-400 font-semibold">"{activeSign.translatedText}"</span> • {activeSign.meaning}
          </p>
        </div>
      </div>

      {/* Instant Action Buttons */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        <button
          onClick={() => onCommitSign && onCommitSign(activeSign)}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center space-x-1 transition-all shadow-md active:scale-95 cursor-pointer"
          title="Commit and translate this sign now"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Send Sign</span>
        </button>
        <button
          onClick={onOpenSignDeck}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
          title="Open Sign Recognition Deck"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

export { LiveSessionOverlayHUD };
