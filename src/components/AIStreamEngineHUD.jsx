import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Gauge,
  Radio,
  Send,
  Sliders,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { AI_SIGN_CLASSES, aiStreamRecognizer } from "../utils/aiStreamRecognizer";
import { geminiService } from "../services/geminiService";

export const AIStreamEngineHUD = ({
  telemetry: propTelemetry,
  isEnabled = true,
  onToggleEnabled,
  onTrainSample,
  onSwitchBackend
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTrainingLabel, setSelectedTrainingLabel] = useState("HELLO");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationFeedback, setCalibrationFeedback] = useState(null);
  const [isStreamingTest, setIsStreamingTest] = useState(false);
  const [testStreamText, setTestStreamText] = useState("");
  const [internalTelemetry, setInternalTelemetry] = useState(() => propTelemetry || aiStreamRecognizer.getTelemetry());
  const [providerStatus, setProviderStatus] = useState(() => geminiService.getProviderStatus());

  useEffect(() => {
    const updateTelemetry = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      setInternalTelemetry(aiStreamRecognizer.getTelemetry());
    };
    updateTelemetry();
    // Only poll telemetry frequently if the HUD is visibly expanded
    const interval = setInterval(updateTelemetry, isExpanded ? 800 : 3500);

    const unsubscribe = geminiService.subscribeToStatus((status) => {
      setProviderStatus({ ...status });
    });
    geminiService.fetchProviderStatus();
    const statusInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      geminiService.fetchProviderStatus();
    }, isExpanded ? 10000 : 30000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
      unsubscribe();
    };
  }, [isExpanded]);

  const telemetry = propTelemetry || internalTelemetry;
  const activeBackend = telemetry?.backend || "Gemini 3.8 Flash Stream (SSE)";
  const inferenceMs = telemetry?.inferenceMs ?? 38;
  const tokensPerSec = telemetry?.tokensPerSecond ?? 45;
  const totalTokens = telemetry?.totalTokensStreamed ?? 0;
  const predictions = telemetry?.topPredictions ?? [];
  const streamText = telemetry?.currentStreamText || testStreamText;

  const handleCalibrateCurrentPose = async () => {
    setIsCalibrating(true);
    setCalibrationFeedback("Registering kinematic gesture pattern with Gemini AI...");
    try {
      if (onTrainSample) {
        await onTrainSample(selectedTrainingLabel);
      } else {
        await aiStreamRecognizer.trainSample(selectedTrainingLabel, [], {});
      }
      setCalibrationFeedback(`Calibrated! Gesture "${selectedTrainingLabel.replace(/_/g, " ")}" is active in AI Stream context.`);
    } catch (err) {
      setCalibrationFeedback("Calibration failed. Please retry.");
    } finally {
      setIsCalibrating(false);
      setTimeout(() => {
        setCalibrationFeedback(null);
      }, 4000);
    }
  };

  const handleTestDirectStream = async () => {
    setIsStreamingTest(true);
    setTestStreamText("");
    try {
      await aiStreamRecognizer.streamRecognize(
        { currentGloss: selectedTrainingLabel, signLanguage: "ASL" },
        (token) => {
          setTestStreamText((prev) => prev + token);
        },
        (res) => {
          setInternalTelemetry(aiStreamRecognizer.getTelemetry());
        }
      );
    } catch (err) {
      console.warn("Test stream error:", err);
    } finally {
      setIsStreamingTest(false);
    }
  };

  return (
    <div id="ai-stream-engine-hud" className="bg-slate-900/95 dark:bg-slate-950 text-white rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5 flex-wrap gap-1">
                <span>Gemini AI Stream Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-extrabold border border-emerald-500/30 flex items-center space-x-1">
                  <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                  <span>LIVE SSE STREAM</span>
                </span>
                {telemetry?.workerOffloaded && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30 flex items-center space-x-1">
                    <Zap className="w-2.5 h-2.5 text-indigo-400" />
                    <span>WEB WORKER OFFLOADED</span>
                  </span>
                )}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">
                Model:{" "}
                <span className="text-indigo-300 font-mono font-semibold">
                  {providerStatus?.activeProvider === "huggingface"
                    ? `HuggingFace (${providerStatus.huggingFaceModel || "Llama-3.2-3B"})`
                    : providerStatus?.activeProvider === "kinematic-rules"
                    ? "Kinematic Rule Engine (Offline Continuity)"
                    : "gemini-3.8-flash"}
                </span>
              </p>
              {providerStatus?.geminiQuotaExceeded ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>
                    Quota Fallback Active
                    {providerStatus.cooldownRemainingSeconds > 0
                      ? ` (${providerStatus.cooldownRemainingSeconds}s)`
                      : ""}
                  </span>
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Auto-Failover Active</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Toggles & Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Stream Test Button */}
          <button
            id="ai-stream-test-btn"
            onClick={handleTestDirectStream}
            disabled={isStreamingTest}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
            title="Stream sample frame to Gemini"
          >
            <Send className={`w-3 h-3 ${isStreamingTest ? "animate-spin" : ""}`} />
            <span>{isStreamingTest ? "Streaming..." : "Test Stream"}</span>
          </button>

          {/* Stream ON/OFF */}
          <button
            id="ai-stream-toggle-btn"
            onClick={() => onToggleEnabled && onToggleEnabled(!isEnabled)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
              isEnabled
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            AI Stream {isEnabled ? "Active" : "Bypassed"}
          </button>

          {/* Expand Details */}
          <button
            id="ai-stream-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? "Collapse Stream Inspector" : "Expand Stream Inspector"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Real-time Hardware & Stream Metrics Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 text-xs font-mono border-b border-slate-800/80">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">STREAM LATENCY</span>
            <span className="text-emerald-400 font-bold">{inferenceMs.toFixed(0)} ms</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">STREAM SPEED</span>
            <span className="text-amber-400 font-bold">~{tokensPerSec} tok/s</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">TOKENS STREAMED</span>
            <span className="text-cyan-300 font-bold">{totalTokens} tokens</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">BACKEND STATUS</span>
            <span className="text-purple-300 font-bold">gemini-3.8-flash</span>
          </div>
        </div>
      </div>

      {/* Expanded Inspector Panel */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-slate-900/50">
          {/* Live Token Stream Visualizer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Gemini Token Stream Buffer</span>
              </h4>
              <span className="text-[10px] text-indigo-400 font-mono">
                Server-Sent Events (SSE) Protocol
              </span>
            </div>
            <div className="min-h-[50px] font-mono text-xs text-indigo-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 whitespace-pre-wrap flex items-center">
              {streamText ? (
                <div>
                  <span>{streamText}</span>
                  <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
                </div>
              ) : (
                <span className="text-slate-500 italic">
                  Stream ready. Performing gestures in front of the camera or clicking "Test Stream" emits token chunks here.
                </span>
              )}
            </div>
          </div>

          {/* Real-time Recognition Confidence Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Stream Sign Confidence Distribution</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Model: gemini-3.8-flash Stream Analysis
              </span>
            </div>

            {predictions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {predictions.map((pred, i) => {
                  const pct = Math.round(pred.confidence * 100);
                  const isTop = i === 0;
                  return (
                    <div
                      key={pred.sign}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isTop
                          ? "bg-indigo-500/10 border-indigo-500/40"
                          : "bg-slate-900 border-slate-800"
                      }`}
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-bold ${isTop ? "text-indigo-300" : "text-slate-300"}`}>
                          {pred.sign.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-slate-400 font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${
                            isTop
                              ? "bg-gradient-to-r from-indigo-400 to-purple-500"
                              : "bg-slate-600"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {pred.meaning && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{pred.meaning}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Streaming gesture coordinates...</p>
            )}
          </div>

          {/* AI Session Calibration */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Session Vocabulary Calibration</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                Zero Browser Freezes • Cloud Stream Integration
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Calibrate personal sign nuances and regional variations into the active Gemini AI interpretation stream.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400 font-medium">Assign Sign Target:</label>
                <select
                  value={selectedTrainingLabel}
                  onChange={(e) => setSelectedTrainingLabel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  {AI_SIGN_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCalibrateCurrentPose}
                disabled={isCalibrating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isCalibrating ? "animate-spin" : ""}`} />
                <span>{isCalibrating ? "Calibrating..." : "Calibrate Current Pose"}</span>
              </button>
            </div>

            {calibrationFeedback && (
              <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{calibrationFeedback}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AIStreamEngineHUD;
