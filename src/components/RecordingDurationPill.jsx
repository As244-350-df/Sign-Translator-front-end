import { useState, useEffect } from "react";
import { Circle } from "lucide-react";

export const RecordingDurationPill = ({ recorder, isRecording }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRecording || !recorder) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSeconds(recorder.getDuration ? recorder.getDuration() : (s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording, recorder]);

  if (!isRecording) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center space-x-1.5 bg-rose-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-rose-700 text-rose-300 text-xs font-mono font-bold animate-pulse">
      <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
      <span>REC {timeFormatted}</span>
    </div>
  );
};
