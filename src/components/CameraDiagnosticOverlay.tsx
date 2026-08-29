import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Sun,
  Moon,
  Tv,
  Layers,
  Wrench,
  X,
  Info,
  Sliders,
  RotateCcw,
  Eye,
  EyeOff,
  VideoOff,
  Activity
} from 'lucide-react';
import { CameraStreamStatus, CameraErrorInfo } from './LiveTranslateView';

export interface CameraDiagnosticOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  permissionStatus: 'checking' | 'prompt' | 'granted' | 'denied' | 'unsupported';
  streamStatus: CameraStreamStatus;
  cameraError: CameraErrorInfo | null;
  mediaStream: MediaStream | null;
  videoElement: HTMLVideoElement | null;
  facingMode: 'user' | 'environment';
  useRealWebcam: boolean;
  onRetryCamera: () => void;
  onSwitchFacingMode: () => void;
  onToggleWebcamMode: () => void;
}

export const CameraDiagnosticOverlay: React.FC<CameraDiagnosticOverlayProps> = ({
  isOpen,
  onClose,
  permissionStatus,
  streamStatus,
  cameraError,
  mediaStream,
  videoElement,
  facingMode,
  useRealWebcam,
  onRetryCamera,
  onSwitchFacingMode,
  onToggleWebcamMode
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [sampledLuminance, setSampledLuminance] = useState<number | null>(null);
  const [isLuminanceDark, setIsLuminanceDark] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'troubleshoot' | 'raw'>('metrics');
  
  // Real-time track metrics
  const [trackSettings, setTrackSettings] = useState<MediaTrackSettings | null>(null);
  const [trackCapabilities, setTrackCapabilities] = useState<MediaTrackCapabilities | null>(null);
  const [trackState, setTrackState] = useState<MediaStreamTrackState | null>(null);
  const [trackMuted, setTrackMuted] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number; readyState: number }>({
    width: 0,
    height: 0,
    readyState: 0
  });

  const samplingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Poll video dimensions, track settings, and sample brightness
  useEffect(() => {
    if (!isOpen) return;

    const analyzeStream = () => {
      // 1. Video element dimensions
      if (videoElement) {
        setVideoDimensions({
          width: videoElement.videoWidth || 0,
          height: videoElement.videoHeight || 0,
          readyState: videoElement.readyState
        });

        // 2. Luminance & Black Screen detection
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0 && videoElement.readyState >= 2) {
          try {
            if (!samplingCanvasRef.current) {
              samplingCanvasRef.current = document.createElement('canvas');
              samplingCanvasRef.current.width = 32;
              samplingCanvasRef.current.height = 32;
            }
            const canvas = samplingCanvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(videoElement, 0, 0, 32, 32);
              const imgData = ctx.getImageData(0, 0, 32, 32);
              const data = imgData.data;
              let totalLuminance = 0;
              const numPixels = 32 * 32;

              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // ITU-R BT.709 relative luminance formula
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                totalLuminance += lum;
              }

              const avgLuminance = Math.round((totalLuminance / numPixels / 255) * 100);
              setSampledLuminance(avgLuminance);
              setIsLuminanceDark(avgLuminance <= 3);
            }
          } catch (e) {
            // Security or cross-origin issues
          }
        }
      }

      // 3. Track metrics
      if (mediaStream) {
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          setTrackSettings(videoTrack.getSettings ? videoTrack.getSettings() : null);
          setTrackCapabilities(videoTrack.getCapabilities ? videoTrack.getCapabilities() : null);
          setTrackState(videoTrack.readyState);
          setTrackMuted(videoTrack.muted);
        } else {
          setTrackSettings(null);
          setTrackCapabilities(null);
          setTrackState(null);
          setTrackMuted(false);
        }
      }
    };

    analyzeStream();
    const interval = setInterval(analyzeStream, 600);
    return () => clearInterval(interval);
  }, [isOpen, mediaStream, videoElement]);

  if (!isOpen) return null;

  // Stream Resolution formatting
  const reportedWidth = trackSettings?.width || videoDimensions.width || 0;
  const reportedHeight = trackSettings?.height || videoDimensions.height || 0;
  const aspectRatio = reportedHeight > 0 ? (reportedWidth / reportedHeight).toFixed(2) : '0';
  const aspectLabel = 
    aspectRatio === '1.78' ? '16:9 (Widescreen HD)' :
    aspectRatio === '1.33' ? '4:3 (Standard)' :
    aspectRatio === '1.00' ? '1:1 (Square)' :
    aspectRatio !== '0' ? `${aspectRatio}:1` : 'Not Resolved';

  const readyStateLabels: Record<number, string> = {
    0: '0 - HAVE_NOTHING (No frames)',
    1: '1 - HAVE_METADATA (Dimensions loaded)',
    2: '2 - HAVE_CURRENT_DATA (Frame available)',
    3: '3 - HAVE_FUTURE_DATA (Playing)',
    4: '4 - HAVE_ENOUGH_DATA (Smooth playback)'
  };

  const generateDiagnosticReport = () => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      permissionStatus,
      streamStatus,
      useRealWebcam,
      facingMode,
      cameraError,
      resolution: {
        negotiatedWidth: reportedWidth,
        negotiatedHeight: reportedHeight,
        aspectRatio: aspectLabel,
        videoElementWidth: videoDimensions.width,
        videoElementHeight: videoDimensions.height,
        videoElementReadyState: readyStateLabels[videoDimensions.readyState] || videoDimensions.readyState
      },
      track: {
        label: trackSettings?.deviceId || mediaStream?.getVideoTracks()[0]?.label || 'Unknown',
        readyState: trackState,
        muted: trackMuted,
        frameRate: trackSettings?.frameRate || 'Default',
        facingMode: trackSettings?.facingMode || facingMode
      },
      luminance: {
        percentage: sampledLuminance !== null ? `${sampledLuminance}%` : 'Unavailable',
        isPitchDark: isLuminanceDark
      },
      browserEnvironment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
        hasGetUserMedia: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
      }
    }, null, 2);
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateDiagnosticReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div 
      id="camera-diagnostic-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Camera Hardware Diagnostics</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                  Live Stream Inspector
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time monitor for hardware permissions, resolution negotiation, and frame delivery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close diagnostic overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Quick Bar: Permission & Resolution Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/60 border-b border-slate-800/80">
          {/* Permission Card */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Permission</span>
            </span>
            <div className="mt-1 flex items-center space-x-1.5">
              {permissionStatus === 'granted' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Granted</span>
                </>
              ) : permissionStatus === 'denied' ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">Denied</span>
                </>
              ) : permissionStatus === 'prompt' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Awaiting</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{permissionStatus}</span>
                </>
              )}
            </div>
          </div>

          {/* Resolution Card */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
              <Tv className="w-3 h-3 text-indigo-400" />
              <span>Stream Res</span>
            </span>
            <div className="mt-1">
              <p className="text-xs font-mono font-bold text-white">
                {reportedWidth > 0 && reportedHeight > 0
                  ? `${reportedWidth} × ${reportedHeight}`
                  : '0 × 0 (Offline)'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {reportedWidth >= 1280 ? '720p HD' : reportedWidth > 0 ? 'Standard' : 'No signal'}
              </p>
            </div>
          </div>

          {/* Track State */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-indigo-400" />
              <span>Track State</span>
            </span>
            <div className="mt-1 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${
                trackState === 'live' && !trackMuted
                  ? 'bg-emerald-400 animate-pulse'
                  : trackMuted
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`} />
              <span className={`text-xs font-bold uppercase ${
                trackState === 'live' && !trackMuted
                  ? 'text-emerald-400'
                  : trackMuted
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {trackMuted ? 'Muted by OS' : trackState || 'Ended'}
              </span>
            </div>
          </div>

          {/* Light / Luminance Sensor */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 flex items-center space-x-1">
              {isLuminanceDark ? (
                <Moon className="w-3 h-3 text-amber-400" />
              ) : (
                <Sun className="w-3 h-3 text-amber-400" />
              )}
              <span>Luminance</span>
            </span>
            <div className="mt-1 flex items-center space-x-1.5">
              <span className="text-xs font-mono font-bold text-white">
                {sampledLuminance !== null ? `${sampledLuminance}%` : 'N/A'}
              </span>
              {isLuminanceDark && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                  Dark
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'metrics'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hardware Specs & Stream</span>
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'troubleshoot'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Why is Video Dark? (Troubleshooter)</span>
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'raw'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Diagnostic JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: HARDWARE SPECS & STREAM RESOLUTION */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {/* Pitch Dark Alert Banner if applicable */}
              {isLuminanceDark && streamStatus === 'active' && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start space-x-3 text-amber-200 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-300">Camera Feed is Delivering Pitch Dark Frames (Luminance &lt; 3%)</p>
                    <p className="text-slate-300 leading-relaxed">
                      The video track is active and streaming at <strong className="text-white font-mono">{reportedWidth}×{reportedHeight}</strong>, but the sensor is registering black pixels. Check if your camera has a <strong>physical privacy shutter / slider</strong> covering the lens or a <strong>hardware switch / function key</strong> toggled off.
                    </p>
                  </div>
                </div>
              )}

              {/* Hardware Permission Details Table */}
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Browser & OS Permission Status</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Hardware Permission Query</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {permissionStatus.toUpperCase()}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {permissionStatus === 'granted'
                        ? 'Browser has authorized camera hardware access.'
                        : permissionStatus === 'denied'
                        ? 'Blocked in browser permissions. Click lock icon in URL bar.'
                        : 'Browser has not yet received user authorization.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">MediaDevices API Support</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia ? 'SUPPORTED' : 'UNAVAILABLE'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      HTML5 getUserMedia is fully ready for WebRTC & TensorFlow vision.
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Stream & Resolution Table */}
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Tv className="w-4 h-4 text-indigo-400" />
                  <span>Stream Resolution & Video Element Pipeline</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Negotiated Stream Res</span>
                    <span className="text-white font-bold">{reportedWidth} × {reportedHeight}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Aspect Ratio</span>
                    <span className="text-indigo-300 font-bold">{aspectLabel}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Track Frame Rate</span>
                    <span className="text-emerald-400 font-bold">
                      {trackSettings?.frameRate ? `${Math.round(trackSettings.frameRate)} fps` : '30 fps (Target)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Video Native Buffer</span>
                    <span className="text-white font-bold">{videoDimensions.width} × {videoDimensions.height}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Video readyState</span>
                    <span className="text-indigo-300 font-bold">
                      {readyStateLabels[videoDimensions.readyState] || videoDimensions.readyState}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Track Hardware State</span>
                    <span className={`font-bold ${trackState === 'live' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trackState || 'None'}
                    </span>
                  </div>
                </div>

                {mediaStream?.getVideoTracks()[0]?.label && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px] block">Hardware Device Label:</span>
                    <span className="text-white font-bold font-mono">
                      {mediaStream.getVideoTracks()[0].label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WHY IS THE VIDEO DARK? TROUBLESHOOTER */}
          {activeTab === 'troubleshoot' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-300">
                <p className="font-bold text-indigo-300 mb-1">
                  Diagnosing Black or Dark Video Feeds:
                </p>
                <p className="leading-relaxed">
                  If the stream status shows "Camera Active" or "TensorFlow Camera HD", but the visual feed is completely black, follow the automated checklist below to identify the root cause.
                </p>
              </div>

              {/* Automated Troubleshooting Checklist */}
              <div className="space-y-2.5">
                {/* Step 1: Permission */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
                  {permissionStatus === 'granted' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">1. Browser Hardware Permission</span>
                      <span className={`font-mono text-[11px] font-bold ${permissionStatus === 'granted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {permissionStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {permissionStatus === 'granted'
                        ? 'Passed: The browser allows this site to access camera hardware.'
                        : 'Blocked: Click the lock or camera icon next to the address bar and change Camera to "Allow".'}
                    </p>
                  </div>
                </div>

                {/* Step 2: Physical Shutter / Lens Cover */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
                  {isLuminanceDark ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">2. Physical Privacy Shutter / Lens Slider</span>
                      <span className={`font-mono text-[11px] font-bold ${isLuminanceDark ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isLuminanceDark ? 'PITCH DARK DETECTED' : 'LIGHT DETECTED'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {isLuminanceDark
                        ? 'The camera stream is receiving 0% light. Most modern laptops (Lenovo ThinkPad, HP Spectre, Dell XPS, Asus) and webcams have a physical mechanical slider or red dot shutter over the lens.'
                        : 'Passed: Sensor is receiving ambient light.'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Track Muted by Operating System */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
                  {trackMuted ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">3. Hardware Switch / Function Key Mute</span>
                      <span className={`font-mono text-[11px] font-bold ${trackMuted ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {trackMuted ? 'MUTED BY SYSTEM' : 'UNMUTED'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {trackMuted
                        ? 'The operating system reports the video track is muted. Look for a camera key (often F8, F10, or a side switch) on your laptop keyboard.'
                        : 'Passed: MediaStreamTrack is receiving frames from device driver.'}
                    </p>
                  </div>
                </div>

                {/* Step 4: Resolution & Pipeline Buffer */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
                  {reportedWidth > 0 && reportedHeight > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">4. Frame Buffer Resolution</span>
                      <span className={`font-mono text-[11px] font-bold ${reportedWidth > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {reportedWidth > 0 ? `${reportedWidth}×${reportedHeight}` : '0×0'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {reportedWidth > 0
                        ? `Passed: Hardware stream is rendering at ${reportedWidth}×${reportedHeight} resolution.`
                        : 'Failed: No frame resolution received. Click "Restart Camera Hardware" below.'}
                    </p>
                  </div>
                </div>

                {/* Step 5: Hardware Mutex / In Use by Another App */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start space-x-3 text-xs">
                  {cameraError?.type === 'in_use' ? (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">5. Exclusive Lock / Other Apps</span>
                      <span className={`font-mono text-[11px] font-bold ${cameraError?.type === 'in_use' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {cameraError?.type === 'in_use' ? 'HARDWARE LOCKED' : 'EXCLUSIVE ACCESS'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {cameraError?.type === 'in_use'
                        ? 'Another program (Zoom, Teams, OBS, FaceTime) has an exclusive lock on your camera. Close those applications and retry.'
                        : 'Passed: Camera hardware is not locked by another process.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RAW DIAGNOSTIC JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Full system diagnostic snapshot for technical troubleshooting:
                </span>
                <button
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Diagnostic Report'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
                {generateDiagnosticReport()}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={onRetryCamera}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart Camera Hardware</span>
            </button>

            <button
              onClick={onSwitchFacingMode}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
              title="Flip between Front and Back Camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip ({facingMode === 'user' ? 'Front' : 'Back'})</span>
            </button>

            <button
              onClick={onToggleWebcamMode}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{useRealWebcam ? 'Switch to AI Simulator' : 'Switch to Webcam'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
