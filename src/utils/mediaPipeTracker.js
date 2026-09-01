import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { SIGN_DICTIONARY } from "./handTracker";
class MediaPipeHandTracker {
  static instance = null;
  landmarker = null;
  isInitializing = false;
  isReady = false;
  initError = null;
  // Smoothing filters
  prevLandmarks = [];
  lastInferenceMs = 0;
  fpsCounter = 60;
  frameCount = 0;
  lastFpsUpdateTime = performance.now();
  // Inference rate limiting & caching (Adaptive to device CPU capabilities)
  lastDetectionTime = 0;
  lastMediaPipeTimestamp = 0;
  cachedResult = null;
  detectionIntervalMs = 45;
  // ~22 FPS vision inference - silky smooth without thread starvation
  isDetecting = false;
  constructor() {
  }
  static getInstance() {
    if (!MediaPipeHandTracker.instance) {
      MediaPipeHandTracker.instance = new MediaPipeHandTracker();
    }
    return MediaPipeHandTracker.instance;
  }
  isLoaded() {
    return this.isReady && this.landmarker !== null;
  }
  getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      error: this.initError
    };
  }
  /**
   * Initializes MediaPipe HandLandmarker with WASM runtime and GPU delegate
   */
  async initialize() {
    if (this.isReady && this.landmarker) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;
    this.initError = null;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
        minTrackingConfidence: 0.4
      });
      this.isReady = true;
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn("[MediaPipe] GPU initialization note, attempting CPU fallback:", err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35
        });
        this.isReady = true;
        this.isInitializing = false;
        return true;
      } catch (fallbackErr) {
        this.isInitializing = false;
        this.initError = fallbackErr?.message || "Failed to initialize MediaPipe";
        console.error("[MediaPipe] Initialization failed:", fallbackErr);
        return false;
      }
    }
  }
  setDetectionIntervalMs(intervalMs) {
    this.detectionIntervalMs = Math.max(16, Math.min(100, intervalMs));
  }
  /**
   * Process a live HTMLVideoElement with non-blocking coordinate detection
   */
  processVideoFrame(video, canvasWidth, canvasHeight, timestamp = performance.now(), forceDetect = false) {
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsUpdateTime >= 500) {
      this.fpsCounter = Math.round(this.frameCount * 1e3 / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }
    if (!this.isReady || !this.landmarker || video.readyState < 2) {
      return {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: this.isReady
      };
    }
    const timeSinceLastDetect = now - this.lastDetectionTime;
    if (!forceDetect && timeSinceLastDetect < this.detectionIntervalMs && this.cachedResult) {
      return {
        ...this.cachedResult,
        fps: this.fpsCounter
      };
    }
    if (this.isDetecting) {
      return this.cachedResult || {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: true
      };
    }
    this.isDetecting = true;
    this.lastDetectionTime = now;
    let safeTimestamp = timestamp;
    if (safeTimestamp <= this.lastMediaPipeTimestamp) {
      safeTimestamp = this.lastMediaPipeTimestamp + 1;
    }
    this.lastMediaPipeTimestamp = safeTimestamp;
    const t0 = performance.now();
    let result = null;
    try {
      result = this.landmarker.detectForVideo(video, safeTimestamp);
    } catch (e) {
      try {
        const fallbackTs = this.lastMediaPipeTimestamp + 2;
        this.lastMediaPipeTimestamp = fallbackTs;
        result = this.landmarker.detectForVideo(video, fallbackTs);
      } catch {
      }
    } finally {
      this.isDetecting = false;
    }
    this.lastInferenceMs = Math.round(performance.now() - t0);
    if (this.lastInferenceMs > 35) {
      this.detectionIntervalMs = Math.min(100, Math.max(45, Math.round(this.lastInferenceMs * 1.5)));
    } else {
      this.detectionIntervalMs = 45;
    }
    if (!result || !result.landmarks || result.landmarks.length === 0) {
      this.prevLandmarks = [];
      const emptyResult = {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: true
      };
      this.cachedResult = emptyResult;
      return emptyResult;
    }
    const rawHand = result.landmarks[0];
    const handednessCat = result.handednesses?.[0]?.[0];
    const handedness = handednessCat?.categoryName === "Left" ? "Left" : "Right";
    const landmarks = rawHand.map((pt, idx) => {
      const x = (1 - pt.x) * canvasWidth;
      const y = pt.y * canvasHeight;
      const z = (pt.z || 0) * canvasWidth;
      if (this.prevLandmarks[idx]) {
        const alpha = 0.7;
        return {
          x: alpha * x + (1 - alpha) * this.prevLandmarks[idx].x,
          y: alpha * y + (1 - alpha) * this.prevLandmarks[idx].y,
          z: alpha * z + (1 - alpha) * (this.prevLandmarks[idx].z || 0)
        };
      }
      return { x, y, z };
    });
    this.prevLandmarks = landmarks;
    const flexions = this.computeFingerFlexions(rawHand);
    const orientation = this.computeHandOrientation(rawHand);
    const signMatch = this.classifySign(flexions, orientation, rawHand);
    const trackingResult = {
      hasHand: true,
      landmarks,
      rawLandmarks: rawHand,
      handedness,
      fingerFlexions: flexions,
      wristRotation: orientation.rotation,
      wristPitch: orientation.pitch,
      recognizedSign: signMatch.sign,
      confidence: signMatch.confidence,
      fps: this.fpsCounter,
      inferenceMs: this.lastInferenceMs,
      isMediaPipeReady: true
    };
    this.cachedResult = trackingResult;
    return trackingResult;
  }
  /**
   * Fast anatomical finger flexion calculator from 21 MediaPipe coordinates
   */
  computeFingerFlexions(raw) {
    const wrist = raw[0];
    const handScale = Math.hypot(raw[0].x - raw[9].x, raw[0].y - raw[9].y) || 0.2;
    const calcExtension = (tipIdx, mcpIdx) => {
      const tip = raw[tipIdx];
      const mcp = raw[mcpIdx];
      const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const dMcp = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
      const ratio = dTip / Math.max(0.01, dMcp * 1.65);
      return Math.max(0, Math.min(1, (ratio - 0.45) / 0.55));
    };
    const thumbDist = Math.hypot(raw[4].x - raw[17].x, raw[4].y - raw[17].y) / handScale;
    const thumbFlex = Math.max(0, Math.min(1, (thumbDist - 0.65) / 0.7));
    const indexFlex = calcExtension(8, 5);
    const middleFlex = calcExtension(12, 9);
    const ringFlex = calcExtension(16, 13);
    const pinkyFlex = calcExtension(20, 17);
    const totalSpanDist = Math.hypot(raw[8].x - raw[20].x, raw[8].y - raw[20].y) / handScale;
    const spread = Math.max(0.05, Math.min(1, (totalSpanDist - 0.25) / 0.85));
    return {
      thumb: thumbFlex,
      index: indexFlex,
      middle: middleFlex,
      ring: ringFlex,
      pinky: pinkyFlex,
      spread
    };
  }
  /**
   * Computes roll, pitch and orientation of hand in 3D from coordinates
   */
  computeHandOrientation(raw) {
    const wrist = raw[0];
    const middleMcp = raw[9];
    const dx = middleMcp.x - wrist.x;
    const dy = middleMcp.y - wrist.y;
    const angleRad = Math.atan2(dy, dx);
    const rotationDeg = angleRad * 180 / Math.PI + 90;
    const dz = middleMcp.z - wrist.z;
    const pitchDeg = Math.atan2(dz, Math.hypot(dx, dy)) * (180 / Math.PI);
    return {
      rotation: Math.max(-60, Math.min(60, rotationDeg)),
      pitch: Math.max(-45, Math.min(45, pitchDeg))
    };
  }
  /**
   * Coordinate-Based Sign Classification Model:
   * Maps 21 3D Landmark Coordinates & Finger Curl Vector -> Recognized Sign
   */
  classifySign(flex, orient, raw) {
    const { thumb, index, middle, ring, pinky } = flex;
    let bestKey = "HELLO";
    let bestScore = 0;
    const handScale = Math.hypot(raw[0].x - raw[9].x, raw[0].y - raw[9].y) || 0.2;
    const distThumbIndex = raw.length >= 21 ? Math.hypot(raw[4].x - raw[8].x, raw[4].y - raw[8].y) / handScale : 1;
    const distThumbMiddle = raw.length >= 21 ? Math.hypot(raw[4].x - raw[12].x, raw[4].y - raw[12].y) / handScale : 1;
    const distThumbRing = raw.length >= 21 ? Math.hypot(raw[4].x - raw[16].x, raw[4].y - raw[16].y) / handScale : 1;
    const distThumbPinky = raw.length >= 21 ? Math.hypot(raw[4].x - raw[20].x, raw[4].y - raw[20].y) / handScale : 1;
    const distIndexMiddle = raw.length >= 21 ? Math.hypot(raw[8].x - raw[12].x, raw[8].y - raw[12].y) / handScale : 1;
    if (thumb > 0.65 && index > 0.7 && middle < 0.35 && ring < 0.35 && pinky > 0.7) {
      return { sign: SIGN_DICTIONARY["I_LOVE_YOU"] || null, confidence: 0.98 };
    }
    if (thumb > 0.7 && index < 0.3 && middle < 0.3 && ring < 0.3 && pinky > 0.7) {
      return { sign: SIGN_DICTIONARY["Y"] || SIGN_DICTIONARY["CALL_ME"] || null, confidence: 0.98 };
    }
    if (thumb > 0.75 && index > 0.75 && middle < 0.3 && ring < 0.3 && pinky < 0.3 && distThumbIndex > 0.75) {
      return { sign: SIGN_DICTIONARY["L"] || null, confidence: 0.98 };
    }
    if (pinky > 0.75 && thumb < 0.4 && index < 0.3 && middle < 0.3 && ring < 0.3) {
      return { sign: SIGN_DICTIONARY["I"] || null, confidence: 0.98 };
    }
    if (index > 0.7 && middle > 0.7 && ring < 0.35 && pinky < 0.35 && thumb < 0.5) {
      return { sign: SIGN_DICTIONARY["V"] || SIGN_DICTIONARY["PEACE"] || SIGN_DICTIONARY["2"] || null, confidence: 0.97 };
    }
    if (index > 0.7 && middle > 0.7 && ring > 0.65 && pinky < 0.35 && thumb < 0.5) {
      return { sign: SIGN_DICTIONARY["W"] || SIGN_DICTIONARY["WATER"] || null, confidence: 0.97 };
    }
    if (thumb < 0.3 && index > 0.7 && middle > 0.7 && ring > 0.7 && pinky > 0.7) {
      return { sign: SIGN_DICTIONARY["B"] || SIGN_DICTIONARY["4"] || null, confidence: 0.97 };
    }
    if (thumb > 0.65 && index > 0.7 && middle > 0.7 && ring > 0.65 && pinky > 0.65) {
      return { sign: SIGN_DICTIONARY["HELLO"] || SIGN_DICTIONARY["5"] || null, confidence: 0.98 };
    }
    if (index > 0.75 && middle < 0.3 && ring < 0.3 && pinky < 0.3 && thumb < 0.5) {
      return { sign: SIGN_DICTIONARY["1"] || SIGN_DICTIONARY["D"] || null, confidence: 0.97 };
    }
    if (distThumbPinky < 0.35 && index > 0.6 && middle > 0.6 && ring > 0.6) {
      return { sign: SIGN_DICTIONARY["6"] || null, confidence: 0.96 };
    }
    if (distThumbRing < 0.35 && index > 0.6 && middle > 0.6 && pinky > 0.6) {
      return { sign: SIGN_DICTIONARY["7"] || null, confidence: 0.96 };
    }
    if (distThumbMiddle < 0.35 && index > 0.6 && ring > 0.6 && pinky > 0.6) {
      return { sign: SIGN_DICTIONARY["8"] || null, confidence: 0.96 };
    }
    if (distThumbIndex < 0.35 && middle > 0.6 && ring > 0.55 && pinky > 0.55) {
      return { sign: SIGN_DICTIONARY["F"] || SIGN_DICTIONARY["9"] || SIGN_DICTIONARY["OKAY"] || null, confidence: 0.96 };
    }
    if (thumb > 0.7 && index < 0.25 && middle < 0.25 && ring < 0.25 && pinky < 0.25) {
      return { sign: SIGN_DICTIONARY["A"] || SIGN_DICTIONARY["GOOD"] || null, confidence: 0.97 };
    }
    if (thumb < 0.3 && index < 0.25 && middle < 0.25 && ring < 0.25 && pinky < 0.25) {
      return { sign: SIGN_DICTIONARY["S"] || SIGN_DICTIONARY["YES"] || null, confidence: 0.96 };
    }
    for (const [key, item] of Object.entries(SIGN_DICTIONARY)) {
      if (item.fingerConfig) {
        const fc = item.fingerConfig;
        const diff = Math.abs(thumb - fc.thumb) * 1.2 + Math.abs(index - fc.index) * 1.3 + Math.abs(middle - fc.middle) * 1.1 + Math.abs(ring - fc.ring) * 1 + Math.abs(pinky - fc.pinky) * 1.2;
        const similarity = Math.max(0, 1 - diff / 4);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestKey = key;
        }
      }
    }
    const matchedSign = SIGN_DICTIONARY[bestKey] || null;
    return {
      sign: matchedSign,
      confidence: Math.max(0.7, Math.min(0.99, bestScore))
    };
  }
  getCachedResult() {
    return this.cachedResult;
  }
  /**
   * Ultra-fast, GPU-accelerated canvas mesh renderer (zero-lag, batch path rendering)
   */
  drawOptimizedMesh(ctx, landmarks, signName = "", confidence = 0.95, isRealHand = true) {
    if (!landmarks || landmarks.length < 21) return;
    const connections = [
      // Metacarpals (Palm base)
      [0, 1],
      [0, 5],
      [0, 9],
      [0, 13],
      [0, 17],
      [5, 9],
      [9, 13],
      [13, 17],
      // Thumb
      [1, 2],
      [2, 3],
      [3, 4],
      // Index
      [5, 6],
      [6, 7],
      [7, 8],
      // Middle
      [9, 10],
      [10, 11],
      [11, 12],
      // Ring
      [13, 14],
      [14, 15],
      [15, 16],
      // Pinky
      [17, 18],
      [18, 19],
      [19, 20]
    ];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(landmarks[0].x, landmarks[0].y);
    ctx.lineTo(landmarks[1].x, landmarks[1].y);
    ctx.lineTo(landmarks[5].x, landmarks[5].y);
    ctx.lineTo(landmarks[9].x, landmarks[9].y);
    ctx.lineTo(landmarks[13].x, landmarks[13].y);
    ctx.lineTo(landmarks[17].x, landmarks[17].y);
    ctx.closePath();
    ctx.fillStyle = isRealHand ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)";
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isRealHand ? "#10B981" : "#38BDF8";
    for (let i = 0; i < connections.length; i++) {
      const [from, to] = connections[i];
      const p1 = landmarks[from];
      const p2 = landmarks[to];
      if (p1 && p2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#FFFFFF";
    for (let i = 0; i < connections.length; i++) {
      const [from, to] = connections[i];
      const p1 = landmarks[from];
      const p2 = landmarks[to];
      if (p1 && p2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const isFingertip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const isWrist = i === 0;
      const radius = isFingertip ? 7 : isWrist ? 8 : 4.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isFingertip ? "#F59E0B" : isWrist ? "#3B82F6" : "#10B981";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    }
    ctx.restore();
  }
}
const mediaPipeTracker = MediaPipeHandTracker.getInstance();
export {
  MediaPipeHandTracker,
  mediaPipeTracker
};
