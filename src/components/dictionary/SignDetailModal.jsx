import { useState } from "react";
import {
  X,
  Volume2,
  Bookmark,
  Share2,
  Check,
  Camera,
  Layers,
  Sparkles,
  Compass,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { SignIllustrationPlayer } from "./SignIllustrationPlayer";
import { speakText } from "../../utils/speech";

export const SignDetailModal = ({
  sign,
  isOpen,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  onPracticeInCamera,
  primarySignLanguage = "ASL"
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !sign) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}?sign=${encodeURIComponent(sign.name)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePronounce = () => {
    speakText(sign.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {sign.name}
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  {sign.gloss}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  {primarySignLanguage}
                </span>
                {sign.isTwoHanded && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    Two-Handed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 capitalize">
                Category: <span className="text-slate-200 font-medium">{sign.category}</span> • Level: <span className="text-slate-200 font-medium">{sign.difficulty}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleBookmark?.(sign.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-700"
              }`}
              title={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
              title="Copy sign reference link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Visual Player */}
          <SignIllustrationPlayer
            sign={sign}
            onPracticeInCamera={(s) => {
              onPracticeInCamera?.(s);
              onClose();
            }}
            primarySignLanguage={primarySignLanguage}
          />

          {/* 5 ASL Parameters Grid */}
          <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                <Compass className="w-4 h-4" />
                <span>The 5 Core Parameters of this Sign</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Linguistic Anatomy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Parameter 1: Handshape */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  1. Handshape
                </span>
                <p className="text-xs font-semibold text-white">
                  {sign.handshape}
                </p>
              </div>

              {/* Parameter 2: Palm Orientation */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  2. Palm Orientation
                </span>
                <p className="text-xs font-semibold text-white">
                  {sign.orientation}
                </p>
              </div>

              {/* Parameter 3: Location */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  3. Location / Space
                </span>
                <p className="text-xs font-semibold text-white">
                  {sign.location}
                </p>
              </div>

              {/* Parameter 4: Movement */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  4. Movement Trajectory
                </span>
                <p className="text-xs font-semibold text-white">
                  {sign.movement}
                </p>
              </div>

              {/* Parameter 5: Non-manual Signals */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  5. Non-Manual Signals / Facial Grammar
                </span>
                <p className="text-xs font-semibold text-indigo-300">
                  {sign.nonManualSignals || "Neutral head posture and welcoming eye contact"}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Instructional Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step-by-step How-To */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                How to Perform This Sign
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {sign.description}
              </p>
            </div>

            {/* Mnemonic & Pro Tips */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Pro Tip & Common Traps
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {sign.tips || "Maintain relaxed shoulder posture and ensure palm orientation is clear to observer."}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center space-x-1.5 flex-wrap pt-2">
            <span className="text-xs text-slate-500 font-semibold mr-1">Tags:</span>
            {sign.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 px-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePronounce}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Pronounce Spoken Word</span>
            </button>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>

            {onPracticeInCamera && (
              <button
                onClick={() => {
                  onPracticeInCamera(sign);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Practice Live with AI Camera</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
