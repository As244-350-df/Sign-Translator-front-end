import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Star, 
  Camera, 
  Video, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { SessionHistoryItem, AppSettings } from '../types';
import { MOCK_SESSION_HISTORY } from '../data/mockData';

interface SessionHistoryViewProps {
  settings: AppSettings;
  onSelectSession: (session: SessionHistoryItem) => void;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  settings,
  onSelectSession,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ai_translation' | 'interpreter_call'>('all');

  const filteredHistory = MOCK_SESSION_HISTORY.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyTerms.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.interpreterName && item.interpreterName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Session History & Transcripts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              {MOCK_SESSION_HISTORY.length} Archived
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access, download, and review full conversational transcripts from your AI live translations and interpreter video calls.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts by title, key terms (e.g. Doctor, Flight, Reading), or interpreter..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('ai_translation')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'ai_translation'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            AI Vision
          </button>
          <button
            onClick={() => setTypeFilter('interpreter_call')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'interpreter_call'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Human Video
          </button>
        </div>
      </div>

      {/* History List Cards */}
      <div className="space-y-4">
        {filteredHistory.map((item) => {
          const isHumanCall = item.type === 'interpreter_call';

          return (
            <div
              key={item.id}
              onClick={() => onSelectSession(item)}
              className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                {/* Icon or Avatar */}
                {isHumanCall && item.interpreterAvatar ? (
                  <img
                    src={item.interpreterAvatar}
                    alt={item.interpreterName || 'Interpreter'}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHumanCall
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    }`}>
                      {isHumanCall ? 'Live Call' : 'AI Translation'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>Duration: {item.duration}</span>
                    <span>•</span>
                    <span>Dialect: {item.language}</span>
                    {item.rating && (
                      <>
                        <span>•</span>
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="ml-1 text-slate-700 dark:text-slate-300">{item.rating}.0</span>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>

                  {/* Key Term Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.keyTerms.map((term, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 text-[10px] font-medium border border-slate-200/60 dark:border-slate-800"
                      >
                        #{term}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right CTA */}
              <div className="flex items-center space-x-2 self-end md:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSession(item);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center space-x-1 hover:bg-indigo-100 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Transcript</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
