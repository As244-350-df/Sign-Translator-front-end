import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Maximize2, 
  Settings2, 
  Video, 
  HandMetal, 
  Play, 
  Pause, 
  FastForward, 
  Layers, 
  HelpCircle,
  Keyboard,
  Share2,
  ChevronDown,
  ChevronUp,
  Circle,
  Download,
  Activity,
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Target,
  Sliders,
  Focus,
  Move
} from 'lucide-react';
import { AppSettings, RecognizedSign, SignLanguageCode, SignGestureItem } from '../types';
import { SIGN_LANGUAGES, COMMON_SIGNS, SIGN_ALPHABET } from '../data/mockData';
import { speakText, stopSpeaking, SpeechToSignListener } from '../utils/speech';
import { RealtimeHandTracker, HandDetectionResult, SIGN_DICTIONARY, SignSymbolMeaning, FingerPoseState } from '../utils/handTracker';
import { LiveSessionRecorder, RecordedVideoResult } from '../utils/mediaRecorder';
import { RecordedVideoModal } from './RecordedVideoModal';
import { AddSignModal } from './AddSignModal';
import { FreeFingerController } from './FreeFingerController';

interface LiveTranslateViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenLiveCall: (interpreterId?: string) => void;
  onOpenKeyboard: () => void;
  onOpenTutorial: () => void;
}

