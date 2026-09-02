import { BookOpen, Plus, Trash2 } from "lucide-react";

export const SignDictionaryPanel = ({
  dictionaryList,
  filteredDictionary,
  selectedSignCategory,
  onSelectCategory,
  selectedTestSignKey,
  onTestSign,
  onOpenAddSignModal,
  onDeleteCustomSign
}) => {
  const categories = ["all", "custom", "greetings", "common", "emergency", "actions", "numbers", "alphabet"];

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Sign Language Symbols & Recognition Dictionary ({dictionaryList.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={onOpenAddSignModal}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Sign</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                selectedSignCategory === cat
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Hold any of these signs in front of your camera or click to simulate and translate the symbol into text!
      </p>

      {/* Grid of Signs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
        {filteredDictionary.map((item) => {
          const isActive = selectedTestSignKey === item.key;
          return (
            <div
              key={item.key}
              onClick={() => onTestSign(item.key)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl">{item.symbol}</span>
                <div className="flex items-center space-x-1">
                  {item.isCustom && (
                    <button
                      onClick={(e) => onDeleteCustomSign(e, item.key)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                      title="Delete custom sign"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.translatedText}
                  </p>
                  {item.isCustom && (
                    <span className="text-[9px] px-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded font-bold">
                      User
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{item.signName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
