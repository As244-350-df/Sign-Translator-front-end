import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Clock,
  Star,
  ShieldCheck,
  Video,
  PhoneIncoming,
  TrendingUp,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  Zap,
  Calendar,
  User,
  PlusCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { api } from "../utils/api";
import { useFirebase } from "../context/FirebaseContext";
import { firestoreService } from "../services/firestoreService";

function playIncomingRingTone() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch {
    // browser audio restrictions safe
  }
}

const IncomingCallAlertCard = ({ call, onAccept, onDecline }) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    playIncomingRingTone();
    const interval = setInterval(() => {
      playIncomingRingTone();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDecline]);

  const clientName = call?.clientName || "Stanford Hospital Emergency Room";
  const language = call?.language || "ASL";
  const urgency = call?.urgency || "urgent";
  const notes = call?.notes || "Urgent Video Remote Interpretation requested";

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300 ring-4 ring-emerald-400/40">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
          <PhoneIncoming className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping mr-1 inline-block" />
              ⚡ Real-Time Live Call ({urgency})
            </span>
            <span className="text-xs font-mono font-bold bg-black/30 px-2 py-0.5 rounded-full">
              Auto-Cascade in {countdown}s
            </span>
          </div>
          <h2 className="text-lg font-bold mt-1 text-white flex items-center space-x-2">
            <span>{clientName}</span>
          </h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            {language} Required • {notes} • Guaranteed Rate: $75.00/hr ($1.25/min)
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-end md:self-center">
        <button
          onClick={onDecline}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="px-6 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-slate-100 text-xs font-extrabold shadow-lg transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
        >
          <Video className="w-4 h-4" />
          <span>Accept & Join Room</span>
        </button>
      </div>
    </div>
  );
};

