import { Volume2, Copy, Check, RotateCcw } from "lucide-react";

export const LiveTranscriptBox = ({
  fullSentence,
  onChangeFullSentence,
  onClearFullSentence,
  onSpeakTranscript,
  onCopyTranscript,
  copied,
  highContrastCaptions,
  recognizedSigns
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col space-y-4">
      {/* Live Generated Sentence Box */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Live Translated Sentence
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onSpeakTranscript}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Vocalize sentence (Text-to-Speech)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onCopyTranscript}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Editable/Interactive Transcript Box */}
        <textarea
          value={fullSentence}
          onChange={(e) => onChangeFullSentence(e.target.value)}
          className={`w-full flex-1 min-h-[140px] p-4 rounded-2xl resize-none text-base leading-relaxed font-medium transition-all ${
            highContrastCaptions
              ? "bg-black text-amber-300 font-mono border-2 border-amber-400"
              : "bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          }`}
          placeholder="Translated sign language will assemble here automatically as you sign in front of the camera..."
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={onClearFullSentence}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Text</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onSpeakTranscript}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Speak Audio (TTS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gesture Stream Feed Log */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Recognized Signs Feed Tape
          </span>
          <span className="text-[11px] text-slate-400">
            {recognizedSigns.length} symbols captured
          </span>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
          {recognizedSigns
            .slice()
            .reverse()
            .map((sign, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                    ASL
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {sign.text}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <span className="text-[10px]">{sign.timestamp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    {Math.round(sign.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
