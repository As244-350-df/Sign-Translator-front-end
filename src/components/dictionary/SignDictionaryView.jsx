import { useState, useMemo, useEffect } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Bookmark,
  Volume2,
  Camera,
  Play,
  RotateCcw,
  Layers,
  LayoutGrid,
  Columns2,
  Filter,
  X,
  ChevronRight,
  HandMetal,
  CheckCircle2,
  Compass,
  Info
} from "lucide-react";
import {
  DICTIONARY_SIGNS,
  SIGN_CATEGORIES,
  HANDSHAPES_LIST,
  searchSigns
} from "../../data/dictionaryData";
import { SignIllustrationPlayer } from "./SignIllustrationPlayer";
import { SignDetailModal } from "./SignDetailModal";
import { speakText } from "../../utils/speech";
import { useFirebase } from "../../context/FirebaseContext";

const POPULAR_SEARCH_TAGS = [
  "Hello",
  "Thank You",
  "Help",
  "Emergency",
  "Doctor",
  "Water",
  "Alphabet",
  "Numbers",
  "Family"
];

const ALPHABET_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const SignDictionaryView = ({
  settings,
  onNavigateToTranslate,
  onOpenTutorial
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedHandshape, setSelectedHandshape] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [twoHandedFilter, setTwoHandedFilter] = useState("all"); // "all", "two", "one"
  const [viewLayout, setViewLayout] = useState("split"); // "split" or "grid"
  const { bookmarks: firebaseBookmarks, toggleBookmark: toggleFirebaseBookmark, isAuthenticated } = useFirebase();
  const [selectedSign, setSelectedSign] = useState(DICTIONARY_SIGNS[0]);
  const [detailModalSign, setDetailModalSign] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("signlink_favorite_signs");
      return saved ? JSON.parse(saved) : ["sign-hello", "sign-thankyou", "sign-help"];
    } catch {
      return ["sign-hello", "sign-thankyou", "sign-help"];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeLetterFilter, setActiveLetterFilter] = useState(null);

  // Synchronize with Firebase bookmarks when authenticated
  useEffect(() => {
    if (isAuthenticated && firebaseBookmarks && firebaseBookmarks.length > 0) {
      const ids = firebaseBookmarks.map(b => b.id || b.signId);
      setBookmarkedIds(ids);
    }
  }, [isAuthenticated, firebaseBookmarks]);

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "signlink_favorite_signs",
        JSON.stringify(bookmarkedIds)
      );
    } catch (e) {
      console.warn("Could not persist favorites to localStorage", e);
    }
  }, [bookmarkedIds]);

  const toggleBookmark = (signId) => {
    const targetSign = DICTIONARY_SIGNS.find(s => s.id === signId) || { id: signId, name: signId };
    if (isAuthenticated) {
      toggleFirebaseBookmark(targetSign);
    }
    setBookmarkedIds((prev) =>
      prev.includes(signId)
        ? prev.filter((id) => id !== signId)
        : [...prev, signId]
    );
  };

  // Filter signs based on criteria
  const filteredSigns = useMemo(() => {
    let list = searchSigns({
      query: searchQuery,
      category: selectedCategory,
      handshape: selectedHandshape,
      difficulty: selectedDifficulty,
      twoHandedOnly:
        twoHandedFilter === "two"
          ? true
          : twoHandedFilter === "one"
          ? false
          : null
    });

    if (showFavoritesOnly) {
      list = list.filter((s) => bookmarkedIds.includes(s.id));
    }

    if (activeLetterFilter) {
      list = list.filter((s) =>
        s.name.toUpperCase().startsWith(activeLetterFilter)
      );
    }

    return list;
  }, [
    searchQuery,
    selectedCategory,
    selectedHandshape,
    selectedDifficulty,
    twoHandedFilter,
    showFavoritesOnly,
    activeLetterFilter,
    bookmarkedIds
  ]);

  // Handle Practice in Camera
  const handlePracticeSign = (sign) => {
    if (onNavigateToTranslate) {
      onNavigateToTranslate(sign);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedHandshape("all");
    setSelectedDifficulty("all");
    setTwoHandedFilter("all");
    setShowFavoritesOnly(false);
    setActiveLetterFilter(null);
  };

  const isFilteringActive =
    searchQuery !== "" ||
    selectedCategory !== "all" ||
    selectedHandshape !== "all" ||
    selectedDifficulty !== "all" ||
    twoHandedFilter !== "all" ||
    showFavoritesOnly ||
    activeLetterFilter !== null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Visual Dictionary & Kinematic Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Sign Language Dictionary
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Search vocabulary, manual alphabet, and emergency phrases. Study animated kinematic hand clips, anatomical joint flexions, and 5-parameter linguistic breakdowns.
          </p>
        </div>

        {/* Action pills on header */}
        <div className="relative z-10 mt-5 sm:mt-0 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${
              showFavoritesOnly
                ? "bg-amber-500 text-slate-950 shadow-amber-500/25"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showFavoritesOnly ? "fill-slate-950" : ""}`} />
            <span>My Bookmarks ({bookmarkedIds.length})</span>
          </button>

          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive 5-Param Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
        {/* Search Bar Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign dictionary (e.g. Hello, Doctor, Help, Water, A-Z)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Handshape Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={selectedHandshape}
              onChange={(e) => setSelectedHandshape(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {HANDSHAPES_LIST.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.label}
                </option>
              ))}
            </select>

            {/* Layout Toggle (Split Studio vs Grid) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewLayout("split")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === "split"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="Split Studio View (Player + List)"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === "grid"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="Bento Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Popular Tags Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1">
            Quick Suggestions:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {SIGN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Alphabet Quick Scroller Ribbon */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-1 pb-0.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">
            Letter:
          </span>
          <button
            onClick={() => setActiveLetterFilter(null)}
            className={`w-6 h-6 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
              activeLetterFilter === null
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            All
          </button>
          {ALPHABET_LETTERS.map((letter) => (
            <button
              key={letter}
              onClick={() =>
                setActiveLetterFilter(
                  activeLetterFilter === letter ? null : letter
                )
              }
              className={`w-6 h-6 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                activeLetterFilter === letter
                  ? "bg-indigo-600 text-white font-black"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header & Active Filter Badges */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Dictionary Results ({filteredSigns.length} Signs Found)
          </span>
          {isFilteringActive && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          {settings?.primarySignLanguage || "ASL"} Dialect • Click sign to inspect kinematic motion
        </span>
      </div>

      {/* =========================================================================
          VIEW LAYOUT 1: SPLIT STUDIO VIEW (Player on right, Searchable list on left)
          ========================================================================= */}
      {viewLayout === "split" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sign List / Selector */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredSigns.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  No signs matched your search
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try searching with simpler terms or clear your active filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSigns.map((s) => {
                const isSelected = selectedSign?.id === s.id;
                const isBookmarked = bookmarkedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSign(s)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-400"
                            : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        <HandMetal className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {s.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {s.gloss}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                          <span className="uppercase font-bold text-indigo-600 dark:text-indigo-400">
                            {s.category}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {s.difficulty}
                          </span>
                          {s.isTwoHanded && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                2-Handed
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(s.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isBookmarked
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        }`}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark sign"}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(s.name);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Speak pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Active Interactive Player & Detail Panel */}
          <div className="lg:col-span-7 sticky top-20 space-y-4">
            {selectedSign && (
              <>
                <SignIllustrationPlayer
                  sign={selectedSign}
                  onPracticeInCamera={handlePracticeSign}
                  primarySignLanguage={settings?.primarySignLanguage || "ASL"}
                />

                {/* In-depth 5 Parameters Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                      <Compass className="w-4 h-4" />
                      <span>5-Parameter Linguistic Breakdown</span>
                    </h3>
                    <button
                      onClick={() => setDetailModalSign(selectedSign)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Expand Full View &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Handshape
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSign.handshape}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Palm Orientation
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSign.orientation}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Location / Space
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSign.location}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Movement Trajectory
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedSign.movement}
                      </p>
                    </div>
                  </div>

                  {/* Description & Pro Tip */}
                  <div className="pt-1 text-xs space-y-1.5">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedSign.description}
                    </p>
                    {selectedSign.tips && (
                      <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                        <span className="font-bold">Pro Tip: </span>
                        {selectedSign.tips}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW LAYOUT 2: BENTO CARDS GRID VIEW (Rich thumbnail cards)
          ========================================================================= */}
      {viewLayout === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSigns.map((s) => {
            const isBookmarked = bookmarkedIds.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => setDetailModalSign(s)}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-lg transition-all hover:border-indigo-400 dark:hover:border-indigo-500 group flex flex-col justify-between cursor-pointer"
              >
                {/* Visual Thumbnail Representation */}
                <div className="relative aspect-video bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <HandMetal className="w-7 h-7" />
                  </div>

                  {/* Animated Play icon hover overlay */}
                  <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>

                  {/* Badges on card thumbnail */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 text-cyan-300 border border-slate-700/80 backdrop-blur-xs">
                    {s.gloss}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(s.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-amber-400 border border-slate-700/80 backdrop-blur-xs transition-colors"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {s.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {s.description}
                    </p>
                  </div>

                  {/* Footer of Card */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.handshapeCode}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(s.name);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Pronounce"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-depth Sign Detail Modal Popup */}
      <SignDetailModal
        sign={detailModalSign}
        isOpen={detailModalSign !== null}
        onClose={() => setDetailModalSign(null)}
        isBookmarked={
          detailModalSign ? bookmarkedIds.includes(detailModalSign.id) : false
        }
        onToggleBookmark={toggleBookmark}
        onPracticeInCamera={handlePracticeSign}
        primarySignLanguage={settings?.primarySignLanguage || "ASL"}
      />
    </div>
  );
};
