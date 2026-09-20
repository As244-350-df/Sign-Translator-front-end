import { useState, useEffect, useRef } from "react";
import {
  X,
  Video,
  Copy,
  CheckCircle2,
  Radio,
  Sparkles,
  Smartphone,
  Laptop,
  PhoneIncoming,
  Languages,
  ArrowRight,
  ClipboardPaste
} from "lucide-react";

export const JoinRoomModal = ({
  isOpen,
  onClose,
  onJoinRoom,
  initialRoomCode = "room-4927",
  initialRole = "client",
  callContext = null
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode || "room-4927");
  const [role, setRole] = useState(initialRole || "client");
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setRoomCode(initialRoomCode || "room-4927");
      if (initialRole) {
        setRole(initialRole);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialRoomCode, initialRole]);

  if (!isOpen) return null;

  const handleGenerateInstantRoom = () => {
    const code = `room-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomCode(code);
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // If it's a URL with session param, extract it
        try {
          const url = new URL(text);
          const sess = url.searchParams.get("session");
          if (sess) {
            setRoomCode(sess.trim());
            return;
          }
        } catch {}
        setRoomCode(text.trim());
      }
    } catch {}
  };

  const handleCopyLink = (roleForLink) => {
    const code = (roomCode || "room-4927").trim();
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("session", code);
    url.searchParams.set("role", roleForLink);

    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const finalCode = (roomCode || "room-4927").trim();
    onJoinRoom(finalCode, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl relative p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Incoming Call Header Banner (if launched from call notification) */}
        {callContext ? (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 border border-emerald-500/30">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <PhoneIncoming className="w-4 h-4 animate-bounce" />
              <span>Incoming Call Notification</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {callContext.clientName || "Caller"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{callContext.language || "ASL"} • {callContext.notes || "Live Video Session"}</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              Confirm or enter the room code below to join this session.
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Live Session Mode</span>
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {callContext ? "Join Call Session" : "Enter Room Code"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Put the room code in the box below to join the real-time two-way video and translation session.
        </p>

        {/* Room Code Input Form */}
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Room Code
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePasteCode}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleGenerateInstantRoom}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>New Code</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="e.g. room-4927"
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/40 focus:border-indigo-600 dark:border-indigo-500/50 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {roomCode && (
                  <button
                    type="button"
                    onClick={() => setRoomCode("")}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preset Room Quick Tags */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 text-[11px]">Quick codes:</span>
            {["room-4927", "room-emergency", "room-clinic"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRoomCode(preset)}
                className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-medium border transition-colors cursor-pointer ${
                  roomCode === preset
                    ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Role in this Session
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  role === "client"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Client / Signer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("interpreter")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  role === "interpreter"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Interpreter</span>
              </button>
            </div>
          </div>

          {/* Share with 2nd device options */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Share with 2nd device:</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleCopyLink("interpreter")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3 h-3 text-purple-500" />
                <span>Copy Interpreter Link</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyLink("client")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3 h-3 text-indigo-500" />
                <span>Copy Client Link</span>
              </button>
            </div>
          </div>

          {copiedLink && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Link copied to clipboard! Open on other device to connect.</span>
            </p>
          )}

          {/* Primary Join Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer mt-3"
          >
            <Video className="w-4 h-4" />
            <span>Join Live Room Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
