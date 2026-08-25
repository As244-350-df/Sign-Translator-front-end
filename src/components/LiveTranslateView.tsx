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
  ChevronDown
} from 'lucide-react';
import { AppSettings, RecognizedSign, SignLanguageCode, SignGestureItem } from '../types';
import { SIGN_LANGUAGES, COMMON_SIGNS, SIGN_ALPHABET } from '../data/mockData';
import { speakText, stopSpeaking, SpeechToSignListener } from '../utils/speech';
import { generateHandLandmarks, drawHandSkeleton } from '../utils/gestureSimulation';

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
  const [useRealWebcam, setUseRealWebcam] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showMesh, setShowMesh] = useState<boolean>(settings.gestureTrackingOverlay);
  
  // Recognition State
  const [recognizedSigns, setRecognizedSigns] = useState<RecognizedSign[]>([
    { text: 'HELLO', confidence: 0.98, timestamp: '10:00:12', hand: 'right', type: 'word' },
    { text: 'MY', confidence: 0.94, timestamp: '10:00:14', hand: 'right', type: 'word' },
    { text: 'NAME', confidence: 0.96, timestamp: '10:00:16', hand: 'both', type: 'word' },
    { text: 'A-L-E-X', confidence: 0.99, timestamp: '10:00:19', hand: 'right', type: 'letter' },
  ]);
  const [currentGesture, setCurrentGesture] = useState<{ name: string; confidence: number; category: string }>({
    name: 'HELLO',
    confidence: 0.97,
    category: 'greetings'
  });
  const [fullSentence, setFullSentence] = useState<string>('Hello, my name is Alex. Welcome to SignLink.');
  const [copied, setCopied] = useState<boolean>(false);

  // Reverse Translation (Speech/Text -> Sign Avatar / Gesture Animator)
  const [textInput, setTextInput] = useState<string>('Thank you for helping me');
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [animatingGestureIndex, setAnimatingGestureIndex] = useState<number>(0);
  const [isPlayingSignAnimation, setIsPlayingSignAnimation] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);

  // Canvas & Video references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const speechListenerRef = useRef<SpeechToSignListener | null>(null);

  // Filtered vocabulary based on language
  const currentLanguage = SIGN_LANGUAGES.find(l => l.code === settings.primarySignLanguage) || SIGN_LANGUAGES[0];

  // Start/Stop Real Webcam
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isCameraActive && useRealWebcam) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: settings.cameraFacing } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
          setPermissionError(null);
        })
        .catch((err) => {
          console.warn('Webcam permission not granted or unavailable:', err);
          setPermissionError('Camera access denied. Switched to AI Gesture Simulator mode.');
          setUseRealWebcam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, useRealWebcam, settings.cameraFacing]);

  // AI Landmark Canvas Render Loop
  useEffect(() => {
    if (!isCameraActive || translationMode !== 'sign_to_text') return;

    let time = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Periodically cycle recognized gestures for realistic AI simulation
    const gesturePool = [
      { name: 'HELLO', confidence: 0.98, category: 'greetings' },
      { name: 'THANK YOU', confidence: 0.96, category: 'greetings' },
      { name: 'PLEASE', confidence: 0.92, category: 'common' },
      { name: 'HELP', confidence: 0.99, category: 'emergency' },
      { name: 'GOOD', confidence: 0.95, category: 'common' },
      { name: 'I LOVE YOU', confidence: 0.97, category: 'common' },
      { name: 'DOCTOR', confidence: 0.91, category: 'emergency' },
      { name: 'FRIEND', confidence: 0.94, category: 'common' }
    ];

    let gestureTimer = setInterval(() => {
      const randomG = gesturePool[Math.floor(Math.random() * gesturePool.length)];
      setCurrentGesture(randomG);
      
      // Auto append to recognized transcript stream
      setRecognizedSigns(prev => {
        const next = [
          ...prev.slice(-12),
          {
            text: randomG.name,
            confidence: randomG.confidence,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            hand: Math.random() > 0.3 ? 'right' : 'both',
            type: 'word' as const
          }
        ];
        return next;
      });
    }, 4500);

    const render = () => {
      time += 16;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showMesh) {
        // Draw primary right hand tracking mesh
        const centerX = canvas.width * 0.58;
        const centerY = canvas.height * 0.52;
        const landmarks = generateHandLandmarks(centerX, centerY, canvas.width / 500, time);

        drawHandSkeleton(
          ctx, 
          landmarks, 
          '#10B981', 
          '#38BDF8', 
          true, 
          `${settings.primarySignLanguage} Detection: ${currentGesture.name}`, 
          currentGesture.confidence
        );

        // Optionally draw non-dominant left hand
        const leftX = canvas.width * 0.38;
        const leftY = canvas.height * 0.60;
        const leftLandmarks = generateHandLandmarks(leftX, leftY, canvas.width / 600, time + 200);
        drawHandSkeleton(ctx, leftLandmarks, '#6366F1', '#A855F7', false);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearInterval(gestureTimer);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isCameraActive, translationMode, showMesh, settings.primarySignLanguage]);

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

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Mode Selector & Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        
        {/* Toggle Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setTranslationMode('sign_to_text')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              translationMode === 'sign_to_text'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Sign → Text & Voice</span>
          </button>

          <button
            onClick={() => setTranslationMode('speech_to_sign')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              translationMode === 'speech_to_sign'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice/Text → Sign</span>
          </button>
        </div>

        {/* Dialect Selector & Live Interpreter Connect */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Dialect Dropdown */}
          <div className="relative inline-block">
            <select
              value={settings.primarySignLanguage}
              onChange={(e) => onUpdateSettings({ primarySignLanguage: e.target.value as SignLanguageCode })}
              className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {SIGN_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.code} ({lang.name.split(' ')[0]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Connect with Human Interpreter button */}
          <button
            onClick={() => onOpenLiveCall()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:shadow-emerald-500/25"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Live Human Interpreter</span>
          </button>
        </div>
      </div>

      {/* Main Translation Canvas Area */}
      {translationMode === 'sign_to_text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Camera / AI Vision Stream (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center">
              
              {/* Actual Video Element or Simulated Video Canvas */}
              {isCameraActive ? (
                <>
                  {useRealWebcam ? (
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover mirror transform -scale-x-100"
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" 
                        alt="Signer View Simulation"
                        className="w-full h-full object-cover opacity-35 filter blur-xs"
                      />
                      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/70 to-slate-950/90" />
                    </div>
                  )}

                  {/* Tracking Landmark Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={480}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />

                  {/* Live Scan Line Effect */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40 animate-scan pointer-events-none" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center space-x-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        AI Vision Active • {settings.primarySignLanguage}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-slate-300 text-xs">
                      <span>FPS: 60</span>
                      <span className="text-slate-500">•</span>
                      <span>Lat: 18ms</span>
                    </div>
                  </div>

                  {/* Bottom Gesture Detection Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/60 shadow-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                        <HandMetal className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-medium">Classified Gesture</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {Math.round(currentGesture.confidence * 100)}% Match
                          </span>
                        </div>
                        <p className="text-lg font-bold text-white tracking-wide">
                          {currentGesture.name}
                        </p>
                      </div>
                    </div>

                    {/* Confidence Meter Bar */}
                    <div className="w-28 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                        <span>Confidence</span>
                        <span>{Math.round(currentGesture.confidence * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${currentGesture.confidence * 100}%` }}
                        />
                      </div>
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
              <div className="flex items-center space-x-2">
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
                  <span>{useRealWebcam ? 'Using My Webcam' : 'Simulation Mode'}</span>
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
            
            {/* Live Generated Sentence */}
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
                className={`w-full flex-1 min-h-[120px] p-3.5 rounded-2xl resize-none text-base leading-relaxed font-medium transition-all ${
                  settings.highContrastCaptions
                    ? 'bg-black text-amber-300 font-mono border-2 border-amber-400'
                    : 'bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500'
                }`}
                placeholder="Translated sign language will appear here in real time..."
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => setFullSentence('')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSpeakTranscript}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Speak Audio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Gesture Stream Feed Log */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Recognized Gesture Tape
                </span>
                <span className="text-[11px] text-slate-400">
                  {recognizedSigns.length} gestures captured
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[190px] pr-1">
                {recognizedSigns.slice().reverse().map((sign, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                        {sign.type === 'letter' ? 'ABC' : 'ASL'}
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
                    {currentAnimatedWord.length === 1 ? currentAnimatedWord : currentAnimatedWord.slice(0, 3)}
                  </span>
                  <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-indigo-600 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    {settings.primarySignLanguage} Motion
                  </div>
                </div>

                {/* Current Gesture Name */}
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                  {currentAnimatedWord}
                </h2>
                <p className="text-sm text-cyan-300 font-medium max-w-sm">
                  {COMMON_SIGNS.find(s => s.name.toUpperCase() === currentAnimatedWord)?.description || 
                   SIGN_ALPHABET.find(a => a.name === currentAnimatedWord)?.description ||
                   `Fingerspelling manual gesture sequence for: "${currentAnimatedWord}"`}
                </p>
              </div>

              {/* Progress dots for current sentence */}
              <div className="absolute bottom-16 flex items-center space-x-1.5">
                {parsedWords.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      animatingGestureIndex === i 
                        ? 'w-6 bg-cyan-400' 
                        : 'w-2 bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Playback Controls Footer Bar */}
              <div className="absolute bottom-4 inset-x-4 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlayingSignAnimation(!isPlayingSignAnimation)}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
                  >
                    {isPlayingSignAnimation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                    {isPlayingSignAnimation ? 'Auto Playing' : 'Paused'}
                  </span>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl">
                  {[0.5, 1.0, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setAnimationSpeed(spd)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        animationSpeed === spd
                          ? 'bg-cyan-500 text-slate-950 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Vocalize Spoken Output */}
                <button
                  onClick={() => speakText(textInput, settings.speechVoiceRate, settings.speechVoicePitch)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Speak</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
