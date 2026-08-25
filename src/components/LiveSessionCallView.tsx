import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  MessageSquare, 
  Volume2, 
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
  ChevronDown
} from 'lucide-react';
import { Interpreter, AppSettings } from '../types';
import { MOCK_INTERPRETERS } from '../data/mockData';

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
  const [signSpeed, setSignSpeed] = useState<number>(1.0);
  const [chatInput, setChatInput] = useState<string>('');
  
  // Real-time live captions
  const [currentCaption, setCurrentCaption] = useState<string>(
    `"The doctor mentioned reviewing your prescription dosage. Would you like me to clarify the timing?"`
  );

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; time: string; text: string; isSelf?: boolean }>>([
    { sender: interpreter.name, time: '10:02', text: 'Hello! I am connected and can hear the other participant clearly.' },
    { sender: 'You', time: '10:03', text: 'Thank you! Please let me know if you need me to spell any medical terms.', isSelf: true },
    { sender: interpreter.name, time: '10:04', text: 'Understood. The physician is speaking now, translating...' }
  ]);

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

  // Caption cycle simulation for realism
  useEffect(() => {
    const captionList = [
      `"The doctor confirms: take 1 tablet with breakfast each morning."`,
      `"Please confirm if you experience any side effects in the next 14 days."`,
      `"All laboratory test results from Monday came back normal and healthy."`,
      `"Elena (Interpreter): Doctor asks if you have questions regarding the physical therapy referral."`
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % captionList.length;
      setCurrentCaption(captionList[idx]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* Top Session Status Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between">
        
        {/* Interpreter Info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={interpreter.avatar}
              alt={interpreter.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="font-bold text-sm text-white">{interpreter.name}</h2>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Live Human Interpreter • {settings.primarySignLanguage} Certified
            </p>
          </div>
        </div>

        {/* Call Metadata & Timer */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-mono font-bold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTime(callDuration)}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-emerald-400 font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span>HD 1080p</span>
          </div>
        </div>

      </div>

      {/* Main Video Viewport & Layout */}
      <div className="relative flex-1 flex flex-col justify-center items-center overflow-hidden">
        
        {/* Primary Interpreter Video Stream */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={interpreter.coverImage || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop&q=80"}
            alt="Live Interpreter Feed"
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        {/* Picture-in-Picture: User Camera Feed (Top Right) */}
        <div className="absolute top-18 right-4 z-20 w-32 sm:w-44 aspect-4/3 rounded-2xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl overflow-hidden">
          {isCameraOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
              <CameraOff className="w-6 h-6 mb-1 text-slate-500" />
              <span className="text-[10px] font-bold">Your Camera Off</span>
            </div>
          ) : (
            <div className="relative w-full h-full bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                alt="Your camera feed"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white">
                You
              </span>
            </div>
          )}
        </div>

        {/* Live Subtitles Banner Overlay (Bottom Viewport) */}
        <div className="absolute bottom-24 inset-x-4 sm:inset-x-12 z-20 flex justify-center pointer-events-none">
          <div className={`p-4 rounded-2xl max-w-2xl text-center shadow-xl backdrop-blur-md transition-all ${
            settings.highContrastCaptions
              ? 'bg-black text-amber-300 font-mono text-base border-2 border-amber-400'
              : 'bg-slate-900/90 text-white border border-slate-700/80 text-sm sm:text-base font-medium'
          }`}>
            <div className="flex items-center justify-center space-x-1.5 mb-1 text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Captions</span>
            </div>
            <p className="leading-snug">
              {currentCaption}
            </p>
          </div>
        </div>

        {/* Hand Raised Notification Indicator */}
        {isHandRaised && (
          <div className="absolute top-20 left-4 z-20 px-3 py-1.5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg animate-bounce">
            <Hand className="w-4 h-4" />
            <span>Hand Raised to Speak</span>
          </div>
        )}

      </div>

      {/* Floating Chat Sidebar (If opened) */}
      {showChat && (
        <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">In-Call Chat & Notes</h3>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          {/* Quick Phrase Buttons */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
              Quick In-Session Prompts
            </span>
            <div className="flex flex-wrap gap-1">
              {['Please slow down', 'Please spell that name', 'Could you repeat?'].map(p => (
                <button
                  key={p}
                  onClick={() => handleQuickChat(p)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-900/50 hover:text-indigo-300 text-[10px] text-slate-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1 text-[10px] text-slate-400 mb-0.5">
                  <span className="font-semibold">{msg.sender}</span>
                  <span>• {msg.time}</span>
                </div>
                <div className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  msg.isSelf
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-800 text-slate-200 rounded-tl-xs border border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message to interpreter..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
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

      {/* Bottom Control Bar Actions */}
      <div className="relative z-20 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Side: Speed Multiplier */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Signing Speed:
          </span>
          {[0.75, 1.0, 1.25].map((spd) => (
            <button
              key={spd}
              onClick={() => setSignSpeed(spd)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                signSpeed === spd
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Center: In-Call Toggles */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-2xl font-bold transition-all ${
              isMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            className={`p-3 rounded-2xl font-bold transition-all ${
              isCameraOff
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </button>

          {/* Raise Hand */}
          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`p-3 rounded-2xl font-bold transition-all ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Raise Hand to signal speaker"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Toggle Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-2xl font-bold transition-all relative ${
              showChat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="Toggle in-call messaging chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* END SESSION (Red Button) */}
          <button
            onClick={onEndCall}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center space-x-2 transition-all active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>

        {/* Right Side: Dialect Indicator */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Encrypted Session • {settings.primarySignLanguage}</span>
        </div>

      </div>

    </div>
  );
};
