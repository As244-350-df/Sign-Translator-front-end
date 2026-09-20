import { useState, useEffect } from "react";
import {
  PhoneIncoming,
  Video,
  X,
  Sparkles,
  ShieldCheck,
  Languages
} from "lucide-react";
import { firestoreService } from "../services/firestoreService";

function playIncomingCallRing() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.55);
  } catch {
    // Audio restrictions safe fallback
  }
}

export const IncomingCallGlobalAlert = ({
  currentUserId,
  currentUserName,
  isCallActive,
  onAcceptCall
}) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [countdown, setCountdown] = useState(30);

  // Subscribe to real-time incoming calls for this user
  useEffect(() => {
    if (!currentUserId || isCallActive) {
      setIncomingCall(null);
      return;
    }

    const unsubscribe = firestoreService.subscribeIncomingCalls(currentUserId, (pendingCalls) => {
      if (pendingCalls && pendingCalls.length > 0) {
        setIncomingCall(pendingCalls[0]);
        setCountdown(30);
      } else {
        setIncomingCall(null);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, isCallActive]);

  // Audio ring chime when incoming call is active
  useEffect(() => {
    if (!incomingCall || isCallActive) return;

    playIncomingCallRing();
    const ringInterval = setInterval(() => {
      playIncomingCallRing();
    }, 3500);

    return () => clearInterval(ringInterval);
  }, [incomingCall, isCallActive]);

  // Countdown timer for auto-timeout
  useEffect(() => {
    if (!incomingCall || isCallActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingCall, isCallActive]);

  if (!incomingCall || isCallActive) return null;

  const clientName = incomingCall.clientName || "SignLink Client";
  const language = incomingCall.language || "ASL";
  const urgency = incomingCall.urgency || "urgent";
  const notes = incomingCall.notes || "Live 2-Way Video Interpretation Session";

  const handleAccept = async () => {
    try {
      await firestoreService.acceptCall(incomingCall.sessionId || incomingCall.id, {
        name: currentUserName
      });
    } catch (err) {
      console.warn("Accept call notice:", err);
    }
    const callToAccept = incomingCall;
    setIncomingCall(null);
    onAcceptCall(callToAccept);
  };

  const handleDecline = async () => {
    try {
      await firestoreService.declineCall(incomingCall.sessionId || incomingCall.id);
    } catch (err) {
      console.warn("Decline call notice:", err);
    }
    setIncomingCall(null);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white p-5 sm:p-6 rounded-3xl shadow-2xl ring-4 ring-emerald-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce shadow-inner">
              <PhoneIncoming className="w-7 h-7 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400" />
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-300/40 text-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                Incoming Live Video Call
              </span>
              <span className="text-[11px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full text-slate-200">
                {countdown}s
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
              <span>{clientName}</span>
            </h3>

            <p className="text-xs text-emerald-100 flex items-center space-x-1.5 mt-0.5">
              <Languages className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{language} Required • {notes}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <button
            onClick={handleDecline}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-slate-100 text-xs font-extrabold shadow-lg transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Join Call (Enter Code)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
