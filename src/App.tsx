import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LiveTranslateView } from './components/LiveTranslateView';
import { SignKeyboardView } from './components/SignKeyboardView';
import { SignKeyboardTutorialModal } from './components/SignKeyboardTutorialModal';
import { LiveSessionCallView } from './components/LiveSessionCallView';
import { InterpreterDirectoryView } from './components/InterpreterDirectoryView';
import { InterpreterProfileModal } from './components/InterpreterProfileModal';
import { InterpreterDashboardView } from './components/InterpreterDashboardView';
import { ScheduleView } from './components/ScheduleView';
import { SessionHistoryView } from './components/SessionHistoryView';
import { SessionReviewModal } from './components/SessionReviewModal';
import { ResourceHubView } from './components/ResourceHubView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SystemErrorModal } from './components/SystemErrorModal';
import { ExportZipModal } from './components/ExportZipModal';
import { 
  UserProfile, 
  AppSettings, 
  Interpreter, 
  SessionHistoryItem, 
  AppNotification, 
  Booking 
} from './types';
import { 
  INITIAL_USER, 
  INITIAL_SETTINGS, 
  MOCK_NOTIFICATIONS, 
  MOCK_INTERPRETERS, 
  MOCK_SESSION_HISTORY 
} from './data/mockData';

export default function App() {
  // Global State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('translate');
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // Active Live Video Session Call
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [activeCallInterpreterId, setActiveCallInterpreterId] = useState<string>('int-01');

  // Modals
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  const [selectedSessionHistory, setSelectedSessionHistory] = useState<SessionHistoryItem | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isExportZipOpen, setIsExportZipOpen] = useState<boolean>(false);
  const [errorModalType, setErrorModalType] = useState<'camera' | 'connection' | 'maintenance' | null>(null);

  // Dark Mode synchronization on document root
  useEffect(() => {
    if (settings.darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkTheme]);

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleToggleRole = () => {
    setUser(prev => {
      const nextRole = prev.role === 'interpreter' ? 'user_deaf' : 'interpreter';
      return {
        ...prev,
        role: nextRole
      };
    });
    if (user.role !== 'interpreter') {
      setActiveTab('interpreter_dashboard');
    } else {
      setActiveTab('translate');
    }
  };

  const handleStartCall = (interpreterId: string = 'int-01') => {
    setActiveCallInterpreterId(interpreterId);
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    // Automatically transition to session review for the completed call
    setSelectedSessionHistory(MOCK_SESSION_HISTORY[0]);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      settings.darkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* App Top Header Bar */}
      <Header
        user={user}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onToggleRole={handleToggleRole}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenExportZip={() => setIsExportZipOpen(true)}
        isCallActive={isCallActive}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {isCallActive ? (
          /* Live 2-Way Human Sign Language Interpreter Video Room */
          <LiveSessionCallView
            interpreterId={activeCallInterpreterId}
            onEndCall={handleEndCall}
            settings={settings}
          />
        ) : (
          <>
            {/* AI Real-Time Camera Gesture Translator View */}
            {activeTab === 'translate' && (
              <LiveTranslateView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOpenLiveCall={handleStartCall}
                onOpenKeyboard={() => setActiveTab('keyboard')}
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            )}

            {/* Virtual Sign Language Keyboard & Fingerspelling */}
            {activeTab === 'keyboard' && (
              <SignKeyboardView
                settings={settings}
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            )}

            {/* Certified Interpreters Directory */}
            {activeTab === 'directory' && (
              <InterpreterDirectoryView
                settings={settings}
                onSelectInterpreter={(int) => setSelectedInterpreter(int)}
                onStartCall={handleStartCall}
                onBookAppointment={(int) => setSelectedInterpreter(int)}
              />
            )}

            {/* Appointments & Schedule */}
            {activeTab === 'schedule' && (
              <ScheduleView
                settings={settings}
                onJoinCall={handleStartCall}
                onOpenDirectory={() => setActiveTab('directory')}
              />
            )}

            {/* Interpreter Professional Portal */}
            {activeTab === 'interpreter_dashboard' && (
              <InterpreterDashboardView
                user={user}
                settings={settings}
                onAcceptIncomingCall={() => handleStartCall()}
              />
            )}

            {/* Historical Session Transcripts */}
            {activeTab === 'history' && (
              <SessionHistoryView
                settings={settings}
                onSelectSession={(sess) => setSelectedSessionHistory(sess)}
              />
            )}

            {/* Sign Language Academy & Dictionary Resource Hub */}
            {activeTab === 'resources' && (
              <ResourceHubView
                settings={settings}
                onOpenTutorial={() => setIsTutorialOpen(true)}
              />
            )}

            {/* Settings & Preferences */}
            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onOpenErrorModal={(type) => setErrorModalType(type)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {!isCallActive && (
        <Navigation
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          user={user}
          settings={settings}
        />
      )}

      {/* Modals & Dialogs */}
      <InterpreterProfileModal
        interpreter={selectedInterpreter}
        isOpen={selectedInterpreter !== null}
        onClose={() => setSelectedInterpreter(null)}
        onStartCall={handleStartCall}
        onBookSlot={(int, slot) => {
          setSelectedInterpreter(null);
          setActiveTab('schedule');
        }}
        settings={settings}
      />

      <SessionReviewModal
        session={selectedSessionHistory}
        isOpen={selectedSessionHistory !== null}
        onClose={() => setSelectedSessionHistory(null)}
        settings={settings}
      />

      <SignKeyboardTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        settings={settings}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => > setIsAuthOpen(false)}
        currentUser={user}
        onUpdateUser={setUser}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSelectNotification={(n) => {
          setIsNotificationsOpen(false);
          if (n.type === 'session' || n.type === 'booking') {
            setActiveTab('schedule');
          }
        }}
      />

      <SystemErrorModal
        type={errorModalType}
        isOpen={errorModalType !== null}
        onClose={() => setErrorModalType(null)}
        onRetry={() => {
          setErrorModalType(null);
        }}
      />

      <ExportZipModal
        isOpen={isExportZipOpen}
        onClose={() => setIsExportZipOpen(false)}
      />

    </div>
  );
}
