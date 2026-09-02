import { useState, useEffect, useRef } from "react";
import { MOCK_INTERPRETERS } from "../data/mockData";
import { speakText, stopSpeaking } from "../utils/speech";
import { RealtimeHandTracker, SIGN_DICTIONARY } from "../utils/handTracker";
import { LiveSessionRecorder } from "../utils/mediaRecorder";
import { RecordedVideoModal } from "./RecordedVideoModal";
import { AddSignModal } from "./AddSignModal";
import { LiveSessionHeader } from "./live-session/LiveSessionHeader";
import { LiveSessionControlBar } from "./live-session/LiveSessionControlBar";
import { LiveSessionSignDeckDrawer } from "./live-session/LiveSessionSignDeckDrawer";
import { LiveSessionChatDrawer } from "./live-session/LiveSessionChatDrawer";
import { LiveSessionPipView } from "./live-session/LiveSessionPipView";
import { LiveSessionTelemetryOverlay } from "./live-session/LiveSessionTelemetryOverlay";
import { LiveSessionStageOverlay } from "./live-session/LiveSessionStageOverlay";
import { useLiveSessionCallMedia } from "../hooks/useLiveSessionCallMedia";

const LiveSessionCallView = ({
  interpreterId = "int-01",
  onEndCall,
  settings = {}
}) => {
  const interpreter = MOCK_INTERPRETERS.find((i) => i.id === interpreterId) || MOCK_INTERPRETERS[0];
  const [callDuration, setCallDuration] = useState(142);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSignDeck, setShowSignDeck] = useState(false);
  const [deckTab, setDeckTab] = useState("signs");
  const [showAddSignModal, setShowAddSignModal] = useState(false);
  const [signSpeed, setSignSpeed] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [freeFingerPose, setFreeFingerPose] = useState({
    thumb: 1,
    index: 1,
    middle: 1,
    ring: 1,
    pinky: 1,
    spread: 0.8,
    wristAngle: 0,
    rotation: 0,
    isFreeMotion: true,
    proceduralAnimation: "none"
  });
  const [autoSpeakSigns, setAutoSpeakSigns] = useState(true);
  const [autoChatSigns, setAutoChatSigns] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dictionaryMap, setDictionaryMap] = useState(SIGN_DICTIONARY);
  const [lastCommittedBanner, setLastCommittedBanner] = useState(null);
  const [recognizedSignLogs, setRecognizedSignLogs] = useState([
    { symbol: "👋", text: "Hello", confidence: 0.98, time: "10:02:14" },
    { symbol: "🙏", text: "Thank you", confidence: 0.96, time: "10:03:05" }
  ]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showLandmarkOverlay, setShowLandmarkOverlay] = useState(true);
  const [showAlignmentGuide, setShowAlignmentGuide] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });
  const [isAutoCentering, setIsAutoCentering] = useState(settings?.autoCenterCamera ?? false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [activeRecordingResult, setActiveRecordingResult] = useState(null);
  const [showRecordedModal, setShowRecordedModal] = useState(false);
  const [useRealCameraLocal, setUseRealCameraLocal] = useState(true);
  const [mainViewMode, setMainViewMode] = useState("interpreter");

  const compositeCanvasRef = useRef(null);
  const handTrackerRef = useRef(new RealtimeHandTracker());
  const recorderRef = useRef(new LiveSessionRecorder());
  const animationFrameId = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const { localVideoRef, mainVideoRef, localStreamRef } = useLiveSessionCallMedia({
    useRealCameraLocal,
    isCameraOff,
    cameraFacing: settings.cameraFacing,
    mainViewMode,
    setUseRealCameraLocal
  });

  useEffect(() => {
    handTrackerRef.current.setAutoCenter(isAutoCentering);
  }, [isAutoCentering]);

  useEffect(() => {
    if (!isAutoCentering) {
      handTrackerRef.current.setZoom(cameraZoom, cameraPan.x, cameraPan.y);
    }
  }, [cameraZoom, cameraPan, isAutoCentering]);

  const handleToggleAutoCenter = () => {
    setIsAutoCentering((prev) => {
      const next = !prev;
      handTrackerRef.current.setAutoCenter(next);
      return next;
    });
  };

  const handleZoomIn = () => setCameraZoom((prev) => Math.min(3.5, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setCameraZoom((prev) => Math.max(1, +(prev - 0.25).toFixed(2)));

  const ratePerSecond = (interpreter.ratePerMinute || 1.25) / 60;
  const currentTotalCost = callDuration * ratePerSecond;
  const [currentCaption, setCurrentCaption] = useState(
    `"The physician confirms: take 1 tablet with water each morning after breakfast."`
  );
  const [captionSpeaking, setCaptionSpeaking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: interpreter.name, time: "10:02", text: "Hello! I am connected via WebRTC SFU and ready to interpret." },
    { sender: "You", time: "10:03", text: "Thank you Elena! Please fingerspell any unfamiliar medical names.", isSelf: true },
    { sender: interpreter.name, time: "10:04", text: "Understood. Doctor is now going over your follow-up lab dates." }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let recTimer;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordedDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordedDuration(0);
    }
    return () => {
      if (recTimer) clearInterval(recTimer);
    };
  }, [isRecording]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const tracker = handTrackerRef.current;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 50;

    const renderLoop = (time) => {
      if (document.hidden) {
        animationFrameId.current = requestAnimationFrame(renderLoop);
        return;
      }
      const activeVideo =
        mainViewMode === "camera"
          ? mainVideoRef.current || localVideoRef.current
          : localVideoRef.current || mainVideoRef.current;
      if (activeVideo) {
        tracker.setElements(activeVideo, canvas);
      }
      const now = performance.now();
      const shouldRunDetection = now - lastDetectionTime >= DETECTION_INTERVAL_MS;
      if (shouldRunDetection) {
        lastDetectionTime = now;
      }
      const detection = tracker.processFrame(time, shouldRunDetection);
      if (detection.isCommitted && detection.signMeaning) {
        const sign = detection.signMeaning;
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        setLastCommittedBanner({
          symbol: sign.symbol,
          text: sign.translatedText,
          time: timeStr
        });
        setRecognizedSignLogs((prev) => [
          ...prev.slice(-15),
          {
            symbol: sign.symbol,
            text: sign.translatedText,
            confidence: detection.confidence,
            time: timeStr
          }
        ]);
        setCurrentCaption(`"You (Sign Language): ${sign.translatedText}"`);
        if (autoSpeakSigns) {
          speakText(sign.translatedText, settingsRef.current.speechVoiceRate, settingsRef.current.speechVoicePitch);
        }
        if (autoChatSigns) {
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "You (Signed)",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: `${sign.symbol} ${sign.translatedText}`,
              isSelf: true
            }
          ]);
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showLandmarkOverlay) {
        tracker.draw(ctx, detection, {
          color: detection.isRealHandDetected ? "#10B981" : "#6366F1",
          jointColor: "#38BDF8",
          showBoundingBox: true,
          showHUD: false,
          showAlignmentGuide,
          labelPrefix: `${settingsRef.current.primarySignLanguage || "ASL"} Live Session`
        });
      }
      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [showLandmarkOverlay, showAlignmentGuide, mainViewMode, autoSpeakSigns, autoChatSigns, mainVideoRef, localVideoRef]);

  useEffect(() => {
    const captionList = [
      `"Elena (Interpreter): The physician confirms: take 1 tablet with water each morning after breakfast."`,
      `"Elena (Interpreter): Please let the clinic know if you experience any side effects in the next 14 days."`,
      `"Elena (Interpreter): All laboratory test results from Monday returned normal and in optimal ranges."`,
      `"Elena (Interpreter): Doctor asks if you have questions regarding the physical therapy referral."`
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % captionList.length;
      setCurrentCaption(captionList[idx]);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const handleSpeakCurrentCaption = () => {
    if (captionSpeaking) {
      stopSpeaking();
      setCaptionSpeaking(false);
    } else {
      setCaptionSpeaking(true);
      speakText(
        currentCaption.replace(/Elena \(Interpreter\): /g, "").replace(/You \(Sign Language\): /g, ""),
        () => setCaptionSpeaking(false),
        settings.speechVoiceRate,
        settings.speechVoicePitch
      );
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: chatInput.trim(),
        isSelf: true
      }
    ]);
    setChatInput("");
  };

  const handleQuickChat = (phrase) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: phrase,
        isSelf: true
      }
    ]);
  };

  const handleTestSign = (signKey) => {
    handTrackerRef.current.forceSign(signKey);
  };

  const handleSaveSign = (key, newSign) => {
    const regKey = handTrackerRef.current.registerCustomSign(key, newSign);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
    handTrackerRef.current.forceSign(regKey);
  };

  const handleCommitCurrentSignNow = (customSign) => {
    const sign = customSign || handTrackerRef.current.getCurrentSignMeaning();
    if (!sign) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastCommittedBanner({
      symbol: sign.symbol,
      text: sign.translatedText,
      time: timeStr
    });
    setRecognizedSignLogs((prev) => [
      ...prev.slice(-15),
      {
        symbol: sign.symbol,
        text: sign.translatedText,
        confidence: sign.confidence || 0.98,
        time: timeStr
      }
    ]);
    setCurrentCaption(`"You (Sign Language): ${sign.translatedText}"`);
    speakText(sign.translatedText, settings.speechVoiceRate, settings.speechVoicePitch);
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You (Signed)",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `${sign.symbol} ${sign.translatedText}`,
        isSelf: true
      }
    ]);
  };

  const handleToggleRecording = async () => {
    const recorder = recorderRef.current;
    const canvas = compositeCanvasRef.current;
    if (isRecording) {
      const result = await recorder.stopRecording();
      setIsRecording(false);
      if (result) {
        setActiveRecordingResult(result);
        setShowRecordedModal(true);
      }
    } else {
      if (!canvas) return;
      const started = await recorder.startRecording(canvas, localVideoRef.current, localStreamRef.current);
      if (started) {
        setIsRecording(true);
      }
    }
  };

  const dictionaryList = Object.entries(dictionaryMap).map(([key, item]) => ({
    key,
    ...item
  }));
  const filteredSigns =
    selectedCategory === "all"
      ? dictionaryList
      : dictionaryList.filter((s) => s.category === selectedCategory);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      <LiveSessionHeader
        interpreter={interpreter}
        primarySignLanguage={settings.primarySignLanguage || "ASL"}
        isRecording={isRecording}
        recordedDuration={recordedDuration}
        currentTotalCost={currentTotalCost}
        callDuration={callDuration}
        formatTime={formatTime}
        showDiagnostics={showDiagnostics}
        onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
      />

      {/* Main Video Presentation Stage */}
      <div className="relative flex-1 flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          {mainViewMode === "camera" && useRealCameraLocal ? (
            <video
              ref={mainVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <img
              src={interpreter.coverImage || interpreter.avatar}
              alt={interpreter.name}
              className="w-full h-full object-cover opacity-90 transition-transform duration-300 filter contrast-105"
              style={{ transform: `scale(${signSpeed === 0.5 ? 0.98 : 1})` }}
            />
          )}

          {/* Overlay Canvas for Hand Landmark 21-Points & Skeleton */}
          <canvas
            ref={compositeCanvasRef}
            width={1280}
            height={720}
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
              showLandmarkOverlay ? "opacity-100" : "opacity-0"
            }`}
          />

          <LiveSessionStageOverlay
            lastCommittedBanner={lastCommittedBanner}
            onDismissBanner={() => setLastCommittedBanner(null)}
            signSpeed={signSpeed}
            handTracker={handTrackerRef.current}
            onCommitSign={handleCommitCurrentSignNow}
            onOpenSignDeck={() => setShowSignDeck(true)}
            captionSpeaking={captionSpeaking}
            onSpeakCurrentCaption={handleSpeakCurrentCaption}
            currentCaption={currentCaption}
            fontSize={settings.fontSize}
          />

          <LiveSessionPipView
            ref={localVideoRef}
            isCameraOff={isCameraOff}
            useRealCameraLocal={useRealCameraLocal}
            cameraZoom={cameraZoom}
            cameraPan={cameraPan}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onToggleMainViewMode={() =>
              setMainViewMode(mainViewMode === "interpreter" ? "camera" : "interpreter")
            }
          />

          <LiveSessionTelemetryOverlay showDiagnostics={showDiagnostics} />
        </div>

        <LiveSessionSignDeckDrawer
          showSignDeck={showSignDeck}
          onClose={() => setShowSignDeck(false)}
          deckTab={deckTab}
          onSetDeckTab={setDeckTab}
          onOpenAddSignModal={() => setShowAddSignModal(true)}
          autoSpeakSigns={autoSpeakSigns}
          onToggleAutoSpeakSigns={setAutoSpeakSigns}
          autoChatSigns={autoChatSigns}
          onToggleAutoChatSigns={setAutoChatSigns}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          filteredSigns={filteredSigns}
          dictionaryList={dictionaryList}
          activeSignMeaning={null}
          onTestSign={handleTestSign}
          freeFingerPose={freeFingerPose}
          onPoseChange={setFreeFingerPose}
          handTracker={handTrackerRef.current}
          recognizedSignLogs={recognizedSignLogs}
        />

        <LiveSessionChatDrawer
          showChat={showChat}
          onClose={() => setShowChat(false)}
          chatMessages={chatMessages}
          onQuickChat={handleQuickChat}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          onSendMessage={handleSendMessage}
        />
      </div>

      <LiveSessionControlBar
        showSignDeck={showSignDeck}
        onToggleSignDeck={() => setShowSignDeck(!showSignDeck)}
        showLandmarkOverlay={showLandmarkOverlay}
        onToggleLandmarkOverlay={() => setShowLandmarkOverlay(!showLandmarkOverlay)}
        isAutoCentering={isAutoCentering}
        onToggleAutoCenter={handleToggleAutoCenter}
        cameraZoom={cameraZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showAlignmentGuide={showAlignmentGuide}
        onToggleAlignmentGuide={() => setShowAlignmentGuide(!showAlignmentGuide)}
        signSpeed={signSpeed}
        onChangeSignSpeed={setSignSpeed}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isCameraOff={isCameraOff}
        onToggleCamera={() => setIsCameraOff(!isCameraOff)}
        isHandRaised={isHandRaised}
        onToggleHandRaised={() => setIsHandRaised(!isHandRaised)}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        onEndCall={onEndCall}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
      />

      {showAddSignModal && (
        <AddSignModal onClose={() => setShowAddSignModal(false)} onSaveSign={handleSaveSign} />
      )}

      {showRecordedModal && activeRecordingResult && (
        <RecordedVideoModal
          recording={activeRecordingResult}
          onClose={() => setShowRecordedModal(false)}
        />
      )}
    </div>
  );
};

export { LiveSessionCallView };
