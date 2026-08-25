import React, { useState } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  Star, 
  ShieldCheck, 
  Video, 
  PhoneIncoming, 
  UserCheck, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { UserProfile, AppSettings } from '../types';

interface InterpreterDashboardViewProps {
  user: UserProfile;
  settings: AppSettings;
  onAcceptIncomingCall: () => void;
}

export const InterpreterDashboardView: React.FC<InterpreterDashboardViewProps> = ({
  user,
  settings,
  onAcceptIncomingCall,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [incomingCall, setIncomingCall] = useState<boolean>(true);

  const earningsData = {
    today: 214.50,
    thisWeek: 1280.00,
    thisMonth: 4850.00,
    completedHours: 32.5,
    clientSatisfaction: 4.98
  };

  const queueRequests = [
    {
      id: 'req-01',
      clientName: 'Stanford Hospital Emergency Room',
      language: 'ASL',
      type: 'Urgent Medical Triage',
      timeRequested: '1 min ago',
      rate: '$75.00/hr'
    },
    {
      id: 'req-02',
      clientName: 'City College of San Francisco',
      language: 'ASL',
      type: 'Biology 101 Lecture',
      timeRequested: 'Scheduled 03:00 PM',
      rate: '$65.00/hr'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Status Toggle */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500"
            />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-800 ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RID Certified Master</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Available for ASL • BSL • International Sign
            </p>
          </div>
        </div>

        {/* Live Online / Offline State Toggle */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {isOnline ? 'Active for Instant Calls' : 'Offline / Inactive'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isOnline ? 'Receiving incoming on-demand queue' : 'You will not receive live incoming alerts'}
            </span>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="p-1 text-indigo-600 dark:text-indigo-400"
          >
            {isOnline ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Live Incoming Alert (If active and online) */}
      {isOnline && incomingCall && (
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl text-white border-2 border-indigo-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-pulse">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-[10px] font-bold uppercase tracking-wider text-white">
                Incoming On-Demand Request
              </span>
              <h3 className="text-base font-bold mt-1">
                Emergency Room Intake Consultation (ASL)
              </h3>
              <p className="text-xs text-indigo-200">
                Memorial Health Center • 2-Way Video • Estimated: 20-30 min
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIncomingCall(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-600 text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAcceptIncomingCall}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Accept & Join Call</span>
            </button>
          </div>
        </div>
      )}

      {/* Analytics & Earnings Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${earningsData.today.toFixed(2)}
          </p>
          <span className="text-[11px] text-emerald-500 font-semibold mt-1 block">
            +18% from yesterday
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${earningsData.thisMonth.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {earningsData.completedHours} billable hours
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Client Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-current" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {earningsData.clientSatisfaction} / 5.0
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            From 184 verified sessions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Status</span>
            <CheckCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            Tier 1 Verified Pro
          </p>
          <span className="text-[11px] text-purple-500 font-semibold mt-1 block">
            Auto-payout enabled
          </span>
        </div>
      </div>

      {/* Scheduled Queue & Upcoming Shifts */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Today's Confirmed Interpretation Sessions</span>
          </h2>
          <span className="text-xs text-slate-500">2 bookings today</span>
        </div>

        <div className="space-y-3">
          {queueRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {req.clientName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                    {req.language}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {req.type} • {req.timeRequested}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {req.rate}
                </span>
                <button
                  onClick={onAcceptIncomingCall}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Session</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
