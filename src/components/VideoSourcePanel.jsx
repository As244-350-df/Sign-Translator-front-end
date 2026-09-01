import { useState, useRef } from "react";
import {
  Camera,
  HandMetal,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ExternalLink,
  HelpCircle,
  FileVideo,
  Film
} from "lucide-react";
import { DEMO_SIGN_PRESETS } from "../utils/demoVideoFeeds";
import { isInsideIframe, getSafeCurrentUrl } from "../utils/environment";
const VideoSourcePanel = ({
  inputMode,
  onSelectMode,
  onUploadVideo,
  onSelectDemoClip,
  activeDemoId = "HELLO",
  uploadedFileName,
  isPlayingVideo = true,
  onTogglePlayPause,
  onRestartVideo,
  playbackRate = 1,
  onChangePlaybackRate,
  onOpenDiagnostics
}) => {
  const isInIframe = isInsideIframe();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadVideo(e.target.files[0]);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        onUploadVideo(file);
      }
    }
  };
  return <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5">
      {
    /* Primary Input Source Selector Bar */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block">
            Camera & Video Input Source
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <span>Recognition Feed Source</span>
          </h3>
        </div>

        {
    /* Source Pills */
  }
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 gap-1">
          <button
    onClick={() => onSelectMode("webcam")}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${inputMode === "webcam" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}
  >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Webcam</span>
          </button>

          <button
    onClick={() => onSelectMode("simulator")}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${inputMode === "simulator" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}
  >
            <HandMetal className="w-3.5 h-3.5 text-indigo-300" />
            <span>Virtual Hand 3D</span>
          </button>

          <button
    onClick={() => onSelectMode("video_upload")}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${inputMode === "video_upload" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}
  >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Video File</span>
          </button>

          <button
    onClick={() => onSelectMode("demo_clips")}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${inputMode === "demo_clips" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"}`}
  >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sign Video Library</span>
          </button>
        </div>
      </div>

      {
    /* Mode Details / Action Triggers */
  }
      {inputMode === "webcam" && <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Hardware Camera Active (Live Physical Stream)
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                {isInIframe ? 'Note: Browsers restrict webcam in iframe previews. Click "Open in New Tab" if permission prompt is blocked.' : "Point camera at your hand in good lighting. MediaPipe tracks 21 coordinates in real time."}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {isInIframe && <a
    href={getSafeCurrentUrl()}
    target="_blank"
    rel="noopener noreferrer"
    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1.5 transition-colors shadow-xs"
  >
                <ExternalLink className="w-3 h-3" />
                <span>Open in New Tab</span>
              </a>}
            <button
    onClick={onOpenDiagnostics}
    className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
  >
              <HelpCircle className="w-3 h-3 text-indigo-500" />
              <span>Camera Diagnostic</span>
            </button>
          </div>
        </div>}

      {inputMode === "simulator" && <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <HandMetal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                3D Virtual Hand Simulator (Zero Webcam Required)
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Full 21 3D joint coordinate kinematics with physics spring simulation. Test any sign from the dictionary below or use finger sliders.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] self-start sm:self-center">
            Ready & Offline
          </span>
        </div>}

      {inputMode === "video_upload" && <div className="space-y-3">
          <div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    onClick={() => fileInputRef.current?.click()}
    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-900/40"}`}
  >
            <input
    ref={fileInputRef}
    type="file"
    accept="video/mp4,video/webm,video/ogg,video/quicktime"
    className="hidden"
    onChange={handleFileChange}
  />
            <FileVideo className="w-7 h-7 mx-auto text-indigo-500 mb-1.5" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {uploadedFileName ? `Loaded: ${uploadedFileName}` : "Drop or Select Sign Language Video File"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports MP4, WebM, MOV. MediaPipe will continuously track hands & translate signs from the video!
            </p>
          </div>

          {uploadedFileName && <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <button
    onClick={onTogglePlayPause}
    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1 cursor-pointer"
  >
                  {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingVideo ? "Pause" : "Play"}</span>
                </button>
                <button
    onClick={onRestartVideo}
    className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer"
    title="Restart Video"
  >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {onChangePlaybackRate && <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-400 font-bold">Speed:</span>
                  {[0.5, 1, 1.5].map((rate) => <button
    key={rate}
    onClick={() => onChangePlaybackRate(rate)}
    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${playbackRate === rate ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
  >
                      {rate}x
                    </button>)}
                </div>}
            </div>}
        </div>}

      {inputMode === "demo_clips" && <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>Select Pre-Recorded Sign Video Clip:</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Plays in video container & runs MediaPipe AI vision
            </span>
          </div>

          {
    /* Grid of demo sign clips */
  }
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DEMO_SIGN_PRESETS.map((preset) => {
    const isSelected = activeDemoId === preset.id;
    return <button
      key={preset.id}
      onClick={() => onSelectDemoClip(preset)}
      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${isSelected ? "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/30" : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-cyan-300"}`}
    >
                  <span className="text-xl shrink-0">{preset.symbol}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {preset.category}
                    </p>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />}
                </button>;
  })}
          </div>
        </div>}
    </div>;
};
export {
  VideoSourcePanel
};
