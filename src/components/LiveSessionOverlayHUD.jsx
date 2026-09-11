import { useState, useEffect, memo } from "react";
import { Zap, BookOpen, Sparkles, Loader2 } from "lucide-react";

/**
 * Isolated Real-Time Overlay HUD for Live Video Call Sessions.
 * Eliminates high-frequency parent re-renders by polling tracking state at 150ms.
 * Displays both kinematic hand tracker feedback and Gemini AI multimodal translations.
 */
const LiveSessionOverlayHUD = memo(({
  tracker,
  onCommitSign,
  onOpenSignDeck,
  geminiTranslation = null,
  isGeminiLoading = false,
  onTriggerGeminiTranslate = null
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

  if (!activeSign && !geminiTranslation) return null;

  const displaySign = activeSign;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-2">
      {/* Gemini AI Landmark Translation Card (when available) */}
      {geminiTranslation && (
        <div className="w-full bg-slate-950/95 backdrop-blur-md border border-indigo-500/60 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-sm truncate">
                  Gemini: &quot;{geminiTranslation.label || geminiTranslation.signName}&quot; → {geminiTranslation.englishTranslation || geminiTranslation.translation}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 font-mono text-[10px] font-bold">
                  {Math.round(((geminiTranslation.confidence ?? 0.96) * 100))}% AI CONFIDENCE
                </span>
                {geminiTranslation.grammaticalCategory && (
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 text-[10px]">
                    {geminiTranslation.grammaticalCategory}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-[11px] truncate mt-0.5">
                {geminiTranslation.handshape && <span className="text-slate-400"><strong className="text-indigo-200">Shape:</strong> {geminiTranslation.handshape} • </span>}
                {geminiTranslation.explanation && <span className="text-slate-400">{geminiTranslation.explanation}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => {
                if (onCommitSign) {
                  onCommitSign({
                    symbol: "✨",
                    signName: geminiTranslation.label || geminiTranslation.signName || "GEMINI",
                    translatedText: geminiTranslation.englishTranslation || geminiTranslation.translation || geminiTranslation.label,
                    meaning: geminiTranslation.explanation || "Gemini Live Session Landmark Translation",
                    confidence: geminiTranslation.confidence || 0.98
                  });
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center space-x-1 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Commit Gemini translation into call captions and chat"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Send AI Sign</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Kinematic Hand Tracking HUD */}
      {displaySign && (
        <div className="w-full bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative flex-shrink-0">
              <span className="text-2xl">{displaySign.symbol}</span>
              {holdProgress > 0 && holdProgress < 1 && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">
                  {Math.round(holdProgress * 100)}%
                </div>
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm truncate">{displaySign.signName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 font-mono text-[10px] font-bold">
                  {Math.round((displaySign.confidence || 0.96) * 100)}% MATCH
                </span>
                {displaySign.isCustom && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-900/60 text-purple-300 text-[10px] font-bold">
                    CUSTOM SIGN
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-[11px] truncate">
                Meaning: <span className="text-emerald-400 font-semibold">&quot;{displaySign.translatedText}&quot;</span> • {displaySign.meaning}
              </p>
            </div>
          </div>

          {/* Instant Action Buttons */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {onTriggerGeminiTranslate && (
              <button
                onClick={onTriggerGeminiTranslate}
                disabled={isGeminiLoading}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-[11px] flex items-center space-x-1 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Translate current hand landmarks with Gemini AI"
              >
                {isGeminiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Gemini AI</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => onCommitSign && onCommitSign(displaySign)}
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
      )}
    </div>
  );
});

LiveSessionOverlayHUD.displayName = "LiveSessionOverlayHUD";

export { LiveSessionOverlayHUD };
