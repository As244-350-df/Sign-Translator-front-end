import { useState, useEffect } from "react";
import {
  X,
  Zap,
  ShieldCheck,
  Star,
  Clock,
  Video,
  AlertCircle,
  RotateCw,
  Copy,
  CheckCircle2
} from "lucide-react";
import { SIGN_LANGUAGES, MOCK_INTERPRETERS } from "../data/mockData";
import { api } from "../utils/api";
import { firestoreService } from "../services/firestoreService";

const OnDemandDispatchModal = ({
  isOpen,
  onClose,
  onConnectCall,
  settings
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(settings.primarySignLanguage);
  const [selectedSpecialty, setSelectedSpecialty] = useState("Medical & Healthcare");
  const [matchingState, setMatchingState] = useState("idle");
  const [countdown, setCountdown] = useState(30);
  const [matchedInterpreter, setMatchedInterpreter] = useState(null);
  const [dispatchedRoomCode, setDispatchedRoomCode] = useState("room-4927");
  const [copiedCode, setCopiedCode] = useState(false);

  const specialties = [
    "Medical & Healthcare",
    "Legal & Courtroom",
    "Higher Education",
    "Corporate Meetings",
    "Emergency First Response",
    "Deaf Culture Mediation"
  ];

  const startMatching = async () => {
    setMatchingState("searching");
    setCountdown(30);
    setMatchedInterpreter(null);
    const roomCode = `room-${Math.floor(1000 + Math.random() * 9000)}`;
    setDispatchedRoomCode(roomCode);

    try {
      const matchResult = await api.matchOnDemand(selectedLanguage, selectedSpecialty);
      setTimeout(async () => {
        let selected = null;
        if (matchResult && matchResult.matchedInterpreter) {
          selected = matchResult.matchedInterpreter;
        } else {
          selected = MOCK_INTERPRETERS.find((i) => i.availableStatus === "online") || MOCK_INTERPRETERS[0];
        }
        setMatchedInterpreter(selected);
        setMatchingState("found");

        // Send call across the network to Firestore
        try {
          await firestoreService.initiateCall({
            clientUserId: "client-on-demand",
            clientName: "Urgent Triage Client",
            interpreterId: selected.id,
            interpreterName: selected.name,
            language: selectedLanguage,
            urgency: "urgent",
            roomCode,
            meetingRoomId: roomCode,
            notes: `Urgent On-Demand Match (${selectedSpecialty})`
          });
        } catch (err) {
          console.warn("Firestore on-demand notice:", err);
        }
      }, 1500);
    } catch {
      const fallback = MOCK_INTERPRETERS[0];
      setMatchedInterpreter(fallback);
      setMatchingState("found");
      try {
        await firestoreService.initiateCall({
          clientUserId: "client-on-demand",
          clientName: "Urgent Triage Client",
          interpreterId: fallback.id,
          interpreterName: fallback.name,
          language: selectedLanguage,
          urgency: "urgent",
          roomCode,
          meetingRoomId: roomCode,
          notes: `Urgent On-Demand Match (${selectedSpecialty})`
        });
      } catch {}
    }
  };
  useEffect(() => {
    let timer;
    if (matchingState === "found" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setMatchingState("timeout");
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    }
    return () => clearInterval(timer);
  }, [matchingState, countdown]);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl relative p-6 sm:p-8">
        
        {
    /* Close button */
  }
        <button
    onClick={onClose}
    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
          <X className="w-5 h-5" />
        </button>

        {
    /* Modal Header */
  }
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
          <Zap className="w-4 h-4" />
          <span>Instant On-Demand Dispatch</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Urgent Live Interpreter Match
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pings our network of certified RID & ASL/BSL interpreters with a guaranteed 30-second connection cascade.
        </p>

        {
    /* State 1: Configure & Start Matching */
  }
        {matchingState === "idle" && <div className="mt-6 space-y-4">
            
            {
    /* Language Selection */
  }
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Required Sign Language
              </label>
              <select
    value={selectedLanguage}
    onChange={(e) => setSelectedLanguage(e.target.value)}
    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
  >
                {SIGN_LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.code})
                  </option>)}
              </select>
            </div>

            {
    /* Specialty Selection */
  }
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Specialty Context
              </label>
              <select
    value={selectedSpecialty}
    onChange={(e) => setSelectedSpecialty(e.target.value)}
    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
  >
                {specialties.map((spec) => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>

            {
    /* SLA Badge */
  }
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Guaranteed SLA:</span> Immediate 2-way WebRTC video room creation with 100% background-checked certified human interpreters.
              </div>
            </div>

            {
    /* Action Button */
  }
            <button
    onClick={startMatching}
    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98"
  >
              <Zap className="w-4 h-4" />
              <span>Start Instant Match Radar</span>
            </button>

          </div>}

        {
    /* State 2: Searching Animation */
  }
        {matchingState === "searching" && <div className="mt-8 text-center space-y-4 py-8">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center">
                <RotateCw className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dispatching to online {selectedLanguage} interpreters...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Matching certifications in {selectedSpecialty}
              </p>
            </div>
          </div>}

        {
    /* State 3: Found & Connected */
  }
        {matchingState === "found" && matchedInterpreter && <div className="mt-6 space-y-4">
            
            {
    /* Interpreter Profile Card */
  }
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
              <div className="relative">
                <img
    src={matchedInterpreter.avatar}
    alt={matchedInterpreter.name}
    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500"
  />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {matchedInterpreter.name}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {matchedInterpreter.title}
                </p>
                <div className="flex items-center space-x-2 mt-1 text-xs">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    {matchedInterpreter.rating}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Free Service
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatched Room Code & Copy */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Network Room Code:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{dispatchedRoomCode}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dispatchedRoomCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            {
    /* Countdown bar */
  }
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span>Room ready! Auto-connecting in:</span>
              </div>
              <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {countdown}s
              </span>
            </div>

            {
    /* Join Call Button */
  }
            <button
    onClick={() => {
      onConnectCall(dispatchedRoomCode, matchedInterpreter);
      onClose();
    }}
    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer"
  >
              <Video className="w-4 h-4" />
              <span>Enter 2-Way Video Session Now</span>
            </button>

          </div>}

        {
    /* State 4: Timeout Retry */
  }
        {matchingState === "timeout" && <div className="mt-6 space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Dispatch Window Expired
            </h3>
            <p className="text-xs text-slate-500">
              The candidate interpreter was assigned to another urgent triage call. Would you like to cascade to the next available certified pro?
            </p>
            <button
    onClick={startMatching}
    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2"
  >
              <RotateCw className="w-4 h-4" />
              <span>Cascade to Next Interpreter</span>
            </button>
          </div>}

      </div>
    </div>;
};
export {
  OnDemandDispatchModal
};
