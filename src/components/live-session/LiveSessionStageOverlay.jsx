import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { LiveSessionOverlayHUD } from "../LiveSessionOverlayHUD";

export const LiveSessionStageOverlay = ({
  lastCommittedBanner,
  onDismissBanner,
  signSpeed,
  handTracker,
  onCommitSign,
  onOpenSignDeck,
  captionSpeaking,
  onSpeakCurrentCaption,
  currentCaption,
  fontSize
}) => {
  return (
    <>
      {/* Committed Sign Live Notification Banner */}
      {lastCommittedBanner && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/80 shadow-2xl text-emerald-200 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="text-2xl animate-bounce">{lastCommittedBanner.symbol}</span>
          <div className="text-left">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              ✨ Recognized Hand Sign
            </div>
            <div className="text-sm font-bold text-white">&quot;{lastCommittedBanner.text}&quot;</div>
          </div>
          <button
            onClick={onDismissBanner}
            className="text-xs text-emerald-400 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {signSpeed !== 1 && (
        <div className="absolute top-20 right-6 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-indigo-400">
          ⚡ Sign Speed: {signSpeed}x
        </div>
      )}

      {/* Real-Time Live Sign Recognition HUD & Captions Overlay */}
      <div className="absolute bottom-28 inset-x-4 sm:inset-x-12 z-10 flex flex-col items-center space-y-2 pointer-events-auto">
        <LiveSessionOverlayHUD
          tracker={handTracker}
          onCommitSign={onCommitSign}
          onOpenSignDeck={onOpenSignDeck}
        />

        <div className="w-full max-w-3xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-center relative group">
          <div className="flex items-center justify-between mb-1.5 text-xs text-indigo-400 font-bold">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Interpretation Stream (Speech & Sign)</span>
            </span>
            <button
              onClick={onSpeakCurrentCaption}
              className={`p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ${
                captionSpeaking ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-900"
              }`}
              title="Speak caption aloud"
            >
              {captionSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <p
            className={`font-semibold tracking-wide text-slate-100 ${
              fontSize === "extra-large"
                ? "text-xl"
                : fontSize === "large"
                ? "text-lg"
                : "text-sm sm:text-base"
            }`}
          >
            {currentCaption}
          </p>
        </div>
      </div>
    </>
  );
};
