import { Server, Radio, Zap, Activity, Database } from "lucide-react";

export const SystemDiagramTab = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 relative overflow-hidden font-mono text-xs shadow-inner">
        {/* Clients Tier */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold shadow-md">
            💻 Client Layer: React 18 + PWA + MediaPipe 21-Landmark Edge Detector
          </div>
          <div className="text-slate-500 text-[10px] mt-1">
            HTTPS REST & Signaling (WSS) • WebRTC Media (SRTP 60fps)
          </div>
          <div className="w-0.5 h-6 bg-slate-700 mx-auto mt-2" />
        </div>

        {/* API Gateway Tier */}
        <div className="text-center mb-6">
          <div className="inline-block px-5 py-2 rounded-xl bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold shadow-md">
            🛡️ API Gateway & Nginx Reverse Proxy (Cloud Run Port 3000)
          </div>
          <div className="w-0.5 h-6 bg-slate-700 mx-auto mt-2" />
        </div>

        {/* Dual Core Engine Tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Node/Express Core */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Server className="w-4 h-4" />
              <span>Express API Service</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>Interpreter Directory & On-Demand Dispatch</li>
              <li>Booking Lifecycle & Scheduling State</li>
              <li>Metered Duration Billing ($/min ticker)</li>
              <li>Session Transcript Vault & Audit Logs</li>
            </ul>
          </div>

          {/* WebRTC SFU Cluster */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Radio className="w-4 h-4" />
              <span>WebRTC SFU Media Cluster</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>2-Way Low Latency Video (VP9/AV1)</li>
              <li>Opus 48kHz Stereo Voice & Captions Track</li>
              <li>High Frame Rate (60 FPS) Fingerspelling</li>
              <li>E2E Call Recording Engine (WebM/MP4)</li>
            </ul>
          </div>
        </div>

        {/* Backend Storage & AI Tier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Gemini 2.5 Worker</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Sign gloss syntax translation, clinical summary extraction, action items.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-rose-400 font-bold mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Redis Match Queue</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Sorted sets for online certified pros with 30-sec accept cascades.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-purple-400 font-bold mb-1">
              <Database className="w-3.5 h-3.5" />
              <span>Encrypted Vault</span>
            </div>
            <p className="text-[10px] text-slate-400">
              HIPAA/GDPR encrypted transcripts, booking tables & audit history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
