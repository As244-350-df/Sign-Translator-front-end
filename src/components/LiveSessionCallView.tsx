import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Hand, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Wifi, 
  Send, 
  Share2, 
  Maximize2, 
  Settings2, 
  FastForward, 
  ChevronDown, 
  Layers, 
  Circle, 
  Radio, 
  Lock, 
  Download, 
  Activity, 
  DollarSign, 
  Play, 
  Pause, 
  RotateCcw, 
  RefreshCw, 
  Video,
  HandMetal,
  Plus,
  Trash2,
  BookOpen,
  Check,
  Zap,
  ZoomIn,
  ZoomOut,
  Target,
  Focus,
  Crosshair
} from 'lucide-react';
import { Interpreter, AppSettings } from '../types';
import { MOCK_INTERPRETERS } from '../data/mockData';
import { speakText, stopSpeaking } from '../utils/speech';
import { RealtimeHandTracker, HandDetectionResult, SIGN_DICTIONARY, SignSymbolMeaning, FingerPoseState } from '../utils/handTracker';
import { LiveSessionRecorder, RecordedVideoResult } from '../utils/mediaRecorder';
import { RecordedVideoModal } from './RecordedVideoModal';
import { AddSignModal } from './AddSignModal';
import { FreeFingerController } from './FreeFingerController';

interface LiveSessionCallViewProps {
  interpreterId?: string;
  onEndCall: () => void;
  settings: AppSettings;
}

