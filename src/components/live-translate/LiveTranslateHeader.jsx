import { Plus, HandMetal, Mic } from "lucide-react";

export const LiveTranslateHeader = ({
  currentLanguage,
  totalRecognizedSigns,
  onOpenAddSignModal,
  translationMode,
  onChangeTranslationMode
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {currentLanguage.name} ({currentLanguage.code})
          </span>
          <span className="text-xs text-slate-400 font-medium">
            TensorFlow HandPose Model Active ({totalRecognizedSigns} Signs Recognized)
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
          Real-Time Sign-to-Text Translation
        </h1>
      </div>

      {/* Right Controls: Add Sign & Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onOpenAddSignModal}
          className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sign Recognition</span>
        </button>

        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-600/40">
          <button
            onClick={() => onChangeTranslationMode("sign_to_text")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              translationMode === "sign_to_text"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <HandMetal className="w-4 h-4" />
            <span>Sign → Text (Camera CV)</span>
          </button>

          <button
            onClick={() => onChangeTranslationMode("speech_to_sign")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              translationMode === "speech_to_sign"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Speech/Text → Sign (Avatar)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
