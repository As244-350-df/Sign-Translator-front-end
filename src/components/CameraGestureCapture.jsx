import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Volume2,
  Copy,
  Trash2,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  SwitchCamera,
  Sparkles,
  HandMetal,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { RealtimeHandTracker } from "../utils/handTracker";
import { speakText } from "../utils/speech";
import { isInsideIframe, getSafeCurrentUrl } from "../utils/environment";

/**
 * CameraGestureCapture
 * A dedicated, high-performance camera component that accesses the user's
 * camera feed to capture hand gestures in real-time for sign language interpretation.
 */
export const CameraGestureCapture = ({
  onSignDetected,
  onSentenceUpdate,
  activeSignLanguage = "ASL",
  autoStart = true,
  showControls = true,
  autoSpeak = false,
  className = ""
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const handTrackerRef = useRef(null);

  // Component state
  const [isCameraActive, setIsCameraActive] = useState(autoStart);
  const [cameraStatus, setCameraStatus] = useState("idle"); // 'idle' | 'starting' | 'active' | 'error'
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' | 'environment'
  const [isMirrored, setIsMirrored] = useState(true);
  const [showSkeletonMesh, setShowSkeletonMesh] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Interpretation state
  const [currentSign, setCurrentSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHandInFrame, setIsHandInFrame] = useState(false);
  const [sentence, setSentence] = useState("");
  const [recognizedSignsHistory, setRecognizedSignsHistory] = useState([]);

  const containerRef = useRef(null);
  const lastCommittedSignRef = useRef(null);
  const commitCooldownRef = useRef(0);
  const sentenceRef = useRef("");

  useEffect(() => {
    sentenceRef.current = sentence;
  }, [sentence]);

  // Initialize tracker once
  if (!handTrackerRef.current) {
    handTrackerRef.current = RealtimeHandTracker.getInstance
      ? RealtimeHandTracker.getInstance()
      : new RealtimeHandTracker();
  }

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus("idle");
  }, []);

  // Request camera stream directly without artificial delays
  const startCamera = useCallback(async (targetFacing = facingMode) => {
    setCameraStatus("starting");
    setCameraError(null);

    // Stop existing stream if running
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: targetFacing
          },
          audio: false
        });
      } catch (idealErr) {
        // Fallback to basic constraints if ideal resolution rejected
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (!stream) {
        throw new Error("Could not acquire video stream from camera.");
      }

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.setAttribute("muted", "");
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        await videoRef.current.play().catch(() => {});
      }

      setCameraStatus("active");
      setIsCameraActive(true);
    } catch (err) {
      console.warn("[CameraGestureCapture] Camera error:", err);
      let message = err?.message || "Failed to access camera.";
      let tip = "Check browser camera permissions.";

      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        message = "Camera access was denied by your browser or OS.";
        tip = isInsideIframe()
          ? "Preview iframe detected: Open app in a new tab to grant camera permissions directly."
          : "Click the camera icon in your address bar and choose 'Allow'.";
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        message = "No camera device detected.";
        tip = "Connect a webcam or check system privacy settings.";
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        message = "Camera is currently in use by another app or tab.";
        tip = "Close other applications using the webcam and retry.";
      }

      setCameraError({ message, tip, isIframe: isInsideIframe() });
      setCameraStatus("error");
    }
  }, [facingMode]);

  // Flip camera front/back
  const handleToggleFacingMode = useCallback(() => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === "user");
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  }, [facingMode, isCameraActive, startCamera]);

  // Toggle Camera On/Off
  const handleToggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCameraStream();
      setIsCameraActive(false);
    } else {
      startCamera(facingMode);
    }
  }, [isCameraActive, stopCameraStream, startCamera, facingMode]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Commit recognized sign to sentence
  const commitSign = useCallback((signObj) => {
    if (!signObj) return;
    const word = signObj.translatedText || signObj.signName;
    if (!word) return;

    const current = sentenceRef.current;
    const updated = current && current.trim() ? `${current.trim()} ${word}` : word;
    sentenceRef.current = updated;
    setSentence(updated);

    if (onSentenceUpdate) {
      onSentenceUpdate(updated);
    }

    setRecognizedSignsHistory((prev) => [
      ...prev.slice(-9),
      {
        id: Date.now(),
        text: word,
        symbol: signObj.symbol || "🤟",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confidence: signObj.confidence || 0.95
      }
    ]);

    if (autoSpeak) {
      speakText(word);
    }

    if (onSignDetected) {
      onSignDetected({
        signMeaning: signObj,
        translatedText: word,
        symbol: signObj.symbol || "🤟",
        confidence: signObj.confidence || 0.95
      });
    }
  }, [autoSpeak, onSentenceUpdate, onSignDetected]);

  // Text-to-speech for whole sentence
  const handleSpeakSentence = () => {
    if (sentence) {
      speakText(sentence);
    }
  };

  // Copy sentence to clipboard
  const handleCopySentence = () => {
    if (sentence) {
      navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clear sentence
  const handleClearSentence = () => {
    sentenceRef.current = "";
    setSentence("");
    setRecognizedSignsHistory([]);
    if (onSentenceUpdate) {
      onSentenceUpdate("");
    }
  };

  // Start camera on mount if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startCamera("user");
    }
    return () => {
      stopCameraStream();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    if (!isCameraActive || cameraStatus !== "active") return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const tracker = handTrackerRef.current;
    tracker.setElements(video, canvas, isMirrored);

    let lastTime = 0;
    const FRAME_INTERVAL = 33; // ~30 FPS tracking loop

    const processLoop = (now) => {
      if (video.readyState >= 2 && !video.paused) {
        // Sync canvas dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        }

        const shouldDetect = now - lastTime >= FRAME_INTERVAL;
        if (shouldDetect) {
          lastTime = now;
        }

        // Process frame through hand tracker
        const detection = tracker.processFrame(now, shouldDetect);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hasHand = !!detection?.isRealHandDetected;
        setIsHandInFrame(hasHand);

        if (detection?.signMeaning) {
          setCurrentSign(detection.signMeaning);
          setConfidence(Math.round((detection.confidence || 0.95) * 100));
          setHoldProgress(detection.holdProgress || 0);

          // Auto-commit sign when gesture held steadily
          const nowTs = Date.now();
          if (
            detection.isCommitted &&
            nowTs - commitCooldownRef.current > 1200 &&
            lastCommittedSignRef.current !== detection.signMeaning.signName
          ) {
            commitCooldownRef.current = nowTs;
            lastCommittedSignRef.current = detection.signMeaning.signName;
            commitSign(detection.signMeaning);
          }
        }

        // Render skeleton mesh
        if (showSkeletonMesh && hasHand) {
          tracker.draw(ctx, detection, {
            color: "#10B981",
            jointColor: "#38BDF8",
            showBoundingBox: true,
            showHUD: false,
            labelPrefix: `${activeSignLanguage} Live CV`
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(processLoop);
    };

    animationFrameRef.current = requestAnimationFrame(processLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, cameraStatus, isMirrored, showSkeletonMesh, activeSignLanguage, commitSign]);

  return (
    <div
      ref={containerRef}
      id="camera-gesture-capture-root"
      className={`relative flex flex-col bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}
    >
      {/* Video Viewport Area */}
      <div className="relative aspect-4/3 w-full bg-black overflow-hidden flex items-center justify-center">
        {/* Live Camera Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            transform: isMirrored ? "scaleX(-1)" : "none",
            transformOrigin: "center center"
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraStatus === "active" ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* MediaPipe Hand Landmarks Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Idle / Camera Off State */}
        {cameraStatus === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
              <CameraOff className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Camera Is Ready</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5">
              Access your camera feed to capture sign language gestures in real-time using high-speed hand landmark tracking.
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center space-x-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Feed</span>
            </button>
          </div>
        )}

        {/* Loading / Starting State */}
        {cameraStatus === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/85 z-20 backdrop-blur-xs">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Opening Camera Feed...</p>
            <p className="text-xs text-slate-400 mt-1">Requesting video permissions and initializing vision tracker</p>
          </div>
        )}

        {/* Error State Overlay */}
        {cameraStatus === "error" && cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-30">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Camera Access Issue</h4>
            <p className="text-xs text-slate-300 max-w-sm mb-2">{cameraError.message}</p>
            <p className="text-xs text-slate-400 max-w-sm mb-5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              💡 {cameraError.tip}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>

              {cameraError.isIframe && (
                <a
                  href={getSafeCurrentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Live Top HUD Indicators (When Active) */}
        {cameraStatus === "active" && (
          <>
            {/* Top Left: Live Status & Hand Detection */}
            <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
              <div className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-white text-[11px] font-semibold flex items-center space-x-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE FEED</span>
              </div>

              <div
                className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-semibold flex items-center space-x-1.5 transition-colors ${
                  isHandInFrame
                    ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300"
                    : "bg-slate-900/80 border-slate-700 text-slate-400"
                }`}
              >
                <HandMetal className="w-3 h-3" />
                <span>{isHandInFrame ? "Hand Tracked" : "Searching Hand"}</span>
              </div>
            </div>

            {/* Top Right: Current Sign Language Badge */}
            <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 backdrop-blur-md border border-indigo-500/50 text-indigo-200 font-mono text-[11px] font-bold shadow-md">
                {activeSignLanguage}
              </span>
            </div>

            {/* Bottom Real-Time Recognized Gesture Banner */}
            {currentSign && (
              <div className="absolute bottom-3 left-3 right-3 z-20 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-indigo-500/40 shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-2xl shrink-0">
                    {currentSign.symbol || "🤟"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-white truncate">
                        {currentSign.signName || "Gesture"}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {confidence}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      &ldquo;{currentSign.translatedText || currentSign.signName}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Manual Commit Button */}
                  <button
                    onClick={() => commitSign(currentSign)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center space-x-1"
                    title="Add this word to sentence"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Add Word</span>
                  </button>

                  {/* Speak Current Sign */}
                  <button
                    onClick={() => speakText(currentSign.translatedText || currentSign.signName)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Speak word aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Toolbar */}
      {showControls && (
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Power & Camera Features */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleCamera}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isCameraActive
                  ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {isCameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Turn Off Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Turn On Camera</span>
                </>
              )}
            </button>

            {isCameraActive && (
              <>
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isMirrored
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title={isMirrored ? "Mirror mode ON" : "Mirror mode OFF"}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleToggleFacingMode}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                  title="Switch front/rear camera"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowSkeletonMesh(!showSkeletonMesh)}
                  className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    showSkeletonMesh
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                  title={showSkeletonMesh ? "Hide Landmark Mesh" : "Show Landmark Mesh"}
                >
                  {showSkeletonMesh ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </div>

          {/* Right Controls: Fullscreen */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Live Interpretation Transcript Area */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Interpreted Transcript
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {sentence && (
              <>
                <button
                  onClick={handleSpeakSentence}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold flex items-center space-x-1 border border-indigo-500/30 transition-colors cursor-pointer"
                  title="Speak sentence"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Speak</span>
                </button>
                <button
                  onClick={handleCopySentence}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 border border-slate-700 transition-colors cursor-pointer"
                  title="Copy transcript"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleClearSentence}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear transcript"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Sentence Text Box */}
        <div className="min-h-[46px] p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium flex items-center">
          {sentence ? (
            <span className="text-white font-semibold leading-relaxed">{sentence}</span>
          ) : (
            <span className="text-slate-500 text-xs italic">
              Show sign language gestures to your camera to build the translated sentence here...
            </span>
          )}
        </div>

        {/* Recent Signs History Chips */}
        {recognizedSignsHistory.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1 shrink-0">Recent:</span>
            {recognizedSignsHistory.map((item) => (
              <span
                key={item.id}
                className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium text-[11px] shrink-0 flex items-center space-x-1"
              >
                <span>{item.symbol}</span>
                <span>{item.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CameraGestureCapture;
