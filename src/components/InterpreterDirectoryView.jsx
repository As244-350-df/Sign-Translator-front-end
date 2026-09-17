import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Star,
  ShieldCheck,
  Video,
  Calendar,
  RotateCw,
  Zap,
  UserCheck,
  PlusCircle,
  CheckCircle2,
  X,
  Activity,
  Users,
  User,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { SIGN_LANGUAGES } from "../data/mockData";
import { api } from "../utils/api";
import { useFirebase } from "../context/FirebaseContext";
import { OnDemandDispatchModal } from "./OnDemandDispatchModal";

const InterpreterDirectoryView = ({
  settings,
  onSelectInterpreter,
  onStartCall,
  onBookAppointment
}) => {
  const {
    interpreters: firebaseInterpreters,
    refreshInterpreters,
    publishAsInterpreter,
    updateInterpreterStatus,
    searchDatabase,
    initiateCall,
    user,
    firebaseUser
  } = useFirebase();

  const [interpreters, setInterpreters] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [searchTab, setSearchTab] = useState("all"); // 'all' | 'interpreters' | 'users'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [callingInterpreterId, setCallingInterpreterId] = useState(null);
  const [callToast, setCallToast] = useState(null);

  // Form state for becoming / updating interpreter profile
  const [regForm, setRegForm] = useState({
    title: "Certified ASL & Spoken English Interpreter",
    ratePerHour: 65,
    languages: ["ASL", "English"],
    specialties: ["Medical & Healthcare", "Corporate Meetings"],
    bio: "Certified sign language interpreter with high-speed video remote interpretation experience."
  });

  const specialtiesList = [
    "ALL",
    "Medical & Healthcare",
    "Legal & Courtroom",
    "Higher Education",
    "Corporate Meetings",
    "Deaf Culture Mediation",
    "Community Events"
  ];

  // Debounced real-time Firestore database query
  const searchTimeoutRef = useRef(null);

  const executeRealtimeSearch = async (term, lang, spec, online) => {
    setLoading(true);
    try {
      if (searchDatabase) {
        const results = await searchDatabase(term, {
          language: lang,
          specialty: spec,
          onlineOnly: online
        });
        setInterpreters(results.interpreters || []);
        setRegisteredUsers(results.users || []);
      } else {
        const data = await api.getInterpreters({
          language: lang,
          specialty: spec,
          status: online ? "online" : "all",
          search: term
        });
        setInterpreters(data);
        setRegisteredUsers([]);
      }
    } catch (err) {
      console.warn("Direct database search notice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Small debounce (150ms) for snappy real-time database response
    searchTimeoutRef.current = setTimeout(() => {
      executeRealtimeSearch(searchQuery, selectedLanguage, selectedSpecialty, onlineOnly);
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedLanguage, selectedSpecialty, onlineOnly, firebaseInterpreters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    executeRealtimeSearch(searchQuery, selectedLanguage, selectedSpecialty, onlineOnly);
  };

  const handlePublishInterpreter = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      await publishAsInterpreter(regForm);
      setIsRegisterModalOpen(false);
      await refreshInterpreters();
    } catch (err) {
      console.error("Failed to register as interpreter:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  // Real-time call initiation directly into Firestore
  const handleInitiateLiveCall = async (interp) => {
    const interpId = interp.id || interp.interpreterId;
    setCallingInterpreterId(interpId);
    setCallToast(`Ringing ${interp.name}... Alert sent to interpreter dashboard in real-time.`);

    try {
      if (initiateCall) {
        await initiateCall({
          clientUserId: user?.userId || user?.id || "client-direct",
          clientName: user?.name || "Verified Client",
          interpreterId: interpId,
          interpreterName: interp.name,
          language: interp.languages?.[0] || "ASL",
          urgency: "urgent",
          notes: "Real-time call started from directory"
        });
      }
    } catch (err) {
      console.warn("Initiate call notice:", err);
    } finally {
      // Transition to call view
      setTimeout(() => {
        setCallingInterpreterId(null);
        setCallToast(null);
        onStartCall(interpId, "client");
      }, 900);
    }
  };

  const isUserAnInterpreter = user?.role === "interpreter";

  const totalResults =
    searchTab === "interpreters"
      ? interpreters.length
      : searchTab === "users"
      ? registeredUsers.length
      : interpreters.length + registeredUsers.length;

  return (
    <div className="space-y-6">
      {/* Live Call Feedback Toast */}
      {callToast && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>{callToast}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-emerald-700 px-2.5 py-0.5 rounded-full">
            Firestore Live Session
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Database Search Connected • Firestore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Interpreters & Registered Users
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Query certified sign language interpreters and real registered users directly from Firebase Firestore in real-time. Start live calls that ring instantly on their dashboard or book scheduled appointments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Instant Match Call</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-indigo-300" />
            <span>{isUserAnInterpreter ? "Update Interpreter Profile" : "Register as Interpreter"}</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Real-time Status Banner for Registered Interpreters */}
      {isUserAnInterpreter && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                You are listed in the Firebase Interpreter Directory as: <span className="text-indigo-600 dark:text-indigo-400">{user.name}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clients can discover your profile, schedule appointments, and connect for live calls.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">Status:</span>
            {["online", "busy", "offline"].map((st) => {
              const isActive = (user.availableStatus || "online") === st;
              return (
                <button
                  key={st}
                  onClick={() => updateInterpreterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    isActive
                      ? st === "online"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : st === "busy"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
      >
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search directly in database by name, user role, specialty (e.g. Medical, Legal), or language..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Sign Languages</option>
            {SIGN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.code} - {l.name.split(" ")[0]}
              </option>
            ))}
          </select>

          {/* Specialty Dropdown */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full md:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {specialtiesList.map((spec) => (
              <option key={spec} value={spec}>
                {spec === "ALL" ? "All Specialties" : spec}
              </option>
            ))}
          </select>

          {/* Online Toggle */}
          <button
            type="button"
            onClick={() => setOnlineOnly(!onlineOnly)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              onlineOnly
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${onlineOnly ? "bg-white" : "bg-emerald-500"}`}
            />
            <span>Available Now</span>
          </button>

          <button
            type="button"
            onClick={() => executeRealtimeSearch(searchQuery, selectedLanguage, selectedSpecialty, onlineOnly)}
            title="Refresh Directory from Firestore"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Database Search Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 gap-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSearchTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                searchTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              All Directory ({interpreters.length + registeredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchTab("interpreters")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                searchTab === "interpreters"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Certified Interpreters ({interpreters.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchTab("users")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                searchTab === "users"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Registered Users ({registeredUsers.length})
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
              {loading ? "Querying Firestore collections..." : `Live DB: ${totalResults} matching results`}
            </span>
          </div>
        </div>
      </form>

      {/* Loading Indicator */}
      {loading && (
        <div className="py-12 text-center">
          <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Querying Firestore real-time database...</p>
        </div>
      )}

      {/* No Results */}
      {!loading && totalResults === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No database entries match your query</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Try adjusting your search query, clearing filters, or create an interpreter profile to add yourself to Firestore.
          </p>
          <button
            onClick={() => {
              setSelectedLanguage("ALL");
              setSelectedSpecialty("ALL");
              setOnlineOnly(false);
              setSearchQuery("");
              setSearchTab("all");
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Interpreters Section */}
      {!loading && (searchTab === "all" || searchTab === "interpreters") && interpreters.length > 0 && (
        <div className="space-y-3">
          {searchTab === "all" && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Certified Interpreters ({interpreters.length})
              </h2>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interpreters.map((interpreter) => {
              const isOnline = interpreter.availableStatus === "online";
              const isBusy = interpreter.availableStatus === "busy";
              const languages = Array.isArray(interpreter.languages) ? interpreter.languages : ["ASL"];
              const spokenLanguages = Array.isArray(interpreter.spokenLanguages) ? interpreter.spokenLanguages : ["English"];
              const specialties = Array.isArray(interpreter.specialties) ? interpreter.specialties : [];
              const isCallingThis = callingInterpreterId === (interpreter.id || interpreter.interpreterId);

              return (
                <div
                  key={interpreter.id || interpreter.interpreterId}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Card Header & Avatar */}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className="relative">
                          <img
                            src={interpreter.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                            alt={interpreter.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                              isOnline ? "bg-emerald-500" : isBusy ? "bg-amber-500" : "bg-slate-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1 flex-wrap">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {interpreter.name}
                            </h3>
                            {interpreter.verified && (
                              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                              Firestore DB
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {interpreter.title}
                          </p>

                          {/* Rating & Reviews */}
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1">
                                {interpreter.rating || 5.0}
                              </span>
                            </div>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {interpreter.reviewsCount || 1} reviews
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Languages Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold"
                        >
                          {lang}
                        </span>
                      ))}
                      {spokenLanguages.map((spk) => (
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
                      {interpreter.bio || "Certified sign language interpreter active and ready for live video interpretation."}
                    </p>

                    {/* Specialties Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {specialties.slice(0, 2).map((spec, i) => (
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
                        ${interpreter.ratePerHour || 65}
                      </span>
                      <span className="text-[10px] text-slate-400">/hr (${interpreter.ratePerMinute || 1.10}/min)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectInterpreter(interpreter)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Details
                      </button>

                      {isOnline ? (
                        <button
                          disabled={isCallingThis}
                          onClick={() => handleInitiateLiveCall(interpreter)}
                          title="Calls this interpreter. The incoming call will pop up on their dashboard in real-time!"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isCallingThis ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Video className="w-3.5 h-3.5" />
                          )}
                          <span>{isCallingThis ? "Calling..." : "Call Now"}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onBookAppointment(interpreter)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 shadow-xs transition-all active:scale-95 cursor-pointer"
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
        </div>
      )}

      {/* Registered Users Section */}
      {!loading && (searchTab === "all" || searchTab === "users") && registeredUsers.length > 0 && (
        <div className="space-y-3 pt-2">
          {searchTab === "all" && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered Users in Database ({registeredUsers.length})
              </h2>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registeredUsers.map((u) => {
              const roleColor =
                u.role === "interpreter"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                  : u.role === "student"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300";

              return (
                <div
                  key={u.id || u.userId}
                  className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
                        alt={u.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {u.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${roleColor}`}>
                            {u.role ? u.role.replace("_", " ") : "Member"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {u.primaryLanguage || "ASL"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      {u.email && (
                        <p className="truncate">
                          Email: <span className="text-slate-700 dark:text-slate-300">{u.email}</span>
                        </p>
                      )}
                      <p className="text-[11px]">
                        Account Type: <strong className="text-indigo-600 dark:text-indigo-400">Firebase Auth User</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Verified User</span>
                    </span>
                    <button
                      onClick={() => handleInitiateLiveCall({
                        id: u.id || u.userId,
                        interpreterId: u.id || u.userId,
                        name: u.name,
                        languages: [u.primaryLanguage || "ASL"]
                      })}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Call User</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Register / Update Interpreter Profile Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Publish Certified Interpreter Profile
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishInterpreter} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  required
                  value={regForm.title}
                  onChange={(e) => setRegForm({ ...regForm, title: e.target.value })}
                  placeholder="e.g. Certified ASL Medical & Legal Interpreter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rate ($/hour)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    required
                    value={regForm.ratePerHour}
                    onChange={(e) => setRegForm({ ...regForm, ratePerHour: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Sign Language
                  </label>
                  <select
                    value={regForm.languages[0] || "ASL"}
                    onChange={(e) => setRegForm({ ...regForm, languages: [e.target.value, "English"] })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {SIGN_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.code} ({l.name.split(" ")[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bio & Experience Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={regForm.bio}
                  onChange={(e) => setRegForm({ ...regForm, bio: e.target.value })}
                  placeholder="Summarize your years of experience, certifications, and availability..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                >
                  {isPublishing ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Publish to Firebase Marketplace</span>
                </button>
              </div>
            </form>
          </div>
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

export { InterpreterDirectoryView };

