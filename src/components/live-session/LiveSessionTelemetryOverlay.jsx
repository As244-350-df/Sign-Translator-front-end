import { Radio, Lock } from "lucide-react";

export const LiveSessionTelemetryOverlay = ({ showDiagnostics }) => {
  if (!showDiagnostics) return null;

  return (
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
  );
};
