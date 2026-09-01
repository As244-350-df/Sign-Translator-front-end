import { X, CameraOff, WifiOff, Wrench, RefreshCw } from "lucide-react";
const SystemErrorModal = ({
  type,
  isOpen,
  onClose,
  onRetry
}) => {
  if (!isOpen || !type) return null;
  const contentMap = {
    camera: {
      title: "Camera & Microphone Access Required",
      subtitle: "Permission blocked by browser settings",
      icon: CameraOff,
      iconColor: "text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900",
      description: "SignLink needs camera access to track 21-point hand landmarks for sign recognition, and microphone access for spoken voice conversion.",
      instructions: [
        "Click the lock or camera icon in your browser address bar.",
        'Change Camera and Microphone permissions to "Allow".',
        'Reload or click "Grant Permission" below.'
      ],
      actionText: "Retry Device Permission"
    },
    connection: {
      title: "Video Session Connection Disrupted",
      subtitle: "Network latency or temporary packet drop",
      icon: WifiOff,
      iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900",
      description: "We lost real-time signaling with the interpreter video bridge. Auto-reconnecting to the nearest relay server...",
      instructions: [
        "Check your Wi-Fi or cellular data connection.",
        "The live room transcript has been safely saved.",
        "Click reconnect to resume immediately without losing session place."
      ],
      actionText: "Reconnect Session Now"
    },
    maintenance: {
      title: "Scheduled Model Upgrade in Progress",
      subtitle: "System optimization & accuracy enhancements",
      icon: Wrench,
      iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900",
      description: "SignLink AI Vision is receiving an updated neural network model for increased low-light fingerspelling accuracy.",
      instructions: [
        "Live human interpreter booking remains 100% operational.",
        "Scheduled completion time: Under 2 minutes.",
        "All offline dictionary resources are currently accessible."
      ],
      actionText: "Check Service Health"
    }
  };
  const activeContent = contentMap[type];
  const Icon = activeContent.icon;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        
        {
    /* Close Button */
  }
        <button
    onClick={onClose}
    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
  >
          <X className="w-5 h-5" />
        </button>

        {
    /* Big Icon */
  }
        <div className={`w-16 h-16 mx-auto rounded-3xl border flex items-center justify-center mb-4 ${activeContent.iconColor}`}>
          <Icon className="w-8 h-8" />
        </div>

        {
    /* Heading */
  }
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {activeContent.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {activeContent.subtitle}
        </p>

        {
    /* Description */
  }
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-2 mb-5">
          <p>{activeContent.description}</p>
          <ul className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700">
            {activeContent.instructions.map((step, idx) => <li key={idx} className="flex items-start space-x-2">
                <span className="font-bold text-indigo-500">•</span>
                <span>{step}</span>
              </li>)}
          </ul>
        </div>

        {
    /* Actions */
  }
        <div className="flex items-center space-x-2">
          <button
    onClick={onClose}
    className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
            Dismiss
          </button>
          <button
    onClick={() => {
      onRetry();
      onClose();
    }}
    className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-1.5"
  >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{activeContent.actionText}</span>
          </button>
        </div>

      </div>
    </div>;
};
export {
  SystemErrorModal
};
