import { useState } from "react";
import { X, Bell, Calendar, Video, ShieldAlert, Sparkles, CheckCheck, Copy, CheckCircle2 } from "lucide-react";

const NotificationsModal = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification
}) => {
  const [copiedNotifId, setCopiedNotifId] = useState(null);

  if (!isOpen) return null;
  const getIcon = (type) => {
    switch (type) {
      case "booking":
      case "booking_new":
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      case "session":
      case "call":
      case "incoming_call":
        return <Video className="w-4 h-4 text-emerald-500" />;
      case "alert":
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case "system":
      default:
        return <Sparkles className="w-4 h-4 text-cyan-500" />;
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
        
        {
    /* Header */
  }
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Notifications & Activity
            </h2>
          </div>
          <button
    onClick={onClose}
    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Notifications List */
  }
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length > 0 ? notifications.map((notif) => <div
    key={notif.id}
    onClick={() => onSelectNotification(notif)}
    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${notif.read ? "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400" : "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800 text-slate-900 dark:text-slate-100 shadow-2xs"}`}
  >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-2xs shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs leading-snug">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    {(() => {
                      const extractedRoomCode = notif.roomCode || notif.meetingRoomId || notif.message?.match(/room-[a-zA-Z0-9_-]+/i)?.[0] || (notif.type === "incoming_call" || notif.type === "call" ? "room-4927" : null);
                      if (!extractedRoomCode && notif.type !== "session" && notif.type !== "call" && notif.type !== "incoming_call") return null;

                      return (
                        <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                          {extractedRoomCode ? (
                            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Room:</span>
                              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{extractedRoomCode}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(extractedRoomCode);
                                  setCopiedNotifId(notif.id || extractedRoomCode);
                                  setTimeout(() => setCopiedNotifId(null), 2000);
                                }}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                title="Copy room code"
                              >
                                {copiedNotifId === (notif.id || extractedRoomCode) ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : <div />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectNotification({ ...notif, roomCode: extractedRoomCode });
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer ml-auto"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{extractedRoomCode ? `Join Room (${extractedRoomCode})` : "Join Session"}</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>) : <div className="text-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">You have no new notifications.</p>
            </div>}
        </div>

        {
    /* Footer */
  }
        {notifications.length > 0 && <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
    onClick={onMarkAllAsRead}
    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
  >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
            <button
    onClick={onClose}
    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
  >
              Close
            </button>
          </div>}

      </div>
    </div>;
};
export {
  NotificationsModal
};
