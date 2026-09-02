import { HandMetal, Plus, BookOpen, Hand, Volume2, MessageSquare } from "lucide-react";
import { FreeFingerController } from "../FreeFingerController";

export const LiveSessionSignDeckDrawer = ({
  showSignDeck,
  onClose,
  deckTab,
  onSetDeckTab,
  onOpenAddSignModal,
  autoSpeakSigns,
  onToggleAutoSpeakSigns,
  autoChatSigns,
  onToggleAutoChatSigns,
  selectedCategory,
  onSelectCategory,
  filteredSigns,
  dictionaryList,
  activeSignMeaning,
  onTestSign,
  freeFingerPose,
  onPoseChange,
  handTracker,
  recognizedSignLogs
}) => {
  if (!showSignDeck) return null;

  return (
    <div className="absolute left-0 top-0 bottom-24 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <HandMetal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm text-white">In-Call Hands & Sign Deck</span>
        </div>
        <div className="flex items-center space-x-1">
          {deckTab === "signs" && (
            <button
              onClick={onOpenAddSignModal}
              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white flex items-center space-x-1 cursor-pointer"
              title="Train or add a new custom sign"
            >
              <Plus className="w-3 h-3" />
              <span>Add Sign</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Deck Navigation Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl my-2 border border-slate-800 text-xs">
        <button
          onClick={() => onSetDeckTab("signs")}
          className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            deckTab === "signs" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Signs ({dictionaryList.length})</span>
        </button>
        <button
          onClick={() => onSetDeckTab("free_fingers")}
          className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            deckTab === "free_fingers" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Free Fingers</span>
        </button>
      </div>

      {deckTab === "signs" ? (
        <>
          {/* Options */}
          <div className="py-2 border-b border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center space-x-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Speak Signs to Call</span>
              </span>
              <input
                type="checkbox"
                checked={autoSpeakSigns}
                onChange={(e) => onToggleAutoSpeakSigns(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Send Signs to Chat</span>
              </span>
              <input
                type="checkbox"
                checked={autoChatSigns}
                onChange={(e) => onToggleAutoChatSigns(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-2 border-b border-slate-800 text-[10px] font-bold scrollbar-none">
            {["all", "custom", "greetings", "emergency", "common", "actions", "numbers", "alphabet"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Signs List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 text-xs">
            {filteredSigns.map((sign) => {
              const isActive = activeSignMeaning?.signName === sign.signName;
              return (
                <div
                  key={sign.key}
                  onClick={() => onTestSign(sign.key)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500"
                      : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{sign.symbol}</span>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                        <span>{sign.signName}</span>
                        {sign.isCustom && (
                          <span className="px-1 py-0.2 rounded bg-purple-900 text-purple-300 text-[9px]">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        &quot;{sign.translatedText}&quot;
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestSign(sign.key);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-indigo-600 text-[10px] font-bold text-slate-200 cursor-pointer"
                  >
                    {isActive ? "Active" : "Test"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto py-2">
          <FreeFingerController
            handTracker={handTracker}
            currentPose={freeFingerPose}
            onPoseChange={onPoseChange}
          />
        </div>
      )}

      {/* History Log */}
      <div className="pt-2 border-t border-slate-800 text-[11px]">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="font-bold text-slate-300">
            Signed This Session ({recognizedSignLogs.length})
          </span>
          <span className="text-[10px]">Real-time feed</span>
        </div>
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {recognizedSignLogs.slice(-5).map((log, i) => (
            <div
              key={i}
              className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap flex items-center space-x-1"
            >
              <span>{log.symbol}</span>
              <span className="font-bold">{log.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
