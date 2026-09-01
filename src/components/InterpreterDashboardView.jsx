import { useState, useEffect } from "react";
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
  Zap
} from "lucide-react";
import { api } from "../utils/api";
const InterpreterDashboardView = ({
  user,
  settings,
  onAcceptIncomingCall
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [incomingCall, setIncomingCall] = useState(true);
  const [incomingCountdown, setIncomingCountdown] = useState(28);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const earningsData = {
    availableBalance: 420.5,
    today: 214.5,
    thisWeek: 1280,
    thisMonth: 4850,
    completedHours: 32.5,
    clientSatisfaction: 4.98
  };
  const queueRequests = [
    {
      id: "req-01",
      clientName: "Stanford Hospital Emergency Room",
      language: "ASL",
      type: "Urgent Medical Triage",
      timeRequested: "Just now",
      rate: "$75.00/hr"
    },
    {
      id: "req-02",
      clientName: "City College of San Francisco",
      language: "ASL",
      type: "Biology 101 Lecture",
      timeRequested: "Scheduled 03:00 PM",
      rate: "$65.00/hr"
    },
    {
      id: "req-03",
      clientName: "District Court Civil Hearing",
      language: "ASL",
      type: "Legal Proceedings",
      timeRequested: "Scheduled Tomorrow",
      rate: "$90.00/hr"
    }
  ];
  useEffect(() => {
    let timer;
    if (incomingCall && incomingCountdown > 0) {
      timer = setInterval(() => {
        setIncomingCountdown((prev) => {
          if (prev <= 1) {
            setIncomingCall(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    }
    return () => clearInterval(timer);
  }, [incomingCall, incomingCountdown]);
  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    await api.updateInterpreterStatus(user.id, next ? "online" : "offline");
  };
  const handleRequestPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => setPayoutSuccess(false), 4e3);
  };
  return <div className="space-y-6">
      
      {
    /* Top Header & Status Toggle */
  }
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
    src={user.avatar}
    alt={user.name}
    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500"
  />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800 ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
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
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Certified Interpreter • ASL • BSL • International Sign
            </p>
          </div>
        </div>

        {
    /* Live Online / Offline State Toggle */
  }
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {isOnline ? "Active for Instant Calls" : "Offline / Inactive"}
            </span>
            <span className="text-[10px] text-slate-400">
              {isOnline ? "Receiving incoming on-demand queue" : "You will not receive live incoming alerts"}
            </span>
          </div>

          <button
    onClick={handleToggleOnline}
    className={`p-2 rounded-xl transition-all ${isOnline ? "bg-emerald-500 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
  >
            {isOnline ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {
    /* Incoming Urgent Call Alert Card (If Active & Online) */
  }
      {isOnline && incomingCall && <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
              <PhoneIncoming className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  ⚡ Urgent On-Demand Match
                </span>
                <span className="text-xs font-mono font-bold bg-black/30 px-2 py-0.5 rounded-full">
                  Auto-Cascade in {incomingCountdown}s
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1">Stanford Hospital Emergency Room</h2>
              <p className="text-xs text-emerald-100">
                Medical Triage • ASL Required • Guaranteed Rate: $75.00/hr ($1.25/min)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end md:self-center">
            <button
    onClick={() => setIncomingCall(false)}
    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
  >
              Decline
            </button>
            <button
    onClick={() => {
      setIncomingCall(false);
      onAcceptIncomingCall();
    }}
    className="px-6 py-2.5 rounded-xl bg-white text-emerald-700 hover:bg-slate-100 text-xs font-extrabold shadow-lg transition-all active:scale-95 flex items-center space-x-1.5"
  >
              <Video className="w-4 h-4" />
              <span>Accept & Join Room</span>
            </button>
          </div>
        </div>}

      {
    /* KPI Stats Grid */
  }
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {
    /* Available Escrow Balance */
  }
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
    className="mt-3 w-full py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center space-x-1"
  >
            <span>{payoutSuccess ? "Payout Sent to Stripe!" : "Instant Payout"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {
    /* Today's Earnings */
  }
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Earned Today</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ${earningsData.today.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-3">
            +18% from yesterday
          </span>
        </div>

        {
    /* Interpreted Hours */
  }
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Live Hours</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {earningsData.completedHours}h
          </div>
          <span className="text-[11px] text-slate-500 block mt-3">
            Across 14 appointments
          </span>
        </div>

        {
    /* Client Rating */
  }
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

      {
    /* Main Content: Dispatch Queue & Schedule */
  }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {
    /* Urgent Dispatch Requests Queue */
  }
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Urgent Queue & Upcoming Appointments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live dispatches assigned to your certified language pool
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              3 In Queue
            </span>
          </div>

          <div className="space-y-3">
            {queueRequests.map((req) => <div
    key={req.id}
    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/50 transition-colors"
  >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {req.clientName}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                      {req.language}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{req.type}</span>
                    <span>•</span>
                    <span>{req.timeRequested}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {req.rate}
                  </span>
                  <button
    onClick={onAcceptIncomingCall}
    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
  >
                    Open Room
                  </button>
                </div>
              </div>)}
          </div>
        </div>

        {
    /* Right Sidebar: Certifications & Account Compliance */
  }
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

    </div>;
};
export {
  InterpreterDashboardView
};
