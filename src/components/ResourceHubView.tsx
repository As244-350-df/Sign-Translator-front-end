import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Play, 
  ThumbsUp, 
  Eye, 
  Award, 
  Sparkles, 
  HandMetal, 
  Heart, 
  Share2, 
  ChevronRight, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { ResourceItem, SignGestureItem, AppSettings } from '../types';
import { MOCK_RESOURCES, COMMON_SIGNS, SIGN_ALPHABET, SIGN_LANGUAGES } from '../data/mockData';
import { speakText } from '../utils/speech';

interface ResourceHubViewProps {
  settings: AppSettings;
  onOpenTutorial: () => void;
}

export const ResourceHubView: React.FC<ResourceHubViewProps> = ({
  settings,
  onOpenTutorial,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dictionary' | 'tutorials' | 'fingerspelling' | 'grammar'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [activeDictionarySign, setActiveDictionarySign] = useState<SignGestureItem | null>(null);

  const filteredResources = MOCK_RESOURCES.filter((res) => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.signsCovered.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
    const matchesLevel = selectedLevel === 'ALL' || res.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const allSignsList = [...COMMON_SIGNS, ...SIGN_ALPHABET];
  const filteredSigns = allSignsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>SignLink Educational Academy & Resource Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Sign Language Dictionary & Video Tutorials
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Expand your vocabulary with fingerspelling drills, essential medical & emergency signs, grammar deep-dives, and 3D spatial tutorials.
          </p>
        </div>

        <button
          onClick={onOpenTutorial}
          className="relative z-10 mt-5 sm:mt-0 px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch 5-Parameter Interactive Guide</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dictionary vocabulary, topics (e.g. Doctor, Emergency, Alphabet), or signs..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full md:w-auto overflow-x-auto">
            {(['all', 'dictionary', 'tutorials', 'fingerspelling', 'grammar'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Quick Searchable Dictionary Carousel / Grid */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HandMetal className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Instant {settings.primarySignLanguage} Sign Dictionary ({filteredSigns.length} Signs)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Click any sign to preview motion</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredSigns.slice(0, 12).map((sign) => (
            <button
              key={sign.id}
              onClick={() => {
                setActiveDictionarySign(sign);
                speakText(sign.name);
              }}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-left transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                  {sign.name}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                  {sign.description}
                </p>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 block">
                {sign.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Masterclasses & Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Curated Video Lessons & Masterclasses</span>
          </h2>
          <span className="text-xs text-slate-400">{filteredResources.length} lessons available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Thumbnail with Play Overlay */}
              <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
                <img
                  src={res.thumbnail}
                  alt={res.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white backdrop-blur-xs">
                  {res.duration}
                </span>

                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600 text-[10px] font-bold uppercase text-white shadow-xs">
                  {res.level}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {res.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {res.signsCovered.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{res.views.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{res.likes.toLocaleString()}</span>
                    </span>
                  </div>

                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs group-hover:underline">
                    Watch Lesson →
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Dictionary Detail Modal popup if active */}
      {activeDictionarySign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveDictionarySign(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-500 flex items-center justify-center text-3xl font-black text-indigo-600 dark:text-indigo-400 shadow-lg mb-2">
                {activeDictionarySign.name}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                "{activeDictionarySign.name}" ({settings.primarySignLanguage})
              </h2>
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Category: {activeDictionarySign.category}
              </span>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700">
              <div>
                <strong className="text-slate-500 block mb-0.5">Handshape:</strong>
                <p className="text-slate-800 dark:text-slate-200 font-semibold">{activeDictionarySign.handshape}</p>
              </div>
              <div>
                <strong className="text-slate-500 block mb-0.5">Motion / Trajectory:</strong>
                <p className="text-slate-800 dark:text-slate-200 font-semibold">{activeDictionarySign.movement}</p>
              </div>
              <div>
                <strong className="text-slate-500 block mb-0.5">How to Sign:</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{activeDictionarySign.description}</p>
              </div>
            </div>

            <button
              onClick={() => speakText(activeDictionarySign.name)}
              className="w-full mt-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pronounce Vocal Audio</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
