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
import { SignDictionaryView } from "./components/dictionary/SignDictionaryView";
import { SettingsView } from "./components/SettingsView";
import { UserProfile } from "./components/UserProfile";
import { AuthModal } from "./components/AuthModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { SystemErrorModal } from "./components/SystemErrorModal";
import { ExportZipModal } from "./components/ExportZipModal";
import { ArchitectureInspectorModal } from "./components/ArchitectureInspectorModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { IncomingCallGlobalAlert } from "./components/IncomingCallGlobalAlert";
import { JoinRoomModal } from "./components/JoinRoomModal";
import {
  INITIAL_USER,
  INITIAL_SETTINGS,
  MOCK_NOTIFICATIONS,
  MOCK_INTERPRETERS
} from "./data/mockData";
import { api } from "./utils/api";
import { useFirebase } from "./context/FirebaseContext";

function App() {
  const {
    user,
    settings,
    notifications,
    firebaseUser,
    isAuthenticated,
    interpreters,
    updateUserProfile,
    updateUserSettings,
    recordSession,
    addBooking,
    setNotifications
  } = useFirebase();

  const [activeTab, setActiveTab] = useState("translate");
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
  const [initialCallPerspective, setInitialCallPerspective] = useState(null);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [joinRoomInitialCode, setJoinRoomInitialCode] = useState("room-4927");
  const [joinRoomInitialRole, setJoinRoomInitialRole] = useState("client");
  const [joinRoomCallContext, setJoinRoomCallContext] = useState(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get("session") || params.get("call");
      const roleParam = params.get("role");
      const tabParam = params.get("tab");
      if (sessionParam) {
        setActiveCallInterpreterId(sessionParam);
        if (roleParam === "interpreter" || roleParam === "client") {
          setInitialCallPerspective(roleParam);
        }
        setIsCallActive(true);
      }
      if (tabParam) {
        setActiveTab(tabParam);
      }
    } catch (err) {
      console.warn("URL params parse warning:", err);
    }
  }, []);

  useEffect(() => {
    if (settings.darkTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkTheme]);

  const handleUpdateSettings = (newSettings) => {
    updateUserSettings(newSettings);
  };

  const handleToggleRole = async () => {
    const nextRole = user.role === "interpreter" ? "user_deaf" : "interpreter";
    await updateUserProfile({ role: nextRole });
    if (user.role !== "interpreter") {
      setActiveTab("interpreter_dashboard");
    } else {
      setActiveTab("translate");
    }
  };

  const handleStartCall = (roomIdOrInterpreterId = "room-4927", role = null) => {
    const finalRoomId = typeof roomIdOrInterpreterId === "object"
      ? (roomIdOrInterpreterId?.roomCode || roomIdOrInterpreterId?.meetingRoomId || roomIdOrInterpreterId?.sessionId || roomIdOrInterpreterId?.id || "room-4927")
      : (roomIdOrInterpreterId || "room-4927");
    setActiveCallInterpreterId(finalRoomId);
    if (role) {
      setInitialCallPerspective(role);
    }
    setIsCallActive(true);
  };

  const handlePromptJoinIncomingCall = (call, defaultRole = "interpreter") => {
    const code = (
      call?.roomCode ||
      call?.meetingRoomId ||
      call?.sessionId ||
      (typeof call === "string" ? call : null) ||
      "room-4927"
    ).trim();
    setJoinRoomInitialCode(code);
    setJoinRoomInitialRole(defaultRole);
    setJoinRoomCallContext(typeof call === "object" ? { ...call, roomCode: code, meetingRoomId: code } : { roomCode: code, meetingRoomId: code });
    setIsJoinRoomOpen(true);
  };

  const handleEndCall = async () => {
    setIsCallActive(false);
    const currentInterpreter = interpreters?.find(
      (i) => i.id === activeCallInterpreterId || i.interpreterId === activeCallInterpreterId
    ) || MOCK_INTERPRETERS.find((i) => i.id === activeCallInterpreterId) || MOCK_INTERPRETERS[0];
    const liveTranscript = [
      { speaker: "Interpreter", time: "00:05", text: `Connected with ${currentInterpreter.name}. Real-time interpretation active.` },
      { speaker: "Signer", time: "00:20", text: "Thank you for interpreting today. We covered prescription timings and follow-up lab dates." },
      { speaker: "Speaker", time: "00:45", text: "Everything looks great on the health metrics. Maintain current activity and routine." },
      { speaker: "Interpreter", time: "01:10", text: "Session concluding with verified mutual understanding." }
    ];
    const aiAnalysis = await api.summarizeSessionWithAI(
      liveTranscript,
      `Consultation with ${currentInterpreter.name}`,
      settings.primarySignLanguage
    );
    const saved = await recordSession({
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
      await addBooking({
        interpreterId: interpreter.id || interpreter.interpreterId,
        interpreterName: interpreter.name,
        interpreterAvatar: interpreter.avatar,
        clientName: user?.name || "Client",
        language: settings.primarySignLanguage || "ASL",
        date: "Tomorrow",
        time: slot || "02:00 PM",
        durationMinutes: 45,
        totalCost: 0,
        notes: `Scheduled free community appointment with ${interpreter.name}`
      });
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
        onOpenJoinRoom={() => {
          setJoinRoomCallContext(null);
          setJoinRoomInitialCode("room-4927");
          setJoinRoomInitialRole(user?.role === "interpreter" ? "interpreter" : "client");
          setIsJoinRoomOpen(true);
        }}
        onStartLiveCall={() => {
          setJoinRoomCallContext(null);
          setJoinRoomInitialCode("room-4927");
          setJoinRoomInitialRole(user?.role === "interpreter" ? "interpreter" : "client");
          setIsJoinRoomOpen(true);
        }}
        onEndCall={handleEndCall}
        onToggleLiveMode={(enable) => {
          if (enable) {
            setJoinRoomCallContext(null);
            setJoinRoomInitialCode("room-4927");
            setJoinRoomInitialRole(user?.role === "interpreter" ? "interpreter" : "client");
            setIsJoinRoomOpen(true);
          } else {
            handleEndCall();
          }
        }}
        isCallActive={isCallActive}
      />

      {
    /* Main Content Body */
  }
      <main
        className={`flex-1 w-full mx-auto ${
          isCallActive
            ? "max-w-7xl px-2 sm:px-4 py-2 sm:py-3 flex flex-col min-h-0 h-[calc(100dvh-4.5rem)] overflow-hidden"
            : "max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8"
        }`}
      >
        {isCallActive ? (
    /* Live 2-Way Human Sign Language Interpreter Video Room */
    <LiveSessionCallView
      interpreterId={activeCallInterpreterId}
      initialPerspective={initialCallPerspective}
      onEndCall={handleEndCall}
      settings={settings}
    />
  ) : <>
            {/* AI Real-Time Camera Gesture Translator View */}
            {activeTab === "translate" && <LiveTranslateView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onOpenLiveCall={() => {
                setJoinRoomCallContext(null);
                setJoinRoomInitialCode("room-4927");
                setJoinRoomInitialRole("client");
                setIsJoinRoomOpen(true);
              }}
              onOpenKeyboard={() => setActiveTab("keyboard")}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />}

            {/* Virtual Sign Language Keyboard & Fingerspelling */}
            {activeTab === "keyboard" && <SignKeyboardView
              settings={settings}
              onOpenTutorial={() => setIsTutorialOpen(true)}
            />}

            {/* Certified Interpreters Directory */}
            {activeTab === "directory" && <InterpreterDirectoryView
              settings={settings}
              onSelectInterpreter={(int) => setSelectedInterpreter(int)}
              onStartCall={(target) => {
                const targetCode = typeof target === "string"
                  ? target
                  : (target?.roomCode || target?.meetingRoomId || target?.sessionId || target?.id || target?.interpreterId || "room-4927");
                handlePromptJoinIncomingCall({
                  roomCode: targetCode,
                  meetingRoomId: targetCode,
                  sessionId: targetCode,
                  clientName: typeof target === "object" ? (target?.interpreterName || target?.name) : "Interpreter",
                  notes: "Live Call"
                }, "client");
              }}
              onBookAppointment={(int) => setSelectedInterpreter(int)}
            />}

            {/* Appointments & Schedule */}
            {activeTab === "schedule" && <ScheduleView
              settings={settings}
              onJoinCall={(target) => {
                const targetCode = typeof target === "string"
                  ? target
                  : (target?.roomCode || target?.meetingRoomId || target?.sessionId || target?.id || target?.interpreterId || "room-4927");
                handlePromptJoinIncomingCall({
                  roomCode: targetCode,
                  meetingRoomId: targetCode,
                  sessionId: targetCode,
                  notes: "Scheduled Appointment"
                }, user?.role === "interpreter" ? "interpreter" : "client");
              }}
              onOpenDirectory={() => setActiveTab("directory")}
            />}

            {/* Interpreter Professional Portal */}
            {activeTab === "interpreter_dashboard" && <InterpreterDashboardView
              user={user}
              settings={settings}
              onAcceptIncomingCall={(call) => handlePromptJoinIncomingCall(call, "interpreter")}
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
    onOpenDictionary={() => setActiveTab("dictionary")}
  />}

            {
    /* Dedicated Sign Dictionary */
  }
            {activeTab === "dictionary" && <SignDictionaryView
    settings={settings}
    onNavigateToTranslate={() => setActiveTab("translate")}
    onOpenTutorial={() => setIsTutorialOpen(true)}
  />}

            {
    /* Settings & Preferences */
  }
            {activeTab === "settings" && <SettingsView
    settings={settings}
    onUpdateSettings={handleUpdateSettings}
    onOpenErrorModal={(type) => setErrorModalType(type)}
    onNavigateToProfile={() => setActiveTab("profile")}
  />}

            {
    /* Dedicated User Profile & Preferences (with Auth State Guard & Firestore Sync) */
  }
            {activeTab === "profile" && <UserProfile
    onOpenAuth={() => setIsAuthOpen(true)}
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
          await updateUserProfile(updated);
        }}
        onNavigateToProfile={() => {
          setIsAuthOpen(false);
          setActiveTab("profile");
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSelectNotification={(n) => {
          setIsNotificationsOpen(false);
          const code = (n.roomCode || n.meetingRoomId || n.sessionId || "").trim();
          if (code || n.type === "incoming_call" || n.type === "call" || n.type === "session") {
            const roleToJoin = user?.role === "interpreter" ? "interpreter" : "client";
            handlePromptJoinIncomingCall({
              roomCode: code || "room-4927",
              meetingRoomId: code || "room-4927",
              sessionId: n.sessionId || code,
              clientName: n.clientName || "Client",
              language: n.language || "ASL",
              notes: n.message || "Live video session"
            }, roleToJoin);
          } else if (n.type === "booking") {
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

      {/* Global Real-Time Incoming Call Alert */}
      <IncomingCallGlobalAlert
        currentUserId={user?.userId || user?.id || firebaseUser?.uid}
        currentUserName={user?.name || "Participant"}
        isCallActive={isCallActive}
        onAcceptCall={(call) => handlePromptJoinIncomingCall(call, "interpreter")}
      />

      {/* Cross-Device Join Room Modal */}
      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => {
          setIsJoinRoomOpen(false);
          setJoinRoomCallContext(null);
        }}
        initialRoomCode={joinRoomInitialCode}
        initialRole={joinRoomInitialRole}
        callContext={joinRoomCallContext}
        currentUser={user}
        onJoinRoom={(roomId, role) => handleStartCall(roomId, role)}
      />

      {/* Full-Screen System Initialization Overlay */}
      <LoadingOverlay />

    </div>;
}
export {
  App as default
};
