import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Radio, Copy, ExternalLink, Columns, Maximize2 } from "lucide-react";
import { MOCK_INTERPRETERS } from "../data/mockData";
import { useFirebase } from "../context/FirebaseContext";
import { firestoreService } from "../services/firestoreService";
import { speakText, stopSpeaking } from "../utils/speech";
import { RealtimeHandTracker, SIGN_DICTIONARY } from "../utils/handTracker";
import { mediaPipeTracker } from "../utils/mediaPipeTracker";
import { LiveSessionRecorder } from "../utils/mediaRecorder";
import { geminiService } from "../services/geminiService";
import { RecordedVideoModal } from "./RecordedVideoModal";
import { AddSignModal } from "./AddSignModal";
import { LiveSessionHeader } from "./live-session/LiveSessionHeader";
import { LiveSessionControlBar } from "./live-session/LiveSessionControlBar";
import { LiveSessionSignDeckDrawer } from "./live-session/LiveSessionSignDeckDrawer";
import { LiveSessionChatDrawer } from "./live-session/LiveSessionChatDrawer";
import { LiveSessionPipView } from "./live-session/LiveSessionPipView";
import { LiveSessionTelemetryOverlay } from "./live-session/LiveSessionTelemetryOverlay";
import { LiveSessionStageOverlay } from "./live-session/LiveSessionStageOverlay";
import { LiveSessionRemoteVideoStage } from "./live-session/LiveSessionRemoteVideoStage";
import { LiveSessionFloatingVideoControls } from "./live-session/LiveSessionFloatingVideoControls";
import { DisconnectModal } from "./live-session/DisconnectModal";
import { CallSignalingEngine } from "../utils/callSignaling";
import { useLiveSessionCallMedia } from "../hooks/useLiveSessionCallMedia";

