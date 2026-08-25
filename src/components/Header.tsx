import React from 'react';
import { 
  Languages, 
  Moon, 
  Sun, 
  Bell, 
  Download, 
  User, 
  Briefcase, 
  ShieldCheck, 
  Camera, 
  Video, 
  Volume2
} from 'lucide-react';
import { UserProfile, AppSettings, AppNotification } from '../types';

interface HeaderProps {
  user: UserProfile;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onToggleRole: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenExportZip: () => void;
  isCallActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  onUpdateSettings,
  activeTab,
  onChangeTab,
  onToggleRole,
  notifications,
  onOpenNotifications,
  onOpenAuth,
  onOpenExportZip,
  isCallActive = false,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const isInterpreter = user.role === 'interpreter';

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
      settings.darkTheme 
        ? 'bg-slate-900/95 border-slate-800 text-white backdrop-blur-md' 
        : 'bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onChangeTab('translate')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
              <Languages className="w-5 h-5" />
              {isCallActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">
                  SignLink
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isInterpreter 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                }`}>
                  {isInterpreter ? 'Interpreter Pro' : settings.primarySignLanguage}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                AI & Live Video Interpretation
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onChangeTab('translate')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'translate'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>AI Translator</span>
            </button>

            <button
              onClick={() => onChangeTab('keyboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'keyboard'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>Sign Keyboard</span>
            </button>

            <button
              onClick={() => onChangeTab('directory')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'directory'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Interpreters</span>
            </button>

            {isInterpreter ? (
              <button
                onClick={() => onChangeTab('interpreter_dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'interpreter_dashboard'
                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>My Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => onChangeTab('schedule')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'schedule'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>Appointments</span>
              </button>
            )}

            <button
              onClick={() => onChangeTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              History
            </button>

            <button
              onClick={() => onChangeTab('resources')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'resources'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Resources
            </button>
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Role Switcher Button */}
            <button
              onClick={onToggleRole}
              title={`Switch to ${isInterpreter ? 'User' : 'Interpreter'} mode`}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {isInterpreter ? (
                <>
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span>User View</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>Interpreter Mode</span>
                </>
              )}
            </button>

            {/* Export Project Zip Button */}
            <button
              onClick={onOpenExportZip}
              title="Download full project code as ZIP"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all hover:shadow-indigo-500/25"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export ZIP</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => onUpdateSettings({ darkTheme: !settings.darkTheme })}
              title="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.darkTheme ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              title="Notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Profile Avatar / Login */}
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-2 pl-1.5 pr-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-indigo-500/30 transition-all"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500/40"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[100px] truncate">
                {user.name}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
