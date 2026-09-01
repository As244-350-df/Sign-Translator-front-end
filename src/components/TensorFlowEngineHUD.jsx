import { useState } from "react";
import {
  Brain,
  Cpu,
  Zap,
  Activity,
  Flame,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Database,
  Gauge
} from "lucide-react";
import { TF_SIGN_CLASSES } from "../utils/tfjsModel";
const TensorFlowEngineHUD = ({
  telemetry,
  isEnabled,
  onToggleEnabled,
  onTrainSample,
  onSwitchBackend
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTrainingLabel, setSelectedTrainingLabel] = useState("HELLO");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingFeedback, setTrainingFeedback] = useState(null);
  const [isSwitchingBackend, setIsSwitchingBackend] = useState(false);
  const activeBackend = telemetry?.backend || "webgl";
  const numTensors = telemetry?.numTensors ?? 0;
  const memoryKB = telemetry?.memoryKB ?? 0;
  const inferenceMs = telemetry?.inferenceMs ?? 1.5;
  const predictions = telemetry?.topPredictions ?? [];
  const totalEpochs = telemetry?.totalTrainingEpochs ?? 15;
  const handleTrainCurrentPose = async () => {
    setIsTraining(true);
    setTrainingFeedback("Computing gradient backprop via tf.train.adam()...");
    try {
      const res = await onTrainSample(selectedTrainingLabel);
      if (res.success) {
        setTrainingFeedback(`Model updated! Trained 5 epochs (Final Loss: ${res.loss})`);
      } else {
        setTrainingFeedback("Training did not complete. Try again.");
      }
    } catch (err) {
      setTrainingFeedback("Training failed. See console.");
    } finally {
      setIsTraining(false);
      setTimeout(() => {
        setTrainingFeedback(null);
      }, 4e3);
    }
  };
  const handleBackendToggle = async (targetBackend) => {
    if (targetBackend === activeBackend || isSwitchingBackend) return;
    setIsSwitchingBackend(true);
    try {
      await onSwitchBackend(targetBackend);
    } finally {
      setIsSwitchingBackend(false);
    }
  };
  return <div className="bg-slate-900/95 dark:bg-slate-950 text-white rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden transition-all">
      {
    /* Top Banner Bar */
  }
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>TensorFlow.js Neural Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-extrabold border border-amber-500/30">
                  Pure JavaScript
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Client-side deep learning • Client GPU WebGL / CPU acceleration • 0ms server latency
            </p>
          </div>
        </div>

        {
    /* Quick Toggles & Expand Button */
  }
        <div className="flex items-center space-x-2">
          {
    /* Backend Selector */
  }
          <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
            <button
    onClick={() => handleBackendToggle("webgl")}
    disabled={isSwitchingBackend}
    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${activeBackend === "webgl" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"}`}
    title="GPU-Accelerated WebGL Backend"
  >
              <Zap className="w-3 h-3" />
              <span>WebGL</span>
            </button>
            <button
    onClick={() => handleBackendToggle("cpu")}
    disabled={isSwitchingBackend}
    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${activeBackend === "cpu" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-white"}`}
    title="Pure JavaScript CPU Fallback Backend"
  >
              <Cpu className="w-3 h-3" />
              <span>CPU (JS)</span>
            </button>
          </div>

          {
    /* Model Classifier ON/OFF */
  }
          <button
    onClick={() => onToggleEnabled(!isEnabled)}
    className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${isEnabled ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-400"}`}
  >
            TF.js {isEnabled ? "Active" : "Bypassed"}
          </button>

          {
    /* Expand Details */
  }
          <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
    title={isExpanded ? "Collapse Engine Inspector" : "Expand Engine Inspector"}
  >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {
    /* Real-time Hardware & Model Metrics Ribbons */
  }
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 text-xs font-mono border-b border-slate-800/80">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">INFERENCE LATENCY</span>
            <span className="text-emerald-400 font-bold">{inferenceMs.toFixed(1)} ms</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">ACTIVE TENSORS</span>
            <span className="text-cyan-400 font-bold">{numTensors} tensors</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">TF.JS MEMORY</span>
            <span className="text-purple-300 font-bold">{memoryKB} KB</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="truncate">
            <span className="text-slate-500 text-[10px] block">TRAINED WEIGHTS</span>
            <span className="text-amber-400 font-bold">{totalEpochs} epochs</span>
          </div>
        </div>
      </div>

      {
    /* Expanded Inspector Panel */
  }
      {isExpanded && <div className="p-5 space-y-5 bg-slate-900/50">
          {
    /* Real-time Softmax Probability Visualizer */
  }
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>TensorFlow.js Softmax Output Distribution</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Input: 68-Feature Geometric Tensor (21 Landmarks + Kinematic Flexions)
              </span>
            </div>

            {predictions.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {predictions.map((pred, i) => {
    const pct = Math.round(pred.confidence * 100);
    const isTop = i === 0;
    return <div
      key={pred.sign}
      className={`p-2.5 rounded-xl border transition-all ${isTop ? "bg-amber-500/10 border-amber-500/40" : "bg-slate-900 border-slate-800"}`}
    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`font-bold ${isTop ? "text-amber-300" : "text-slate-300"}`}>
                          {pred.sign.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-slate-400 font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
      className={`h-full rounded-full transition-all duration-150 ${isTop ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-slate-600"}`}
      style={{ width: `${pct}%` }}
    />
                      </div>
                    </div>;
  })}
              </div> : <p className="text-xs text-slate-500 italic">Evaluating hand coordinates...</p>}
          </div>

          {
    /* On-Device Transfer Learning & In-Browser Model Fine-Tuning */
  }
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>On-Device Transfer Learning with tf.fit()</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
                100% Client-Side Local Backpropagation
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Capture your current camera hand pose or articulated finger posture to fine-tune the TensorFlow.js neural network in real-time.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400 font-medium">Assign Sign Target:</label>
                <select
    value={selectedTrainingLabel}
    onChange={(e) => setSelectedTrainingLabel(e.target.value)}
    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-amber-500"
  >
                  {TF_SIGN_CLASSES.map((cls) => <option key={cls} value={cls}>
                      {cls.replace(/_/g, " ")}
                    </option>)}
                </select>
              </div>

              <button
    onClick={handleTrainCurrentPose}
    disabled={isTraining}
    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-slate-950 flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
  >
                <Flame className={`w-3.5 h-3.5 ${isTraining ? "animate-spin" : ""}`} />
                <span>{isTraining ? "Training with Adam Optimizer..." : "Train Current Pose (5 Epochs)"}</span>
              </button>
            </div>

            {trainingFeedback && <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{trainingFeedback}</span>
              </div>}
          </div>
        </div>}
    </div>;
};
export {
  TensorFlowEngineHUD
};
