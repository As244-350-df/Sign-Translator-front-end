import { useState, useEffect, useMemo } from "react";
import {
  History,
  Search,
  Calendar,
  Clock,
  FileText,
  Download,
  Camera,
  Video,
  ChevronRight,
  RotateCw
} from "lucide-react";
import { api } from "../utils/api";
import { useFirebase } from "../context/FirebaseContext";

const normalizeSession = (item) => {
  if (!item) return null;
  const isAI = item.type === "ai_translation";
  
  const fullTranscript = Array.isArray(item.fullTranscript)
    ? item.fullTranscript
    : Array.isArray(item.transcript)
    ? item.transcript
    : [];

  const keyTerms = Array.isArray(item.keyTerms)
    ? item.keyTerms
    : typeof item.keyTerms === "string"
    ? [item.keyTerms]
    : [];

  let dateStr = item.date;
  if (!dateStr) {
    if (item.createdAt) {
      try {
        dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      } catch {
        dateStr = "Recent";
      }
    } else {
      dateStr = "Recent";
    }
  }

  let durationStr = item.duration;
  if (!durationStr) {
    durationStr = item.durationMinutes ? `${item.durationMinutes}m 00s` : "15m 00s";
  }

  return {
    ...item,
    id: item.id || item.sessionId || `sess-${Math.random().toString(36).substring(2, 9)}`,
    type: item.type || (item.interpreterId || item.interpreterName ? "interpreter_call" : "ai_translation"),
    title: item.title || (isAI ? "AI Real-Time Translation Session" : "Certified Interpreter Call"),
    summary: item.summary || (fullTranscript.length > 0 ? "Transcript recorded and encrypted in vault." : "Completed live translation session."),
    date: dateStr,
    duration: durationStr,
    language: item.language || "ASL",
    interpreterName: item.interpreterName || (isAI ? null : "Certified Interpreter"),
    interpreterAvatar: item.interpreterAvatar || "",
    fullTranscript,
    keyTerms,
    rating: typeof item.rating === "number" ? item.rating : 5,
    notes: item.notes || ""
  };
};

const SessionHistoryView = ({
  settings,
  onSelectSession
}) => {
  const { sessions: contextSessions } = useFirebase();
  const [sessions, setSessions] = useState(() => Array.isArray(contextSessions) ? contextSessions : []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (Array.isArray(contextSessions) && contextSessions.length > 0) {
      setSessions(contextSessions);
    } else {
      fetchSessions();
    }
  }, [contextSessions]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Notice fetching sessions:", err?.message || err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const safeSessions = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    return list.map(normalizeSession).filter(Boolean);
  }, [sessions]);

  const filteredHistory = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    return safeSessions.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const summary = (item.summary || "").toLowerCase();
      const interpreterName = (item.interpreterName || "").toLowerCase();
      const keyTerms = Array.isArray(item.keyTerms) ? item.keyTerms : [];

      const matchesSearch =
        !q ||
        title.includes(q) ||
        summary.includes(q) ||
        interpreterName.includes(q) ||
        keyTerms.some((t) => typeof t === "string" && t.toLowerCase().includes(q));

      const matchesType = typeFilter === "all" || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [safeSessions, searchQuery, typeFilter]);

  const exportAllTranscripts = () => {
    const jsonStr = JSON.stringify(safeSessions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signlink-transcripts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              {safeSessions.length} Archived
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access, download, and review full conversational transcripts from your AI live translations and interpreter video calls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            title="Refresh history"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={exportAllTranscripts}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
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
            onClick={() => setTypeFilter("all")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${typeFilter === "all" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"}`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("ai_translation")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${typeFilter === "ai_translation" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"}`}
          >
            AI Vision
          </button>
          <button
            onClick={() => setTypeFilter("interpreter_call")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${typeFilter === "interpreter_call" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-900 dark:text-slate-400"}`}
          >
            Interpreter Calls
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => {
            const isAI = item.type === "ai_translation";
            const turnsCount = (item.fullTranscript || []).length;
            const keyTermsList = Array.isArray(item.keyTerms) ? item.keyTerms : [];

            return (
              <div
                key={item.id}
                onClick={() => onSelectSession(item)}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Icon & Details */}
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isAI
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                          : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {isAI ? <Camera className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAI
                              ? "bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                              : "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                          }`}
                        >
                          {isAI ? "AI Detection" : `Interpreter: ${item.interpreterName?.split(",")[0] || "Live Pro"}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.duration}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{turnsCount} Dialogue Turns</span>
                        </span>
                      </div>

                      {/* Summary Quote */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                        {item.summary}
                      </p>

                      {/* Key Terms */}
                      {keyTermsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {keyTermsList.map((term, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                            >
                              #{term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow Action */}
                  <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
                    <button className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer">
                      <span>View Full Transcript</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
            <History className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No session history found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Completed AI live translations and interpreter video calls will automatically save their full encrypted transcripts here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { SessionHistoryView };
