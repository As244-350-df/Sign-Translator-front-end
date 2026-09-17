import { MessageSquare, Send, Sparkles, Radio, X } from "lucide-react";

export const LiveSessionChatDrawer = ({
  showChat,
  isOpen,
  onClose,
  chatMessages = [],
  onQuickChat,
  chatInput = "",
  onChatInputChange,
  onChangeChatInput,
  onSendMessage,
  autoChatSigns = true,
  onToggleAutoChat = null
}) => {
  const isVisible = showChat ?? isOpen;
  if (!isVisible) return null;

  const handleInputChange = (val) => {
    if (onChatInputChange) onChatInputChange(val);
    if (onChangeChatInput) onChangeChatInput(val);
  };

  return (
    <div className="absolute right-0 top-0 bottom-24 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-sm text-white">Live Text & Translated Feed</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-[10px] font-mono text-emerald-300">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>Socket Live</span>
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            title="Close Text Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto Socket Translate Toggle Banner */}
      {onToggleAutoChat && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Send Translated Signs via Socket</span>
          </span>
          <input
            type="checkbox"
            checked={autoChatSigns}
            onChange={(e) => onToggleAutoChat(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
          />
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
        {chatMessages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`p-3 rounded-2xl max-w-[88%] ${
              msg.isSelf
                ? "ml-auto bg-indigo-600 text-white rounded-br-xs"
                : "bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
              <span className="font-bold flex items-center space-x-1">
                {msg.isTranslated && <Sparkles className="w-2.5 h-2.5 text-amber-300" />}
                <span>{msg.sender}</span>
              </span>
              <span>{msg.time}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Quick Chips */}
      <div className="py-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
        {["Please repeat slower", "Spell that name", "Wait a moment", "Understood, thank you"].map(
          (chip) => (
            <button
              key={chip}
              onClick={() => onQuickChat && onQuickChat(chip)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              {chip}
            </button>
          )
        )}
      </div>

      {/* Chat Input Field */}
      <form onSubmit={onSendMessage} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type message or note over socket..."
          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
