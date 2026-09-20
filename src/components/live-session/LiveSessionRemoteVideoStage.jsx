import { useEffect, useRef, useState, useMemo } from "react";
import {
  MicOff,
  Wifi,
  Sparkles,
  RotateCcw,
  FastForward,
  Type,
  Camera,
  CheckCircle2,
  VideoOff,
  Radio,
  Hand
} from "lucide-react";

export const LiveSessionRemoteVideoStage = ({
  perspective = "client", // 'client' (viewing interpreter) or 'interpreter' (viewing client)
  interpreter,
  clientUser,
  remoteStream = null,
  remoteVideoFrame = null,
  remoteMediaStatus = null,
  remotePeerInfo = null,
  peerStatus = "idle", // 'idle' | 'detected' | 'connected' | 'degraded'
  signSpeed = 1,
  currentCaption = "",
  onPromptAction = null,
  showLandmarkOverlay = true,
  compositeCanvasRef = null
}) => {
  const [activeGestureIndex, setActiveGestureIndex] = useState(0);
  const [audioBars, setAudioBars] = useState([40, 75, 55, 90, 60, 30, 85]);
  const [lastActionPrompt, setLastActionPrompt] = useState(null);
  const videoElementRef = useRef(null);
  const canvasStageRef = useRef(null);
  const animFrameRef = useRef(null);

  const isRemoteMuted = remoteMediaStatus?.isMuted ?? false;
  const isRemoteCameraOff = remoteMediaStatus?.isCameraOff ?? false;
  const isRemoteHandRaised = remoteMediaStatus?.isHandRaised ?? false;

  // Identify remote participant depending on perspective & detected peer metadata
  const remoteParticipant = useMemo(() => {
    if (remotePeerInfo?.name) {
      return {
        name: remotePeerInfo.name,
        roleLabel: remotePeerInfo.role === "interpreter" ? "Certified Interpreter" : "Client / Signer",
        location: "Live WebSocket Session",
        avatar:
          remotePeerInfo.avatar ||
          (remotePeerInfo.role === "interpreter"
            ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"),
        badge: remotePeerInfo.role === "interpreter" ? "Interpreter" : "Client",
        language: "ASL"
      };
    }

    if (perspective === "interpreter") {
      return {
        name: clientUser?.name || "Alex Morgan (Client)",
        roleLabel: "Deaf Signer • Patient Consultation",
        location: "Stanford Health Care ER • Room 304",
        avatar:
          clientUser?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        coverImage:
          "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80",
        badge: "Client / Signer",
        language: "ASL Native"
      };
    } else {
      return {
        name: interpreter?.name || "Elena Rostova, CI/CT",
        roleLabel: interpreter?.title || "Certified Master ASL/IS Interpreter",
        location: "Remote Interpreting Studio • Encrypted Room",
        avatar:
          interpreter?.avatar ||
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
        coverImage:
          interpreter?.coverImage ||
          "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
        badge: "Certified Interpreter",
        language: interpreter?.languages?.[0] || "ASL"
      };
    }
  }, [perspective, interpreter, clientUser, remotePeerInfo]);

  // Handle remote WebRTC stream attachment
  useEffect(() => {
    if (remoteStream && videoElementRef.current) {
      videoElementRef.current.srcObject = remoteStream;
      videoElementRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Audio waveform animation loop (simulates remote audio level in real-time)
  useEffect(() => {
    const audioInterval = setInterval(() => {
      if (!isRemoteMuted) {
        setAudioBars([
          20 + Math.floor(Math.random() * 70),
          30 + Math.floor(Math.random() * 65),
          45 + Math.floor(Math.random() * 55),
          50 + Math.floor(Math.random() * 50),
          35 + Math.floor(Math.random() * 60),
          25 + Math.floor(Math.random() * 70),
          40 + Math.floor(Math.random() * 55)
        ]);
      } else {
        setAudioBars([10, 10, 10, 10, 10, 10, 10]);
      }
    }, 180);
    return () => clearInterval(audioInterval);
  }, [isRemoteMuted]);

  // Interactive dynamic canvas simulation for natural video call gestures when no peer video stream
  const hasLivePeerVideo = Boolean(
    (remoteStream || remoteVideoFrame) && !isRemoteCameraOff
  );

  useEffect(() => {
    const canvas = canvasStageRef.current;
    if (!canvas || hasLivePeerVideo) return;
    const ctx = canvas.getContext("2d");
    let startTime = performance.now();

    const renderCallFeed = (now) => {
      const elapsed = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Subtle camera breathing and dynamic lighting
      const swayX = Math.sin(elapsed * 1.2 * signSpeed) * 8;
      const swayY = Math.cos(elapsed * 0.9 * signSpeed) * 5;

      // 2. Realistic Hand Movement Traces (Sign Language Gesture Loop)
      ctx.save();
      ctx.translate(w / 2 + swayX, h / 2 + swayY);

      // Hand Glow effect
      const glow = ctx.createRadialGradient(0, 40, 20, 0, 40, 120);
      glow.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      glow.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-150, -50, 300, 200);

      const t = elapsed * 2.8 * signSpeed;
      const leftHandX = -70 + Math.sin(t) * 35;
      const leftHandY = 40 + Math.cos(t * 1.3) * 30;
      const rightHandX = 70 + Math.cos(t * 1.1) * 35;
      const rightHandY = 30 + Math.sin(t * 1.4) * 32;

      // Dynamic visual joint markers
      const drawJoint = (x, y, label, color) => {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = color.replace(")", ", 0.4)").replace("rgb", "rgba");
        ctx.stroke();
      };

      drawJoint(leftHandX, leftHandY, "L-Hand", "rgb(16, 185, 129)");
      drawJoint(rightHandX, rightHandY, "R-Hand", "rgb(99, 102, 241)");

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(renderCallFeed);
    };

    animFrameRef.current = requestAnimationFrame(renderCallFeed);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [hasLivePeerVideo, signSpeed]);

  const handleSendPrompt = (promptText) => {
    setLastActionPrompt(promptText);
    if (onPromptAction) onPromptAction(promptText);
    setTimeout(() => {
      setLastActionPrompt(null);
    }, 3500);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      {/* 1. Remote Participant Video Feed Display */}
      {isRemoteCameraOff ? (
        // Peer Turned Off Camera Placeholder
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center p-4 sm:p-6">
          <div className="relative mb-3 sm:mb-4">
            <img
              src={remoteParticipant.avatar}
              alt={remoteParticipant.name}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-slate-800 shadow-2xl opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-2.5 sm:p-3 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 shadow-lg">
                <VideoOff className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">{remoteParticipant.name}</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Camera is currently turned off by the participant. Audio stream remains active.
          </p>
        </div>
      ) : remoteStream ? (
        // WebRTC Real-Time Stream (Hardware-Accelerated 60 FPS)
        <video
          ref={(el) => {
            videoElementRef.current = el;
            if (el && remoteStream && el.srcObject !== remoteStream) {
              el.srcObject = remoteStream;
              el.play().catch(() => {});
            }
          }}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : remoteVideoFrame ? (
        // Real-Time WebSocket Video Frame Stream
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
          <img
            src={remoteVideoFrame}
            alt="Live Remote Video Stream"
            className="w-full h-full object-cover transition-opacity duration-150"
          />
          {/* Subtle WebSocket Streaming watermark */}
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-[10px] font-mono font-bold text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>WebSocket 60FPS Video</span>
          </div>
        </div>
      ) : (
        // Waiting for other participant to connect & allow camera
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-center">
          <div className="relative mb-3 sm:mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-slate-800 overflow-hidden shadow-2xl relative mx-auto">
              <img
                src={remoteParticipant.avatar}
                alt={remoteParticipant.name}
                className="w-full h-full object-cover filter grayscale opacity-60"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-amber-400">
              <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 flex items-center justify-center space-x-2">
            <span>{remoteParticipant.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {perspective === "client" ? "Interpreter Feed" : "Client Feed"}
            </span>
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mb-3">
            {peerStatus === "connected"
              ? "Participant connected. Waiting for camera stream permission..."
              : "Waiting for other participant to join. Their live camera feed will appear here as soon as they allow camera access."}
          </p>

          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] sm:text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Socket Room Live • Direct Feed Ready</span>
          </div>
        </div>
      )}

      {/* 2. MediaPipe 21-Point Skeleton Overlay Canvas */}
      {compositeCanvasRef && (
        <canvas
          ref={compositeCanvasRef}
          width={1280}
          height={720}
          className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 z-10 ${
            showLandmarkOverlay ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 3. Hand Raised Alert Banner */}
      {isRemoteHandRaised && (
        <div className="absolute top-12 sm:top-14 left-1/2 transform -translate-x-1/2 z-40 flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl animate-bounce">
          <Hand className="w-4 h-4" />
          <span>{remoteParticipant.name} raised their hand!</span>
        </div>
      )}

      {/* 4. Remote Participant Header Badge (Top-Left on Video) */}
      <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-4 z-20 flex items-center space-x-2 sm:space-x-3 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-700/70 shadow-xl max-w-[calc(100%-8rem)] sm:max-w-none animate-in fade-in duration-300">
        <div className="relative shrink-0">
          <img
            src={remoteParticipant.avatar}
            alt={remoteParticipant.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-emerald-500 shadow-md"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
            <h3 className="font-bold text-xs sm:text-sm text-white tracking-wide truncate">
              {remoteParticipant.name}
            </h3>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
              {remoteParticipant.badge}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-300 mt-0.2 truncate">
            <span className="truncate">{remoteParticipant.roleLabel}</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono font-semibold flex items-center space-x-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-0.5" />
              {remoteStream
                ? "1080p 60FPS"
                : remoteVideoFrame
                ? "WebSocket Feed"
                : "Live Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Remote Participant Status & Connection Pill (Top-Right on Video) */}
      <div className="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-4 z-20 flex items-center space-x-1.5 sm:space-x-2">
        {/* Dynamic Speaking Audio VU Waveform */}
        <div
          className="flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-lg"
          title="Remote Participant Audio Activity"
        >
          {!isRemoteMuted ? (
            <div className="flex items-end space-x-0.5 h-3.5 sm:h-4 w-8 sm:w-12 px-0.5">
              {audioBars.map((height, idx) => (
                <span
                  key={idx}
                  className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          ) : (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-300 ml-0.5 sm:ml-1">
            {!isRemoteMuted ? "ACTIVE" : "MUTED"}
          </span>
        </div>

        {/* WebRTC / WebSocket Connection Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-xs font-mono text-indigo-300 shadow-lg">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {remoteStream
              ? "P2P WebRTC"
              : remoteVideoFrame
              ? "WebSocket Relay"
              : "Room Ready"}
          </span>
        </div>
      </div>

      {/* 6. Interactive Prompt Sent Notification */}
      {lastActionPrompt && (
        <div className="absolute top-14 sm:top-16 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/90 backdrop-blur-md border border-indigo-500 text-indigo-200 text-xs font-bold shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          <span>Prompt Sent: &quot;{lastActionPrompt}&quot;</span>
        </div>
      )}

      {/* 7. Context-Aware Quick Interaction Bar (Neatly placed near top below badges, avoiding bottom caption overlap) */}
      <div className="absolute top-14 sm:top-16 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-1.5 sm:space-x-2 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-slate-800 shadow-xl max-w-[94vw] overflow-x-auto no-scrollbar">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 shrink-0">
          {perspective === "client" ? "Ask Interpreter:" : "Prompt Client:"}
        </span>

        {perspective === "client" ? (
          <>
            <button
              onClick={() => handleSendPrompt("Please slow down signing speed")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-indigo-400" />
              <span>Slow Down (0.75x)</span>
            </button>
            <button
              onClick={() => handleSendPrompt("Please fingerspell medical terms")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <Type className="w-3 h-3 text-emerald-400" />
              <span>Fingerspell Term</span>
            </button>
            <button
              onClick={() => handleSendPrompt("Please repeat the last sentence")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <FastForward className="w-3 h-3 text-amber-400" />
              <span>Repeat Last</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleSendPrompt("Please keep hands centered in camera frame")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <Camera className="w-3 h-3 text-indigo-400" />
              <span>Center Hands</span>
            </button>
            <button
              onClick={() => handleSendPrompt("Ready for your sign input")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs font-medium transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Ready for Sign</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
