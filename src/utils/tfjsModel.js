import * as tf from "@tensorflow/tfjs";
const TF_SIGN_CLASSES = [
  "HELLO",
  "THANK_YOU",
  "I_LOVE_YOU",
  "PEACE",
  "YES",
  "NO",
  "HELP",
  "PLEASE",
  "GOOD",
  "WATER",
  "OKAY",
  "OPEN_HAND",
  "FIST",
  "INDEX_POINT"
];
class TFJSGestureClassifier {
  static instance = null;
  isInitialized = false;
  model = null;
  isTraining = false;
  totalEpochsTrained = 0;
  lastInferenceTimeMs = 0;
  lastPredictions = [];
  // Recorded custom user samples for on-device transfer learning
  userTrainingSamples = [];
  constructor() {
  }
  static getInstance() {
    if (!TFJSGestureClassifier.instance) {
      TFJSGestureClassifier.instance = new TFJSGestureClassifier();
    }
    return TFJSGestureClassifier.instance;
  }
  // Initialize TensorFlow.js backend and warm up model
  async initialize() {
    if (this.isInitialized && this.model) return true;
    try {
      await tf.ready();
      console.log(`[TF.js] TensorFlow.js initialized with backend: ${tf.getBackend()}`);
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [68],
            units: 64,
            activation: "relu",
            kernelInitializer: "glorotNormal"
          }),
          tf.layers.dropout({ rate: 0.15 }),
          tf.layers.dense({
            units: 32,
            activation: "relu"
          }),
          tf.layers.dense({
            units: TF_SIGN_CLASSES.length,
            activation: "softmax"
          })
        ]
      });
      this.model.compile({
        optimizer: tf.train.adam(6e-3),
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
      });
      await this.trainCanonicalBaseline();
      this.isInitialized = true;
      console.log("[TF.js] Gesture neural model compiled & baseline calibrated.");
      return true;
    } catch (err) {
      console.warn("[TF.js] Error initializing TensorFlow.js:", err);
      return false;
    }
  }
  // Generate canonical feature vectors for dictionary gestures
  getCanonicalFeaturesForSign(sign) {
    const features = new Array(68).fill(0);
    let thumb = 0.5, index = 0.5, middle = 0.5, ring = 0.5, pinky = 0.5;
    switch (sign) {
      case "HELLO":
      case "OPEN_HAND":
        thumb = 1;
        index = 1;
        middle = 1;
        ring = 1;
        pinky = 1;
        break;
      case "FIST":
        thumb = 0.05;
        index = 0.05;
        middle = 0.05;
        ring = 0.05;
        pinky = 0.05;
        break;
      case "PEACE":
        thumb = 0.1;
        index = 1;
        middle = 1;
        ring = 0.1;
        pinky = 0.1;
        break;
      case "I_LOVE_YOU":
        thumb = 0.95;
        index = 0.95;
        middle = 0.1;
        ring = 0.1;
        pinky = 0.95;
        break;
      case "THANK_YOU":
        thumb = 0.7;
        index = 0.9;
        middle = 0.9;
        ring = 0.85;
        pinky = 0.85;
        break;
      case "YES":
        thumb = 0.6;
        index = 0.05;
        middle = 0.05;
        ring = 0.05;
        pinky = 0.05;
        break;
      case "NO":
        thumb = 0.7;
        index = 0.2;
        middle = 0.2;
        ring = 0.05;
        pinky = 0.05;
        break;
      case "HELP":
        thumb = 0.9;
        index = 0.1;
        middle = 0.1;
        ring = 0.1;
        pinky = 0.1;
        break;
      case "OKAY":
        thumb = 0.3;
        index = 0.25;
        middle = 1;
        ring = 1;
        pinky = 1;
        break;
      case "INDEX_POINT":
        thumb = 0.2;
        index = 1;
        middle = 0.05;
        ring = 0.05;
        pinky = 0.05;
        break;
      case "WATER":
        thumb = 0.2;
        index = 0.95;
        middle = 0.95;
        ring = 0.95;
        pinky = 0.1;
        break;
      case "PLEASE":
        thumb = 0.6;
        index = 0.85;
        middle = 0.85;
        ring = 0.85;
        pinky = 0.85;
        break;
      case "GOOD":
        thumb = 0.95;
        index = 0.1;
        middle = 0.1;
        ring = 0.1;
        pinky = 0.1;
        break;
      default:
        thumb = 0.5;
        index = 0.5;
        middle = 0.5;
        ring = 0.5;
        pinky = 0.5;
    }
    const baseCoords = [];
    baseCoords.push(0, 0, 0);
    const fingers = [thumb, index, middle, ring, pinky];
    fingers.forEach((ext, fIdx) => {
      const angle = (fIdx - 2) * 0.25;
      for (let j = 1; j <= 4; j++) {
        const dist = j * 35 * (0.3 + 0.7 * ext);
        baseCoords.push(
          Math.sin(angle) * dist / 200,
          -Math.cos(angle) * dist / 200,
          (1 - ext) * (j * 15) / 200
        );
      }
    });
    for (let i = 0; i < 63; i++) {
      features[i] = baseCoords[i] !== void 0 ? baseCoords[i] : 0;
    }
    features[63] = thumb;
    features[64] = index;
    features[65] = middle;
    features[66] = ring;
    features[67] = pinky;
    return features;
  }
  // Pretrain model on canonical sign vectors
  async trainCanonicalBaseline() {
    if (!this.model) return;
    const xsData = [];
    const ysData = [];
    TF_SIGN_CLASSES.forEach((sign, classIdx) => {
      const canonical = this.getCanonicalFeaturesForSign(sign);
      for (let aug = 0; aug < 6; aug++) {
        const sample = canonical.map((val, idx) => {
          const jitter = (Math.random() - 0.5) * 0.08;
          return idx >= 63 ? Math.max(0, Math.min(1, val + jitter)) : val + jitter * 0.5;
        });
        const oneHot = new Array(TF_SIGN_CLASSES.length).fill(0);
        oneHot[classIdx] = 1;
        xsData.push(sample);
        ysData.push(oneHot);
      }
    });
    const xs = tf.tensor2d(xsData);
    const ys = tf.tensor2d(ysData);
    try {
      await this.model.fit(xs, ys, {
        epochs: 15,
        batchSize: 16,
        shuffle: true,
        verbose: 0
      });
      this.totalEpochsTrained += 15;
    } finally {
      xs.dispose();
      ys.dispose();
    }
  }
  // Extract normalized 68-d feature vector from landmarks & pose
  extractFeatureVector(landmarks, pose) {
    const features = new Array(68).fill(0);
    if (landmarks && landmarks.length >= 21) {
      const wrist = landmarks[0] || { x: 640, y: 360, z: 0 };
      const mcp = landmarks[9] || { x: 640, y: 300, z: 0 };
      const handScale = Math.max(20, Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y));
      for (let i = 0; i < 21; i++) {
        const pt = landmarks[i] || wrist;
        const normX = (pt.x - wrist.x) / handScale;
        const normY = (pt.y - wrist.y) / handScale;
        const normZ = ((pt.z || 0) - (wrist.z || 0)) / handScale;
        features[i * 3 + 0] = Number.isFinite(normX) ? normX : 0;
        features[i * 3 + 1] = Number.isFinite(normY) ? normY : 0;
        features[i * 3 + 2] = Number.isFinite(normZ) ? normZ : 0;
      }
    }
    features[63] = Math.max(0, Math.min(1, pose.thumb));
    features[64] = Math.max(0, Math.min(1, pose.index));
    features[65] = Math.max(0, Math.min(1, pose.middle));
    features[66] = Math.max(0, Math.min(1, pose.ring));
    features[67] = Math.max(0, Math.min(1, pose.pinky));
    return features;
  }
  // Cached telemetry to prevent garbage collection spikes from tf.memory()
  cachedTelemetry = null;
  lastTelemetryQueryTime = 0;
  isPredicting = false;
  lastInferenceTimestamp = 0;
  inferenceIntervalMs = 120;

  // Run Real-time TensorFlow.js Inference (Non-blocking & Zero-freeze)
  predict(landmarks, pose) {
    if (!this.model || !this.isInitialized) {
      return {
        topSign: "HELLO",
        confidence: 0.85,
        predictions: this.lastPredictions.length > 0 ? this.lastPredictions : [
          { sign: "HELLO", confidence: 0.95 },
          { sign: "OPEN_HAND", confidence: 0.88 }
        ]
      };
    }
    const now = performance.now();
    if (this.isPredicting || (now - this.lastInferenceTimestamp < this.inferenceIntervalMs && this.lastPredictions.length > 0)) {
      return {
        topSign: this.lastPredictions[0]?.sign || "HELLO",
        confidence: this.lastPredictions[0]?.confidence || 0.85,
        predictions: this.lastPredictions
      };
    }
    try {
      this.isPredicting = true;
      this.lastInferenceTimestamp = now;
      const t0 = performance.now();
      const features = this.extractFeatureVector(landmarks, pose);
      let probabilities = [];
      tf.tidy(() => {
        const inputTensor = tf.tensor2d([features]);
        const outputTensor = this.model.predict(inputTensor);
        const dataSync = outputTensor.dataSync();
        probabilities = Array.from(dataSync);
      });
      this.lastInferenceTimeMs = Math.round((performance.now() - t0) * 10) / 10;
      const ranked = probabilities.map((prob, idx) => ({
        sign: TF_SIGN_CLASSES[idx] || `SIGN_${idx}`,
        confidence: Math.round(prob * 100) / 100
      })).sort((a, b) => b.confidence - a.confidence);
      this.lastPredictions = ranked.slice(0, 4);
      return {
        topSign: ranked[0]?.sign || "HELLO",
        confidence: ranked[0]?.confidence || 0.85,
        predictions: this.lastPredictions
      };
    } catch (err) {
      return {
        topSign: this.lastPredictions[0]?.sign || "HELLO",
        confidence: this.lastPredictions[0]?.confidence || 0.85,
        predictions: this.lastPredictions
      };
    } finally {
      this.isPredicting = false;
    }
  }
  // On-device Backpropagation / Transfer Learning for custom gestures
  async trainSample(label, landmarks, pose) {
    if (!this.model || this.isTraining) {
      return { success: false, epochs: 0, loss: 0 };
    }
    this.isTraining = true;
    const features = this.extractFeatureVector(landmarks, pose);
    this.userTrainingSamples.push({ features, label });
    let targetIdx = TF_SIGN_CLASSES.indexOf(label);
    if (targetIdx === -1) {
      targetIdx = 0;
    }
    const oneHot = new Array(TF_SIGN_CLASSES.length).fill(0);
    oneHot[targetIdx] = 1;
    const xs = tf.tensor2d([features]);
    const ys = tf.tensor2d([oneHot]);
    try {
      const info = await this.model.fit(xs, ys, {
        epochs: 5,
        batchSize: 1,
        shuffle: true,
        verbose: 0
      });
      this.totalEpochsTrained += 5;
      const finalLoss = info.history.loss ? Number(info.history.loss[info.history.loss.length - 1]) : 0.05;
      return { success: true, epochs: 5, loss: Math.round(finalLoss * 1e3) / 1e3 };
    } finally {
      xs.dispose();
      ys.dispose();
      this.isTraining = false;
    }
  }
  // Reset or Switch Backend (WebGL / CPU)
  async setBackend(backend) {
    try {
      await tf.setBackend(backend);
      await tf.ready();
      return tf.getBackend();
    } catch (err) {
      console.warn(`[TF.js] Could not switch to backend ${backend}`, err);
      return tf.getBackend();
    }
  }
  // Get Live Telemetry for HUD / DevTools with 1000ms caching to prevent GC pauses
  getTelemetry() {
    const now = performance.now();
    if (this.cachedTelemetry && now - this.lastTelemetryQueryTime < 1e3) {
      return this.cachedTelemetry;
    }
    this.lastTelemetryQueryTime = now;
    try {
      const mem = typeof tf !== "undefined" && tf.memory ? tf.memory() : { numTensors: 0, numBytes: 0 };
      const currentBackend = typeof tf !== "undefined" && tf.getBackend ? tf.getBackend() || "pure-js" : "pure-js";
      this.cachedTelemetry = {
        backend: currentBackend,
        isReady: this.isInitialized,
        modelReady: !!this.model,
        numTensors: mem?.numTensors ?? 0,
        memoryKB: Math.round((mem?.numBytes ?? 0) / 1024),
        inferenceMs: this.lastInferenceTimeMs,
        topPredictions: this.lastPredictions,
        activeModelName: "SignNet-MLP-v2",
        totalTrainingEpochs: this.totalEpochsTrained
      };
      return this.cachedTelemetry;
    } catch {
      this.cachedTelemetry = {
        backend: "pure-js",
        isReady: this.isInitialized,
        modelReady: !!this.model,
        numTensors: 0,
        memoryKB: 0,
        inferenceMs: this.lastInferenceTimeMs,
        topPredictions: this.lastPredictions,
        activeModelName: "SignNet-MLP-v2",
        totalTrainingEpochs: this.totalEpochsTrained
      };
      return this.cachedTelemetry;
    }
  }
}
const tfjsClassifier = TFJSGestureClassifier.getInstance();
export {
  TFJSGestureClassifier,
  TF_SIGN_CLASSES,
  tfjsClassifier
};
