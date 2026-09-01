import { Camera, Keyboard, Video, Calendar, BookOpen, Settings, History, Briefcase } from "lucide-react";
const Navigation = ({
  activeTab,
  onChangeTab,
  user,
  settings
}) => {
  const isInterpreter = user.role === "interpreter";
  const navItems = [
    { id: "translate", label: "Translate", icon: Camera },
    { id: "keyboard", label: "Keyboard", icon: Keyboard },
    { id: "directory", label: "Interpreters", icon: Video },
    isInterpreter ? { id: "interpreter_dashboard", label: "Dashboard", icon: Briefcase } : { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "history", label: "History", icon: History },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings }
  ];
  return <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t transition-colors duration-200 ${settings.darkTheme ? "bg-slate-900/95 border-slate-800 backdrop-blur-lg" : "bg-white/95 border-slate-200 backdrop-blur-lg"}`}>
      <div className="flex items-center justify-around px-2 py-1.5 safe-area-inset-bottom">
        {navItems.map((item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return <button
      key={item.id}
      onClick={() => onChangeTab(item.id)}
      className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 relative ${isActive ? "text-indigo-600 dark:text-indigo-400 font-semibold scale-105" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
    >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[56px]">{item.label}</span>
              {isActive && <span className="absolute bottom-0 w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />}
            </button>;
  })}
      </div>
    </div>;
};
export {
  Navigation
};
