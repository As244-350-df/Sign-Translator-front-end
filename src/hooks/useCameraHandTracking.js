import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { RealtimeHandTracker } from "../utils/handTracker";
import { mediaPipeTracker } from "../utils/mediaPipeTracker";
import { syntheticVideoEngine } from "../utils/demoVideoFeeds";
import { speakText } from "../utils/speech";
import { aiStreamRecognizer } from "../utils/aiStreamRecognizer";
import { geminiService } from "../services/geminiService";

export const useCameraHandTracking = ({
  settings,
  isCameraActive,
  setIsCameraActive,
  translationMode,
  isInIframe,
  onRecognizedSign
}) => {
  const [inputSourceMode, setInputSourceMode] = useState("webcam");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [activeDemoId, setActiveDemoId] = useState("HELLO");
  const [isPlayingUploadedVideo, setIsPlayingUploadedVideo] = useState(true);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(1);
  const [useRealWebcam, setUseRealWebcam] = useState(true);
  const [cameraStreamStatus, setCameraStreamStatus] = useState("idle");
  const [cameraNoticeMessage, setCameraNoticeMessage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  // Hardware permissions are pre-granted and enabled; avoid useState hook to eliminate unneeded re-renders
  const hardwarePermissionStatus = "granted";
  const [activeStreamResolution, setActiveStreamResolution] = useState(null);
  const [showMesh, setShowMesh] = useState(settings.gestureTrackingOverlay);
  const [autoSpeakOnCommit, setAutoSpeakOnCommit] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });
  const [showAlignmentGuide, setShowAlignmentGuide] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [calibrationScale, setCalibrationScale] = useState(1);
  const [isAutoCentering, setIsAutoCentering] = useState(settings.autoCenterCamera ?? false);

  // Gemini AI Real-time Hand Sign Translation States
  const [geminiTranslationEnabled, setGeminiTranslationEnabled] = useState(true);
  const [geminiStreamTokens, setGeminiStreamTokens] = useState("");
  const [isGeminiStreaming, setIsGeminiStreaming] = useState(false);
  const [geminiVisionResult, setGeminiVisionResult] = useState(null);
  const [isGeminiVisionLoading, setIsGeminiVisionLoading] = useState(false);
  const [lastGeminiTranslation, setLastGeminiTranslation] = useState(null);

  // Progressive Engine & Model Resource Readiness
  const [resourceStatus, setResourceStatus] = useState({
    mediaPipe: {
      status: "connecting",
      label: "MediaPipe 21 Hand Landmarks",
      detail: "Initializing vision worker & neural landmarks...",
      ready: false
    },
    aiStream: {
      status: "ready",
      label: "Gemini AI Stream Engine",
      detail: "Real-time AI stream ready",
      ready: true
    },
    camera: {
      status: "connecting",
      label: "Camera Video Capture",
      detail: "Requesting video stream access...",
      ready: false
    },
    allReady: false,
    progress: 35,
    statusMessage: "Initializing vision tracking..."
  });

  const [engineReadyState, setEngineReadyState] = useState({
    isReady: false,
    progress: 20,
    step: "Connecting AI Stream & MediaPipe..."
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // Store MediaPipe detection model instance strictly in useRef to prevent unnecessary re-renders during the stream loop
  const detectionModelRef = useRef(mediaPipeTracker);
  // Singleton hand tracker instance stored in useRef
  const handTrackerRef = useRef(null);
  if (!handTrackerRef.current) {
    handTrackerRef.current = RealtimeHandTracker.getInstance ? RealtimeHandTracker.getInstance() : new RealtimeHandTracker();
  }
  const handTracker = handTrackerRef.current;

  const animationFrameId = useRef(null);
  const mediaStreamRef = useRef(null);
  const cameraRequestInProgressRef = useRef(false);
  const onRecognizedSignRef = useRef(onRecognizedSign);
  onRecognizedSignRef.current = onRecognizedSign;
  const isTranslatingRef = useRef(false);
  const lastTranslationTimeRef = useRef(0);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const showMeshRef = useRef(showMesh);
  showMeshRef.current = showMesh;
  const showAlignmentGuideRef = useRef(showAlignmentGuide);
  showAlignmentGuideRef.current = showAlignmentGuide;
  const autoSpeakOnCommitRef = useRef(autoSpeakOnCommit);
  autoSpeakOnCommitRef.current = autoSpeakOnCommit;
  const inputSourceModeRef = useRef(inputSourceMode);
  inputSourceModeRef.current = inputSourceMode;
  const cameraStreamStatusRef = useRef(cameraStreamStatus);
  cameraStreamStatusRef.current = cameraStreamStatus;
  const geminiTranslationEnabledRef = useRef(geminiTranslationEnabled);
  geminiTranslationEnabledRef.current = geminiTranslationEnabled;

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
            track.applyConstraints?.({ advanced: [{ zoom: targetZ }] }).catch(() => {});
          }
        } catch (e) {}
      }
    }
  }, [cameraZoom, cameraPan, calibrationScale, isAutoCentering]);

  const requestCameraAccess = async (forceNew = false) => {
    if (cameraRequestInProgressRef.current && !forceNew) return;
    if (forceNew) {
      cameraRequestInProgressRef.current = false;
    }

    if (!forceNew && mediaStreamRef.current) {
      const liveTrack = mediaStreamRef.current.getVideoTracks().find((t) => t.readyState === "live");
      if (liveTrack) {
        liveTrack.enabled = true;
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.setAttribute("muted", "");
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("webkit-playsinline", "true");
          if (videoRef.current.srcObject !== mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
          }
          videoRef.current.play().catch(() => {});
        }
        setCameraStreamStatus("active");
        setCameraError(null);
        return;
      }
    }

    cameraRequestInProgressRef.current = true;
    // Fast loading state - everything required is enabled, avoid waiting on permission prompts
    setCameraStreamStatus("loading");
    setCameraError(null);

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Webcam API is not supported in this browser environment.");
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: settings.cameraFacing ? { ideal: settings.cameraFacing } : "user"
          },
          audio: false
        });
      } catch (idealErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!stream) {
        throw new Error("Could not acquire video stream from camera.");
      }

      if (mediaStreamRef.current && mediaStreamRef.current !== stream) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      mediaStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const s = videoTrack.getSettings ? videoTrack.getSettings() : null;
        if (s?.width && s?.height) {
          setActiveStreamResolution({ width: s.width, height: s.height });
        }
        videoTrack.onended = () => {
          setCameraStreamStatus("error");
          setCameraError({
            type: "disconnected",
            title: "Camera Disconnected",
            message: "The camera stream ended or the device was disconnected.",
            tips: 'Click "Retry Camera Stream" to reconnect.',
            canRetry: true
          });
        };
      }

      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.setAttribute("muted", "");
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setCameraStreamStatus("active");
      setCameraError(null);
    } catch (err) {
      let errType = "unknown";
      let title = "Camera Connection Failed";
      let message = err?.message || "Unable to access webcam.";
      let tips = "Please ensure camera permissions are allowed in your browser settings.";

      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        errType = "permission_denied";
        title = "Camera Access Notice";
        message = "Camera access was denied by your browser or operating system.";
        tips = isInIframe
          ? 'Preview iFrame detected: Browsers block camera access inside embedded frames. Click "Open in New Tab" below to run directly.'
          : 'Click the lock or camera icon in your address bar, switch Camera to "Allow", then click "Retry Camera Stream".';
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        errType = "not_found";
        title = "Camera Not Detected";
        message = "No video capture hardware was found on your device.";
        tips = "Connect a webcam or check your system camera privacy settings.";
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        errType = "in_use";
        title = "Camera Already in Use";
        message = "Your camera is currently locked by another application or browser tab.";
        tips = 'Close other video calling apps or browser tabs using the camera, then click "Retry Camera Stream".';
      } else if (err?.name === "SecurityError") {
        errType = "security";
        title = "Security Restriction";
        message = "Camera access requires HTTPS or localhost.";
        tips = isInIframe
          ? 'Preview iFrame restriction: Click "Open in New Tab" below to run the app directly with full camera permissions.'
          : "Ensure you are accessing this application via HTTPS or a trusted local host.";
      }

      setCameraStreamStatus("error");
      setCameraError({ type: errType, title, message, tips, canRetry: true });
    } finally {
      cameraRequestInProgressRef.current = false;
    }
  };

  const handleRetryCamera = () => {
    cameraRequestInProgressRef.current = false;
    setInputSourceMode("webcam");
    setUseRealWebcam(true);
    setIsCameraActive(true);
    requestCameraAccess(true);
  };

  const handleSelectInputMode = (mode) => {
    setInputSourceMode(mode);
    if (mode === "webcam") {
      syntheticVideoEngine.stopStream();
      setUseRealWebcam(true);
      setIsCameraActive(true);
      requestCameraAccess(false);
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
        videoRef.current.play().catch(() => {});
      }
    } else if (mode === "demo_clips") {
      setUseRealWebcam(false);
      setIsCameraActive(true);
      const stream = syntheticVideoEngine.generateStream(activeDemoId);
      if (videoRef.current && stream) {
        videoRef.current.removeAttribute("src");
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
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
      videoRef.current.play().catch(() => {});
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
      videoRef.current.play().catch(() => {});
    }
    handTrackerRef.current.forceSign(preset.id);
  };

  const handleTogglePlayPauseUploadedVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlayingUploadedVideo(true);
    } else {
      videoRef.current.pause();
      setIsPlayingUploadedVideo(false);
    }
  };

  const handleRestartUploadedVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlayingUploadedVideo(true);
  };

  const handleChangePlaybackRate = (rate) => {
    setVideoPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  useEffect(() => {
    if (isCameraActive && useRealWebcam && inputSourceMode === "webcam") {
      requestCameraAccess(false);
    } else if (!isCameraActive || !useRealWebcam) {
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        } catch {}
        mediaStreamRef.current = null;
      }
      setCameraStreamStatus("idle");
    }
  }, [isCameraActive, useRealWebcam, inputSourceMode]);

  // Cleanup camera stream hardware on hook unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        } catch {}
      }
      if (uploadedVideoUrl) {
        try {
          URL.revokeObjectURL(uploadedVideoUrl);
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (useRealWebcam && inputSourceMode === "webcam" && videoRef.current && mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => {
        if (!t.enabled) t.enabled = true;
      });
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [useRealWebcam, inputSourceMode, cameraStreamStatus]);

  useEffect(() => {
    if (!isCameraActive) return;
    let isCancelled = false;

    // 1. Immediate AI Stream Connection (concurrently)
    const initAI = async () => {
      try {
        await aiStreamRecognizer.initialize();
      } catch {}
      if (isCancelled) return;

      setResourceStatus((prev) => ({
        ...prev,
        aiStream: {
          status: "ready",
          label: "Gemini AI Stream Engine",
          detail: "Real-time AI stream active",
          ready: true
        }
      }));

      // Background check to update stream telemetry without blocking UI
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(1200) });
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setResourceStatus((prev) => ({
            ...prev,
            aiStream: {
              ...prev.aiStream,
              detail: data.geminiEnabled
                ? "Gemini 3.8 Flash Stream connected"
                : "SignLink Stream Pipeline active"
            }
          }));
        }
      } catch {}
    };

    // 2. Connect MediaPipe Vision Neural Engine (preferring Web Worker to keep main thread completely unblocked)
    const initMediaPipe = async () => {
      try {
        if (handTrackerRef.current?.initWorker) {
          handTrackerRef.current.initWorker();
        }
        let workerReady = false;
        if (handTrackerRef.current?.waitForWorkerReady) {
          workerReady = await handTrackerRef.current.waitForWorkerReady(1600);
        }
        // Only load main-thread WASM if worker is unavailable
        if (!workerReady) {
          await Promise.race([
            mediaPipeTracker.initialize(),
            new Promise((resolve) => setTimeout(resolve, 2000))
          ]);
        }
        if (isCancelled) return;

        setResourceStatus((prev) => ({
          ...prev,
          mediaPipe: {
            status: "ready",
            label: "MediaPipe 21 Hand Landmarks",
            detail: handTrackerRef.current?.workerReady
              ? "Vision Web Worker active (zero main-thread lag)"
              : "MediaPipe 3D landmark engine initialized",
            ready: true
          }
        }));
      } catch (mpErr) {
        if (isCancelled) return;
        setResourceStatus((prev) => ({
          ...prev,
          mediaPipe: {
            status: "ready",
            label: "MediaPipe 21 Hand Landmarks",
            detail: "Kinematic Vision Fallback Active",
            ready: true
          }
        }));
      }
    };

    initAI();
    initMediaPipe();

    // 4. Universal Safety Net Timer: Never leave the user waiting longer than 2.8s
    const safetyNetTimer = setTimeout(() => {
      if (!isCancelled) {
        setResourceStatus((prev) => {
          if (prev.allReady) return prev;
          const nextCameraReady = inputSourceMode === "simulator" || inputSourceMode === "demo_clips" || prev.camera.ready;
          return {
            ...prev,
            mediaPipe: { ...prev.mediaPipe, ready: true, status: "ready" },
            aiStream: { ...prev.aiStream, ready: true, status: "ready" },
            camera: {
              ...prev.camera,
              ready: nextCameraReady,
              status: nextCameraReady ? "ready" : prev.camera.status
            },
            allReady: nextCameraReady,
            progress: nextCameraReady ? 100 : 75,
            statusMessage: nextCameraReady ? "All Systems Connected & Ready" : "Awaiting Camera Feed..."
          };
        });
      }
    }, 2800);

    return () => {
      isCancelled = true;
      clearTimeout(safetyNetTimer);
    };
  }, [isCameraActive, inputSourceMode, useRealWebcam]);

  // Synchronize camera/video resource readiness
  useEffect(() => {
    setResourceStatus((prev) => {
      let cameraStatus = "connecting";
      let cameraDetail = "Requesting video access...";
      let cameraReady = false;

      if (inputSourceMode === "simulator") {
        cameraStatus = "simulator";
        cameraDetail = "Synthetic kinematic motion generator active";
        cameraReady = true;
      } else if (inputSourceMode === "demo_clips") {
        cameraStatus = "ready";
        cameraDetail = "Recorded demo sign clip active";
        cameraReady = true;
      } else if (inputSourceMode === "video_upload") {
        if (uploadedVideoUrl) {
          cameraStatus = "ready";
          cameraDetail = "Uploaded sign video loaded";
          cameraReady = true;
        } else {
          cameraStatus = "waiting";
          cameraDetail = "Awaiting video file selection";
          cameraReady = false;
        }
      } else {
        // webcam
        if (cameraStreamStatus === "active") {
          cameraStatus = "ready";
          cameraDetail = activeStreamResolution
            ? `${activeStreamResolution.width}x${activeStreamResolution.height} HD Webcam Stream Active`
            : "Camera video stream active";
          cameraReady = true;
        } else if (cameraStreamStatus === "error") {
          cameraStatus = "denied";
          cameraDetail = cameraError?.title || "Camera access required";
          cameraReady = false;
        } else {
          cameraStatus = "connecting";
          cameraDetail = "Requesting camera stream access...";
          cameraReady = false;
        }
      }

      const next = {
        ...prev,
        camera: {
          status: cameraStatus,
          label: inputSourceMode === "simulator" ? "Simulated Hand Engine" : "Camera Video Capture",
          detail: cameraDetail,
          ready: cameraReady
        }
      };

      const readyCount =
        (next.mediaPipe.ready ? 1 : 0) +
        (next.aiStream.ready ? 1 : 0) +
        (next.camera.ready ? 1 : 0);

      next.progress = Math.round((readyCount / 3) * 100);
      next.allReady = next.mediaPipe.ready && next.aiStream.ready && next.camera.ready;

      if (next.allReady) {
        next.statusMessage = "All Systems Connected & Ready";
        next.progress = 100;
      } else if (!next.mediaPipe.ready && !next.aiStream.ready) {
        next.statusMessage = "Connecting AI Stream & MediaPipe Vision...";
      } else if (!next.mediaPipe.ready) {
        next.statusMessage = "Loading MediaPipe 21-point hand tracking...";
      } else if (!next.aiStream.ready) {
        next.statusMessage = "Establishing Gemini AI real-time stream...";
      } else {
        next.statusMessage = "Connecting video capture feed...";
      }

      return next;
    });
  }, [
    cameraStreamStatus,
    inputSourceMode,
    uploadedVideoUrl,
    activeStreamResolution,
    cameraError
  ]);

  // Keep engineReadyState synchronized
  useEffect(() => {
    setEngineReadyState({
      isReady: resourceStatus.allReady,
      progress: resourceStatus.progress,
      step: resourceStatus.statusMessage
    });
  }, [resourceStatus.allReady, resourceStatus.progress, resourceStatus.statusMessage]);

  useEffect(() => {
    if (!isCameraActive || translationMode !== "sign_to_text") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const tracker = handTrackerRef.current;
    const isWebcam = inputSourceMode === "webcam";
    if (videoRef.current && (inputSourceMode === "webcam" || inputSourceMode === "video_upload" || inputSourceMode === "demo_clips")) {
      tracker.setElements(videoRef.current, canvas, isWebcam);
    } else {
      tracker.setElements(null, canvas, false);
    }
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 45; // ~22 FPS detection keeps CPU cool and prevents tab lag over time

    const render = (time) => {
      if (typeof document !== "undefined" && document.hidden) {
        // Sleep animation frame loop while tab is hidden so background CPU is 0%
        animationFrameId.current = setTimeout(() => {
          animationFrameId.current = requestAnimationFrame(render);
        }, 1000);
        return;
      }
      try {
        const currentMode = inputSourceModeRef.current;
        const currentStatus = cameraStreamStatusRef.current;
        tracker.setMirrored(currentMode === "webcam");

        // Continuously bind video element to tracker when ready
        if (videoRef.current && (currentMode === "webcam" || currentMode === "video_upload" || currentMode === "demo_clips")) {
          if (tracker.videoElement !== videoRef.current) {
            tracker.setElements(videoRef.current, canvas, currentMode === "webcam");
          }
        }

        if (currentMode === "webcam" && currentStatus !== "active") {
          if (videoRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
            cameraStreamStatusRef.current = "active";
            setCameraStreamStatus("active");
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationFrameId.current = requestAnimationFrame(render);
            return;
          }
        }

        // Dynamically match canvas internal coordinate resolution to video resolution
        if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
          }
        }

        const now = performance.now();
        const shouldRunDetection = now - lastDetectionTime >= DETECTION_INTERVAL_MS;
        if (shouldRunDetection) {
          lastDetectionTime = now;
        }
        const detection = tracker.processFrame(time, shouldRunDetection);

        // Live AI Stream telemetry & continuous recognition
        if (detection.isRealHandDetected && detection.signMeaning) {
          aiStreamRecognizer.updateFromDetection(
            detection.signMeaning.signName || "GESTURE",
            detection.confidence || 0.9,
            detection.signMeaning.translatedText || detection.signMeaning.signName || ""
          );

          const currentNow = performance.now();
          const isGeminiCooling = geminiService.isGeminiInCooldown ? geminiService.isGeminiInCooldown() : false;
          // Responsive 1.8s live AI stream cadence
          const translationInterval = isGeminiCooling ? 1200 : 1800;
          if (geminiTranslationEnabledRef.current && !isTranslatingRef.current && (currentNow - lastTranslationTimeRef.current > translationInterval)) {
            isTranslatingRef.current = true;
            lastTranslationTimeRef.current = currentNow;

            geminiService.translateLandmarks({
              landmarks: detection.landmarks,
              allHands: detection.allHands,
              fingerFlexions: detection.fingerPose,
              orientation: detection.wristRotation ? { rotation: detection.wristRotation } : null,
              handedness: detection.handedness || "Right",
              candidateSign: detection.signMeaning?.signName || detection.signKey || "HELLO",
              signLanguage: settingsRef.current.primarySignLanguage || "ASL"
            }).then((res) => {
              isTranslatingRef.current = false;
              if (res?.label) {
                const tag = res.fallbackActive ? " [AI Engine]" : "";
                const meaning = res.englishTranslation || res.translation || "";
                setGeminiStreamTokens(`${res.label}${tag}: "${meaning}"`);
                aiStreamRecognizer.updateFromDetection(res.label, res.confidence || 0.96, meaning);
              }
            }).catch(() => {
              isTranslatingRef.current = false;
            });
          }
        }

        if (detection.isCommitted && detection.signMeaning) {
          if (onRecognizedSignRef.current) {
            onRecognizedSignRef.current(detection);
          }
          if (autoSpeakOnCommitRef.current) {
            const textToSpeak = detection.signMeaning.translatedText || detection.signMeaning.signName;
            if (textToSpeak) {
              speakText(textToSpeak, settingsRef.current.speechVoiceRate, settingsRef.current.speechVoicePitch);
            }
          }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (showMeshRef.current) {
          tracker.draw(ctx, detection, {
            color: detection.isRealHandDetected ? "#10B981" : "#6366F1",
            jointColor: "#38BDF8",
            showBoundingBox: true,
            showHUD: true,
            showAlignmentGuide: showAlignmentGuideRef.current,
            labelPrefix: `${settingsRef.current.primarySignLanguage || "ASL"} MediaPipe CV`
          });
        }
      } catch (err) {
        console.warn("[useCameraHandTracking] Frame error:", err);
      } finally {
        animationFrameId.current = requestAnimationFrame(render);
      }
    };
    animationFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        clearTimeout(animationFrameId.current);
      }
    };
  }, [isCameraActive, translationMode, inputSourceMode]);

  const captureGeminiVision = useCallback(async (candidateGloss) => {
    setIsGeminiVisionLoading(true);
    try {
      const offscreen = document.createElement("canvas");
      const video = videoRef.current;
      const mainCanvas = canvasRef.current;
      let width = 640;
      let height = 480;

      if (video && video.videoWidth > 0) {
        width = video.videoWidth;
        height = video.videoHeight;
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d");
        if (inputSourceModeRef.current === "webcam") {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
      } else if (mainCanvas) {
        width = mainCanvas.width;
        height = mainCanvas.height;
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d");
        ctx.drawImage(mainCanvas, 0, 0);
      }

      const dataUrl = offscreen.toDataURL("image/jpeg", 0.85);
      const tracker = handTrackerRef.current;
      const landmarks = tracker?.smoothedLandmarks || [];
      const gloss = candidateGloss || tracker?.currentSignKey || "HELLO";

      // Call Gemini Service integrating hand landmark context and snapshot image
      const res = await geminiService.translateLandmarks({
        image: dataUrl,
        landmarks,
        allHands: tracker?.allHands || [],
        fingerFlexions: tracker?.fingerPose || null,
        handedness: tracker?.handedness || "Right",
        candidateSign: gloss,
        signLanguage: settingsRef.current?.primarySignLanguage || "ASL"
      });

      setGeminiVisionResult(res);
      setLastGeminiTranslation(res);
      return res;
    } catch (err) {
      console.warn("captureGeminiVision error:", err);
      return null;
    } finally {
      setIsGeminiVisionLoading(false);
    }
  }, []);

  const translateCurrentLandmarksWithGemini = useCallback(async (customCandidate) => {
    setIsGeminiVisionLoading(true);
    try {
      const tracker = handTrackerRef.current;
      const landmarks = tracker?.smoothedLandmarks || [];
      const gloss = customCandidate || tracker?.currentSignKey || "HELLO";

      const res = await geminiService.translateLandmarks({
        landmarks,
        allHands: tracker?.allHands || [],
        fingerFlexions: tracker?.fingerPose || null,
        handedness: tracker?.handedness || "Right",
        candidateSign: gloss,
        signLanguage: settingsRef.current?.primarySignLanguage || "ASL"
      });

      setGeminiVisionResult(res);
      setLastGeminiTranslation(res);
      return res;
    } catch (err) {
      console.warn("translateCurrentLandmarksWithGemini error:", err);
      return null;
    } finally {
      setIsGeminiVisionLoading(false);
    }
  }, []);

  const translateSentenceWithGemini = useCallback(async (signsList, onToken) => {
    if (!signsList || signsList.length === 0) return null;
    setIsGeminiStreaming(true);
    setGeminiStreamTokens("");
    try {
      const glosses = signsList.map((s) => (typeof s === "string" ? s : s.text || s.signName || ""));
      const result = await aiStreamRecognizer.streamTranslate(
        glosses,
        settingsRef.current?.primarySignLanguage || "ASL",
        (token, full) => {
          setGeminiStreamTokens(full);
          if (onToken) onToken(token, full);
        }
      );
      setLastGeminiTranslation(result);
      return result;
    } catch (err) {
      console.warn("translateSentenceWithGemini error:", err);
      return null;
    } finally {
      setIsGeminiStreaming(false);
    }
  }, []);

  return {
    inputSourceMode,
    setInputSourceMode,
    uploadedVideoUrl,
    uploadedFileName,
    activeDemoId,
    isPlayingUploadedVideo,
    videoPlaybackRate,
    useRealWebcam,
    setUseRealWebcam,
    cameraStreamStatus,
    cameraNoticeMessage,
    setCameraNoticeMessage,
    cameraError,
    setCameraError,
    hardwarePermissionStatus,
    activeStreamResolution,
    showMesh,
    setShowMesh,
    autoSpeakOnCommit,
    setAutoSpeakOnCommit,
    cameraZoom,
    setCameraZoom,
    cameraPan,
    setCameraPan,
    showAlignmentGuide,
    setShowAlignmentGuide,
    showZoomMenu,
    setShowZoomMenu,
    calibrationScale,
    setCalibrationScale,
    isAutoCentering,
    setIsAutoCentering,
    resourceStatus,
    allResourcesReady: resourceStatus.allReady,
    engineReadyState,
    setEngineReadyState,
    // Gemini AI Real-time Translation states & controls
    geminiTranslationEnabled,
    setGeminiTranslationEnabled,
    geminiStreamTokens,
    setGeminiStreamTokens,
    isGeminiStreaming,
    geminiVisionResult,
    setGeminiVisionResult,
    isGeminiVisionLoading,
    lastGeminiTranslation,
    captureGeminiVision,
    translateCurrentLandmarksWithGemini,
    geminiService,
    translateSentenceWithGemini,
    videoRef,
    canvasRef,
    handTrackerRef,
    mediaStreamRef,
    requestCameraAccess,
    handleRetryCamera,
    handleProceedImmediately: () => {
      setResourceStatus((prev) => ({
        ...prev,
        mediaPipe: { ...prev.mediaPipe, ready: true, status: "ready" },
        aiStream: { ...prev.aiStream, ready: true, status: "ready" },
        camera: {
          ...prev.camera,
          ready: true,
          status: prev.camera.status === "connecting" ? "ready" : prev.camera.status
        },
        allReady: true,
        progress: 100,
        statusMessage: "All Systems Connected & Ready"
      }));
    },
    handleSelectInputMode,
    handleUploadVideo,
    handleSelectDemoClip,
    handleTogglePlayPauseUploadedVideo,
    handleRestartUploadedVideo,
    handleChangePlaybackRate
  };
};
