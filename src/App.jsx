import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { LiveTranslateView } from "./components/LiveTranslateView";
import { SignKeyboardView } from "./components/SignKeyboardView";
import { SignKeyboardTutorialModal } from "./components/SignKeyboardTutorialModal";
import { LiveSessionCallView } from "./components/LiveSessionCallView";
import { InterpreterDirectoryView } from "./components/InterpreterDirectoryView";
import { InterpreterProfileModal } from "./components/InterpreterProfileModal";
import { InterpreterDashboardView } from "./components/InterpreterDashboardView";
import { ScheduleView } from "./components/ScheduleView";
import { SessionHistoryView } from "./components/SessionHistoryView";
import { SessionReviewModal } from "./components/SessionReviewModal";
import { ResourceHubView } from "./components/ResourceHubView";
import { SettingsView } from "./components/SettingsView";
import { AuthModal } from "./components/AuthModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { SystemErrorModal } from "./components/SystemErrorModal";
import { ExportZipModal } from "./components/ExportZipModal";
import { ArchitectureInspectorModal } from "./components/ArchitectureInspectorModal";
import {
  INITIAL_USER,
  INITIAL_SETTINGS,
  MOCK_NOTIFICATIONS,
  MOCK_INTERPRETERS
} from "./data/mockData";
import { api } from "./utils/api";
function App() {
  const [user, setUser] = useState(INITIAL_USER);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState("translate");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallInterpreterId, setActiveCallInterpreterId] = useState("int-01");
  const [selectedInterpreter, setSelectedInterpreter] = useState(null);
  const [selectedSessionHistory, setSelectedSessionHistory] = useState(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExportZipOpen, setIsExportZipOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [errorModalType, setErrorModalType] = useState(null);
  useEffect(() => {
    async function loadInitialBackendData() {
      try {
        const [profile, notifs] = await Promise.all([
          api.getUserProfile(),
          api.getNotifications()
        ]);
        if (profile) setUser(profile);
        if (notifs && notifs.length > 0) setNotifications(notifs);
      } catch (err) {
        console.warn("Could not reach backend at boot, using local state:", err);
      }
    }
    loadInitialBackendData();
  }, []);
  useEffect(() => {
    if (settings.darkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkTheme]);
  const handleUpdateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };
  const handleToggleRole = async () => {
    const nextRole = user.role === "interpreter" ? "user_deaf" : "interpreter";
    const updatedUser = {
      ...user,
      role: nextRole
    };
    setUser(updatedUser);
    await api.updateUserProfile({ role: nextRole });
    if (user.role !== "interpreter") {
      setActiveTab("interpreter_dashboard");
    } else {
      setActiveTab("translate");
    }
  };
  const handleStartCall = (interpreterId = "int-01") => {
    setActiveCallInterpreterId(interpreterId);
    setIsCallActive(true);
  };
  const handleEndCall = async () => {
    setIsCallActive(false);
    const currentInterpreter = MOCK_INTERPRETERS.find((i) => i.id === activeCallInterpreterId) || MOCK_INTERPRETERS[0];
    const liveTranscript = [
      { speaker: "Interpreter", time: "00:05", text: `Connected with ${currentInterpreter.name}. Translation active.` },
      { speaker: "Signer", time: "00:20", text: "Thank you for interpreting today. We covered prescription timings and follow-up lab dates." },
      { speaker: "Speaker", time: "00:45", text: "Everything looks great on the health metrics. Maintain current activity and routine." },
      { speaker: "Interpreter", time: "01:10", text: "Session concluding with verified mutual understanding." }
    ];
    const aiAnalysis = await api.summarizeSessionWithAI(
      liveTranscript,
      `Consultation with ${currentInterpreter.name}`,
      settings.primarySignLanguage
    );
    const saved = await api.saveSession({
      type: "interpreter_call",
      title: `Live Session with ${currentInterpreter.name}`,
      duration: "02m 45s",
      language: settings.primarySignLanguage,
      interpreterName: currentInterpreter.name,
      interpreterAvatar: currentInterpreter.avatar,
      summary: aiAnalysis.summary,
      fullTranscript: liveTranscript,
      keyTerms: aiAnalysis.keyTerms,
      rating: 5
    });
    setSelectedSessionHistory(saved);
  };
  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.markAllNotificationsRead();
  };
  const handleBookSlot = async (interpreter, slot) => {
    try {
      await api.createBooking({
        interpreterId: interpreter.id,
        language: settings.primarySignLanguage,
        date: "Tomorrow",
        time: slot || "02:00 PM",
        durationMinutes: 45,
        notes: `Appointment booked with ${interpreter.name}`
      });
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error("Booking failed:", err);
    }
    setSelectedInterpreter(null);
    setActiveTab("schedule");
  };
  return <div className={`min-h-screen flex flex-col transition-colors duration-200 ${settings.darkTheme ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {
    /* App Top Header Bar */
  }
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
    onOpenArchitecture={() => setIsArchitectureOpen(true)}
    isCallActive={isCallActive}
  />

      {
    /* Main Content Body */
  }
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {isCallActive ? (
    /* Live 2-Way Human Sign Language Interpreter Video Room */
    <LiveSessionCallView
      interpreterId={activeCallInterpreterId}
      onEndCall={handleEndCall}
      settings={settings}
    />
  ) : <>
            {
    /* AI Real-Time Camera Gesture Translator View */
  }
            {activeTab === "translate" && <LiveTranslateView
    settings={settings}
    onUpdateSettings={handleUpdateSettings}
    onOpenLiveCall={handleStartCall}
    onOpenKeyboard={() => setActiveTab("keyboard")}
    onOpenTutorial={() => setIsTutorialOpen(true)}
  />}

            {
    /* Virtual Sign Language Keyboard & Fingerspelling */
  }
            {activeTab === "keyboard" && <SignKeyboardView
    settings={settings}
    onOpenTutorial={() => setIsTutorialOpen(true)}
  />}

            {
    /* Certified Interpreters Directory */
  }
            {activeTab === "directory" && <InterpreterDirectoryView
    settings={settings}
    onSelectInterpreter={(int) => setSelectedInterpreter(int)}
    onStartCall={handleStartCall}
    onBookAppointment={(int) => setSelectedInterpreter(int)}
  />}

            {
    /* Appointments & Schedule */
  }
            {activeTab === "schedule" && <ScheduleView
    settings={settings}
    onJoinCall={handleStartCall}
    onOpenDirectory={() => setActiveTab("directory")}
  />}

            {
    /* Interpreter Professional Portal */
  }
            {activeTab === "interpreter_dashboard" && <InterpreterDashboardView
    user={user}
    settings={settings}
    onAcceptIncomingCall={() => handleStartCall()}
  />}

            {
    /* Historical Session Transcripts */
  }
            {activeTab === "history" && <SessionHistoryView
    settings={settings}
    onSelectSession={(sess) => setSelectedSessionHistory(sess)}
  />}

            {
    /* Sign Language Academy & Dictionary Resource Hub */
  }
            {activeTab === "resources" && <ResourceHubView
    settings={settings}
    onOpenTutorial={() => setIsTutorialOpen(true)}
  />}

            {
    /* Settings & Preferences */
  }
            {activeTab === "settings" && <SettingsView
    settings={settings}
    onUpdateSettings={handleUpdateSettings}
    onOpenErrorModal={(type) => setErrorModalType(type)}
  />}
          </>}
      </main>

      {
    /* Mobile Bottom Navigation Bar */
  }
      {!isCallActive && <Navigation
    activeTab={activeTab}
    onChangeTab={setActiveTab}
    user={user}
    settings={settings}
  />}

      {
    /* Modals & Dialogs */
  }
      <InterpreterProfileModal
    interpreter={selectedInterpreter}
    isOpen={selectedInterpreter !== null}
    onClose={() => setSelectedInterpreter(null)}
    onStartCall={handleStartCall}
    onBookSlot={handleBookSlot}
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
    onClose={() => setIsAuthOpen(false)}
    currentUser={user}
    onUpdateUser={async (updated) => {
      setUser(updated);
      await api.updateUserProfile(updated);
    }}
  />

      <NotificationsModal
    isOpen={isNotificationsOpen}
    onClose={() => setIsNotificationsOpen(false)}
    notifications={notifications}
    onMarkAllAsRead={handleMarkAllNotificationsAsRead}
    onSelectNotification={(n) => {
      setIsNotificationsOpen(false);
      if (n.type === "session" || n.type === "booking") {
        setActiveTab("schedule");
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

      <ArchitectureInspectorModal
    isOpen={isArchitectureOpen}
    onClose={() => setIsArchitectureOpen(false)}
  />

    </div>;
}
export {
  App as default
};
