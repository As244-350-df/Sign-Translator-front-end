import { Mic } from "lucide-react";

export const TextToSignInputPanel = ({
  textInput,
  onChangeTextInput,
  isListeningMic,
  onToggleMic,
  parsedWords,
  animatingGestureIndex,
  onSelectWordIndex
}) => {
  const presetPhrases = [
    "Hello my friend",
    "Thank you so much",
    "I need help please",
    "Where is doctor",
    "I love you"
  ];

  return (
    <div className="lg:col-span-5 space-y-4">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Enter Text or Speak to Translate</span>
          </label>
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isListeningMic
                ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/25"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isListeningMic ? "Listening..." : "Voice Input"}</span>
          </button>
        </div>

        <textarea
          value={textInput}
          onChange={(e) => onChangeTextInput(e.target.value)}
          rows={4}
          className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Type or speak a message (e.g. 'Hello, where is the doctor? Thank you')..."
        />

        {/* Quick Preset Phrases */}
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Quick Sign Phrases
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetPhrases.map((phrase) => (
              <button
                key={phrase}
                onClick={() => onChangeTextInput(phrase)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word Breakdown Chips */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-3">
          Sign Sequence Tokens ({parsedWords.length})
        </span>
        <div className="flex flex-wrap gap-2">
          {parsedWords.map((word, idx) => (
            <button
              key={idx}
              onClick={() => onSelectWordIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                animatingGestureIndex === idx
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <span>{word}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
