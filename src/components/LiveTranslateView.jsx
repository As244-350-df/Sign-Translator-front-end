import { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Mic,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  HandMetal,
  Layers,
  HelpCircle,
  Keyboard,
  ChevronDown,
  Circle,
  Activity,
  Plus,
  Trash2,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Target,
  Sliders,
  Focus,
  Move,
  Crosshair,
  Loader2,
  Film,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  VideoOff,
  ExternalLink,
  X
} from "lucide-react";
import { SIGN_LANGUAGES } from "../data/mockData";
import { speakText, SpeechToSignListener } from "../utils/speech";
import { RealtimeHandTracker, SIGN_DICTIONARY } from "../utils/handTracker";
import { LiveSessionRecorder } from "../utils/mediaRecorder";
import { RecordedVideoModal } from "./RecordedVideoModal";
import { AddSignModal } from "./AddSignModal";
import { FreeFingerController } from "./FreeFingerController";
import { TensorFlowEngineHUD } from "./TensorFlowEngineHUD";
import { CameraDiagnosticOverlay } from "./CameraDiagnosticOverlay";
import { SignLanguageAvatar } from "./SignLanguageAvatar";
import { VideoSourcePanel } from "./VideoSourcePanel";
import { syntheticVideoEngine } from "../utils/demoVideoFeeds";
import { isInsideIframe, getSafeCurrentUrl } from "../utils/environment";
const LiveTranslateView = ({
  settings,
  onUpdateSettings,
  onOpenLiveCall,
  onOpenKeyboard,
  onOpenTutorial
}) => {
  const [translationMode, setTranslationMode] = useState("sign_to_text");
  const [inputSourceMode, setInputSourceMode] = useState("webcam");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [activeDemoId, setActiveDemoId] = useState("HELLO");
  const [isPlayingUploadedVideo, setIsPlayingUploadedVideo] = useState(true);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1);
  const isInIframe = isInsideIframe();
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [useRealWebcam, setUseRealWebcam] = useState(true);
  const [cameraStreamStatus, setCameraStreamStatus] = useState("idle");
  const [cameraSlowLoading, setCameraSlowLoading] = useState(false);
  const [cameraNoticeMessage, setCameraNoticeMessage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraRetryCount, setCameraRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [hardwarePermissionStatus, setHardwarePermissionStatus] = useState("checking");
  const [activeStreamResolution, setActiveStreamResolution] = useState(null);
  const [showDiagnosticsOverlay, setShowDiagnosticsOverlay] = useState(false);
  const [isDarkFeedWarning, setIsDarkFeedWarning] = useState(false);
  const [showMesh, setShowMesh] = useState(settings.gestureTrackingOverlay);
  const [autoSpeakOnCommit, setAutoSpeakOnCommit] = useState(false);
  const [showAddSignModal, setShowAddSignModal] = useState(false);
  const [showFreeFingerStudio, setShowFreeFingerStudio] = useState(true);
  const [dictionaryMap, setDictionaryMap] = useState(SIGN_DICTIONARY);
  const [currentFingerPose, setCurrentFingerPose] = useState({
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
  const [tfTelemetry, setTfTelemetry] = useState({
    fps: 60,
    gesture: "\u{1F590}\uFE0F HELLO",
    confidence: 0.98,
    isReal: false,
    holdProgress: 0.5
  });
  const [tfEngineTelemetry, setTfEngineTelemetry] = useState(void 0);
  const [isTfModelEnabled, setIsTfModelEnabled] = useState(true);
  const [activeSignMeaning, setActiveSignMeaning] = useState(SIGN_DICTIONARY["HELLO"] || {
    symbol: "\u{1F590}\uFE0F",
    signName: "HELLO",
    translatedText: "Hello",
    meaning: "Standard friendly greeting",
    category: "greetings",
    confidence: 0.97
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [activeRecordingResult, setActiveRecordingResult] = useState(null);
  const [showRecordedModal, setShowRecordedModal] = useState(false);
  const [recognizedSigns, setRecognizedSigns] = useState([
    { text: "HELLO", confidence: 0.98, timestamp: "10:00:12", hand: "right", type: "word" },
    { text: "I LOVE YOU", confidence: 0.99, timestamp: "10:00:15", hand: "right", type: "word" },
    { text: "PEACE", confidence: 0.96, timestamp: "10:00:19", hand: "both", type: "word" }
  ]);
  const [fullSentence, setFullSentence] = useState("Hello! I love you. Peace to everyone.");
  const [copied, setCopied] = useState(false);
  const [textInput, setTextInput] = useState("Thank you for helping me");
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [animatingGestureIndex, setAnimatingGestureIndex] = useState(0);
  const [isPlayingSignAnimation, setIsPlayingSignAnimation] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedSignCategory, setSelectedSignCategory] = useState("all");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handTrackerRef = useRef(new RealtimeHandTracker());
  const recorderRef = useRef(new LiveSessionRecorder());
  const animationFrameId = useRef(null);
  const speechListenerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });
  const [showAlignmentGuide, setShowAlignmentGuide] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [calibrationScale, setCalibrationScale] = useState(1);
  const [isAutoCentering, setIsAutoCentering] = useState(settings.autoCenterCamera ?? false);
  const [autoCenterTelemetry, setAutoCenterTelemetry] = useState({
    enabled: settings.autoCenterCamera ?? false,
    isTracking: false,
    currentZoom: 1,
    panOffsetX: 0,
    panOffsetY: 0,
    handFramedScore: 0,
    statusText: "Manual Zoom & Pan"
  });
  useEffect(() => {
    if (typeof settings.autoCenterCamera === "boolean") {
      setIsAutoCentering(settings.autoCenterCamera);
      handTrackerRef.current.setAutoCenter(settings.autoCenterCamera);
    }
  }, [settings.autoCenterCamera]);
  useEffect(() => {
    handTrackerRef.current.setAutoCenter(isAutoCentering);
  }, [isAutoCentering]);
  useEffect(() => {
    if (!isAutoCentering) {
      handTrackerRef.current.setZoom(cameraZoom, cameraPan.x, cameraPan.y);
    }
    handTrackerRef.current.setCalibrationScale(calibrationScale);
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const caps = track.getCapabilities?.();
          if (caps && caps.zoom) {
            const minZ = caps.zoom.min || 1;
            const maxZ = caps.zoom.max || 3.5;
            const targetZ = Math.max(minZ, Math.min(maxZ, cameraZoom));
            track.applyConstraints?.({
              advanced: [{ zoom: targetZ }]
            }).catch(() => {
            });
          }
        } catch (e) {
        }
      }
    }
  }, [cameraZoom, cameraPan, calibrationScale, isAutoCentering]);
  const handleToggleAutoCenter = () => {
    const nextVal = !isAutoCentering;
    setIsAutoCentering(nextVal);
    handTrackerRef.current.setAutoCenter(nextVal);
    onUpdateSettings({ autoCenterCamera: nextVal });
  };
  const handleZoomIn = () => {
    setCameraZoom((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };
  const handleZoomOut = () => {
    setCameraZoom((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
  };
  const handleSetZoom = (z) => {
    setCameraZoom(Math.max(1, Math.min(3.5, Number(z.toFixed(2)))));
  };
  const handleResetZoom = () => {
    setCameraZoom(1);
    setCameraPan({ x: 0, y: 0 });
    setCalibrationScale(1);
  };
  const handlePanNudge = (dx, dy) => {
    setCameraPan((prev) => ({
      x: Math.max(-1, Math.min(1, Number((prev.x + dx).toFixed(2)))),
      y: Math.max(-1, Math.min(1, Number((prev.y + dy).toFixed(2))))
    }));
  };
  const currentLanguage = SIGN_LANGUAGES.find((l) => l.code === settings.primarySignLanguage) || SIGN_LANGUAGES[0];
  const handleRetryCamera = () => {
    setInputSourceMode("webcam");
    setUseRealWebcam(true);
    setIsCameraActive(true);
    setCameraSlowLoading(false);
    setCameraNoticeMessage(null);
    setCameraStreamStatus("requesting_permission");
    setCameraError(null);
    setPermissionError(null);
    setCameraRetryCount((prev) => prev + 1);
  };
  const handleSelectInputMode = (mode) => {
    setInputSourceMode(mode);
    if (mode === "webcam") {
      syntheticVideoEngine.stopStream();
      setUseRealWebcam(true);
      setIsCameraActive(true);
      setCameraStreamStatus("requesting_permission");
      setCameraRetryCount((c) => c + 1);
    } else if (mode === "simulator") {
      syntheticVideoEngine.stopStream();
      setUseRealWebcam(false);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.removeAttribute("src");
      }
    } else if (mode === "video_upload") {
      syntheticVideoEngine.stopStream();
      setUseRealWebcam(false);
      setIsCameraActive(true);
      if (videoRef.current && uploadedVideoUrl) {
        videoRef.current.srcObject = null;
        videoRef.current.src = uploadedVideoUrl;
        videoRef.current.loop = true;
        videoRef.current.playbackRate = videoPlaybackRate;
        videoRef.current.play().catch(() => {
        });
      }
    } else if (mode === "demo_clips") {
      setUseRealWebcam(false);
      setIsCameraActive(true);
      const stream = syntheticVideoEngine.generateStream(activeDemoId);
      if (videoRef.current && stream) {
        videoRef.current.removeAttribute("src");
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
        });
      }
      handTrackerRef.current.forceSign(activeDemoId);
    }
  };
  const handleUploadVideo = (file) => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setUploadedFileName(file.name);
    setInputSourceMode("video_upload");
    setUseRealWebcam(false);
    setIsCameraActive(true);
    setIsPlayingUploadedVideo(true);
    if (videoRef.current) {
      syntheticVideoEngine.stopStream();
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.playbackRate = videoPlaybackRate;
      videoRef.current.play().catch((e) => console.warn("[LiveTranslateView] Video play note:", e));
    }
  };
  const handleSelectDemoClip = (preset) => {
    setActiveDemoId(preset.id);
    setInputSourceMode("demo_clips");
    setUseRealWebcam(false);
    setIsCameraActive(true);
    const stream = syntheticVideoEngine.generateStream(preset.id);
    if (videoRef.current && stream) {
      videoRef.current.removeAttribute("src");
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn("[LiveTranslateView] Demo stream play note:", e));
    }
    handTrackerRef.current.forceSign(preset.id);
  };
  const handleTogglePlayPauseUploadedVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
      });
      setIsPlayingUploadedVideo(true);
    } else {
      videoRef.current.pause();
      setIsPlayingUploadedVideo(false);
    }
  };
  const handleRestartUploadedVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {
    });
    setIsPlayingUploadedVideo(true);
  };
  const handleChangePlaybackRate = (rate) => {
    setVideoPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };
  useEffect(() => {
    let isMounted = true;
    let permissionStatusObj = null;
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions.query({ name: "camera" }).then((status) => {
        if (!isMounted) return;
        permissionStatusObj = status;
        setHardwarePermissionStatus(status.state);
        const handlePermissionChange = () => {
          if (!isMounted) return;
          console.log("[LiveTranslateView] Camera permission state changed:", status.state);
          setHardwarePermissionStatus(status.state);
          if (status.state === "granted") {
            if (isCameraActive) {
              setUseRealWebcam(true);
              setCameraError(null);
              setPermissionError(null);
              setCameraRetryCount((c) => c + 1);
            }
          } else if (status.state === "denied") {
            if (useRealWebcam && isCameraActive) {
              setCameraStreamStatus("error");
              setCameraError({
                type: "permission_denied",
                title: "Camera Permission Blocked",
                message: "Camera permission was denied in browser settings.",
                tips: 'Click the lock or camera icon in your address bar to allow camera access, then click "Retry Camera".',
                canRetry: true
              });
            }
          }
        };
        status.addEventListener("change", handlePermissionChange);
      }).catch(() => {
        if (isMounted) {
          setHardwarePermissionStatus("unsupported");
        }
      });
    } else {
      setHardwarePermissionStatus("unsupported");
    }
    const handleDeviceChange = () => {
      if (!isMounted) return;
      console.log("[LiveTranslateView] Media device change detected");
      if (cameraError?.type === "not_found" && isCameraActive && useRealWebcam) {
        setCameraRetryCount((c) => c + 1);
      }
    };
    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }
    const handleVisibilityChange = () => {
      if (!isMounted) return;
      if (document.visibilityState === "visible" && isCameraActive && useRealWebcam && cameraStreamStatus === "error") {
        if (navigator?.permissions?.query) {
          navigator.permissions.query({ name: "camera" }).then((status) => {
            if (status.state === "granted") {
              setCameraRetryCount((c) => c + 1);
            }
          }).catch(() => {
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      isMounted = false;
      if (permissionStatusObj) {
        try {
          permissionStatusObj.removeEventListener("change", () => {
          });
        } catch {
        }
      }
      if (navigator?.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [isCameraActive, useRealWebcam, cameraError?.type, cameraStreamStatus]);
  useEffect(() => {
    let isMounted = true;
    let fallbackCheckInterval = null;
    let slowLoadingTimer = null;
    let safetyTrackTimeout = null;
    if (isCameraActive && useRealWebcam) {
      setCameraSlowLoading(false);
      slowLoadingTimer = setTimeout(() => {
        if (isMounted) {
          setCameraSlowLoading(true);
        }
      }, 3500);
      const startCamera = async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (!isMounted) return;
          clearTimeout(slowLoadingTimer);
          setCameraStreamStatus("error");
          setCameraError({
            type: "unsupported",
            title: "Webcam Not Supported",
            message: "Your browser environment does not support mediaDevices.getUserMedia.",
            tips: "Please open this application in a modern browser with webcam support (Chrome, Edge, Safari, Firefox).",
            canRetry: false
          });
          return;
        }
        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((d) => d.kind === "videoinput");
            if (videoDevices.length === 0) {
              if (!isMounted) return;
              clearTimeout(slowLoadingTimer);
              setCameraStreamStatus("error");
              setCameraError({
                type: "not_found",
                title: "No Webcam Detected",
                message: "Your operating system reports 0 connected cameras or video capture devices.",
                tips: "Ensure your webcam is plugged in, check physical camera privacy shutter switches, and check OS camera permissions.",
                canRetry: true
              });
              setIsRetrying(false);
              return;
            }
          } catch (enumErr) {
            console.warn("[LiveTranslateView] enumerateDevices check note:", enumErr);
          }
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        setCameraStreamStatus("requesting_permission");
        setCameraError(null);
        setIsRetrying(true);
        try {
          const constraintsList = [
            {
              video: {
                facingMode: settings.cameraFacing ? { ideal: settings.cameraFacing } : void 0,
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            },
            {
              video: settings.cameraFacing ? { facingMode: { ideal: settings.cameraFacing } } : true
            },
            {
              video: true
            }
          ];
          let stream = null;
          let lastAcquisitionError = null;
          for (const constraints of constraintsList) {
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
              if (stream) break;
            } catch (err) {
              lastAcquisitionError = err;
              console.warn("[LiveTranslateView] Constraint set rejected, trying next fallback:", constraints, err);
            }
          }
          if (!stream) {
            throw lastAcquisitionError || new Error("Could not acquire webcam video stream.");
          }
          if (!isMounted || !stream) {
            if (stream) {
              stream.getTracks().forEach((t) => t.stop());
            }
            return;
          }
          mediaStreamRef.current = stream;
          setHardwarePermissionStatus("granted");
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const trackSettings = videoTrack.getSettings ? videoTrack.getSettings() : null;
            if (trackSettings?.width && trackSettings?.height) {
              setActiveStreamResolution({ width: trackSettings.width, height: trackSettings.height });
            }
            videoTrack.onended = () => {
              if (!isMounted) return;
              console.warn("[LiveTranslateView] Video track ended / camera disconnected.");
              setCameraStreamStatus("error");
              setCameraError({
                type: "disconnected",
                title: "Camera Disconnected",
                message: "The camera stream ended or the device was disconnected.",
                tips: 'Ensure your camera is connected, then click "Retry Camera Stream".',
                canRetry: true
              });
            };
            videoTrack.onmute = () => {
              console.warn("[LiveTranslateView] Video track muted by hardware or system.");
            };
            videoTrack.onunmute = () => {
              console.log("[LiveTranslateView] Video track unmuted.");
              if (isMounted) {
                setCameraStreamStatus("active");
                setCameraError(null);
              }
            };
          }
          let isActivated = false;
          const markActive = () => {
            if (isActivated || !isMounted) return;
            isActivated = true;
            clearTimeout(slowLoadingTimer);
            clearInterval(fallbackCheckInterval);
            clearTimeout(safetyTrackTimeout);
            setCameraSlowLoading(false);
            setCameraStreamStatus("active");
            setCameraError(null);
            setPermissionError(null);
            setIsRetrying(false);
            if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              setActiveStreamResolution({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
              });
            }
          };
          const bindToVideoElement = (el) => {
            el.muted = true;
            el.defaultMuted = true;
            el.setAttribute("muted", "");
            el.setAttribute("playsinline", "true");
            el.setAttribute("webkit-playsinline", "true");
            el.srcObject = stream;
            el.onloadedmetadata = markActive;
            el.onloadeddata = markActive;
            el.oncanplay = markActive;
            el.onplaying = markActive;
            el.ontimeupdate = markActive;
            try {
              const playPromise = el.play();
              if (playPromise !== void 0) {
                playPromise.then(() => markActive()).catch((err) => {
                  console.warn("[LiveTranslateView] Video play interaction note:", err);
                  markActive();
                });
              }
            } catch (err) {
              console.warn("[LiveTranslateView] Sync play call exception:", err);
              markActive();
            }
          };
          if (videoRef.current) {
            bindToVideoElement(videoRef.current);
          } else {
            const mountPoll = setInterval(() => {
              if (videoRef.current) {
                clearInterval(mountPoll);
                bindToVideoElement(videoRef.current);
              }
            }, 50);
            setTimeout(() => clearInterval(mountPoll), 1500);
          }
          fallbackCheckInterval = setInterval(() => {
            if (isActivated || !isMounted) {
              clearInterval(fallbackCheckInterval);
              return;
            }
            if (videoRef.current && (videoRef.current.readyState >= 1 || videoRef.current.videoWidth > 0 || videoRef.current.currentTime > 0)) {
              markActive();
            }
          }, 80);
          safetyTrackTimeout = setTimeout(() => {
            clearInterval(fallbackCheckInterval);
            const track = stream?.getVideoTracks()[0];
            if (!isActivated && isMounted && track && track.readyState === "live") {
              console.log("[LiveTranslateView] Safety activator: live track verified");
              markActive();
            }
          }, 1e3);
          setPermissionError(null);
        } catch (err) {
          if (!isMounted) return;
          clearTimeout(slowLoadingTimer);
          clearInterval(fallbackCheckInterval);
          clearTimeout(safetyTrackTimeout);
          console.warn("[LiveTranslateView] Camera initialization error:", err);
          let errType = "unknown";
          let title = "Camera Connection Failed";
          let message = err?.message || "Unable to connect to camera.";
          let tips = "Please ensure your camera is connected and permissions are allowed.";
          if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
            errType = "permission_denied";
            setHardwarePermissionStatus("denied");
            title = "Camera Permission Blocked";
            message = "Camera access was blocked by your browser or system.";
            tips = isInIframe ? 'Preview iFrame detected: Browsers block camera permission dialogs inside embedded frames. Click "Open in New Tab" below to allow camera access.' : 'Click the lock or camera icon in your address bar, switch Camera to "Allow", then click "Retry Camera Stream".';
          } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
            errType = "not_found";
            title = "Camera Not Detected";
            message = "No video capture hardware was found on your device.";
            tips = "Connect a webcam or enable your camera in operating system privacy settings.";
          } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
            errType = "in_use";
            title = "Camera Already in Use";
            message = "Your camera is currently locked by another application or browser tab.";
            tips = 'Close other video calling apps (Zoom, Meet, Teams) or browser tabs using the camera, then click "Retry Camera Stream".';
          } else if (err?.name === "OverconstrainedError") {
            errType = "unknown";
            title = "Resolution Constraint";
            message = "The requested camera resolution is not supported by your hardware.";
            tips = "Try switching camera facing mode or refreshing the page.";
          } else if (err?.name === "SecurityError") {
            errType = "security";
            title = "Security Restriction";
            message = "Camera access is restricted in this context (HTTPS required).";
            tips = isInIframe ? 'Preview iFrame restriction: Click "Open in New Tab" below to run the app directly with full camera permissions.' : "Ensure you are accessing this application via HTTPS or a trusted local host.";
          }
          setCameraStreamStatus("error");
          setCameraError({
            type: errType,
            title,
            message,
            tips,
            canRetry: true
          });
          setPermissionError(message);
          setIsRetrying(false);
        }
      };
      startCamera();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraStreamStatus("idle");
      setCameraError(null);
      setIsRetrying(false);
      setCameraSlowLoading(false);
    }
    return () => {
      isMounted = false;
      clearTimeout(slowLoadingTimer);
      clearInterval(fallbackCheckInterval);
      clearTimeout(safetyTrackTimeout);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isCameraActive, useRealWebcam, settings.cameraFacing, cameraRetryCount]);
  useEffect(() => {
    if (useRealWebcam && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch(() => {
        });
      }
    }
  }, [useRealWebcam, cameraStreamStatus]);
  useEffect(() => {
    if (!isCameraActive || translationMode !== "sign_to_text") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const tracker = handTrackerRef.current;
    if (videoRef.current && (inputSourceMode === "webcam" || inputSourceMode === "video_upload" || inputSourceMode === "demo_clips")) {
      tracker.setElements(videoRef.current, canvas);
    } else {
      tracker.setElements(null, canvas);
    }
    let lastTelemetryTime = 0;
    let lastActiveSignKey = "";
    let lastDetectionTime = 0;
    let lastReportedGesture = "";
    const DETECTION_INTERVAL_MS = 25;
    const render = (time) => {
      if (document.hidden) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }
      try {
        if (inputSourceMode === "webcam" && cameraStreamStatus !== "active") {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          animationFrameId.current = requestAnimationFrame(render);
          return;
        }
        const now = performance.now();
        const shouldRunDetection = now - lastDetectionTime >= DETECTION_INTERVAL_MS;
        if (shouldRunDetection) {
          lastDetectionTime = now;
        }
        const detection = tracker.processFrame(time, shouldRunDetection);
        if (now - lastTelemetryTime > 350) {
          lastTelemetryTime = now;
          lastReportedGesture = detection.gesture;
          if (detection.autoCentering && detection.autoCentering.enabled) {
            setAutoCenterTelemetry(detection.autoCentering);
          }
          setTfTelemetry({
            fps: detection.fps,
            gesture: detection.gesture,
            confidence: detection.confidence,
            isReal: detection.isRealHandDetected,
            holdProgress: detection.holdProgress
          });
        }
        if (detection.signMeaning && detection.signMeaning.signName !== lastActiveSignKey) {
          lastActiveSignKey = detection.signMeaning.signName;
          setActiveSignMeaning(detection.signMeaning);
        }
        if (detection.isCommitted && detection.signMeaning) {
          const textOutput = detection.signMeaning.translatedText;
          setFullSentence((prev) => {
            if (!prev || prev.trim() === "") {
              return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
            }
            return `${prev.trim()} ${textOutput}`;
          });
          setRecognizedSigns((prev) => [
            ...prev.slice(-14),
            {
              text: `${detection.signMeaning?.symbol} ${detection.signMeaning?.translatedText.toUpperCase()}`,
              confidence: detection.confidence,
              timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              hand: "right",
              type: "word"
            }
          ]);
          if (autoSpeakOnCommit) {
            speakText(textOutput, settings.speechVoiceRate, settings.speechVoicePitch);
          }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (showMesh) {
          tracker.draw(ctx, detection, {
            color: detection.isRealHandDetected ? "#10B981" : "#6366F1",
            jointColor: "#38BDF8",
            showBoundingBox: true,
            showHUD: true,
            showAlignmentGuide,
            labelPrefix: `${settings.primarySignLanguage} MediaPipe CV`
          });
        }
      } catch (err) {
        console.warn("[LiveTranslateView] Non-fatal frame error:", err);
      } finally {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };
    animationFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [
    isCameraActive,
    translationMode,
    inputSourceMode,
    showMesh,
    showAlignmentGuide,
    useRealWebcam,
    cameraStreamStatus,
    autoSpeakOnCommit,
    settings.primarySignLanguage,
    settings.speechVoiceRate,
    settings.speechVoicePitch
  ]);
  const handleTestSign = (signKey) => {
    handTrackerRef.current.forceSign(signKey);
    const meaning = dictionaryMap[signKey];
    if (meaning) {
      setActiveSignMeaning(meaning);
    }
  };
  const handleSaveSign = (key, newSign) => {
    const registeredKey = handTrackerRef.current.registerCustomSign(key, newSign);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
    setActiveSignMeaning(newSign);
    handTrackerRef.current.forceSign(registeredKey);
  };
  const handleDeleteCustomSign = (e, key) => {
    e.stopPropagation();
    handTrackerRef.current.deleteCustomSign(key);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
  };
  const handleCommitCurrentSign = () => {
    if (!activeSignMeaning) return;
    const textOutput = activeSignMeaning.translatedText;
    setFullSentence((prev) => {
      if (!prev || prev.trim() === "") {
        return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
      }
      return `${prev.trim()} ${textOutput}`;
    });
    setRecognizedSigns((prev) => [
      ...prev.slice(-14),
      {
        text: `${activeSignMeaning.symbol} ${activeSignMeaning.translatedText.toUpperCase()}`,
        confidence: activeSignMeaning.confidence,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        hand: "right",
        type: "word"
      }
    ]);
    speakText(textOutput, settings.speechVoiceRate, settings.speechVoicePitch);
  };
  const handleToggleRecording = async () => {
    const recorder = recorderRef.current;
    const canvas = canvasRef.current;
    if (isRecording) {
      const result = await recorder.stopRecording();
      setIsRecording(false);
      if (result) {
        setActiveRecordingResult(result);
        setShowRecordedModal(true);
      }
    } else {
      if (!canvas) return;
      const videoEl = useRealWebcam ? videoRef.current : null;
      const started = await recorder.startRecording(
        canvas,
        videoEl,
        mediaStreamRef.current,
        (sec) => {
          setRecordedDuration(sec);
        }
      );
      if (started) {
        setIsRecording(true);
        setRecordedDuration(0);
      }
    }
  };
  const formatRecordedTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  useEffect(() => {
    speechListenerRef.current = new SpeechToSignListener();
    return () => {
      speechListenerRef.current?.stop();
    };
  }, []);
  const handleToggleMic = () => {
    if (!speechListenerRef.current?.isSupported()) {
      alert("Speech recognition is not supported in this browser. You can type text directly in the box.");
      return;
    }
    if (isListeningMic) {
      speechListenerRef.current.stop();
      setIsListeningMic(false);
    } else {
      speechListenerRef.current.start(
        (transcript) => {
          setTextInput(transcript);
        },
        (err) => {
          console.warn(err);
          setIsListeningMic(false);
        }
      );
      setIsListeningMic(true);
    }
  };
  const handleTrainSample = async (label) => {
    return handTrackerRef.current.trainCurrentPoseAsSample(label);
  };
  const handleSwitchBackend = async (backend) => {
    await handTrackerRef.current.setTensorFlowBackend(backend);
    setTfEngineTelemetry(handTrackerRef.current.getTensorFlowTelemetry());
  };
  const handleToggleTfModel = (enabled) => {
    setIsTfModelEnabled(enabled);
    handTrackerRef.current.setUseTensorFlowClassifier(enabled);
  };
  const handleSpeakTranscript = () => {
    const textToSpeak = fullSentence || recognizedSigns.map((s) => s.text).join(" ");
    speakText(textToSpeak, settings.speechVoiceRate, settings.speechVoicePitch);
  };
  const handleCopy = () => {
    const textToCopy = fullSentence || recognizedSigns.map((s) => s.text).join(" ");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const parsedWords = textInput.toUpperCase().split(/\s+/).filter(Boolean);
  const currentAnimatedWord = parsedWords[animatingGestureIndex % Math.max(1, parsedWords.length)] || "READY";
  useEffect(() => {
    if (!isPlayingSignAnimation || parsedWords.length === 0) return;
    const interval = setInterval(() => {
      setAnimatingGestureIndex((prev) => (prev + 1) % parsedWords.length);
    }, 2e3 / animationSpeed);
    return () => clearInterval(interval);
  }, [isPlayingSignAnimation, parsedWords.length, animationSpeed]);
  const dictionaryList = Object.entries(dictionaryMap).map(([key, item]) => ({
    key,
    ...item
  }));
  const filteredDictionary = selectedSignCategory === "all" ? dictionaryList : dictionaryList.filter((d) => d.category === selectedSignCategory);
  return <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {
    /* Top Header & Translation Mode Toggle Bar */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              {currentLanguage.name} ({currentLanguage.code})
            </span>
            <span className="text-xs text-slate-400 font-medium">
              TensorFlow HandPose Model Active ({dictionaryList.length} Signs Recognized)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Real-Time Sign-to-Text Translation
          </h1>
        </div>

        {
    /* Right Controls: Add Sign & Mode Switcher */
  }
        <div className="flex flex-wrap items-center gap-2">
          <button
    onClick={() => setShowAddSignModal(true)}
    className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
  >
            <Plus className="w-4 h-4" />
            <span>Add Sign Recognition</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-600/40">
            <button
    onClick={() => setTranslationMode("sign_to_text")}
    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${translationMode === "sign_to_text" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"}`}
  >
              <HandMetal className="w-4 h-4" />
              <span>Sign → Text (Camera CV)</span>
            </button>

            <button
    onClick={() => setTranslationMode("speech_to_sign")}
    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${translationMode === "speech_to_sign" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"}`}
  >
              <Mic className="w-4 h-4" />
              <span>Speech/Text → Sign (Avatar)</span>
            </button>
          </div>
        </div>
      </div>

      {translationMode === "sign_to_text" ? (
    /* CAMERA AI TRANSLATION VIEW */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {
      /* Main Video & Landmark Stage (Left 7 Cols) */
    }
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {
      /* Multi-Source Camera & Video Alternative Selector Panel */
    }
            <VideoSourcePanel
      inputMode={inputSourceMode}
      onSelectMode={handleSelectInputMode}
      onUploadVideo={handleUploadVideo}
      onSelectDemoClip={handleSelectDemoClip}
      activeDemoId={activeDemoId}
      uploadedFileName={uploadedFileName}
      isPlayingVideo={isPlayingUploadedVideo}
      onTogglePlayPause={handleTogglePlayPauseUploadedVideo}
      onRestartVideo={handleRestartUploadedVideo}
      playbackRate={videoPlaybackRate}
      onChangePlaybackRate={handleChangePlaybackRate}
      onOpenDiagnostics={() => setShowDiagnosticsOverlay(true)}
    />

            {
      /* iFrame Helper Banner if in AI Studio / Embedded iframe and using webcam */
    }
            {isInIframe && inputSourceMode === "webcam" && <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs shadow-md animate-in fade-in">
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-tight">
                    Running inside preview frame: Browser security may restrict camera prompts in iframes.
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <a
      href={getSafeCurrentUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
    >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 transition-colors border border-slate-700 cursor-pointer"
    >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Webcam Guide</span>
                  </button>
                </div>
              </div>}

            {
      /* Live Camera / Video Feed Container */
    }
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
              
              {
      /* Notice banner if camera timed out or was switched */
    }
              {cameraNoticeMessage && inputSourceMode === "webcam" && <div className="absolute top-3 left-3 right-3 z-40 p-2.5 bg-indigo-950/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl shadow-xl flex items-center justify-between text-xs text-indigo-200 animate-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px] sm:text-xs truncate sm:whitespace-normal">{cameraNoticeMessage}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
      onClick={() => {
        setCameraNoticeMessage(null);
        setUseRealWebcam(true);
        setCameraRetryCount((c) => c + 1);
      }}
      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] sm:text-xs transition-colors cursor-pointer"
    >
                      Retry Webcam
                    </button>
                    <button
      onClick={() => setCameraNoticeMessage(null)}
      className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
      title="Dismiss notice"
    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>}

              {isCameraActive ? <>
                  {
      /* Real WebCam / Uploaded Video / Demo Video Feed */
    }
                  {inputSourceMode !== "simulator" ? <>
                      <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      loop={inputSourceMode === "video_upload"}
      style={{
        transform: inputSourceMode === "webcam" ? `scaleX(-${Number(cameraZoom) || 1}) scaleY(${Number(cameraZoom) || 1}) translate(${(Number(cameraPan?.x) || 0) * 12}%, ${(Number(cameraPan?.y) || 0) * 12}%)` : `scale(${Number(cameraZoom) || 1}) translate(${(Number(cameraPan?.x) || 0) * 12}%, ${(Number(cameraPan?.y) || 0) * 12}%)`,
        transformOrigin: "center center"
      }}
      className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-out ${inputSourceMode === "webcam" && cameraStreamStatus !== "active" ? "opacity-20 filter blur-xs" : "opacity-100"}`}
    />

                      {
      /* Empty Uploaded Video Prompt */
    }
                      {inputSourceMode === "video_upload" && !uploadedVideoUrl && <div className="absolute inset-0 z-20 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center">
                          <Film className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                          <h4 className="text-sm font-bold text-white mb-1">No Video File Selected</h4>
                          <p className="text-xs text-slate-400 max-w-xs mb-3">
                            Upload an MP4, WebM, or MOV video of sign language to track hands and recognize gestures.
                          </p>
                        </div>}

                      {
      /* Active Demo Clip Badge */
    }
                      {inputSourceMode === "demo_clips" && <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center space-x-2 shadow-lg">
                          <Film className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Demo Feed: {activeDemoId}</span>
                        </div>}

                      {
      /* Camera Stream Loading State Indicator */
    }
                      {inputSourceMode === "webcam" && (cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission") && <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                          <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                              <Camera className="w-8 h-8 animate-pulse" />
                            </div>
                            <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-indigo-400/40 animate-spin" style={{ animationDuration: "6s" }} />
                          </div>

                          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>
                              {cameraStreamStatus === "requesting_permission" ? "Awaiting Camera Permission..." : "Connecting Camera to AI Engine..."}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-white mb-1.5 max-w-sm">
                            {cameraStreamStatus === "requesting_permission" ? 'Please click "Allow" in your browser prompt' : "Connecting video hardware to TensorFlow tracking engine..."}
                          </h4>

                          <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                            {cameraStreamStatus === "requesting_permission" ? "Your browser may show a permission dialog near the address bar. Grant access to begin real-time sign recognition." : "Initializing video frames, frame buffers, and neural hand landmark detection pipeline."}
                          </p>

                          {
      /* Slow loading helper card if taking longer than expected */
    }
                          {cameraSlowLoading && <div className="mb-4 p-3.5 bg-amber-950/70 border border-amber-500/50 rounded-2xl text-xs text-amber-200 max-w-md animate-in fade-in space-y-2">
                              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>Camera taking longer than expected?</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {isInIframe ? 'Preview iFrame detected: Browsers often block camera prompts in embedded frames. Click "Open in New Tab" for direct webcam access, or switch to the 3D Simulator / Video Upload.' : 'Look for the lock or camera icon in your browser address bar to click "Allow", or check if another app is using the webcam.'}
                              </p>
                              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                {isInIframe && <a
      href={getSafeCurrentUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
    >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open in New Tab</span>
                                  </a>}
                                <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-colors flex items-center space-x-1.5 border border-amber-500/30 shadow-sm cursor-pointer"
    >
                                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Webcam Troubleshooter</span>
                                </button>
                                <button
      onClick={() => handleSelectInputMode("simulator")}
      className="py-1.5 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
    >
                                  <HandMetal className="w-3.5 h-3.5" />
                                  <span>Use 3D Simulator</span>
                                </button>
                              </div>
                            </div>}

                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {isInIframe && <a
      href={getSafeCurrentUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
    >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open in New Tab</span>
                              </a>}

                            <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
    >
                              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Why isn't Webcam Working?</span>
                            </button>

                            <button
      onClick={() => {
        setCameraRetryCount((c) => c + 1);
      }}
      className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/30 transition-colors cursor-pointer flex items-center space-x-1 shadow-sm"
      title="Force Re-attempt Camera"
    >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>

                            <button
      onClick={() => handleSelectInputMode("simulator")}
      className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
    >
                              <HandMetal className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Switch to 3D Simulator</span>
                            </button>
                          </div>
                        </div>}

                      {
      /* Camera Stream Error State Indicator & Recovery Interface */
    }
                      {inputSourceMode === "webcam" && cameraStreamStatus === "error" && cameraError && <div className="absolute inset-0 z-30 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-500/10">
                            {cameraError.type === "permission_denied" ? <ShieldAlert className="w-8 h-8" /> : cameraError.type === "not_found" ? <VideoOff className="w-8 h-8" /> : cameraError.type === "in_use" ? <AlertCircle className="w-8 h-8" /> : <CameraOff className="w-8 h-8" />}
                          </div>

                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 mb-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{cameraError.title}</span>
                          </div>

                          <h4 className="text-base font-bold text-white mb-2 max-w-md">
                            {cameraError.message}
                          </h4>

                          <div className="p-3.5 my-2 max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs text-slate-300 leading-relaxed shadow-inner">
                            <span className="font-bold text-amber-400 flex items-center space-x-1.5 mb-1">
                              <span>💡 Alternatives & Fixes:</span>
                            </span>
                            <p className="text-slate-300">{cameraError.tips}</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
                            {cameraError.canRetry && <button
      onClick={handleRetryCamera}
      disabled={isRetrying}
      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
    >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                                <span>{isRetrying ? "Connecting to Camera..." : "Retry Camera Stream"}</span>
                              </button>}

                            {isInIframe && <a
      href={getSafeCurrentUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
    >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open in New Tab (Bypass iFrame)</span>
                              </a>}

                            <button
      onClick={() => handleSelectInputMode("simulator")}
      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md"
    >
                              <HandMetal className="w-3.5 h-3.5" />
                              <span>Switch to 3D Simulator (No Webcam)</span>
                            </button>

                            <button
      onClick={() => handleSelectInputMode("demo_clips")}
      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md"
    >
                              <Film className="w-3.5 h-3.5" />
                              <span>Play Demo Sign Video</span>
                            </button>

                            <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
    >
                              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Camera Diagnostic</span>
                            </button>
                          </div>
                        </div>}
                    </> : (
      /* Simulated 3D Video Background for Test Mode */
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-44 h-44 rounded-full bg-indigo-500/10 animate-ping absolute pointer-events-none" />
                      <div className="text-center z-0 opacity-80 mb-3">
                        <HandMetal className="w-14 h-14 text-indigo-400 mx-auto mb-2" />
                        <p className="text-xs font-mono font-bold text-indigo-300">TensorFlow Neural Kinematics Simulation Mode</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-1">Generating 21 3D spatial hand landmarks with anatomical physics.</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 z-10">
                        <button
        onClick={() => handleSelectInputMode("webcam")}
        className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
      >
                          <Camera className="w-4 h-4" />
                          <span>Switch to Live Webcam Feed</span>
                        </button>
                        <button
        onClick={() => handleSelectInputMode("demo_clips")}
        className="px-3.5 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-md"
      >
                          <Film className="w-4 h-4 text-cyan-400" />
                          <span>Sign Video Library</span>
                        </button>
                      </div>
                    </div>
    )}

                  {
      /* Tracking Landmark Canvas Overlay (1280x720) */
    }
                  <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />

                  {
      /* Live Scan Line Effect */
    }
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 animate-scan pointer-events-none" />

                  {
      /* Floating Zoom & Hand Alignment HUD Controls */
    }
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
                    {
      /* Compact Glass Zoom Pill Bar */
    }
                    <div className="bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center space-x-1.5">
                      {
      /* Auto-Centering Quick Toggle */
    }
                      <button
      onClick={handleToggleAutoCenter}
      className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${isAutoCentering ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
      title="Toggle Computer Vision Hand Auto-Centering & Smart Framing"
    >
                        <Crosshair className={`w-3.5 h-3.5 ${isAutoCentering ? "text-emerald-100" : ""}`} />
                        <span className="text-[10px] font-bold pr-0.5">{isAutoCentering ? "Auto ON" : "Auto"}</span>
                      </button>

                      {
      /* Zoom Out Button */
    }
                      <button
      onClick={handleZoomOut}
      disabled={cameraZoom <= 1 || isAutoCentering}
      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
      title="Zoom Out (Reduce camera crop)"
    >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      {
      /* Zoom Level Indicator / Popover Toggle */
    }
                      <button
      onClick={() => setShowZoomMenu(!showZoomMenu)}
      className="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
      title="Click to open Zoom Presets & Hand Calibration"
    >
                        <Focus className="w-3 h-3" />
                        <span>{cameraZoom.toFixed(2)}x</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showZoomMenu ? "rotate-180" : ""}`} />
                      </button>

                      {
      /* Zoom In Button */
    }
                      <button
      onClick={handleZoomIn}
      disabled={cameraZoom >= 3.5 || isAutoCentering}
      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
      title="Zoom In (Enlarge hand & fingers for precise tracking)"
    >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {
      /* Reset 1.0x (if zoomed or panned) */
    }
                      {(cameraZoom > 1 || cameraPan.x !== 0 || cameraPan.y !== 0) && !isAutoCentering && <button
      onClick={handleResetZoom}
      className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
      title="Reset to 1.0x Default Fit"
    >
                          1.0x
                        </button>}

                      {
      /* Hand Alignment Guide Toggle */
    }
                      <button
      onClick={() => setShowAlignmentGuide(!showAlignmentGuide)}
      className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${showAlignmentGuide ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
      title="Toggle Hand Alignment Guide & Sweet-spot Reticle"
    >
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold pr-0.5">{showAlignmentGuide ? "Guide ON" : "Align"}</span>
                      </button>
                    </div>

                    {
      /* Precision Zoom & Framing Popover Drawer */
    }
                    {showZoomMenu && <div className="w-80 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/90 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white flex items-center space-x-1.5">
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Camera Zoom & Framing</span>
                          </span>
                          <button
      onClick={handleResetZoom}
      className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
    >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset</span>
                          </button>
                        </div>

                        {
      /* Auto-Centering Toggle Card */
    }
                        <div className={`p-3 rounded-xl border transition-all ${isAutoCentering ? "bg-emerald-950/40 border-emerald-500/50" : "bg-slate-800/60 border-slate-700/60"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Crosshair className={`w-4 h-4 ${isAutoCentering ? "text-emerald-400" : "text-slate-400"}`} />
                              <div>
                                <span className="font-bold text-white block">Auto-Center Hand (CV)</span>
                                <span className="text-[10px] text-slate-400">Automatic optical hand tracking</span>
                              </div>
                            </div>
                            <input
      type="checkbox"
      checked={isAutoCentering}
      onChange={handleToggleAutoCenter}
      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
    />
                          </div>

                          {isAutoCentering && <div className="mt-2 pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[11px]">
                              <span className="text-emerald-300 font-mono flex items-center space-x-1">
                                <span className={`w-2 h-2 rounded-full ${autoCenterTelemetry.isTracking ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse"}`} />
                                <span>{autoCenterTelemetry.statusText}</span>
                              </span>
                              <span className="text-slate-300 font-mono">
                                Zoom: <strong className="text-emerald-400">{cameraZoom.toFixed(2)}x</strong>
                              </span>
                            </div>}
                        </div>

                        {
      /* Quick Presets */
    }
                        <div className={isAutoCentering ? "opacity-50 pointer-events-none" : ""}>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                            Quick Zoom Presets {isAutoCentering && "(Disabled while Auto-Center is ON)"}
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
      { label: "1.0x Fit", val: 1 },
      { label: "1.25x", val: 1.25 },
      { label: "1.5x Opt", val: 1.5 },
      { label: "1.75x", val: 1.75 },
      { label: "2.0x Close", val: 2 },
      { label: "2.5x", val: 2.5 },
      { label: "3.0x Macro", val: 3 },
      { label: "3.5x Max", val: 3.5 }
    ].map((preset) => <button
      key={preset.val}
      onClick={() => handleSetZoom(preset.val)}
      disabled={isAutoCentering}
      className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${Math.abs(cameraZoom - preset.val) < 0.05 ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
    >
                                {preset.label}
                              </button>)}
                          </div>
                        </div>

                        {
      /* Continuous Zoom Slider */
    }
                        <div className={`space-y-1 ${isAutoCentering ? "opacity-50 pointer-events-none" : ""}`}>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>Magnification</span>
                            <span className="font-mono text-indigo-400 font-bold">{cameraZoom.toFixed(2)}x</span>
                          </div>
                          <input
      type="range"
      min="1.0"
      max="3.5"
      step="0.05"
      value={cameraZoom}
      disabled={isAutoCentering}
      onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
    />
                        </div>

                        {
      /* Finger Span Calibration Scale */
    }
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>Skeletal Hand Span Scale</span>
                            <span className="font-mono text-emerald-400 font-bold">{Math.round(calibrationScale * 100)}%</span>
                          </div>
                          <input
      type="range"
      min="0.75"
      max="1.35"
      step="0.05"
      value={calibrationScale}
      onChange={(e) => setCalibrationScale(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
    />
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Fine-tune finger length mapping to align precisely with your fingers.
                          </p>
                        </div>

                        {
      /* Camera Framing Pan D-Pad */
    }
                        {cameraZoom > 1.05 && <div className="pt-2 border-t border-slate-800">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center space-x-1">
                              <Move className="w-3 h-3 text-slate-400" />
                              <span>Nudge Camera Frame Offset</span>
                            </label>
                            <div className="flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-1 w-28 text-center">
                                <div />
                                <button
      onClick={() => handlePanNudge(0, -0.15)}
      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
      title="Pan Up"
    >
                                  ▲
                                </button>
                                <div />
                                <button
      onClick={() => handlePanNudge(-0.15, 0)}
      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
      title="Pan Left"
    >
                                  ◀
                                </button>
                                <button
      onClick={() => setCameraPan({ x: 0, y: 0 })}
      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-indigo-300 font-bold text-[9px] cursor-pointer"
      title="Center View"
    >
                                  •
                                </button>
                                <button
      onClick={() => handlePanNudge(0.15, 0)}
      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
      title="Pan Right"
    >
                                  ▶
                                </button>
                                <div />
                                <button
      onClick={() => handlePanNudge(0, 0.15)}
      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
      title="Pan Down"
    >
                                  ▼
                                </button>
                                <div />
                              </div>
                            </div>
                          </div>}
                      </div>}
                  </div>

                  {
      /* Top Overlay Badges & Diagnostic Quick Bar */
    }
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
                    <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg cursor-pointer transition-colors"
      title="Click to inspect camera hardware, resolution, and permission diagnostics"
    >
                      <span className={`flex h-2.5 w-2.5 rounded-full ${useRealWebcam ? cameraStreamStatus === "active" && tfTelemetry.isReal ? "bg-emerald-400 animate-ping" : cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission" ? "bg-amber-400 animate-pulse" : cameraStreamStatus === "error" ? "bg-rose-400" : "bg-emerald-400" : "bg-indigo-400 animate-pulse"}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${useRealWebcam ? cameraStreamStatus === "active" ? "text-emerald-400" : cameraStreamStatus === "error" ? "text-rose-400" : "text-amber-400" : "text-indigo-400"}`}>
                        {useRealWebcam ? cameraStreamStatus === "active" ? tfTelemetry.isReal ? "TensorFlow Camera HD" : "Camera Active" : cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission" ? "Starting Camera..." : cameraStreamStatus === "error" ? "Camera Offline" : "Webcam" : "AI Simulation Mode"} • {settings.primarySignLanguage}
                      </span>
                    </button>

                    {
      /* Quick Resolution & Hardware Permission Pill */
    }
                    {useRealWebcam && <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="flex items-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-slate-700/80 text-[11px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
      title="Camera Resolution & Permission Diagnostics"
    >
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-white font-bold">
                          {activeStreamResolution ? `${activeStreamResolution.width}\xD7${activeStreamResolution.height}` : "720p HD"}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className={hardwarePermissionStatus === "granted" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {hardwarePermissionStatus === "granted" ? "Perm: OK" : `Perm: ${hardwarePermissionStatus}`}
                        </span>
                      </button>}

                    {
      /* Troubleshoot / Why Webcam Isn't Working Direct Pill */
    }
                    <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer shadow-lg"
      title="Why is Webcam Not Working? Click for instant hardware scan, iframe checks, and fixes"
    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Webcam Help</span>
                    </button>

                    {isRecording && <div className="flex items-center space-x-1.5 bg-rose-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-rose-700 text-rose-300 text-xs font-mono font-bold animate-pulse">
                        <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                        <span>REC {formatRecordedTime(recordedDuration)}</span>
                      </div>}
                  </div>

                  {
      /* Bottom Active Translation Card */
    }
                  {(!useRealWebcam || cameraStreamStatus === "active") && <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 animate-in fade-in duration-200">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-2xl shadow-inner">
                          {activeSignMeaning.symbol}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                              {activeSignMeaning.signName}
                            </span>
                            {activeSignMeaning.isCustom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-extrabold">
                                Custom Sign
                              </span>}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                              {Math.round(activeSignMeaning.confidence * 100)}% Match
                            </span>
                          </div>
                          <p className="text-lg font-black text-white tracking-wide mt-0.5">
                            "{activeSignMeaning.translatedText}"
                          </p>
                          <p className="text-[11px] text-slate-300 line-clamp-1 max-w-md">
                            {activeSignMeaning.meaning}
                          </p>
                        </div>
                      </div>

                      {
      /* Commit & Auto Progress indicator */
    }
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
      onClick={handleCommitCurrentSign}
      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
      title="Commit this translated sign immediately to the sentence"
    >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Text</span>
                        </button>
                      </div>
                    </div>}
                </> : <div className="text-center p-8">
                  <CameraOff className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-semibold mb-1">Camera Feed Paused</p>
                  <p className="text-xs text-slate-500 max-w-xs mb-4">
                    Enable camera to start live sign language landmark tracking and translation.
                  </p>
                  <button
      onClick={() => setIsCameraActive(true)}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
    >
                    Start Translation Camera
                  </button>
                </div>}
            </div>

            {
      /* Camera Toolbar Controls */
    }
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <button
      onClick={() => setIsCameraActive(!isCameraActive)}
      className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${isCameraActive ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200" : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"}`}
    >
                  {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  <span>{isCameraActive ? "Camera On" : "Camera Off"}</span>
                </button>

                <button
      onClick={() => {
        if (!useRealWebcam) {
          setUseRealWebcam(true);
          setCameraRetryCount((c) => c + 1);
        } else {
          setUseRealWebcam(false);
        }
      }}
      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${useRealWebcam ? cameraStreamStatus === "error" ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700" : "bg-indigo-600 text-white shadow-xs" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
    >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {useRealWebcam ? cameraStreamStatus === "loading" || cameraStreamStatus === "requesting_permission" ? "Connecting..." : cameraStreamStatus === "error" ? "Webcam Error" : "Using Webcam" : "Simulation Mode"}
                  </span>
                </button>

                {cameraStreamStatus === "error" && useRealWebcam && <button
      onClick={handleRetryCamera}
      disabled={isRetrying}
      className="px-2.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
      title="Retry Camera Initialization"
    >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                    <span>Retry</span>
                  </button>}

                <button
      onClick={() => setShowMesh(!showMesh)}
      className={`p-2 rounded-xl text-xs font-semibold transition-colors ${showMesh ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-500/30" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}
      title="Toggle 21-point Hand Landmarks Skeleton Mesh"
    >
                  Mesh {showMesh ? "ON" : "OFF"}
                </button>

                {
      /* Auto Speak on Commit */
    }
                <button
      onClick={() => setAutoSpeakOnCommit(!autoSpeakOnCommit)}
      className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${autoSpeakOnCommit ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
      title="Automatically speak each committed sign out loud"
    >
                  {autoSpeakOnCommit ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Auto TTS {autoSpeakOnCommit ? "ON" : "OFF"}</span>
                </button>

                {
      /* Record Translation Video Button */
    }
                <button
      onClick={handleToggleRecording}
      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${isRecording ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
      title={isRecording ? "Stop Recording" : "Record Translation Session"}
    >
                  <Circle className="w-3.5 h-3.5 fill-current" />
                  <span>{isRecording ? `REC ${formatRecordedTime(recordedDuration)}` : "Record"}</span>
                </button>

                {
      /* Camera Hardware Diagnostics & Stream Resolution Inspector */
    }
                <button
      onClick={() => setShowDiagnosticsOverlay(true)}
      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${showDiagnosticsOverlay ? "bg-indigo-600 text-white shadow-xs" : isDarkFeedWarning ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-500/50 animate-pulse" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
      title="Inspect Camera Hardware, Permissions, Resolution & Darkness Troubleshooting"
    >
                  <Activity className={`w-3.5 h-3.5 ${isDarkFeedWarning ? "text-amber-600 dark:text-amber-400" : "text-indigo-500 dark:text-indigo-400"}`} />
                  <span>Diagnostics</span>
                  {activeStreamResolution && <span className="hidden sm:inline text-[10px] font-mono opacity-75">
                      ({activeStreamResolution.width}×{activeStreamResolution.height})
                    </span>}
                </button>

                {
      /* Zoom, Auto-Center & Alignment Controls */
    }
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                  <button
      onClick={handleToggleAutoCenter}
      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${isAutoCentering ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"}`}
      title="Toggle Real-Time Hand Auto-Centering (Computer Vision)"
    >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Auto-Center</span>
                  </button>
                  <button
      onClick={handleZoomOut}
      disabled={cameraZoom <= 1 || isAutoCentering}
      className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
      title="Zoom Out Camera (0.25x step)"
    >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
      onClick={() => setShowZoomMenu(!showZoomMenu)}
      className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-2xs hover:bg-slate-50 transition-colors flex items-center space-x-1 cursor-pointer"
      title="Adjust Camera Zoom & Alignment Settings"
    >
                    <span>{cameraZoom.toFixed(2)}x</span>
                  </button>
                  <button
      onClick={handleZoomIn}
      disabled={cameraZoom >= 3.5 || isAutoCentering}
      className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
      title="Zoom In Camera (0.25x step)"
    >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
      onClick={() => setShowAlignmentGuide(!showAlignmentGuide)}
      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${showAlignmentGuide ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"}`}
      title="Toggle Hand Alignment Guide Reticle"
    >
                    <Target className="w-3.5 h-3.5" />
                    <span>Guide</span>
                  </button>
                </div>

                {
      /* Free Finger Motion Studio Toggle */
    }
                <button
      onClick={() => setShowFreeFingerStudio(!showFreeFingerStudio)}
      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${showFreeFingerStudio ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/30"}`}
      title="Open Free Finger Articulation & Dynamic Motion Studio"
    >
                  <HandMetal className="w-4 h-4" />
                  <span>Free Fingers Studio {showFreeFingerStudio ? "\u25B2" : "\u25BC"}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
      onClick={onOpenKeyboard}
      className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
    >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Sign Keyboard</span>
                </button>

                <button
      onClick={onOpenTutorial}
      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-700 transition-colors"
      title="How to Sign Tutorial"
    >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {
      /* Free Finger Articulation & Dynamic Motion Studio */
    }
            {showFreeFingerStudio && <FreeFingerController
      handTracker={handTrackerRef.current}
      currentPose={currentFingerPose}
      onPoseChange={(p) => setCurrentFingerPose(p)}
    />}

            {
      /* Pure JavaScript TensorFlow.js Deep Learning Engine HUD */
    }
            <TensorFlowEngineHUD
      telemetry={tfEngineTelemetry}
      isEnabled={isTfModelEnabled}
      onToggleEnabled={handleToggleTfModel}
      onTrainSample={handleTrainSample}
      onSwitchBackend={handleSwitchBackend}
    />

            {
      /* Interactive Sign Language Cheatsheet & Live Symbol Tester */
    }
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Sign Language Symbols & Recognition Dictionary ({dictionaryList.length})
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
      onClick={() => setShowAddSignModal(true)}
      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1 transition-colors"
    >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Sign</span>
                  </button>

                  {["all", "custom", "greetings", "common", "emergency", "actions", "numbers", "alphabet"].map((cat) => <button
      key={cat}
      onClick={() => setSelectedSignCategory(cat)}
      className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${selectedSignCategory === cat ? "bg-indigo-600 text-white font-bold" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}`}
    >
                      {cat}
                    </button>)}
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                Hold any of these signs in front of your camera or click to simulate and translate the symbol into text!
              </p>

              {
      /* Grid of Signs */
    }
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredDictionary.map((item) => {
      const isActive = activeSignMeaning.signName === item.signName;
      return <div
        key={item.key}
        onClick={() => handleTestSign(item.key)}
        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${isActive ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs" : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300"}`}
      >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{item.symbol}</span>
                        <div className="flex items-center space-x-1">
                          {item.isCustom && <button
        onClick={(e) => handleDeleteCustomSign(e, item.key)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all"
        title="Delete custom sign"
      >
                              <Trash2 className="w-3 h-3" />
                            </button>}
                          {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.translatedText}
                          </p>
                          {item.isCustom && <span className="text-[9px] px-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded font-bold">
                              User
                            </span>}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.signName}
                        </p>
                      </div>
                    </div>;
    })}
              </div>
            </div>

            {(permissionError || cameraError) && <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {cameraError ? cameraError.title : "Camera Permission Notice"}:
                    </span>{" "}
                    <span>{cameraError ? cameraError.message : permissionError}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
      onClick={handleRetryCamera}
      disabled={isRetrying}
      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
    >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                    <span>Retry</span>
                  </button>
                  <button
      onClick={() => {
        setPermissionError(null);
        setCameraError(null);
      }}
      className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold text-[11px] cursor-pointer"
    >
                    Dismiss
                  </button>
                </div>
              </div>}
          </div>

          {
      /* Transcript & Output Box (Right 5 Cols) */
    }
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {
      /* Live Generated Sentence Box */
    }
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Translated Sentence
                  </h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
      onClick={handleSpeakTranscript}
      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      title="Vocalize sentence (Text-to-Speech)"
    >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      title="Copy to Clipboard"
    >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {
      /* Editable/Interactive Transcript Box */
    }
              <textarea
      value={fullSentence}
      onChange={(e) => setFullSentence(e.target.value)}
      className={`w-full flex-1 min-h-[140px] p-4 rounded-2xl resize-none text-base leading-relaxed font-medium transition-all ${settings.highContrastCaptions ? "bg-black text-amber-300 font-mono border-2 border-amber-400" : "bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"}`}
      placeholder="Translated sign language will assemble here automatically as you sign in front of the camera..."
    />

              {
      /* Action Buttons */
    }
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
      onClick={() => setFullSentence("")}
      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1"
    >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Text</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
      onClick={handleSpeakTranscript}
      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
    >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak Audio (TTS)</span>
                  </button>
                </div>
              </div>
            </div>

            {
      /* Gesture Stream Feed Log */
    }
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Recognized Signs Feed Tape
                </span>
                <span className="text-[11px] text-slate-400">
                  {recognizedSigns.length} symbols captured
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                {recognizedSigns.slice().reverse().map((sign, idx) => <div
      key={idx}
      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
    >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        ASL
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {sign.text}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400">
                      <span className="text-[10px]">{sign.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        {Math.round(sign.confidence * 100)}%
                      </span>
                    </div>
                  </div>)}
              </div>
            </div>

          </div>
        </div>
  ) : (
    /* Speech / Text -> Sign Language Gesture Generator View */
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {
      /* Input Panel (Left 5 Cols) */
    }
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Enter Text or Speak to Translate</span>
                </label>
                <button
      onClick={handleToggleMic}
      className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${isListeningMic ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/25" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600"}`}
    >
                  {isListeningMic ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListeningMic ? "Listening..." : "Voice Input"}</span>
                </button>
              </div>

              <textarea
      value={textInput}
      onChange={(e) => setTextInput(e.target.value)}
      rows={4}
      className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
      placeholder="Type or speak a message (e.g. 'Hello, where is the doctor? Thank you')..."
    />

              {
      /* Quick Preset Phrases */
    }
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Sign Phrases
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Hello my friend", "Thank you so much", "I need help please", "Where is doctor", "I love you"].map((phrase) => <button
      key={phrase}
      onClick={() => setTextInput(phrase)}
      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
    >
                      {phrase}
                    </button>)}
                </div>
              </div>
            </div>

            {
      /* Word Breakdown Chips */
    }
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-3">
                Sign Sequence Tokens ({parsedWords.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {parsedWords.map((word, idx) => <button
      key={idx}
      onClick={() => setAnimatingGestureIndex(idx)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${animatingGestureIndex === idx ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"}`}
    >
                    <span>{word}</span>
                  </button>)}
              </div>
            </div>
          </div>

          {
      /* Animated Sign Avatar & Gesture Player (Right 7 Cols) */
    }
          <div className="lg:col-span-7 space-y-4">
            <SignLanguageAvatar
      currentWord={currentAnimatedWord}
      fullSentence={textInput}
      wordIndex={animatingGestureIndex}
      totalWords={parsedWords.length}
      isPlaying={isPlayingSignAnimation}
      onTogglePlay={() => setIsPlayingSignAnimation(!isPlayingSignAnimation)}
      playbackSpeed={animationSpeed}
      onChangeSpeed={(spd) => setAnimationSpeed(spd)}
      onNextWord={() => setAnimatingGestureIndex((prev) => (prev + 1) % Math.max(1, parsedWords.length))}
      onPrevWord={() => setAnimatingGestureIndex((prev) => (prev - 1 + Math.max(1, parsedWords.length)) % Math.max(1, parsedWords.length))}
      onSelectWordIndex={(idx) => setAnimatingGestureIndex(idx)}
      primarySignLanguage={currentLanguage.code}
      speechVoiceRate={settings.speechVoiceRate}
      speechVoicePitch={settings.speechVoicePitch}
    />
          </div>
        </div>
  )}

      {
    /* Add Custom Sign Recognition Modal */
  }
      {showAddSignModal && <AddSignModal
    onClose={() => setShowAddSignModal(false)}
    onSaveSign={handleSaveSign}
  />}

      {
    /* Recorded Video Playback & Download Modal */
  }
      {showRecordedModal && activeRecordingResult && <RecordedVideoModal
    recording={activeRecordingResult}
    onClose={() => setShowRecordedModal(false)}
  />}

      {
    /* Hardware Permission & Camera Stream Diagnostic Overlay */
  }
      <CameraDiagnosticOverlay
    isOpen={showDiagnosticsOverlay}
    onClose={() => setShowDiagnosticsOverlay(false)}
    permissionStatus={hardwarePermissionStatus}
    streamStatus={cameraStreamStatus}
    activeResolution={activeStreamResolution}
    videoElement={videoRef.current}
    mediaStream={mediaStreamRef.current}
    cameraError={cameraError}
    facingMode={settings.cameraFacing}
    useRealWebcam={useRealWebcam}
    onRetryCamera={handleRetryCamera}
    onSwitchFacingMode={() => {
      onUpdateSettings({ cameraFacing: settings.cameraFacing === "user" ? "environment" : "user" });
      setCameraRetryCount((c) => c + 1);
    }}
    onToggleWebcamMode={() => {
      setUseRealWebcam(!useRealWebcam);
      if (!useRealWebcam) {
        setCameraRetryCount((c) => c + 1);
      }
    }}
  />

    </div>;
};
export {
  LiveTranslateView
};