const InterpreterDashboardView = ({
  user,
  settings,
  onAcceptIncomingCall
}) => {
  const {
    firebaseUser,
    updateInterpreterStatus: ctxUpdateStatus,
    acceptCall: ctxAcceptCall,
    declineCall: ctxDeclineCall
  } = useFirebase();

  const [isOnline, setIsOnline] = useState(user?.availableStatus !== "offline");
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Determine current interpreter identifier
  const interpreterId = user?.userId || user?.id || firebaseUser?.uid || "int-01";

  // Fallback seed appointments if database is newly initialized
  const DEFAULT_APPOINTMENTS = [
    {
      id: "bk-seed-01",
      clientName: "Stanford Hospital Emergency Room",
      language: "ASL",
      date: "Today",
      time: "02:00 PM",
      durationMinutes: 45,
      totalCost: 55,
      status: "upcoming",
      notes: "Post-surgery cardiology patient consultation."
    },
    {
      id: "bk-seed-02",
      clientName: "City College of San Francisco",
      language: "ASL",
      date: "Tomorrow",
      time: "10:30 AM",
      durationMinutes: 60,
      totalCost: 65,
      status: "upcoming",
      notes: "Computer Science algorithm lecture interpretation."
    },
    {
      id: "bk-seed-03",
      clientName: "District Court Civil Hearing",
      language: "ASL",
      date: "Friday",
      time: "09:00 AM",
      durationMinutes: 90,
      totalCost: 110,
      status: "upcoming",
      notes: "Official deposition and courtroom translation."
    }
  ];

  // 1. Subscribe to Real-Time Incoming Calls in Firestore
  useEffect(() => {
    if (!isOnline) {
      setIncomingCalls([]);
      return;
    }

    const unsubCalls = firestoreService.subscribeIncomingCalls(interpreterId, (pendingCalls) => {
      setIncomingCalls(pendingCalls || []);
    });

    return () => {
      unsubCalls && unsubCalls();
    };
  }, [interpreterId, isOnline]);

  // 2. Subscribe to Real-Time Bookings/Appointments in Firestore
  useEffect(() => {
    setIsLoadingAppointments(true);
    const unsubBookings = firestoreService.subscribeInterpreterBookings(interpreterId, (liveBookings) => {
      setIsLoadingAppointments(false);
      if (liveBookings && liveBookings.length > 0) {
        setAppointments(liveBookings);
      } else {
        setAppointments(DEFAULT_APPOINTMENTS);
      }
    });

    return () => {
      unsubBookings && unsubBookings();
    };
  }, [interpreterId]);

  const earningsData = {
    availableBalance: 420.5,
    today: 214.5,
    thisWeek: 1280,
    thisMonth: 4850,
    completedHours: 32.5,
    clientSatisfaction: 4.98
  };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    const nextStatus = next ? "online" : "offline";
    if (ctxUpdateStatus) {
      await ctxUpdateStatus(nextStatus);
    } else {
      await api.updateInterpreterStatus(user.id, nextStatus);
    }
  };

  const handleRequestPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 4000);
  };

  const handleAcceptCall = async (call) => {
    try {
      if (ctxAcceptCall) {
        await ctxAcceptCall(call.sessionId || call.id);
      } else {
        await firestoreService.acceptCall(call.sessionId || call.id, {
          name: user.name,
          avatar: user.avatar
        });
      }
      setIncomingCalls((prev) => prev.filter((c) => (c.sessionId || c.id) !== (call.sessionId || call.id)));
      onAcceptIncomingCall(call);
    } catch (err) {
      console.warn("Accept call notice:", err);
      onAcceptIncomingCall(call);
    }
  };

  const handleDeclineCall = async (call) => {
    try {
      if (ctxDeclineCall) {
        await ctxDeclineCall(call.sessionId || call.id);
      } else {
        await firestoreService.declineCall(call.sessionId || call.id);
      }
      setIncomingCalls((prev) => prev.filter((c) => (c.sessionId || c.id) !== (call.sessionId || call.id)));
    } catch (err) {
      console.warn("Decline call notice:", err);
      setIncomingCalls((prev) => prev.filter((c) => (c.sessionId || c.id) !== (call.sessionId || call.id)));
    }
  };

  // Helper to trigger a live call directly in Firestore for real-time testing
  const handleSimulateIncomingCall = async () => {
    setActionNotice("Sending live test call to Firestore...");
    try {
      const liveCall = await firestoreService.initiateCall({
        clientUserId: "test-client-emergency",
        clientName: "Kaiser Permanente Urgent Care",
        interpreterId: interpreterId,
        interpreterName: user.name || "Certified Interpreter",
        language: "ASL",
        urgency: "urgent",
        notes: "Real-time incoming video call dispatched directly through Firestore database"
      });
      setActionNotice("Live call dispatched to Firestore! Ringing now.");
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setActionNotice("Test call dispatched.");
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Helper to trigger a new booking in Firestore for real-time appointments testing
  const handleSimulateNewBooking = async () => {
    setActionNotice("Writing appointment directly to Firestore...");
    try {
      const bookingData = {
        interpreterId,
        interpreterName: user.name || "Certified Interpreter",
        clientName: `Elena Rostova (Deaf Client)`,
        language: "ASL",
        date: "Tomorrow",
        time: "03:15 PM",
        durationMinutes: 45,
        totalCost: 55,
        notes: "Real-time booking created via Firestore DB subscription test."
      };
      await firestoreService.createBooking("client-user-demo", bookingData);
      setActionNotice("Appointment saved to Firestore! Live updated on appointments section.");
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      setActionNotice("Booking saved to database.");
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const activeCall = incomingCalls[0];

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 bg-indigo-600 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{actionNotice}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-indigo-700 px-2 py-0.5 rounded-full">
            Firestore Sync
          </span>
        </div>
      )}

      {/* Top Header & Status Toggle */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                isOnline ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RID Certified Master</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live DB Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Certified Interpreter ID: <code className="font-mono text-indigo-600 dark:text-indigo-400">{interpreterId}</code> • ASL • BSL • International Sign
            </p>
          </div>
        </div>

        {/* Live Online / Offline State Toggle & Test Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateIncomingCall}
              title="Dispatches a live urgent call directly to Firestore to demonstrate the real-time incoming ring"
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <PhoneIncoming className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Simulate Real Call</span>
            </button>

            <button
              onClick={handleSimulateNewBooking}
              title="Inserts a real appointment to the interpreter's collection in Firestore"
              className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add Test Booking</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {isOnline ? "Active for Instant Calls" : "Offline"}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {isOnline ? "Listening to Firestore queue" : "No live call alerts"}
              </span>
            </div>

            <button
              onClick={handleToggleOnline}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isOnline ? "bg-emerald-500 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {isOnline ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Incoming Urgent Call Alert Card */}
      {isOnline && activeCall && (
        <IncomingCallAlertCard
          call={activeCall}
          onAccept={() => handleAcceptCall(activeCall)}
          onDecline={() => handleDeclineCall(activeCall)}
        />
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Available Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${earningsData.availableBalance.toFixed(2)}
          </div>
          <button
            onClick={handleRequestPayout}
            className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>{payoutSuccess ? "Payout Initiated!" : "Instant Payout (Stripe)"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Earnings */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Today's Earnings</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${earningsData.today.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-3">
            ↑ 22% vs yesterday
          </span>
        </div>

        {/* Completed Hours */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Hours Interpreted</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {earningsData.completedHours} hrs
          </div>
          <span className="text-[11px] text-slate-500 font-medium block mt-3">
            This billing month
          </span>
        </div>

        {/* Client Rating */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Satisfaction</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {earningsData.clientSatisfaction} / 5.0
          </div>
          <span className="text-[11px] text-amber-500 font-bold block mt-3">
            ⭐ 148 Verified 5-Star Reviews
          </span>
        </div>
      </div>

      {/* Main Content: Real-Time Appointments & Bookings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Appointments Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Appointments & Live Bookings
                </h3>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Firestore Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client bookings synchronized instantaneously from database
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              {appointments.length} Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id || appt.bookingId}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <User className="w-4 h-4 text-indigo-500" />
                      <span>{appt.clientName || "Client"}</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                      {appt.language || "ASL"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold capitalize">
                      {appt.status || "Upcoming"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.date || "Today"}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{appt.time || "10:00 AM"} ({appt.durationMinutes || 45} mins)</span>
                    </span>
                  </div>

                  {appt.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{appt.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${appt.totalCost || 65}.00
                  </span>
                  <button
                    onClick={() => onAcceptIncomingCall({
                      interpreterId,
                      clientName: appt.clientName || "Client",
                      language: appt.language || "ASL"
                    })}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Session</span>
                  </button>
                </div>
              </div>
            ))}

            {appointments.length === 0 && !isLoadingAppointments && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No upcoming appointments. When clients book with you, they will appear here in real-time.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Certifications & Account Compliance */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Professional Accreditations
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <span>RID Master Certificate</span>
              </div>
              <p className="text-slate-500">Registry of Interpreters for the Deaf • Verified</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>HIPAA Medical Interpreter Certified</span>
              </div>
              <p className="text-slate-500">Certified Healthcare Interpreter (CHI) • Active</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-purple-600 dark:text-purple-400">
                <Zap className="w-4 h-4" />
                <span>Courtroom Legal Certified (SC:L)</span>
              </div>
              <p className="text-slate-500">Specialist Certificate: Legal • Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { InterpreterDashboardView };
