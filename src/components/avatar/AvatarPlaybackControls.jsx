import { Play, Pause, FastForward, RotateCcw } from "lucide-react";

export const AvatarPlaybackControls = ({
  parsedWords,
  wordIndex,
  totalWords,
  onSelectWordIndex,
  isPlaying,
  onTogglePlay,
  onPrevWord,
  onNextWord,
  playbackSpeed,
  onChangeSpeed
}) => {
  return (
    <div className="bg-slate-950/95 border-t border-slate-800 p-3 sm:px-4 flex flex-col space-y-2 z-20">
      {/* Scrubbable Sentence Token Strip */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {parsedWords.map((word, idx) => (
          <button
            key={idx}
            onClick={() => onSelectWordIndex(idx)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              wordIndex === idx
                ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md scale-105"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>{word}</span>
          </button>
        ))}
      </div>

      {/* Transport Controls (Play, Step, Speed, Audio) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center"
            title={isPlaying ? "Pause Avatar Signing" : "Play Avatar Signing"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={onPrevWord}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Previous Sign Gesture"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onNextWord}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Next Sign Gesture"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-medium text-slate-400 pl-2">
            Word <strong className="text-white">{wordIndex + 1}</strong> of {Math.max(1, totalWords)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Speed:</span>
          {[0.5, 0.75, 1, 1.5].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                playbackSpeed === spd
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
