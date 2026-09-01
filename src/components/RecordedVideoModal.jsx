import { Download, CheckCircle2, Video, Clock, HardDrive, ShieldCheck, X } from "lucide-react";
import { LiveSessionRecorder } from "../utils/mediaRecorder";
const RecordedVideoModal = ({ recording, onClose }) => {
  if (!recording) return null;
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-white">
        
        {
    /* Header */
  }
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Session Video Recording Ready</h3>
              <p className="text-xs text-slate-400">Encrypted local archive with TensorFlow skeleton overlay</p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Video Player */
  }
        <div className="p-6 space-y-5">
          <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-inner group">
            <video
    src={recording.url}
    controls
    autoPlay
    className="w-full h-full object-contain"
  />
          </div>

          {
    /* Telemetry metadata cards */
  }
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Duration</div>
                <div className="font-bold text-slate-200">{formatDuration(recording.durationSeconds)}</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">File Size</div>
                <div className="font-bold text-slate-200">{formatSize(recording.fileSizeBytes)}</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Format</div>
                <div className="font-bold text-slate-200">VP9 / Opus WebM</div>
              </div>
            </div>
          </div>

          {
    /* Download & Actions Bar */
  }
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Includes 21-point hand tracking & audio tracks</span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
    onClick={onClose}
    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
  >
                Close
              </button>
              <button
    onClick={() => LiveSessionRecorder.downloadRecording(recording)}
    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
  >
                <Download className="w-4 h-4" />
                <span>Download Video (.webm)</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>;
};
export {
  RecordedVideoModal
};
