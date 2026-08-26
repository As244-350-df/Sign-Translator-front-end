import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  ShieldCheck, 
  Video, 
  Calendar, 
  Clock, 
  Award, 
  Languages, 
  DollarSign, 
  RotateCw, 
  Sparkles, 
  Zap 
} from 'lucide-react';
import { Interpreter, SignLanguageCode, AppSettings } from '../types';
import { SIGN_LANGUAGES } from '../data/mockData';
import { api } from '../utils/api';
import { OnDemandDispatchModal } from './OnDemandDispatchModal';

interface InterpreterDirectoryViewProps {
  settings: AppSettings;
  onSelectInterpreter: (interpreter: Interpreter) => void;
  onStartCall: (interpreterId: string) => void;
  onBookAppointment: (interpreter: Interpreter) => void;
}

export const InterpreterDirectoryView: React.FC<InterpreterDirectoryViewProps> = ({
  settings,
  onSelectInterpreter,
  onStartCall,
  onBookAppointment,
}) => {
  const [interpreters, setInterpreters] = useState<Interpreter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  const specialtiesList = [
    'ALL',
    'Medical & Healthcare',
    'Legal & Courtroom',
    'Higher Education',
    'Corporate Meetings',
    'Deaf Culture Mediation',
    'Community Events'
  ];

  const fetchInterpreters = async () => {
    setLoading(true);
    try {
      const data = await api.getInterpreters({
        language: selectedLanguage,
        specialty: selectedSpecialty,
        status: onlineOnly ? 'online' : 'all',
        search: searchQuery
      });
      setInterpreters(data);
    } catch (err) {
      console.error('Error fetching interpreters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterpreters();
  }, [selectedLanguage, selectedSpecialty, onlineOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInterpreters();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Certified & Background-Checked Interpreters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Certified Sign Language Interpreters
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Connect instantly with verified ASL, BSL, Auslan, and International Sign interpreters for medical appointments, legal consultations, or live meetings.
          </p>
        </div>

        {/* Instant On-Demand Dispatch Button */}
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" />
            <span>Instant On-Demand Match</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by interpreter name, specialty (e.g. Medical, Legal), or bio..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Sign Languages</option>
            {SIGN_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.code} - {l.name.split(' ')[0]}</option>
            ))}
          </select>

          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {specialtiesList.map(spec => (
              <option key={spec} value={spec}>{spec === 'ALL' ? 'All Specialties' : spec}</option>
            ))}
          </select>

          {/* Online Toggle */}
          <button
            type="button"
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              onlineOnly
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${onlineOnly ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Available Now</span>
          </button>

          <button
            type="button"
            onClick={fetchInterpreters}
            title="Refresh Directory"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </form>

      {/* Interpreters List Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading verified interpreters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interpreters.map((interpreter) => {
            const isOnline = interpreter.availableStatus === 'online';

            return (
              <div
                key={interpreter.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Card Header & Avatar */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="relative">
                        <img
                          src={interpreter.avatar}
                          alt={interpreter.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {interpreter.name}
                          </h3>
                          {interpreter.verified && (
                            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {interpreter.title}
                        </p>
                        
                        {/* Rating & Reviews */}
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1">
                              {interpreter.rating}
                            </span>
                          </div>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {interpreter.reviewsCount} reviews
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Languages Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {interpreter.languages.map(lang => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold"
                      >
                        {lang}
                      </span>
                    ))}
                    {interpreter.spokenLanguages.map(spk => (
                      <span
                        key={spk}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px]"
                      >
                        {spk}
                      </span>
                    ))}
                  </div>

                  {/* Bio Snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {interpreter.bio}
                  </p>

                  {/* Specialties Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {interpreter.specialties.slice(0, 2).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Rates & Actions */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      ${interpreter.ratePerHour}
                    </span>
                    <span className="text-[10px] text-slate-400">/hr (${interpreter.ratePerMinute}/min)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectInterpreter(interpreter)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Details
                    </button>

                    {isOnline ? (
                      <button
                        onClick={() => onStartCall(interpreter.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onBookAppointment(interpreter)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* On-Demand Dispatch Cascade Modal */}
      <OnDemandDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onConnectCall={onStartCall}
        settings={settings}
      />

    </div>
  );
};
