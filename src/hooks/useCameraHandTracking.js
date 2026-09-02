import { useState, useEffect, useRef } from "react";
import { RealtimeHandTracker } from "../utils/handTracker";
import { syntheticVideoEngine } from "../utils/demoVideoFeeds";
import { speakText } from "../utils/speech";

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
  const [hardwarePermissionStatus, setHardwarePermissionStatus] = useState("checking");
  const [activeStreamResolution, setActiveStreamResolution] = useState(null);
  const [showMesh, setShowMesh] = useState(settings.gestureTrackingOverlay);
  const [autoSpeakOnCommit, setAutoSpeakOnCommit] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });
  const [showAlignmentGuide, setShowAlignmentGuide] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [calibrationScale, setCalibrationScale] = useState(1);
  const [isAutoCentering, setIsAutoCentering] = useState(settings.autoCenterCamera ?? false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handTrackerRef = useRef(new RealtimeHandTracker());
  const animationFrameId = useRef(null);
  const mediaStreamRef = useRef(null);
  const cameraRequestInProgressRef = useRef(false);

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
    if (cameraRequestInProgressRef.current) return;

    if (!forceNew && mediaStreamRef.current) {
      const liveTrack = mediaStreamRef.current.getVideoTracks().find((t) => t.readyState === "live");
      if (liveTrack && liveTrack.enabled) {
        if (videoRef.current && videoRef.current.srcObject !== mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
          videoRef.current.play().catch(() => {});
        }
        setCameraStreamStatus("active");
        setCameraError(null);
        return;
      }
    }

    cameraRequestInProgressRef.current = true;
    setCameraStreamStatus("requesting_permission");
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
      setHardwarePermissionStatus("granted");

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
        setHardwarePermissionStatus("denied");
        title = "Camera Permission Blocked";
        message = "Camera access was denied by your browser or operating system.";
        tips = isInIframe
          ? 'Preview iFrame detected: Browsers block camera permission dialogs inside embedded frames. Click "Open in New Tab" below to grant camera access directly.'
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
        mediaStreamRef.current.getTracks().forEach((t) => (t.enabled = false));
      }
      setCameraStreamStatus("idle");
    }
  }, [isCameraActive, useRealWebcam, inputSourceMode]);

  useEffect(() => {
    if (useRealWebcam && inputSourceMode === "webcam" && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [useRealWebcam, inputSourceMode, cameraStreamStatus]);

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
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL_MS = 50;

    const render = (time) => {
      if (document.hidden) {
        animationFrameId.current = requestAnimationFrame(render);
        return;
      }
      try {
        const currentMode = inputSourceModeRef.current;
        const currentStatus = cameraStreamStatusRef.current;
        if (currentMode === "webcam" && currentStatus !== "active") {
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

        if (detection.isCommitted && detection.signMeaning) {
          onRecognizedSign(detection);
          if (autoSpeakOnCommitRef.current) {
            speakText(detection.signMeaning.translatedText, settingsRef.current.speechVoiceRate, settingsRef.current.speechVoicePitch);
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
      }
    };
  }, [isCameraActive, translationMode, inputSourceMode, onRecognizedSign]);

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
    videoRef,
    canvasRef,
    handTrackerRef,
    mediaStreamRef,
    requestCameraAccess,
    handleRetryCamera,
    handleSelectInputMode,
    handleUploadVideo,
    handleSelectDemoClip,
    handleTogglePlayPauseUploadedVideo,
    handleRestartUploadedVideo,
    handleChangePlaybackRate
  };
};
