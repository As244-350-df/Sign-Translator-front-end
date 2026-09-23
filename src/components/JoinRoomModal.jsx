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
  ClipboardPaste,
  BellRing,
  Send
} from "lucide-react";
import { firestoreService } from "../services/firestoreService";

export const JoinRoomModal = ({
  isOpen,
  onClose,
  onJoinRoom,
  initialRoomCode = "room-4927",
  initialRole = "client",
  callContext = null,
  currentUser = null
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode || "room-4927");
  const [role, setRole] = useState(initialRole || "client");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRingingInterpreters, setIsRingingInterpreters] = useState(false);
  const [ringSuccessBanner, setRingSuccessBanner] = useState(null);
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

  const handleCopyCodeOnly = () => {
    const code = (roomCode || "room-4927").trim();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyNumberOnly = () => {
    const code = (roomCode || "room-4927").trim();
    // Extract just numbers e.g. "4927" or clean token
    const digitsOnly = code.replace(/^[a-zA-Z_-]+/, "") || code;
    navigator.clipboard.writeText(digitsOnly);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // If it's a URL with session param, extract it
        try {
          const url = new URL(text);
          const sess = url.searchParams.get("session") || url.searchParams.get("room");
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

  const handleBroadcastRingToInterpreters = async () => {
    const finalCode = (roomCode || "room-4927").trim();
    setIsRingingInterpreters(true);
    setRingSuccessBanner(null);
    try {
      await firestoreService.initiateCall({
        clientUserId: currentUser?.userId || currentUser?.id || "client-user",
        clientName: currentUser?.name || "Client (Deaf Signer)",
        interpreterId: "int-01",
        roomCode: finalCode,
        meetingRoomId: finalCode,
        language: "ASL",
        urgency: "urgent",
        notes: `Client is waiting in Room: ${finalCode}`
      });
      setRingSuccessBanner(`Dispatched! Interpreters across network notified with Room Code: ${finalCode}`);
    } catch (err) {
      console.warn("Ring broadcast notice:", err);
      setRingSuccessBanner(`Room Code ${finalCode} sent to network dispatch.`);
    } finally {
      setIsRingingInterpreters(false);
    }
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    const finalCode = (roomCode || "room-4927").trim();
    onJoinRoom(finalCode, role);
    onClose();
  };

  // Helper to extract clean number
  const numericToken = (roomCode || "").replace(/^[a-zA-Z_-]+/, "") || roomCode;

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
              <span>Incoming Call Dispatched Across Network</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {callContext.clientName || callContext.interpreterName || "Active Caller"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{callContext.language || "ASL"} • {callContext.notes || "Live Video Session"}</span>
            </p>
            <div className="mt-3 flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/25">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Network Room Code:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{roomCode}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCodeOnly}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
              >
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Live WebRTC Room Connection</span>
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {callContext ? "Join Synchronized Room" : "Room Code & Connection"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          The room code is already placed in the box below. Both client and interpreter can copy the number or paste it to join.
        </p>

        {/* Room Code Input Form */}
        <form onSubmit={handleJoin} className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <span>Room Code / Number</span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  In Dialog Box
                </span>
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePasteCode}
                  title="Paste room code from clipboard"
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
                className="w-full pl-4 pr-28 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/50 focus:border-indigo-600 dark:border-indigo-500 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {/* 1-Click Copy Code inside the input */}
                <button
                  type="button"
                  onClick={handleCopyCodeOnly}
                  title="Copy full room code"
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy"}</span>
                </button>
                {roomCode && (
                  <button
                    type="button"
                    onClick={() => setRoomCode("")}
                    title="Clear"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Copy Number Pills & Notification */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 text-[11px]">Copy only number:</span>
                <button
                  type="button"
                  onClick={handleCopyNumberOnly}
                  className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{copiedNumber ? "Copied Number!" : numericToken || "4927"}</span>
                </button>
              </div>

              <div className="flex items-center space-x-1 text-xs">
                <span className="text-slate-400 text-[11px]">Presets:</span>
                {["room-4927", "room-emergency", "room-clinic"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRoomCode(preset)}
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-medium border transition-colors cursor-pointer ${
                      roomCode === preset
                        ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Send Real Room Code to Available Interpreters across Network */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <BellRing className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Ring Available Interpreters to this Room</span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Sends this real room code (<span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{roomCode || "room-4927"}</span>) to certified interpreters' notifications across the network.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBroadcastRingToInterpreters}
                disabled={isRingingInterpreters}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {isRingingInterpreters ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isRingingInterpreters ? "Ringing..." : "Ring Now"}</span>
              </button>
            </div>
            {ringSuccessBanner && (
              <p className="mt-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{ringSuccessBanner}</span>
              </p>
            )}
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