export const LiveSessionCallView: React.FC<LiveSessionCallViewProps> = ({
  interpreterId = 'int-01',
  onEndCall,
  settings,
}) => {
  const interpreter = MOCK_INTERPRETERS.find(i => i.id === interpreterId) || MOCK_INTERPRETERS[0];

  // Call states
  const [callDuration, setCallDuration] = useState<number>(142); // in seconds (02:22)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showSignDeck, setShowSignDeck] = useState<boolean>(false);
  const [deckTab, setDeckTab] = useState<'signs' | 'free_fingers'>('signs');
  const [showAddSignModal, setShowAddSignModal] = useState<boolean>(false);
  const [signSpeed, setSignSpeed] = useState<number>(1.0);
  const [chatInput, setChatInput] = useState<string>('');
  const [freeFingerPose, setFreeFingerPose] = useState<FingerPoseState>({
    thumb: 1.0,
    index: 1.0,
    middle: 1.0,
    ring: 1.0,
    pinky: 1.0,
    spread: 0.8,
    wristAngle: 0,
    rotation: 0,
    isFreeMotion: true,
    proceduralAnimation: 'none'
  });
  
  // Real-time Hand Sign Recognition Features
  const [autoSpeakSigns, setAutoSpeakSigns] = useState<boolean>(true);
  const [autoChatSigns, setAutoChatSigns] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dictionaryMap, setDictionaryMap] = useState<Record<string, SignSymbolMeaning>>(SIGN_DICTIONARY);
  const [activeSignMeaning, setActiveSignMeaning] = useState<SignSymbolMeaning | null>(SIGN_DICTIONARY['HELLO'] || null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [lastCommittedBanner, setLastCommittedBanner] = useState<{ symbol: string; text: string; time: string } | null>(null);
  const [recognizedSignLogs, setRecognizedSignLogs] = useState<Array<{ symbol: string; text: string; confidence: number; time: string }>>([
    { symbol: '👋', text: 'Hello', confidence: 0.98, time: '10:02:14' },
    { symbol: '🙏', text: 'Thank you', confidence: 0.96, time: '10:03:05' }
  ]);

  // Advanced Architecture & ML Features State
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [showLandmarkOverlay, setShowLandmarkOverlay] = useState<boolean>(true);
  const [showAlignmentGuide, setShowAlignmentGuide] = useState<boolean>(false);
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [cameraPan, setCameraPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoCentering, setIsAutoCentering] = useState<boolean>(settings.autoCenterCamera ?? false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [activeRecordingResult, setActiveRecordingResult] = useState<RecordedVideoResult | null>(null);
  const [showRecordedModal, setShowRecordedModal] = useState<boolean>(false);
  const [useRealCameraLocal, setUseRealCameraLocal] = useState<boolean>(true);
  const [mainViewMode, setMainViewMode] = useState<'interpreter' | 'camera'>('interpreter');
  const [tfStatus, setTfStatus] = useState<{ fps: number; gesture: string; confidence: number; isReal: boolean }>({
    fps: 60,
    gesture: '🖐️ HELLO',
    confidence: 0.98,
    isReal: false
  });

  // Sync auto-center to hand tracker
  useEffect(() => {
    handTrackerRef.current.setAutoCenter(isAutoCentering);
  }, [isAutoCentering]);

  // Sync zoom to hand tracker
  useEffect(() => {
    if (!isAutoCentering) {
      handTrackerRef.current.setZoom(cameraZoom, cameraPan.x, cameraPan.y);
    }
  }, [cameraZoom, cameraPan, isAutoCentering]);

  const handleToggleAutoCenter = () => {
    setIsAutoCentering(prev => {
      const next = !prev;
      handTrackerRef.current.setAutoCenter(next);
      return next;
    });
  };

  const handleZoomIn = () => setCameraZoom(prev => Math.min(3.5, +(prev + 0.25).toFixed(2)));
  const handleZoomOut = () => setCameraZoom(prev => Math.max(1.0, +(prev - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setCameraZoom(1.0);
    setCameraPan({ x: 0, y: 0 });
  };

  // Metered Billing ($/min)
  const ratePerSecond = (interpreter.ratePerMinute || 1.25) / 60;
  const currentTotalCost = (callDuration * ratePerSecond);

  // Live Caption
  const [currentCaption, setCurrentCaption] = useState<string>(
    `"The physician confirms: take 1 tablet with water each morning after breakfast."`
  );
  const [captionSpeaking, setCaptionSpeaking] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; time: string; text: string; isSelf?: boolean }>>([
    { sender: interpreter.name, time: '10:02', text: 'Hello! I am connected via WebRTC SFU and ready to interpret.' },
    { sender: 'You', time: '10:03', text: 'Thank you Elena! Please fingerspell any unfamiliar medical names.', isSelf: true },
    { sender: interpreter.name, time: '10:04', text: 'Understood. Doctor is now going over your follow-up lab dates.' }
  ]);

  // Video & Canvas references
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handTrackerRef = useRef<RealtimeHandTracker>(new RealtimeHandTracker());
  const recorderRef = useRef<LiveSessionRecorder>(new LiveSessionRecorder());
  const animationFrameId = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Real Webcam Initialization with graceful audio/video fallback
  useEffect(() => {
    let isCancelled = false;

    if (useRealCameraLocal && !isCameraOff) {
      const acquireStream = async () => {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setUseRealCameraLocal(false);
          return;
        }

        let s: MediaStream | null = null;
        // Attempt 1: Video + Audio
        try {
          s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: settings.cameraFacing ? { ideal: settings.cameraFacing } : undefined, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch {
          // Attempt 2: Video-only if audio or strict resolution fails
          try {
            s = await navigator.mediaDevices.getUserMedia({ 
              video: settings.cameraFacing ? { facingMode: { ideal: settings.cameraFacing } } : true,
              audio: false
            });
          } catch (err) {
            console.warn('Local webcam acquisition failed:', err);
            if (!isCancelled) setUseRealCameraLocal(false);
            return;
          }
        }

        if (isCancelled || !s) {
          if (s) s.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = s;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          localVideoRef.current.play().catch(() => {});
        }
        if (mainVideoRef.current && mainViewMode === 'camera') {
          mainVideoRef.current.srcObject = s;
          mainVideoRef.current.play().catch(() => {});
        }
      };

      acquireStream();
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    }

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [useRealCameraLocal, isCameraOff, settings.cameraFacing, mainViewMode]);

  // Main Canvas & TensorFlow Hand Pose Engine Loop
  useEffect(() => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tracker = handTrackerRef.current;

    const renderLoop = (time: number) => {
      const activeVideo = mainViewMode === 'camera' ? (mainVideoRef.current || localVideoRef.current) : (localVideoRef.current || mainVideoRef.current);
      if (activeVideo) {
        tracker.setElements(activeVideo, canvas);
      }

      // Process real video frame / kinematics
      const detection: HandDetectionResult = tracker.processFrame(time);

      if (detection.autoCentering && detection.autoCentering.enabled) {
        setCameraZoom(detection.autoCentering.currentZoom);
        setCameraPan({
          x: detection.autoCentering.panOffsetX,
          y: detection.autoCentering.panOffsetY
        });
      }

      setTfStatus({
        fps: detection.fps,
        gesture: detection.gesture,
        confidence: detection.confidence,
        isReal: detection.isRealHandDetected
      });

      if (detection.signMeaning) {
        setActiveSignMeaning(detection.signMeaning);
      }
      setHoldProgress(detection.holdProgress);

      // When a sign is held and committed by hand tracker in the live session
      if (detection.isCommitted && detection.signMeaning) {
        const sign = detection.signMeaning;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // 1. Show In-Call Banner Toast
        setLastCommittedBanner({
          symbol: sign.symbol,
          text: sign.translatedText,
          time: timeStr
        });

        // 2. Append to Recognized Sign Logs
        setRecognizedSignLogs(prev => [
          ...prev.slice(-15),
          {
            symbol: sign.symbol,
            text: sign.translatedText,
            confidence: detection.confidence,
            time: timeStr
          }
        ]);

        // 3. Update Captions with user's sign
        setCurrentCaption(`"You (Sign Language): ${sign.translatedText}"`);

        // 4. If Auto-Speak is enabled, vocalize aloud to the live session call
        if (autoSpeakSigns) {
          speakText(sign.translatedText, settings.speechVoiceRate, settings.speechVoicePitch);
        }

        // 5. If Auto-Chat is enabled, append to in-call messages
        if (autoChatSigns) {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'You (Signed)',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: `${sign.symbol} ${sign.translatedText}`,
              isSelf: true
            }
          ]);
        }
      }

      // Clear overlay canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If user enabled AI Skeleton, draw TensorFlow joints & bounding box
      if (showLandmarkOverlay) {
        tracker.draw(ctx, detection, {
          color: detection.isRealHandDetected ? '#10B981' : '#6366F1',
          jointColor: '#38BDF8',
          showBoundingBox: true,
          showHUD: false,
          showAlignmentGuide: showAlignmentGuide,
          labelPrefix: `${settings.primarySignLanguage} Live Session`
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
  }, [showLandmarkOverlay, showAlignmentGuide, mainViewMode, settings.primarySignLanguage, autoSpeakSigns, autoChatSigns, settings.speechVoiceRate, settings.speechVoicePitch]);

  // Caption cycle simulation for realism if no sign active
  useEffect(() => {
    const captionList = [
      `"Elena (Interpreter): The physician confirms: take 1 tablet with water each morning after breakfast."`,
      `"Elena (Interpreter): Please let the clinic know if you experience any side effects in the next 14 days."`,
      `"Elena (Interpreter): All laboratory test results from Monday returned normal and in optimal ranges."`,
      `"Elena (Interpreter): Doctor asks if you have questions regarding the physical therapy referral."`
    ];

    let idx = 0;
    const interval = setInterval(() => {
      // only cycle if user has not signed in the last 6 seconds
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
        currentCaption.replace(/Elena \(Interpreter\): /g, '').replace(/You \(Sign Language\): /g, ''),
        () => setCaptionSpeaking(false),
        settings.speechVoiceRate,
        settings.speechVoicePitch
      );
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: chatInput.trim(),
        isSelf: true
      }
    ]);
    setChatInput('');
  };

  const handleQuickChat = (phrase: string) => {
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: phrase,
        isSelf: true
      }
    ]);
  };

  // Test / Force a specific sign during live session
  const handleTestSign = (signKey: string) => {
    handTrackerRef.current.forceSign(signKey);
    const meaning = dictionaryMap[signKey];
    if (meaning) {
      setActiveSignMeaning(meaning);
    }
  };

  // Add custom sign during call
  const handleSaveSign = (key: string, newSign: SignSymbolMeaning) => {
    const regKey = handTrackerRef.current.registerCustomSign(key, newSign);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
    setActiveSignMeaning(newSign);
    handTrackerRef.current.forceSign(regKey);
  };

  // Commit current detected sign immediately to the call
  const handleCommitCurrentSignNow = () => {
    if (!activeSignMeaning) return;
    const sign = activeSignMeaning;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setLastCommittedBanner({
      symbol: sign.symbol,
      text: sign.translatedText,
      time: timeStr
    });

    setRecognizedSignLogs(prev => [
      ...prev.slice(-15),
      {
        symbol: sign.symbol,
        text: sign.translatedText,
        confidence: sign.confidence,
        time: timeStr
      }
    ]);

    setCurrentCaption(`"You (Sign Language): ${sign.translatedText}"`);

    speakText(sign.translatedText, settings.speechVoiceRate, settings.speechVoicePitch);

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'You (Signed)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `${sign.symbol} ${sign.translatedText}`,
        isSelf: true
      }
    ]);
  };

  // Real in-browser MediaRecorder Toggle
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
      const started = await recorder.startRecording(canvas, localStreamRef.current, (sec) => {
        setRecordedDuration(sec);
      });
      if (started) {
        setIsRecording(true);
        setRecordedDuration(0);
      }
    }
  };

  const dictionaryList = (Object.entries(dictionaryMap) as [string, SignSymbolMeaning][]).map(([key, item]) => ({
    key,
    ...item
  }));

  const filteredSigns = selectedCategory === 'all'
    ? dictionaryList
    : dictionaryList.filter(s => s.category === selectedCategory);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Top Session Status Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between">
        
        {/* Interpreter Info & Rate */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={interpreter.avatar}
              alt={interpreter.name}
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="font-bold text-sm text-white">{interpreter.name}</h2>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Live Certified Human Interpreter • {settings.primarySignLanguage}
            </p>
          </div>
        </div>

        {/* Call Metadata, Metered Billing & Recording Indicators */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Real Camera TensorFlow Status */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${tfStatus.isReal ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
            <span className="text-slate-300">{tfStatus.gesture}</span>
            <span className="text-emerald-400 font-bold">({tfStatus.fps} FPS)</span>
          </div>

          {/* Recording Badge */}
          {isRecording && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-700 text-xs font-mono font-bold text-rose-300 animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
              <span>REC {formatTime(recordedDuration)}</span>
            </div>
          )}

          {/* Metered Cost Ticker */}
          <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-emerald-400">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${currentTotalCost.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 font-normal">(${interpreter.ratePerMinute}/min)</span>
          </div>

          {/* Call Timer */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(callDuration)}</span>
          </div>

          {/* Diagnostics Inspector Button */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border ${
              showDiagnostics 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle WebRTC SFU Telemetry"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">SFU 60FPS</span>
          </button>
        </div>

      </div>

      {/* Main Video Presentation Stage */}
      <div className="relative flex-1 flex items-center justify-center bg-slate-900 overflow-hidden">
        
        {/* Remote Live Interpreter Video Feed OR Main Real Camera */}
        <div className="relative w-full h-full flex items-center justify-center">
          {mainViewMode === 'camera' && useRealCameraLocal ? (
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
              style={{ transform: `scale(${signSpeed === 0.5 ? 0.98 : 1.0})` }}
            />
          )}

          {/* Overlay Canvas for Hand Landmark 21-Points & Skeleton */}
          <canvas
            ref={compositeCanvasRef}
            width={1280}
            height={720}
            className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-200 ${
              showLandmarkOverlay ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Committed Sign Live Notification Banner */}
          {lastCommittedBanner && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/80 shadow-2xl text-emerald-200 animate-in slide-in-from-top-4 fade-in duration-300">
              <span className="text-2xl animate-bounce">{lastCommittedBanner.symbol}</span>
              <div className="text-left">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  ✨ Recognized Hand Sign
                </div>
                <div className="text-sm font-bold text-white">
                  "{lastCommittedBanner.text}"
                </div>
              </div>
              <button
                onClick={() => setLastCommittedBanner(null)}
                className="text-xs text-emerald-400 hover:text-white ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Dialect Sign Speed Indicator */}
          {signSpeed !== 1.0 && (
            <div className="absolute top-20 right-6 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-indigo-400">
              ⚡ Sign Speed: {signSpeed}x
            </div>
          )}

          {/* Real-Time Live Sign Recognition HUD & Captions Overlay */}
          <div className="absolute bottom-28 inset-x-4 sm:inset-x-12 z-10 flex flex-col items-center space-y-2">
            
            {/* Active Real-Time Hand Sign Detection Bar */}
            {activeSignMeaning && (
              <div className="w-full max-w-3xl bg-slate-950/90 backdrop-blur-md border border-indigo-500/40 rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <span className="text-2xl">{activeSignMeaning.symbol}</span>
                    {holdProgress > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">
                        {Math.round(holdProgress * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm truncate">{activeSignMeaning.signName}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 font-mono text-[10px] font-bold">
                        {Math.round(activeSignMeaning.confidence * 100)}% MATCH
                      </span>
                      {activeSignMeaning.isCustom && (
                        <span className="px-1.5 py-0.5 rounded-md bg-purple-900/60 text-purple-300 text-[10px] font-bold">
                          CUSTOM SIGN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] truncate">
                      Meaning: <span className="text-emerald-400 font-semibold">"{activeSignMeaning.translatedText}"</span> • {activeSignMeaning.meaning}
                    </p>
                  </div>
                </div>

                {/* Instant Action Buttons */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={handleCommitCurrentSignNow}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center space-x-1 transition-all shadow-md active:scale-95"
                    title="Commit and translate this sign now"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Send Sign</span>
                  </button>
                  <button
                    onClick={() => setShowSignDeck(true)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
                    title="Open Sign Recognition Deck"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* In-Call Real-Time Captions Stream */}
            <div className="w-full max-w-3xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-center relative group">
              <div className="flex items-center justify-between mb-1.5 text-xs text-indigo-400 font-bold">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time Interpretation Stream (Speech & Sign)</span>
                </span>
                <button
                  onClick={handleSpeakCurrentCaption}
                  className={`p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors ${
                    captionSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-900'
                  }`}
                  title="Speak caption aloud"
                >
                  {captionSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className={`font-semibold tracking-wide text-slate-100 ${
                settings.fontSize === 'extra-large' ? 'text-xl' : settings.fontSize === 'large' ? 'text-lg' : 'text-sm sm:text-base'
              }`}>
                {currentCaption}
              </p>
            </div>
          </div>

          {/* Local User Self-View PiP */}
          <div className="absolute bottom-28 right-6 w-36 sm:w-48 h-28 sm:h-36 rounded-2xl bg-slate-950 border-2 border-slate-700 shadow-2xl overflow-hidden z-20 group">
            {isCameraOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                <CameraOff className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Camera Off</span>
              </div>
            ) : useRealCameraLocal ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  transform: `scaleX(-${cameraZoom}) scaleY(${cameraZoom}) translate(${cameraPan.x * 12}%, ${cameraPan.y * 12}%)`,
                  transformOrigin: 'center center'
                }}
                className="w-full h-full object-cover transition-transform duration-150 ease-out"
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                  alt="You"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-white">
                  You (Signer)
                </div>
              </div>
            )}

            {/* Floating Zoom & Controls on PiP */}
            <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 p-1 rounded-lg">
              <button
                onClick={handleZoomOut}
                disabled={cameraZoom <= 1.0}
                className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-40"
                title="Zoom Out"
              >
                <ZoomOut className="w-2.5 h-2.5" />
              </button>
              <span className="text-[9px] font-mono text-indigo-400 font-bold px-0.5">{cameraZoom.toFixed(1)}x</span>
              <button
                onClick={handleZoomIn}
                disabled={cameraZoom >= 3.5}
                className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-40"
                title="Zoom In"
              >
                <ZoomIn className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => setMainViewMode(mainViewMode === 'interpreter' ? 'camera' : 'interpreter')}
                className="p-0.5 rounded text-slate-300 hover:text-white"
                title="Swap Main / PiP view"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* WebRTC SFU Live Telemetry Drawer */}
          {showDiagnostics && (
            <div className="absolute top-20 left-6 z-30 w-72 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-2xl p-4 text-xs font-mono shadow-2xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span>WebRTC SFU Telemetry</span>
                </span>
                <span className="text-[10px] text-slate-400">LiveKit 60fps</span>
              </div>

              <div className="space-y-1.5 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Video Codec:</span>
                  <span className="text-white font-bold">VP9 (1080p60)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Audio Codec:</span>
                  <span className="text-white font-bold">Opus 48kHz Stereo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roundtrip Latency:</span>
                  <span className="text-emerald-400 font-bold">24 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Bitrate:</span>
                  <span className="text-white font-bold">2.4 Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Packet Loss:</span>
                  <span className="text-emerald-400 font-bold">0.00%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Encryption:</span>
                  <span className="text-purple-400 font-bold flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>DTLS-SRTP 256-bit</span>
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* In-Call Hand Sign Recognition Deck Drawer */}
        {showSignDeck && (
          <div className="absolute left-0 top-0 bottom-24 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <HandMetal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">In-Call Hands & Sign Deck</span>
              </div>
              <div className="flex items-center space-x-1">
                {deckTab === 'signs' && (
                  <button
                    onClick={() => setShowAddSignModal(true)}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white flex items-center space-x-1"
                    title="Train or add a new custom sign"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Sign</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSignDeck(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Deck Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl my-2 border border-slate-800 text-xs">
              <button
                onClick={() => setDeckTab('signs')}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  deckTab === 'signs'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Signs ({dictionaryList.length})</span>
              </button>
              <button
                onClick={() => setDeckTab('free_fingers')}
                className={`py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  deckTab === 'free_fingers'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Free Fingers</span>
              </button>
            </div>

            {deckTab === 'signs' ? (
              <>
                {/* In-Call Sign Recognition Options */}
                <div className="py-2 border-b border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center space-x-1">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Auto-Speak Signs to Call</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={autoSpeakSigns}
                      onChange={(e) => setAutoSpeakSigns(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Auto-Send Signs to Chat</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={autoChatSigns}
                      onChange={(e) => setAutoChatSigns(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto py-2 border-b border-slate-800 text-[10px] font-bold">
                  {['all', 'custom', 'greetings', 'emergency', 'common', 'actions', 'numbers', 'alphabet'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg uppercase whitespace-nowrap transition-colors ${
                        selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Signs List */}
                <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 text-xs">
                  {filteredSigns.map(sign => {
                    const isActive = activeSignMeaning?.signName === sign.signName;
                    return (
                      <div
                        key={sign.key}
                        onClick={() => handleTestSign(sign.key)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isActive 
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{sign.symbol}</span>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                              <span>{sign.signName}</span>
                              {sign.isCustom && (
                                <span className="px-1 py-0.2 rounded bg-purple-900 text-purple-300 text-[9px]">Custom</span>
                              )}
                            </div>
                            <p className="text-[11px] text-emerald-400 font-medium">"{sign.translatedText}"</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSign(sign.key);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-indigo-600 text-[10px] font-bold text-slate-200"
                        >
                          {isActive ? 'Active' : 'Test'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Free Finger Controller tab inside drawer */
              <div className="flex-1 overflow-y-auto py-2">
                <FreeFingerController
                  handTracker={handTrackerRef.current}
                  currentPose={freeFingerPose}
                  onPoseChange={(p) => setFreeFingerPose(p)}
                />
              </div>
            )}

            {/* Recognized History Log */}
            <div className="pt-2 border-t border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="font-bold text-slate-300">Signed This Session ({recognizedSignLogs.length})</span>
                <span className="text-[10px]">Real-time feed</span>
              </div>
              <div className="flex space-x-1.5 overflow-x-auto pb-1">
                {recognizedSignLogs.slice(-5).map((log, i) => (
                  <div key={i} className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap flex items-center space-x-1">
                    <span>{log.symbol}</span>
                    <span className="font-bold">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Side In-Call Text Chat Drawer */}
        {showChat && (
          <div className="absolute right-0 top-0 bottom-24 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-30 flex flex-col p-4 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-white">In-Call Direct Notes</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.isSelf
                      ? 'ml-auto bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-800 text-slate-200 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-300/80 mb-1">
                    <span className="font-bold">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Canned Emergency / Medical Quick Chips */}
            <div className="py-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
              {[
                'Please repeat slower',
                'Spell that name',
                'Wait a moment',
                'Understood, thank you'
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => handleQuickChat(chip)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-semibold"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type note to interpreter..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Bottom Control Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
        
        {/* Left Action Toggles */}
        <div className="flex items-center space-x-2">
          {/* Sign Recognition Deck Toggle */}
          <button
            onClick={() => setShowSignDeck(!showSignDeck)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              showSignDeck 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs' 
                : 'bg-slate-900 border-slate-800 text-emerald-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Live Hand Signs Recognition Deck"
          >
            <HandMetal className="w-4 h-4" />
            <span className="font-bold">Sign Deck</span>
          </button>

          {/* Landmark Overlay Toggle */}
          <button
            onClick={() => setShowLandmarkOverlay(!showLandmarkOverlay)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              showLandmarkOverlay 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Toggle 21-point AI Hand Skeleton"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Skeleton</span>
          </button>

          {/* Camera Zoom In / Out & Auto-Center Quick Controls */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={handleToggleAutoCenter}
              className={`p-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-colors ${
                isAutoCentering ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Real-Time Hand Auto-Centering (Computer Vision)"
            >
              <Crosshair className="w-3 h-3" />
              <span>Auto</span>
            </button>
            <button
              onClick={handleZoomOut}
              disabled={cameraZoom <= 1.0 || isAutoCentering}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Camera Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-indigo-400 font-bold px-1">{cameraZoom.toFixed(1)}x</span>
            <button
              onClick={handleZoomIn}
              disabled={cameraZoom >= 3.5 || isAutoCentering}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Camera Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowAlignmentGuide(!showAlignmentGuide)}
              className={`p-1 rounded text-[10px] font-bold flex items-center space-x-0.5 ${
                showAlignmentGuide ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Hand Alignment Target Reticle"
            >
              <Target className="w-3 h-3" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {[0.75, 1.0, 1.25].map(spd => (
              <button
                key={spd}
                onClick={() => setSignSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  signSpeed === spd ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Center Main Media Controls */}
        <div className="flex items-center space-x-3 mx-auto">
          {/* Microphone */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isMuted
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isCameraOff
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </button>

          {/* Raise Hand Alert */}
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-600 animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Raise Hand for Turn-Taking"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Recording Engine */}
          <button
            onClick={handleToggleRecording}
            className={`p-3.5 rounded-2xl transition-all shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Record Session (WebM)'}
          >
            <Circle className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call & Review</span>
          </button>
        </div>

        {/* Right Side Chat Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-2xl transition-colors border ${
              showChat
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Notes & Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Add Custom Sign Modal mid-session */}
      {showAddSignModal && (
        <AddSignModal
          onClose={() => setShowAddSignModal(false)}
          onSaveSign={handleSaveSign}
        />
      )}

      {/* Recorded Video Playback & Download Modal */}
      {showRecordedModal && activeRecordingResult && (
        <RecordedVideoModal
          recording={activeRecordingResult}
          onClose={() => setShowRecordedModal(false)}
        />
      )}

    </div>
  );
};
