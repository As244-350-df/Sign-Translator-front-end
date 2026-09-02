import { MessageSquare, Send } from "lucide-react";

export const LiveSessionChatDrawer = ({
  showChat,
  onClose,
  chatMessages,
  onQuickChat,
  chatInput,
  onChatInputChange,
  onSendMessage
}) => {
  if (!showChat) return null;

  return (
    <div className="absolute right-0 top-0 bottom-24 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-sm text-white">In-Call Direct Notes</span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl max-w-[85%] ${
              msg.isSelf
                ? "ml-auto bg-indigo-600 text-white rounded-br-xs"
                : "bg-slate-800 text-slate-200 rounded-bl-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
              <span className="font-bold">{msg.sender}</span>
              <span>{msg.time}</span>
            </div>
            <p className="leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Quick Chips */}
      <div className="py-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
        {["Please repeat slower", "Spell that name", "Wait a moment", "Understood, thank you"].map(
          (chip) => (
            <button
              key={chip}
              onClick={() => onQuickChat(chip)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold cursor-pointer"
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
          onChange={(e) => onChatInputChange(e.target.value)}
          placeholder="Type note to interpreter..."
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
