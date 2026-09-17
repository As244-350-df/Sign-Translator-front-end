import { useState } from "react";
import {
  X,
  Video,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
  Smartphone,
  Laptop
} from "lucide-react";

export const JoinRoomModal = ({
  isOpen,
  onClose,
  onJoinRoom
}) => {
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState("client"); // 'client' | 'interpreter'
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleGenerateInstantRoom = () => {
    const code = `room-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCode(code);
    setRoomCode(code);
  };

  const handleCopyLink = (roleForLink) => {
    const code = generatedCode || roomCode || "room-live";
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("session", code);
    url.searchParams.set("role", roleForLink);

    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const finalCode = (roomCode || generatedCode || `room-${Date.now()}`).trim();
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

        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Cross-Device Live Video Room</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Join or Start Instant Live Session
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Connect 2 real devices (Phone, Laptop, Tablet) with mutual two-way video & WebSocket streaming.
        </p>

        {/* Option 1: Quick Generate Room & Invite Link */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Instant Cross-Device Room</span>
            </span>
            <button
              onClick={handleGenerateInstantRoom}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Generate New Code
            </button>
          </div>

          {generatedCode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono text-sm font-bold text-slate-900 dark:text-white">
                <span>Room Code: {generatedCode}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-sans">
                  Active
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink("interpreter")}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                  <span>Copy 2nd Device Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink("client")}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Copy Client Link</span>
                </button>
              </div>

              {copiedLink && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Link copied! Open on your phone/tablet to join instantly.</span>
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleGenerateInstantRoom}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Shareable Room Link</span>
            </button>
          )}
        </div>

        {/* Option 2: Enter Custom Room Code */}
        <form onSubmit={handleJoin} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Or Enter Existing Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. room-4927 or custom-room"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Role in this Session
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  role === "client"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                Signer / Client
              </button>
              <button
                type="button"
                onClick={() => setRole("interpreter")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  role === "interpreter"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                Interpreter / Recipient
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all active:scale-98 cursor-pointer mt-2"
          >
            <Video className="w-4 h-4" />
            <span>Enter Live Room Now</span>
          </button>
        </form>
      </div>
    </div>
  );
};