const LiveSessionCallView = ({
  interpreterId = "int-01",
  initialPerspective = null,
  onEndCall,
  settings = {}
}) => {
  const { interpreters, user } = useFirebase();
  const interpreter = useMemo(() => {
    return (
      interpreters?.find((i) => i.id === interpreterId || i.interpreterId === interpreterId) ||
      MOCK_INTERPRETERS.find((i) => i.id === interpreterId) ||
      MOCK_INTERPRETERS[0]
    );
  }, [interpreters, interpreterId]);
  const [callDuration, setCallDuration] = useState(142);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [mediaFeedbackNotice, setMediaFeedbackNotice] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  const showMediaNotice = (text, icon) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setMediaFeedbackNotice({ text, icon });
    feedbackTimeoutRef.current = setTimeout(() => {
      setMediaFeedbackNotice(null);
    }, 2200);
  };

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      showMediaNotice(
        next ? "Microphone Muted" : "Microphone Active",
        next ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />
      );
      return next;
    });
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const next = !prev;
      showMediaNotice(
        next ? "Camera Disabled" : "Camera Enabled",
        next ? <CameraOff className="w-4 h-4 text-rose-400" /> : <Camera className="w-4 h-4 text-indigo-400" />
      );
      return next;
    });
  }, []);

  // Keyboard shortcut listener for Mute (M), Camera (C), and Disconnect (Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target?.isContentEditable
      ) {
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleToggleCamera();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDisconnectModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleMute, handleToggleCamera]);

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

  // Perspective: 'client' (viewing interpreter) or 'interpreter' (viewing client)
  const [perspective, setPerspective] = useState(
    initialPerspective || (user?.role === "interpreter" ? "interpreter" : "client")
  );
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteVideoFrame, setRemoteVideoFrame] = useState(null);
  const [remoteMediaStatus, setRemoteMediaStatus] = useState({
    isMuted: false,
    isCameraOff: false,
    isHandRaised: false
  });
  const [remotePeerInfo, setRemotePeerInfo] = useState(null);
  const [remotePeerRole, setRemotePeerRole] = useState(null);
  const [layoutMode, setLayoutMode] = useState("split"); // 'split' | 'pip'
  const [peerStatus, setPeerStatus] = useState("idle");
  const signalingEngineRef = useRef(null);

  // Gemini AI landmark translation in live call
  const [geminiTranslation, setGeminiTranslation] = useState(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiAiActive, setGeminiAiActive] = useState(true);

  const compositeCanvasRef = useRef(null);
  const pipCanvasRef = useRef(null);
  const lastBoundVideoRef = useRef(null);
  const lastBoundCanvasRef = useRef(null);
  // Store detection model instance strictly in useRef instead of useState
  const detectionModelRef = useRef(mediaPipeTracker);
  const handTrackerRef = useRef(null);
  if (!handTrackerRef.current) {
    handTrackerRef.current = RealtimeHandTracker.getInstance ? RealtimeHandTracker.getInstance() : new RealtimeHandTracker();
  }
  const handTracker = handTrackerRef.current;

  const recorderRef = useRef(null);
  if (!recorderRef.current) {
    recorderRef.current = new LiveSessionRecorder();
  }
  const animationFrameId = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const { localVideoRef, mainVideoRef, localStreamRef, localStream } = useLiveSessionCallMedia({
    useRealCameraLocal,
    isCameraOff,
    isMuted,
    cameraFacing: settings.cameraFacing,
    mainViewMode,
    setUseRealCameraLocal
  });

  // Cross-tab and WebSocket + WebRTC signaling lifecycle for 2-way call
  useEffect(() => {
    const engine = new CallSignalingEngine(`signlink-call-${interpreterId}`);
    signalingEngineRef.current = engine;

    engine.setStreams(
      localStreamRef.current,
      (stream) => {
        setRemoteStream(stream);
        setPeerStatus("connected");
      },
      ({ status, peerRole, peerInfo, mediaStatus }) => {
        setPeerStatus(status);
        if (peerRole) setRemotePeerRole(peerRole);
        if (peerInfo) setRemotePeerInfo(peerInfo);
        if (mediaStatus) setRemoteMediaStatus(mediaStatus);
      },
      (frameData, meta) => {
        setRemoteVideoFrame(frameData);
        setPeerStatus("connected");
        if (meta?.role && !remotePeerRole) {
          setRemotePeerRole(meta.role);
        }
      }
    );

    engine.onPeerMediaStatus = (mediaStatus) => {
      setRemoteMediaStatus((prev) => ({ ...prev, ...mediaStatus }));
    };

    engine.onRemoteChatMessage = (msg) => {
      const msgText = typeof msg === "string" ? msg : msg?.text;
      const senderName =
        (typeof msg === "object" && msg?.senderName) ||
        remotePeerInfo?.name ||
        (perspective === "client" ? "Elena (Interpreter)" : "Alex (Client)");
      const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `remote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: senderName,
          time: formattedTime,
          text: msgText,
          isSelf: false,
          isTranslated: typeof msg === "object" && !!msg?.isTranslated
        }
      ]);

      if (typeof msg === "object" && msg?.isTranslated) {
        setCurrentCaption(`"${senderName} (Signed): ${msgText}"`);
      }

      showMediaNotice(`Note from ${senderName}`, <MessageSquare className="w-4 h-4 text-indigo-400" />);
    };

    engine.onRemoteTranslatedMessage = (data) => {
      const senderName =
        data.senderName ||
        remotePeerInfo?.name ||
        (perspective === "client" ? "Elena (Interpreter)" : "Alex (Client)");
      const displayText = data.symbol ? `${data.symbol} ${data.text}` : data.text;
      const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender: `${senderName} (Signed)`,
          time: formattedTime,
          text: displayText,
          isSelf: false,
          isTranslated: true
        }
      ]);

      setCurrentCaption(`"${senderName} (${data.isAi ? "Gemini AI" : "Sign Language"}): ${data.text}"`);

      if (settingsRef.current?.speechVoiceRate !== undefined) {
        speakText(data.text, settingsRef.current.speechVoiceRate, settingsRef.current.speechVoicePitch);
      }

      showMediaNotice(`Translated from ${senderName}: ${data.text}`, <Sparkles className="w-4 h-4 text-emerald-400" />);
    };

    engine.onRemoteHandRaise = (isRaised) => {
      setRemoteMediaStatus((prev) => ({ ...prev, isHandRaised: isRaised }));
    };

    engine.announcePresence(
      perspective,
      {
        name: user?.name || (perspective === "client" ? "Alex Morgan" : "Elena Rostova"),
        avatar: user?.avatar,
        role: user?.role
      },
      { isMuted, isCameraOff, isHandRaised }
    );

    return () => {
      engine.destroy();
    };
  }, [interpreterId, perspective, user, localStreamRef]);

  // Keep signaling engine's localStream reference updated
  useEffect(() => {
    if (signalingEngineRef.current && localStream) {
      signalingEngineRef.current.updateLocalStream(localStream);
    }
  }, [localStream]);

  // Real-Time WebSocket Video Frame Stream Broadcaster
  useEffect(() => {
    if (!useRealCameraLocal || isCameraOff) return;

    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = 400;
    frameCanvas.height = 300;
    const ctx = frameCanvas.getContext("2d", { willReadFrequently: true });

    const frameInterval = setInterval(() => {
      const videoEl = localVideoRef.current;
      const engine = signalingEngineRef.current;
      if (!videoEl || !engine || videoEl.readyState < 2 || videoEl.paused) return;

      try {
        ctx.save();
        ctx.translate(frameCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, frameCanvas.width, frameCanvas.height);
        ctx.restore();

        const frameData = frameCanvas.toDataURL("image/jpeg", 0.55);
        engine.sendVideoFrame(frameData);
      } catch (err) {
        // Frame skipped if context busy
      }
    }, 110);

    return () => clearInterval(frameInterval);
  }, [useRealCameraLocal, isCameraOff, localVideoRef]);

  // Sync Media Status over WebSocket (Mute, Camera, Hand Raised)
  useEffect(() => {
    if (signalingEngineRef.current) {
      signalingEngineRef.current.sendMediaStatus({
        isMuted,
        isCameraOff,
        isHandRaised
      });
    }
  }, [isMuted, isCameraOff, isHandRaised]);

  const handleCopySessionLink = () => {
    try {
      const oppRole = perspective === "client" ? "interpreter" : "client";
      const url = new URL(window.location.href);
      url.searchParams.set("session", interpreterId);
      url.searchParams.set("role", oppRole);
      navigator.clipboard.writeText(url.toString());
      showMediaNotice("Room link copied to clipboard!", <Copy className="w-4 h-4 text-indigo-400" />);
    } catch {}
  };

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

  const handleTriggerGeminiTranslate = useCallback(async () => {
    setIsGeminiLoading(true);
    try {
      const tracker = handTrackerRef.current;
      const landmarks = tracker?.smoothedLandmarks || tracker?.allHands?.[0]?.landmarks || [];
      const currentSign = tracker?.getCurrentSignMeaning?.()?.signName || tracker?.currentSignKey || "HELLO";
      const res = await geminiService.translateLandmarks({
        landmarks,
        allHands: tracker?.allHands || [],
        fingerFlexions: tracker?.fingerPose || null,
        handedness: tracker?.handedness || "Right",
        candidateSign: currentSign,
        signLanguage: settingsRef.current?.primarySignLanguage || "ASL"
      });
      if (res) {
        setGeminiTranslation(res);
        const translatedTxt = res.englishTranslation || res.translation || currentSign;
        setCurrentCaption(`"You (Gemini AI ${settingsRef.current?.primarySignLanguage || "ASL"}): ${translatedTxt}"`);
        if (autoSpeakSigns) {
          speakText(translatedTxt, settingsRef.current?.speechVoiceRate, settingsRef.current?.speechVoicePitch);
        }
      }
    } catch (err) {
      console.warn("Manual Gemini call translation error:", err);
    } finally {
      setIsGeminiLoading(false);
    }
  }, [autoSpeakSigns]);

  useEffect(() => {
    const mainCanvas = compositeCanvasRef.current;
    if (!mainCanvas) return;
    const tracker = handTrackerRef.current;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 60; // Smooth 16 FPS vision processing to eliminate main-thread stutter

    const renderLoop = (time) => {
      if (document.hidden) {
        animationFrameId.current = requestAnimationFrame(renderLoop);
        return;
      }
      const activeVideo =
        mainViewMode === "camera"
          ? (mainVideoRef.current || localVideoRef.current)
          : (localVideoRef.current || mainVideoRef.current);

      const targetCanvas =
        mainViewMode === "camera"
          ? compositeCanvasRef.current
          : (pipCanvasRef.current || compositeCanvasRef.current);

      // PERFORMANCE OPTIMIZATION: Only bind elements when the reference actually changes,
      // preventing redundant async initializations at 60 FPS
      if (activeVideo && targetCanvas) {
        if (activeVideo !== lastBoundVideoRef.current || targetCanvas !== lastBoundCanvasRef.current) {
          tracker.setElements(activeVideo, targetCanvas);
          lastBoundVideoRef.current = activeVideo;
          lastBoundCanvasRef.current = targetCanvas;
        }
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
              isSelf: true,
              isTranslated: true
            }
          ]);
          signalingEngineRef.current?.sendTranslatedMessage({
            text: sign.translatedText,
            symbol: sign.symbol,
            signLanguage: settingsRef.current?.primarySignLanguage || "ASL",
            confidence: detection.confidence || 0.98,
            isAi: false
          });
        }

        // GEMINI AI INTEGRATION IN LIVE CALL:
        // Automatically translate real hand landmarks via Gemini API
        if (geminiAiActive && detection.landmarks && detection.landmarks.length >= 21) {
          geminiService.translateLandmarks({
            landmarks: detection.landmarks,
            allHands: detection.allHands || [],
            fingerFlexions: detection.fingerPose || null,
            handedness: detection.handedness || "Right",
            candidateSign: sign.translatedText || sign.signName,
            signLanguage: settingsRef.current?.primarySignLanguage || "ASL"
          }).then((aiResult) => {
            if (aiResult) {
              setGeminiTranslation(aiResult);
              const aiText = aiResult.englishTranslation || aiResult.translation || sign.translatedText;
              setCurrentCaption(`"You (Gemini AI ${settingsRef.current?.primarySignLanguage || "ASL"}): ${aiText}"`);
              if (autoChatSigns && aiText !== sign.translatedText) {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    sender: "You (Gemini AI)",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    text: `✨ ${aiText}`,
                    isSelf: true,
                    isTranslated: true
                  }
                ]);
                signalingEngineRef.current?.sendTranslatedMessage({
                  text: aiText,
                  symbol: "✨",
                  signLanguage: settingsRef.current?.primarySignLanguage || "ASL",
                  confidence: 0.99,
                  isAi: true
                });
              }
            }
          }).catch((err) => {
            console.warn("Gemini Live Call translation note:", err);
          });
        }
      }

      // Draw landmarks on the active canvas (main stage or PiP)
      if (targetCanvas) {
        const ctx = targetCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          if (showLandmarkOverlay) {
            tracker.draw(ctx, detection, {
              color: detection.isRealHandDetected ? "#10B981" : "#6366F1",
              jointColor: "#38BDF8",
              showBoundingBox: true,
              showHUD: false,
              showAlignmentGuide: mainViewMode === "camera" && showAlignmentGuide,
              labelPrefix: `${settingsRef.current.primarySignLanguage || "ASL"} Live Session`
            });
          }
        }
      }

      // Also clear main composite canvas if we are currently drawing on PiP
      if (mainViewMode !== "camera" && compositeCanvasRef.current && compositeCanvasRef.current !== targetCanvas) {
        const mainCtx = compositeCanvasRef.current.getContext("2d");
        if (mainCtx) {
          mainCtx.clearRect(0, 0, compositeCanvasRef.current.width, compositeCanvasRef.current.height);
        }
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [showLandmarkOverlay, showAlignmentGuide, mainViewMode, autoSpeakSigns, autoChatSigns, geminiAiActive, mainVideoRef, localVideoRef]);

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
    const msgText = chatInput.trim();
    const newMsg = {
      sender: "You",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: msgText,
      isSelf: true
    };
    setChatMessages((prev) => [...prev, newMsg]);
    signalingEngineRef.current?.sendChatMessage(msgText);
    setChatInput("");
  };

  const handleQuickChat = (phrase) => {
    const newMsg = {
      sender: "You",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: phrase,
      isSelf: true
    };
    setChatMessages((prev) => [...prev, newMsg]);
    signalingEngineRef.current?.sendChatMessage(phrase);
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
    const signedMsg = {
      sender: "You (Signed)",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `${sign.symbol} ${sign.translatedText}`,
      isSelf: true
    };
    setChatMessages((prev) => [...prev, signedMsg]);
    signalingEngineRef.current?.sendChatMessage(`${sign.symbol} ${sign.translatedText}`);
    signalingEngineRef.current?.sendTranslatedMessage({
      text: sign.translatedText,
      symbol: sign.symbol,
      signLanguage: settings.primarySignLanguage || "ASL",
      confidence: sign.confidence || 0.98,
      isAi: false
    });
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
        clientUser={user}
        perspective={perspective}
        onChangePerspective={setPerspective}
        primarySignLanguage={settings.primarySignLanguage || "ASL"}
        isRecording={isRecording}
        recordedDuration={recordedDuration}
        currentTotalCost={currentTotalCost}
        callDuration={callDuration}
        formatTime={formatTime}
        showDiagnostics={showDiagnostics}
        onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
        peerStatus={peerStatus}
        layoutMode={layoutMode}
        onToggleLayoutMode={() => setLayoutMode((prev) => (prev === "pip" ? "split" : "pip"))}
        roomId={interpreterId || "room-4927"}
        onCopyRoomLink={handleCopySessionLink}
        showChat={showChat}
        onToggleChat={() => setShowChat((prev) => !prev)}
        autoChatSigns={autoChatSigns}
        onToggleAutoChat={() => setAutoChatSigns((prev) => !prev)}
        onDisconnect={() => setShowDisconnectModal(true)}
      />

      {/* Video Presentation Stage: Supports PiP and 50/50 Dual Participant Split Grid */}
      <div className="relative flex-1 flex items-center justify-center bg-slate-900 overflow-hidden min-h-[480px]">
        {layoutMode === "split" ? (
          // 50/50 Dual Participant Split Grid: Users see each other AND see themselves side-by-side
          <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950">
            {/* Left/Top: Your Feed (Local Camera) */}
            <div className="relative w-full h-full min-h-[260px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-lg">
              {isCameraOff ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                    <CameraOff className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-white">Your Camera is Off</span>
                  <span className="text-xs text-slate-400">Click camera button below to resume</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}

              {/* Overlay Badge for Self */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/60 text-xs font-bold text-white z-20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>You ({perspective === "client" ? "Client" : "Interpreter"})</span>
                {isMuted && <span className="text-rose-400 text-[10px] uppercase font-bold">• Muted</span>}
              </div>
            </div>

            {/* Right/Bottom: Remote Participant Feed */}
            <div className="relative w-full h-full min-h-[260px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
              <LiveSessionRemoteVideoStage
                perspective={perspective}
                interpreter={interpreter}
                clientUser={user}
                remoteStream={remoteStream}
                remoteVideoFrame={remoteVideoFrame}
                remoteMediaStatus={remoteMediaStatus}
                remotePeerInfo={remotePeerInfo}
                peerStatus={peerStatus}
                signSpeed={signSpeed}
                currentCaption={currentCaption}
                showLandmarkOverlay={showLandmarkOverlay}
                compositeCanvasRef={compositeCanvasRef}
                onPromptAction={(promptText) => {
                  const promptMsg = {
                    id: `prompt-${Date.now()}`,
                    sender: perspective === "client" ? "You (Client)" : "You (Interpreter)",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    text: promptText,
                    isSelf: true
                  };
                  setChatMessages((prev) => [...prev, promptMsg]);
                  signalingEngineRef.current?.sendChatMessage(promptText);
                }}
              />
            </div>
          </div>
        ) : (
          // Picture-in-Picture Mode: Big Stage for Peer + Floating PiP for Self
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
              <LiveSessionRemoteVideoStage
                perspective={perspective}
                interpreter={interpreter}
                clientUser={user}
                remoteStream={remoteStream}
                remoteVideoFrame={remoteVideoFrame}
                remoteMediaStatus={remoteMediaStatus}
                remotePeerInfo={remotePeerInfo}
                peerStatus={peerStatus}
                signSpeed={signSpeed}
                currentCaption={currentCaption}
                showLandmarkOverlay={showLandmarkOverlay}
                compositeCanvasRef={compositeCanvasRef}
                onPromptAction={(promptText) => {
                  const promptMsg = {
                    id: `prompt-${Date.now()}`,
                    sender: perspective === "client" ? "You (Client)" : "You (Interpreter)",
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    text: promptText,
                    isSelf: true
                  };
                  setChatMessages((prev) => [...prev, promptMsg]);
                  signalingEngineRef.current?.sendChatMessage(promptText);
                }}
              />
            )}

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
              geminiTranslation={geminiTranslation}
              isGeminiLoading={isGeminiLoading}
              onTriggerGeminiTranslate={handleTriggerGeminiTranslate}
            />

            <LiveSessionPipView
              ref={localVideoRef}
              isCameraOff={isCameraOff}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onToggleCamera={handleToggleCamera}
              useRealCameraLocal={useRealCameraLocal}
              cameraZoom={cameraZoom}
              cameraPan={cameraPan}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              mainViewMode={mainViewMode}
              perspective={perspective}
              interpreter={interpreter}
              clientUser={user}
              pipCanvasRef={pipCanvasRef}
              showLandmarkOverlay={showLandmarkOverlay}
              onToggleMainViewMode={() =>
                setMainViewMode(mainViewMode === "interpreter" ? "camera" : "interpreter")
              }
            />
          </div>
        )}

        {/* Floating On-Screen Video Controls HUD (Mute, Camera Toggle, Disconnect) */}
        <LiveSessionFloatingVideoControls
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isCameraOff={isCameraOff}
          onToggleCamera={handleToggleCamera}
          onDisconnect={() => setShowDisconnectModal(true)}
          perspective={perspective}
        />

        {/* Toast Notification for Media Actions (Mute/Unmute, Camera On/Off) */}
        {mediaFeedbackNotice && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-700 text-white text-xs font-bold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {mediaFeedbackNotice.icon}
            <span>{mediaFeedbackNotice.text}</span>
          </div>
        )}
      </div>

      {/* Persistent Bottom Controls Bar */}
      <LiveSessionControlBar
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isCameraOff={isCameraOff}
        onToggleCamera={handleToggleCamera}
        isHandRaised={isHandRaised}
        onToggleHandRaise={() => setIsHandRaised(!isHandRaised)}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        showSignDeck={showSignDeck}
        onToggleSignDeck={() => setShowSignDeck(!showSignDeck)}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        onDisconnect={() => setShowDisconnectModal(true)}
        perspective={perspective}
        onChangePerspective={setPerspective}
        signSpeed={signSpeed}
        onChangeSignSpeed={setSignSpeed}
        onCommitCurrentSign={handleCommitCurrentSignNow}
        showLandmarkOverlay={showLandmarkOverlay}
        onToggleLandmarkOverlay={() => setShowLandmarkOverlay(!showLandmarkOverlay)}
        showAlignmentGuide={showAlignmentGuide}
        onToggleAlignmentGuide={() => setShowAlignmentGuide(!showAlignmentGuide)}
        cameraZoom={cameraZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        isAutoCentering={isAutoCentering}
        onToggleAutoCenter={handleToggleAutoCenter}
        autoChatSigns={autoChatSigns}
        onToggleAutoChat={() => setAutoChatSigns(!autoChatSigns)}
        unreadChatCount={0}
        onPanCamera={(dir) => {
          setCameraPan((prev) => {
            const step = 0.08;
            if (dir === "up") return { ...prev, y: Math.max(-0.4, +(prev.y - step).toFixed(2)) };
            if (dir === "down") return { ...prev, y: Math.min(0.4, +(prev.y + step).toFixed(2)) };
            if (dir === "left") return { ...prev, x: Math.max(-0.4, +(prev.x - step).toFixed(2)) };
            if (dir === "right") return { ...prev, x: Math.min(0.4, +(prev.x + step).toFixed(2)) };
            return { x: 0, y: 0 };
          });
        }}
        onResetCamera={() => {
          setCameraZoom(1);
          setCameraPan({ x: 0, y: 0 });
        }}
      />

      {/* Interactive Chat Drawer */}
      <LiveSessionChatDrawer
        showChat={showChat}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onChangeChatInput={setChatInput}
        onSendMessage={handleSendMessage}
        onQuickChat={handleQuickChat}
        perspective={perspective}
        autoChatSigns={autoChatSigns}
        onToggleAutoChat={setAutoChatSigns}
      />

      {/* Interactive Sign Language Deck & Fingerspelling Reference Drawer */}
      <LiveSessionSignDeckDrawer
        isOpen={showSignDeck}
        onClose={() => setShowSignDeck(false)}
        deckTab={deckTab}
        onChangeDeckTab={setDeckTab}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        filteredSigns={filteredSigns}
        onTestSign={handleTestSign}
        onOpenAddSignModal={() => setShowAddSignModal(true)}
        freeFingerPose={freeFingerPose}
        onChangeFingerPose={setFreeFingerPose}
        autoSpeakSigns={autoSpeakSigns}
        onToggleAutoSpeak={() => setAutoSpeakSigns(!autoSpeakSigns)}
        autoChatSigns={autoChatSigns}
        onToggleAutoChat={() => setAutoChatSigns(!autoChatSigns)}
      />

      {/* Real-Time SFU & AI Telemetry Inspector */}
      {showDiagnostics && (
        <LiveSessionTelemetryOverlay
          peerStatus={peerStatus}
          localStream={localStreamRef.current}
          remoteStream={remoteStream}
          recognizedSignLogs={recognizedSignLogs}
          currentCaption={currentCaption}
          cameraZoom={cameraZoom}
          cameraPan={cameraPan}
          isAutoCentering={isAutoCentering}
          fps={60}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* Recorded Consultation Session Playback & Export Modal */}
      {showRecordedModal && activeRecordingResult && (
        <RecordedVideoModal
          recordedBlob={activeRecordingResult.blob}
          videoUrl={activeRecordingResult.url}
          durationSeconds={activeRecordingResult.duration}
          isOpen={showRecordedModal}
          onClose={() => setShowRecordedModal(false)}
          sessionTitle={`Interpretation Session • ${interpreter.name}`}
        />
      )}

      {/* Custom Medical/Legal Sign Registration Modal */}
      {showAddSignModal && (
        <AddSignModal
          isOpen={showAddSignModal}
          onClose={() => setShowAddSignModal(false)}
          onSaveSign={handleSaveSign}
        />
      )}

      {/* Disconnect Confirmation & Billing Summary Modal */}
      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirmDisconnect={onEndCall}
        callDuration={callDuration}
        currentTotalCost={currentTotalCost}
        interpreter={interpreter}
        perspective={perspective}
        formatTime={formatTime}
      />
    </div>
  );
};

export { LiveSessionCallView };