export const LiveTranslateView: React.FC<LiveTranslateViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenLiveCall,
  onOpenKeyboard,
  onOpenTutorial
}) => {
  // Mode: 'sign_to_text' (Camera AI Vision) | 'speech_to_sign' (Voice/Text to Sign Animation)
  const [translationMode, setTranslationMode] = useState<'sign_to_text' | 'speech_to_sign'>('sign_to_text');
  
  // Camera & Tracking State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [useRealWebcam, setUseRealWebcam] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showMesh, setShowMesh] = useState<boolean>(settings.gestureTrackingOverlay);
  const [autoSpeakOnCommit, setAutoSpeakOnCommit] = useState<boolean>(false);
  
  // Custom Sign Creation Modal State
  const [showAddSignModal, setShowAddSignModal] = useState<boolean>(false);
  const [showFreeFingerStudio, setShowFreeFingerStudio] = useState<boolean>(true);
  const [dictionaryMap, setDictionaryMap] = useState<Record<string, SignSymbolMeaning>>(SIGN_DICTIONARY);
  const [currentFingerPose, setCurrentFingerPose] = useState<FingerPoseState>({
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

  // Real-time TensorFlow Telemetry & Active Sign Meaning
  const [tfTelemetry, setTfTelemetry] = useState<{ 
    fps: number; 
    gesture: string; 
    confidence: number; 
    isReal: boolean;
    holdProgress: number;
  }>({
    fps: 60,
    gesture: '🖐️ HELLO',
    confidence: 0.98,
    isReal: false,
    holdProgress: 0.5
  });

  const [activeSignMeaning, setActiveSignMeaning] = useState<SignSymbolMeaning>(SIGN_DICTIONARY['HELLO'] || {
    symbol: '🖐️',
    signName: 'HELLO',
    translatedText: 'Hello',
    meaning: 'Standard friendly greeting',
    category: 'greetings',
    confidence: 0.97
  });

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [activeRecordingResult, setActiveRecordingResult] = useState<RecordedVideoResult | null>(null);
  const [showRecordedModal, setShowRecordedModal] = useState<boolean>(false);
  
  // Recognition State & Sentence Construction
  const [recognizedSigns, setRecognizedSigns] = useState<RecognizedSign[]>([
    { text: 'HELLO', confidence: 0.98, timestamp: '10:00:12', hand: 'right', type: 'word' },
    { text: 'I LOVE YOU', confidence: 0.99, timestamp: '10:00:15', hand: 'right', type: 'word' },
    { text: 'PEACE', confidence: 0.96, timestamp: '10:00:19', hand: 'both', type: 'word' },
  ]);

  const [fullSentence, setFullSentence] = useState<string>('Hello! I love you. Peace to everyone.');
  const [copied, setCopied] = useState<boolean>(false);

  // Reverse Translation (Speech/Text -> Sign Avatar / Gesture Animator)
  const [textInput, setTextInput] = useState<string>('Thank you for helping me');
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [animatingGestureIndex, setAnimatingGestureIndex] = useState<number>(0);
  const [isPlayingSignAnimation, setIsPlayingSignAnimation] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);

  // Filter Category for Sign Dictionary Guide
  const [selectedSignCategory, setSelectedSignCategory] = useState<string>('all');

  // Canvas, Tracker & Video references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handTrackerRef = useRef<RealtimeHandTracker>(new RealtimeHandTracker());
  const recorderRef = useRef<LiveSessionRecorder>(new LiveSessionRecorder());
  const animationFrameId = useRef<number | null>(null);
  const speechListenerRef = useRef<SpeechToSignListener | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Camera Zoom, Pan Framing & Hand Alignment Calibration
  const [cameraZoom, setCameraZoom] = useState<number>(1.0);
  const [cameraPan, setCameraPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showAlignmentGuide, setShowAlignmentGuide] = useState<boolean>(false);
  const [showZoomMenu, setShowZoomMenu] = useState<boolean>(false);
  const [calibrationScale, setCalibrationScale] = useState<number>(1.0);

  // Sync zoom and calibration to handTracker and hardware camera track
  useEffect(() => {
    handTrackerRef.current.setZoom(cameraZoom, cameraPan.x, cameraPan.y);
    handTrackerRef.current.setCalibrationScale(calibrationScale);

    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const caps = (track as any).getCapabilities?.();
          if (caps && caps.zoom) {
            const minZ = caps.zoom.min || 1;
            const maxZ = caps.zoom.max || 3.5;
            const targetZ = Math.max(minZ, Math.min(maxZ, cameraZoom));
            (track as any).applyConstraints?.({
              advanced: [{ zoom: targetZ }]
            }).catch(() => {});
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }, [cameraZoom, cameraPan, calibrationScale]);

  const handleZoomIn = () => {
    setCameraZoom(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setCameraZoom(prev => Math.max(1.0, Number((prev - 0.25).toFixed(2))));
  };

  const handleSetZoom = (z: number) => {
    setCameraZoom(Math.max(1.0, Math.min(3.5, Number(z.toFixed(2)))));
  };

  const handleResetZoom = () => {
    setCameraZoom(1.0);
    setCameraPan({ x: 0, y: 0 });
    setCalibrationScale(1.0);
  };

  const handlePanNudge = (dx: number, dy: number) => {
    setCameraPan(prev => ({
      x: Math.max(-1.0, Math.min(1.0, Number((prev.x + dx).toFixed(2)))),
      y: Math.max(-1.0, Math.min(1.0, Number((prev.y + dy).toFixed(2))))
    }));
  };

  // Filtered vocabulary based on language
  const currentLanguage = SIGN_LANGUAGES.find(l => l.code === settings.primarySignLanguage) || SIGN_LANGUAGES[0];

  // Start/Stop Real Webcam
  useEffect(() => {
    if (isCameraActive && useRealWebcam) {
      navigator.mediaDevices?.getUserMedia({ 
        video: { facingMode: settings.cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })
        .then((s) => {
          mediaStreamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setPermissionError(null);
        })
        .catch((err) => {
          console.warn('Webcam permission not granted or unavailable:', err);
          setPermissionError('Camera access denied. Switched to AI Gesture Simulator mode.');
          setUseRealWebcam(false);
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, useRealWebcam, settings.cameraFacing]);

  // AI TensorFlow Landmark Canvas Render & Real-time Translation Loop
  useEffect(() => {
    if (!isCameraActive || translationMode !== 'sign_to_text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tracker = handTrackerRef.current;

    const render = (time: number) => {
      if (videoRef.current && useRealWebcam) {
        tracker.setElements(videoRef.current, canvas);
      }

      // Process live frame with 21 landmark spatial tracker
      const detection = tracker.processFrame(time);

      setTfTelemetry({
        fps: detection.fps,
        gesture: detection.gesture,
        confidence: detection.confidence,
        isReal: detection.isRealHandDetected,
        holdProgress: detection.holdProgress
      });

      if (detection.signMeaning) {
        setActiveSignMeaning(detection.signMeaning);
      }

      // When sign is held and committed by the tracker, translate and append to sentence!
      if (detection.isCommitted && detection.signMeaning) {
        const textOutput = detection.signMeaning.translatedText;
        
        // Append to sentence builder
        setFullSentence(prev => {
          if (!prev || prev.trim() === '') {
            return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
          }
          return `${prev.trim()} ${textOutput}`;
        });

        // Append to transcript tape
        setRecognizedSigns(prev => [
          ...prev.slice(-14),
          {
            text: `${detection.signMeaning?.symbol} ${detection.signMeaning?.translatedText.toUpperCase()}`,
            confidence: detection.confidence,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            hand: 'right',
            type: 'word'
          }
        ]);

        // Auto speak if option is enabled
        if (autoSpeakOnCommit) {
          speakText(textOutput, settings.speechVoiceRate, settings.speechVoicePitch);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showMesh) {
        tracker.draw(ctx, detection, {
          color: detection.isRealHandDetected ? '#10B981' : '#6366F1',
          jointColor: '#38BDF8',
          showBoundingBox: true,
          showHUD: true,
          showAlignmentGuide: showAlignmentGuide,
          labelPrefix: `${settings.primarySignLanguage} TensorFlow CV`
        });
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, translationMode, showMesh, showAlignmentGuide, useRealWebcam, autoSpeakOnCommit, settings.primarySignLanguage, settings.speechVoiceRate, settings.speechVoicePitch]);

  // Manually force test a sign
  const handleTestSign = (signKey: string) => {
    handTrackerRef.current.forceSign(signKey);
    const meaning = dictionaryMap[signKey];
    if (meaning) {
      setActiveSignMeaning(meaning);
    }
  };

  // Add / Save new Sign Recognition
  const handleSaveSign = (key: string, newSign: SignSymbolMeaning) => {
    const registeredKey = handTrackerRef.current.registerCustomSign(key, newSign);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
    setActiveSignMeaning(newSign);
    handTrackerRef.current.forceSign(registeredKey);
  };

  // Delete Custom Sign
  const handleDeleteCustomSign = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    handTrackerRef.current.deleteCustomSign(key);
    const updated = handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
  };

  // Commit current active sign immediately to sentence
  const handleCommitCurrentSign = () => {
    if (!activeSignMeaning) return;
    const textOutput = activeSignMeaning.translatedText;
    
    setFullSentence(prev => {
      if (!prev || prev.trim() === '') {
        return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
      }
      return `${prev.trim()} ${textOutput}`;
    });

    setRecognizedSigns(prev => [
      ...prev.slice(-14),
      {
        text: `${activeSignMeaning.symbol} ${activeSignMeaning.translatedText.toUpperCase()}`,
        confidence: activeSignMeaning.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        hand: 'right',
        type: 'word'
      }
    ]);

    speakText(textOutput, settings.speechVoiceRate, settings.speechVoicePitch);
  };

  // Real Video Recording Trigger
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
      const started = await recorder.startRecording(canvas, mediaStreamRef.current, (sec) => {
        setRecordedDuration(sec);
      });
      if (started) {
        setIsRecording(true);
        setRecordedDuration(0);
      }
    }
  };

  const formatRecordedTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Speech Recognition initialization
  useEffect(() => {
    speechListenerRef.current = new SpeechToSignListener();
    return () => {
      speechListenerRef.current?.stop();
    };
  }, []);

  const handleToggleMic = () => {
    if (!speechListenerRef.current?.isSupported()) {
      alert('Speech recognition is not supported in this browser. You can type text directly in the box.');
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

  const handleSpeakTranscript = () => {
    const textToSpeak = fullSentence || recognizedSigns.map(s => s.text).join(' ');
    speakText(textToSpeak, settings.speechVoiceRate, settings.speechVoicePitch);
  };

  const handleCopy = () => {
    const textToCopy = fullSentence || recognizedSigns.map(s => s.text).join(' ');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert input text into individual sign sequences for reverse sign animator
  const parsedWords = textInput.toUpperCase().split(/\s+/).filter(Boolean);
  const currentAnimatedWord = parsedWords[animatingGestureIndex % Math.max(1, parsedWords.length)] || 'READY';

  useEffect(() => {
    if (!isPlayingSignAnimation || parsedWords.length === 0) return;

    const interval = setInterval(() => {
      setAnimatingGestureIndex(prev => (prev + 1) % parsedWords.length);
    }, 2000 / animationSpeed);

    return () => clearInterval(interval);
  }, [isPlayingSignAnimation, parsedWords.length, animationSpeed]);

  const dictionaryList = (Object.entries(dictionaryMap) as [string, SignSymbolMeaning][]).map(([key, item]) => ({
    key,
    ...item
  }));

  const filteredDictionary = selectedSignCategory === 'all' 
    ? dictionaryList 
    : dictionaryList.filter(d => d.category === selectedSignCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Header & Translation Mode Toggle Bar */}
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

        {/* Right Controls: Add Sign & Mode Switcher */}
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
              onClick={() => setTranslationMode('sign_to_text')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                translationMode === 'sign_to_text'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <HandMetal className="w-4 h-4" />
              <span>Sign → Text (Camera CV)</span>
            </button>

            <button
              onClick={() => setTranslationMode('speech_to_sign')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                translationMode === 'speech_to_sign'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Speech/Text → Sign (Avatar)</span>
            </button>
          </div>
        </div>
      </div>

      {translationMode === 'sign_to_text' ? (
        /* CAMERA AI TRANSLATION VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Video & Landmark Stage (Left 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Live Camera View Container */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
              
              {isCameraActive ? (
                <>
                  {/* Real WebCam Video Feed */}
                  {useRealWebcam ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        transform: `scaleX(-${cameraZoom}) scaleY(${cameraZoom}) translate(${cameraPan.x * 12}%, ${cameraPan.y * 12}%)`,
                        transformOrigin: 'center center',
                      }}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-150 ease-out"
                    />
                  ) : (
                    /* Simulated Video Background for Test Mode */
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                      <div className="w-44 h-44 rounded-full bg-indigo-500/10 animate-ping absolute" />
                      <div className="text-center z-0 opacity-40">
                        <HandMetal className="w-16 h-16 text-indigo-400 mx-auto mb-2" />
                        <p className="text-xs font-mono text-indigo-300">TensorFlow Neural Kinematics Simulation</p>
                      </div>
                    </div>
                  )}

                  {/* Tracking Landmark Canvas Overlay (1280x720) */}
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Live Scan Line Effect */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 animate-scan pointer-events-none" />

                  {/* Floating Zoom & Hand Alignment HUD Controls */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
                    {/* Compact Glass Zoom Pill Bar */}
                    <div className="bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center space-x-1.5">
                      {/* Zoom Out Button */}
                      <button
                        onClick={handleZoomOut}
                        disabled={cameraZoom <= 1.0}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
                        title="Zoom Out (Reduce camera crop)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      {/* Zoom Level Indicator / Popover Toggle */}
                      <button
                        onClick={() => setShowZoomMenu(!showZoomMenu)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                        title="Click to open Zoom Presets & Hand Calibration"
                      >
                        <Focus className="w-3 h-3" />
                        <span>{cameraZoom.toFixed(2)}x</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showZoomMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Zoom In Button */}
                      <button
                        onClick={handleZoomIn}
                        disabled={cameraZoom >= 3.5}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
                        title="Zoom In (Enlarge hand & fingers for precise tracking)"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Reset 1.0x (if zoomed or panned) */}
                      {(cameraZoom > 1.0 || cameraPan.x !== 0 || cameraPan.y !== 0) && (
                        <button
                          onClick={handleResetZoom}
                          className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
                          title="Reset to 1.0x Default Fit"
                        >
                          1.0x
                        </button>
                      )}

                      {/* Hand Alignment Guide Toggle */}
                      <button
                        onClick={() => setShowAlignmentGuide(!showAlignmentGuide)}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                          showAlignmentGuide
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Toggle Hand Alignment Guide & Sweet-spot Reticle"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold pr-0.5">{showAlignmentGuide ? 'Guide ON' : 'Align'}</span>
                      </button>
                    </div>

                    {/* Precision Zoom & Framing Popover Drawer */}
                    {showZoomMenu && (
                      <div className="w-72 bg-slate-900/95 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-700/90 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
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

                        {/* Quick Presets */}
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                            Quick Zoom Presets
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: '1.0x Fit', val: 1.0 },
                              { label: '1.25x', val: 1.25 },
                              { label: '1.5x Opt', val: 1.5 },
                              { label: '1.75x', val: 1.75 },
                              { label: '2.0x Close', val: 2.0 },
                              { label: '2.5x', val: 2.5 },
                              { label: '3.0x Macro', val: 3.0 },
                              { label: '3.5x Max', val: 3.5 },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                onClick={() => handleSetZoom(preset.val)}
                                className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  Math.abs(cameraZoom - preset.val) < 0.05
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Continuous Zoom Slider */}
                        <div className="space-y-1">
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
                            onChange={(e) => handleSetZoom(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Finger Span Calibration Scale */}
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

                        {/* Camera Framing Pan D-Pad */}
                        {cameraZoom > 1.05 && (
                          <div className="pt-2 border-t border-slate-800">
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Top Overlay Badges */}
                  <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-none">
                    <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30">
                      <span className={`flex h-2.5 w-2.5 rounded-full ${tfTelemetry.isReal ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400 animate-pulse'}`} />
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        {tfTelemetry.isReal ? 'TensorFlow Camera' : 'AI Sim'} • {settings.primarySignLanguage}
                      </span>
                    </div>

                    {isRecording && (
                      <div className="flex items-center space-x-1.5 bg-rose-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-rose-700 text-rose-300 text-xs font-mono font-bold animate-pulse">
                        <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                        <span>REC {formatRecordedTime(recordedDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Active Translation Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/60 flex items-center justify-center text-2xl shadow-inner">
                        {activeSignMeaning.symbol}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                            {activeSignMeaning.signName}
                          </span>
                          {activeSignMeaning.isCustom && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-extrabold">
                              Custom Sign
                            </span>
                          )}
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

                    {/* Commit & Auto Progress indicator */}
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
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
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
                </div>
              )}
            </div>

            {/* Camera Toolbar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    isCameraActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  }`}
                >
                  {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  <span>{isCameraActive ? 'Camera On' : 'Camera Off'}</span>
                </button>

                <button
                  onClick={() => setUseRealWebcam(!useRealWebcam)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    useRealWebcam 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{useRealWebcam ? 'Using Webcam' : 'Simulation Mode'}</span>
                </button>

                <button
                  onClick={() => setShowMesh(!showMesh)}
                  className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                    showMesh 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}
                  title="Toggle 21-point Hand Landmarks Skeleton Mesh"
                >
                  Mesh {showMesh ? 'ON' : 'OFF'}
                </button>

                {/* Auto Speak on Commit */}
                <button
                  onClick={() => setAutoSpeakOnCommit(!autoSpeakOnCommit)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                    autoSpeakOnCommit 
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-400/40' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title="Automatically speak each committed sign out loud"
                >
                  {autoSpeakOnCommit ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Auto TTS {autoSpeakOnCommit ? 'ON' : 'OFF'}</span>
                </button>

                {/* Record Translation Video Button */}
                <button
                  onClick={handleToggleRecording}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Record Translation Session'}
                >
                  <Circle className="w-3.5 h-3.5 fill-current" />
                  <span>{isRecording ? `REC ${formatRecordedTime(recordedDuration)}` : 'Record'}</span>
                </button>

                {/* Zoom & Alignment Controls */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={handleZoomOut}
                    disabled={cameraZoom <= 1.0}
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
                    disabled={cameraZoom >= 3.5}
                    className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Zoom In Camera (0.25x step)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowAlignmentGuide(!showAlignmentGuide)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      showAlignmentGuide
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600'
                    }`}
                    title="Toggle Hand Alignment Guide Reticle"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Guide</span>
                  </button>
                </div>

                {/* Free Finger Motion Studio Toggle */}
                <button
                  onClick={() => setShowFreeFingerStudio(!showFreeFingerStudio)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    showFreeFingerStudio
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                  title="Open Free Finger Articulation & Dynamic Motion Studio"
                >
                  <HandMetal className="w-4 h-4" />
                  <span>Free Fingers Studio {showFreeFingerStudio ? '▲' : '▼'}</span>
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

            {/* Free Finger Articulation & Dynamic Motion Studio */}
            {showFreeFingerStudio && (
              <FreeFingerController
                handTracker={handTrackerRef.current}
                currentPose={currentFingerPose}
                onPoseChange={(p) => setCurrentFingerPose(p)}
              />
            )}

            {/* Interactive Sign Language Cheatsheet & Live Symbol Tester */}
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

                  {['all', 'custom', 'greetings', 'common', 'emergency', 'actions', 'numbers', 'alphabet'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSignCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                        selectedSignCategory === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                Hold any of these signs in front of your camera or click to simulate and translate the symbol into text!
              </p>

              {/* Grid of Signs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredDictionary.map((item) => {
                  const isActive = activeSignMeaning.signName === item.signName;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleTestSign(item.key)}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{item.symbol}</span>
                        <div className="flex items-center space-x-1">
                          {item.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustomSign(e, item.key)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all"
                              title="Delete custom sign"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {item.translatedText}
                          </p>
                          {item.isCustom && (
                            <span className="text-[9px] px-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded font-bold">
                              User
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">
                          {item.signName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {permissionError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>{permissionError}</span>
                <button 
                  onClick={() => setPermissionError(null)}
                  className="font-bold underline ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Transcript & Output Box (Right 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Live Generated Sentence Box */}
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

              {/* Editable/Interactive Transcript Box */}
              <textarea
                value={fullSentence}
                onChange={(e) => setFullSentence(e.target.value)}
                className={`w-full flex-1 min-h-[140px] p-4 rounded-2xl resize-none text-base leading-relaxed font-medium transition-all ${
                  settings.highContrastCaptions
                    ? 'bg-black text-amber-300 font-mono border-2 border-amber-400'
                    : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500'
                }`}
                placeholder="Translated sign language will assemble here automatically as you sign in front of the camera..."
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setFullSentence('')}
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

            {/* Gesture Stream Feed Log */}
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
                {recognizedSigns.slice().reverse().map((sign, idx) => (
                  <div 
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
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Speech / Text -> Sign Language Gesture Generator View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Input Panel (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Enter Text or Speak to Translate</span>
                </label>
                <button
                  onClick={handleToggleMic}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    isListeningMic
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/25'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600'
                  }`}
                >
                  {isListeningMic ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListeningMic ? 'Listening...' : 'Voice Input'}</span>
                </button>
              </div>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={4}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Type or speak a message (e.g. 'Hello, where is the doctor? Thank you')..."
              />

              {/* Quick Preset Phrases */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Sign Phrases
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Hello my friend', 'Thank you so much', 'I need help please', 'Where is doctor', 'I love you'].map(phrase => (
                    <button
                      key={phrase}
                      onClick={() => setTextInput(phrase)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Word Breakdown Chips */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-3">
                Sign Sequence Tokens ({parsedWords.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {parsedWords.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnimatingGestureIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      animatingGestureIndex === idx
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{word}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Animated Sign Avatar & Gesture Player (Right 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-4/3 w-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex flex-col items-center justify-center p-6 text-white text-center">
              
              {/* Active Sign Visual Display */}
              <div className="relative z-10 flex flex-col items-center">
                
                {/* 3D Illustrated Sign Handshape Badge */}
                <div className="w-32 h-32 rounded-3xl bg-indigo-600/30 border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center mb-4 backdrop-blur-md relative">
                  <span className="text-5xl font-black tracking-wider text-cyan-300">
                    {currentAnimatedWord.slice(0, 3)}
                  </span>
                  <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-emerald-500 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                    {currentLanguage.code} Form
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
                  {currentAnimatedWord}
                </h2>
                <p className="text-xs text-indigo-300 max-w-sm">
                  Sign Gesture #{animatingGestureIndex + 1} of {Math.max(1, parsedWords.length)}
                </p>

                {/* Animated progress bar for sequence */}
                <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${((animatingGestureIndex + 1) / Math.max(1, parsedWords.length)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Playback Controls Overlay */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingSignAnimation(!isPlayingSignAnimation)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {isPlayingSignAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setAnimatingGestureIndex(prev => (prev + 1) % Math.max(1, parsedWords.length))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Next Sign"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Speed:</span>
                  {[0.5, 1.0, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setAnimationSpeed(speed)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                        animationSpeed === speed
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Sign Recognition Modal */}
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
