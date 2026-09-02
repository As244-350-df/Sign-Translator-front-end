import { useState, useEffect } from "react";
import { Circle } from "lucide-react";

export const RecordingControls = ({ isRecording, onToggleRecording, recorder }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      if (recorder) {
        setSeconds(recorder.getDuration ? recorder.getDuration() : (s) => s + 1);
      } else {
        setSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, recorder]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <button
      onClick={onToggleRecording}
      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
        isRecording
          ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md"
          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
      }`}
      title={isRecording ? "Stop Recording" : "Record Translation Session"}
    >
      <Circle className="w-3.5 h-3.5 fill-current" />
      <span>{isRecording ? `REC ${timeFormatted}` : "Record"}</span>
    </button>
  );
};
