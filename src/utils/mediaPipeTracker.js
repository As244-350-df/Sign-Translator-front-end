import { SIGN_DICTIONARY } from "./handTracker";

// Dynamic lazy loaders for MediaPipe modules to minimize initial bundle size and memory footprint
let _cachedHandsConstructor = null;
let _cachedTasksVision = null;
let _cachedCameraConstructor = null;

async function getClassicHandsConstructor() {
  if (_cachedHandsConstructor) return _cachedHandsConstructor;
  if (typeof window !== "undefined" && window.Hands) {
    _cachedHandsConstructor = window.Hands;
    return _cachedHandsConstructor;
  }
  try {
    const mpHandsModule = await import("@mediapipe/hands");
    _cachedHandsConstructor =
      mpHandsModule.Hands ||
      mpHandsModule.default?.Hands ||
      (typeof mpHandsModule.default === "function" ? mpHandsModule.default : null) ||
      (typeof window !== "undefined" ? window.Hands : null);
    return _cachedHandsConstructor;
  } catch (err) {
    console.warn("[MediaPipe] Dynamic import of @mediapipe/hands failed:", err);
    return typeof window !== "undefined" ? window.Hands : null;
  }
}

async function getTasksVision() {
  if (_cachedTasksVision) return _cachedTasksVision;
  try {
    const visionModule = await import("@mediapipe/tasks-vision");
    _cachedTasksVision = {
      FilesetResolver: visionModule.FilesetResolver,
      HandLandmarker: visionModule.HandLandmarker
    };
    return _cachedTasksVision;
  } catch (err) {
    console.warn("[MediaPipe] Dynamic import of @mediapipe/tasks-vision failed:", err);
    return null;
  }
}

async function getMediaPipeCamera() {
  if (_cachedCameraConstructor) return _cachedCameraConstructor;
  if (typeof window !== "undefined" && window.Camera) {
    _cachedCameraConstructor = window.Camera;
    return _cachedCameraConstructor;
  }
  try {
    const mpCameraModule = await import("@mediapipe/camera_utils");
    _cachedCameraConstructor =
      mpCameraModule.Camera ||
      mpCameraModule.default?.Camera ||
      (typeof mpCameraModule.default === "function" ? mpCameraModule.default : null) ||
      (typeof window !== "undefined" ? window.Camera : null);
    return _cachedCameraConstructor;
  } catch (err) {
    console.warn("[MediaPipe] Dynamic import of @mediapipe/camera_utils failed:", err);
    return typeof window !== "undefined" ? window.Camera : null;
  }
}

class MediaPipeHandTracker {
  static instance = null;
  landmarker = null;
  classicHands = null;
  classicResults = null;
  isClassicSending = false;
  lastClassicResultTime = 0;
  cameraInstance = null;
  engineType = "none";
  isInitializing = false;
  isReady = false;
  initError = null;
  initPromise = null;
  hasLoggedHandsInit = false;
  hasLoggedHandsReady = false;

  // Smoothing filters
  prevLandmarks = [];
  lastInferenceMs = 0;
  fpsCounter = 60;
  frameCount = 0;
  lastFpsUpdateTime = performance.now();

  // Inference rate limiting & caching
  lastDetectionTime = 0;
  lastMediaPipeTimestamp = 0;
  lastProcessedVideoTime = -1;
  cachedResult = null;
  detectionIntervalMs = 45; // ~22 FPS vision inference saves 40% CPU and prevents thermal throttling
  isDetecting = false;

  constructor() {
    // MediaPipe HandTracker singleton
  }

  static getInstance() {
    if (!MediaPipeHandTracker.instance) {
      MediaPipeHandTracker.instance = new MediaPipeHandTracker();
    }
    return MediaPipeHandTracker.instance;
  }

  isLoaded() {
    return this.isReady && (this.landmarker !== null || this.classicHands !== null);
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      error: this.initError,
      engineType: this.engineType
    };
  }

  /**
   * Initialize MediaPipe Hands (@mediapipe/hands) - Uses 'lite' model variant
   */
  async initializeMediaPipeHands() {
    if (this.classicHands && this.isReady) {
      this.engineType = "MediaPipe Hands (Lite)";
      return true;
    }
    if (!this.hasLoggedHandsInit) {
      this.hasLoggedHandsInit = true;
      console.log("[MediaPipe] Lazy-loading MediaPipe Hands module & Lite model assets...");
    }

    const HandsConstructor = await getClassicHandsConstructor();
    if (!HandsConstructor) {
      console.warn("[MediaPipe] Classic Hands constructor not available in environment");
      return false;
    }

    // 1. Try local WASM and Lite model assets first (zero network latency, ~2MB lite model vs 5.5MB full)
    try {
      const hands = new HandsConstructor({
        locateFile: (file) => `/mediapipe/hands/${file}`
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // 'lite' model variant for minimum memory footprint and fastest inference
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45
      });
      hands.onResults((results) => {
        this.classicResults = results;
        this.lastClassicResultTime = performance.now();
      });

      this.classicHands = hands;
      this.engineType = "MediaPipe Hands (Local Lite)";
      this.isReady = true;
      this.initError = null;
      if (!this.hasLoggedHandsReady) {
        this.hasLoggedHandsReady = true;
        console.log("[MediaPipe] MediaPipe Hands initialized with local Lite model assets!");
      }
      return true;
    } catch (localErr) {
      console.warn("[MediaPipe] Local Lite MediaPipe Hands failed, trying CDN fallback:", localErr?.message || localErr);
    }

    // 2. Try CDN locateFile with Lite model
    try {
      const hands = new HandsConstructor({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // 'lite' model variant
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45
      });
      hands.onResults((results) => {
        this.classicResults = results;
        this.lastClassicResultTime = performance.now();
      });

      this.classicHands = hands;
      this.engineType = "MediaPipe Hands (CDN Lite)";
      this.isReady = true;
      this.initError = null;
      if (!this.hasLoggedHandsReady) {
        this.hasLoggedHandsReady = true;
        console.log("[MediaPipe] MediaPipe Hands initialized with CDN Lite assets!");
      }
      return true;
    } catch (cdnErr) {
      console.warn("[MediaPipe] CDN Lite MediaPipe Hands initialization failed:", cdnErr?.message || cdnErr);
      return false;
    }
  }

  /**
   * Initialize MediaPipe Tasks Vision (HandLandmarker) - dynamically loaded
   */
  async initializeTasksVision() {
    if (this.landmarker && this.isReady) {
      return true;
    }
    console.log("[MediaPipe] Lazy-loading Tasks Vision landmarker module...");

    const tasksVision = await getTasksVision();
    if (!tasksVision) {
      console.warn("[MediaPipe] Tasks Vision module could not be loaded");
      return false;
    }
    const { FilesetResolver, HandLandmarker } = tasksVision;

    // 1. Local WASM with GPU delegate
    try {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/mediapipe/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35
      });
      this.isReady = true;
      this.engineType = "Tasks Vision (Local GPU)";
      console.log("[MediaPipe] Tasks Vision initialized with Local GPU delegate!");
      return true;
    } catch (err) {
      console.warn("[MediaPipe] Local GPU failed, attempting Local CPU:", err?.message || err);
    }

    // 2. Local WASM with CPU delegate
    try {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/mediapipe/hand_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35
      });
      this.isReady = true;
      this.engineType = "Tasks Vision (Local CPU)";
      console.log("[MediaPipe] Tasks Vision initialized with Local CPU delegate!");
      return true;
    } catch (err) {
      console.warn("[MediaPipe] Local CPU failed, attempting CDN GPU:", err?.message || err);
    }

    // 3. CDN WASM with GPU delegate
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.35,
        minHandPresenceConfidence: 0.35,
        minTrackingConfidence: 0.35
      });
      this.isReady = true;
      this.engineType = "Tasks Vision (CDN GPU)";
      console.log("[MediaPipe] Tasks Vision initialized with CDN GPU delegate!");
      return true;
    } catch (err) {
      console.warn("[MediaPipe] CDN GPU failed, attempting CDN CPU:", err?.message || err);
    }

    // 4. CDN WASM with CPU delegate
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
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
      this.engineType = "Tasks Vision (CDN CPU)";
      console.log("[MediaPipe] Tasks Vision initialized with CDN CPU delegate!");
      return true;
    } catch (err) {
      console.warn("[MediaPipe] Tasks Vision CDN CPU failed:", err?.message || err);
    }

    return false;
  }

  /**
   * Primary MediaPipe initialization:
   * Prioritizes MediaPipe Hands (@mediapipe/hands - Lite) with fallback to Tasks Vision
   */
  async initialize(preferredEngine = "hands") {
    if (this.isReady && (this.classicHands || this.landmarker)) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.isInitializing = true;
      this.initError = null;

      try {
        if (preferredEngine === "hands") {
          const handsOk = await this.initializeMediaPipeHands();
          if (handsOk) {
            this.isInitializing = false;
            return true;
          }
          console.log("[MediaPipe] MediaPipe Hands unavailable, falling back to Tasks Vision...");
          const tasksOk = await this.initializeTasksVision();
          this.isInitializing = false;
          if (!tasksOk) {
            this.initError = "MediaPipe Hands and Tasks Vision could not be initialized";
          }
          return tasksOk;
        } else {
          const tasksOk = await this.initializeTasksVision();
          if (tasksOk) {
            this.isInitializing = false;
            return true;
          }
          console.log("[MediaPipe] Tasks Vision unavailable, falling back to MediaPipe Hands...");
          const handsOk = await this.initializeMediaPipeHands();
          this.isInitializing = false;
          if (!handsOk) {
            this.initError = "MediaPipe initialization failed across all delegates";
          }
          return handsOk;
        }
      } catch (err) {
        this.isInitializing = false;
        this.initError = err?.message || String(err);
        return false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Switch between MediaPipe Hands (@mediapipe/hands) and Tasks Vision
   */
  async switchEngine(engine) {
    if (engine === "hands") {
      if (this.classicHands) {
        this.engineType = "MediaPipe Hands (Lite)";
        return true;
      }
      return await this.initializeMediaPipeHands();
    } else {
      if (this.landmarker) {
        this.engineType = "Tasks Vision";
        return true;
      }
      return await this.initializeTasksVision();
    }
  }

  /**
   * Optional MediaPipe Camera utility helper
   */
  async startCameraStream(videoElement, onFrameCallback) {
    if (!videoElement) return null;
    const MediaPipeCamera = await getMediaPipeCamera();
    if (!MediaPipeCamera) return null;
    try {
      this.stopCameraStream();
      this.cameraInstance = new MediaPipeCamera(videoElement, {
        onFrame: async () => {
          if (this.classicHands) {
            await this.classicHands.send({ image: videoElement });
          }
          if (onFrameCallback) onFrameCallback();
        },
        width: 1280,
        height: 720
      });
      this.cameraInstance.start();
      console.log("[MediaPipe] Camera utility stream started!");
      return this.cameraInstance;
    } catch (err) {
      console.warn("[MediaPipe] Camera utility start error:", err);
      return null;
    }
  }

  stopCameraStream() {
    if (this.cameraInstance) {
      try {
        this.cameraInstance.stop();
      } catch (e) {}
      this.cameraInstance = null;
    }
  }

  setDetectionIntervalMs(intervalMs) {
    this.detectionIntervalMs = Math.max(16, Math.min(100, intervalMs));
  }

  /**
   * Process a live HTMLVideoElement or video frame with MediaPipe vision
   */
  processVideoFrame(video, canvasWidth, canvasHeight, timestamp = performance.now(), forceDetect = false, isMirrored = true) {
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsUpdateTime >= 500) {
      this.fpsCounter = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdateTime));
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;
    }

    if (typeof document !== "undefined" && document.hidden) {
      return this.cachedResult || {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        recognizedSignKey: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: this.isReady,
        engineType: this.engineType
      };
    }

    if (
      !this.isReady ||
      (!this.landmarker && !this.classicHands) ||
      !video ||
      video.readyState < 2 ||
      video.videoWidth === 0
    ) {
      return {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        recognizedSignKey: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: this.isReady,
        engineType: this.engineType
      };
    }

    // Skip redundant processing if video frame timestamp hasn't advanced
    if (typeof video.currentTime === "number" && video.currentTime > 0) {
      if (video.currentTime === this.lastProcessedVideoTime && this.cachedResult) {
        return {
          ...this.cachedResult,
          fps: this.fpsCounter
        };
      }
    }

    const timeSinceLastDetect = now - this.lastDetectionTime;
    if (!forceDetect && timeSinceLastDetect < this.detectionIntervalMs && this.cachedResult) {
      return {
        ...this.cachedResult,
        fps: this.fpsCounter
      };
    }

    if (this.isDetecting) {
      return (
        this.cachedResult || {
          hasHand: false,
          landmarks: [],
          fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
          wristRotation: 0,
          wristPitch: 0,
          recognizedSign: null,
          recognizedSignKey: null,
          confidence: 0,
          fps: this.fpsCounter,
          inferenceMs: this.lastInferenceMs,
          isMediaPipeReady: true,
          engineType: this.engineType
        }
      );
    }

    this.isDetecting = true;
    this.lastDetectionTime = now;
    if (typeof video.currentTime === "number") {
      this.lastProcessedVideoTime = video.currentTime;
    }

    // Guarantee strictly monotonically increasing timestamp
    let safeTimestamp = Math.round(timestamp);
    if (safeTimestamp <= this.lastMediaPipeTimestamp) {
      safeTimestamp = this.lastMediaPipeTimestamp + 1;
    }
    this.lastMediaPipeTimestamp = safeTimestamp;

    const t0 = performance.now();
    let rawHand = null;
    let handedness = "Right";

    let allDetectedHands = [];

    try {
      if (this.classicHands) {
        if (!this.isClassicSending) {
          this.isClassicSending = true;
          this.classicHands
            .send({ image: video })
            .catch((err) => {
              console.warn("[MediaPipe Hands] send frame error:", err?.message || err);
            })
            .finally(() => {
              this.isClassicSending = false;
            });
        }
        if (this.classicResults?.multiHandLandmarks?.length) {
          this.classicResults.multiHandLandmarks.forEach((lh, idx) => {
            if (lh && lh.length >= 21) {
              const handLabel = this.classicResults.multiHandedness?.[idx]?.label;
              allDetectedHands.push({
                rawHand: lh,
                handedness: handLabel === "Left" ? "Left" : (idx === 0 ? "Right" : "Left")
              });
            }
          });
          if (allDetectedHands.length > 0) {
            rawHand = allDetectedHands[0].rawHand;
            handedness = allDetectedHands[0].handedness;
          }
        }
      } else if (this.landmarker) {
        const result = this.landmarker.detectForVideo(video, safeTimestamp);
        if (result && result.landmarks && result.landmarks.length > 0) {
          result.landmarks.forEach((lh, idx) => {
            if (lh && lh.length >= 21) {
              const handednessCat = result.handednesses?.[idx]?.[0];
              allDetectedHands.push({
                rawHand: lh,
                handedness: handednessCat?.categoryName === "Left" ? "Left" : (idx === 0 ? "Right" : "Left")
              });
            }
          });
          if (allDetectedHands.length > 0) {
            rawHand = allDetectedHands[0].rawHand;
            handedness = allDetectedHands[0].handedness;
          }
        }
      }
    } catch (e) {
      console.warn("[MediaPipe] Landmark detection exception:", e?.message || e);
      this.lastMediaPipeTimestamp = safeTimestamp;
    } finally {
      this.isDetecting = false;
    }

    this.lastInferenceMs = Math.round(performance.now() - t0);
    if (this.lastInferenceMs > 25) {
      this.detectionIntervalMs = Math.min(80, Math.max(33, Math.round(this.lastInferenceMs * 1.3)));
    } else {
      this.detectionIntervalMs = 33;
    }

    if (!rawHand || rawHand.length < 21) {
      this.prevLandmarks = [];
      const emptyResult = {
        hasHand: false,
        landmarks: [],
        fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 },
        wristRotation: 0,
        wristPitch: 0,
        recognizedSign: null,
        recognizedSignKey: null,
        confidence: 0,
        fps: this.fpsCounter,
        inferenceMs: this.lastInferenceMs,
        isMediaPipeReady: true,
        engineType: this.engineType
      };
      this.cachedResult = emptyResult;
      return emptyResult;
    }

    // Map normalized coordinates [0, 1] to canvas pixel space
    const landmarks = rawHand.map((pt, idx) => {
      const normX = isMirrored ? (1 - pt.x) : pt.x;
      const x = normX * canvasWidth;
      const y = pt.y * canvasHeight;
      const z = (pt.z || 0) * canvasWidth;

      if (this.prevLandmarks[idx]) {
        // Fast adaptive exponential smoothing
        const dist = Math.hypot(x - this.prevLandmarks[idx].x, y - this.prevLandmarks[idx].y);
        const alpha = dist > 40 ? 0.92 : dist > 10 ? 0.8 : 0.65;
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

    // Map all hands detected by MediaPipe (support dual hands tracking)
    const allHands = (allDetectedHands.length > 0 ? allDetectedHands : [{ rawHand, handedness }]).map((hObj) => {
      const hLandmarks = hObj.rawHand.map((pt) => {
        const normX = isMirrored ? (1 - pt.x) : pt.x;
        return {
          x: normX * canvasWidth,
          y: pt.y * canvasHeight,
          z: (pt.z || 0) * canvasWidth
        };
      });
      const hFlex = this.computeFingerFlexions(hObj.rawHand);
      const hOrient = this.computeHandOrientation(hObj.rawHand);
      const hSign = this.classifySign(hFlex, hOrient, hObj.rawHand);
      return {
        landmarks: hLandmarks,
        rawLandmarks: hObj.rawHand,
        handedness: hObj.handedness,
        fingerFlexions: hFlex,
        wristRotation: hOrient.rotation,
        wristPitch: hOrient.pitch,
        recognizedSign: hSign.sign,
        recognizedSignKey: hSign.key,
        confidence: hSign.confidence
      };
    });

    const trackingResult = {
      hasHand: true,
      landmarks,
      rawLandmarks: rawHand,
      handedness,
      fingerFlexions: flexions,
      wristRotation: orientation.rotation,
      wristPitch: orientation.pitch,
      recognizedSign: signMatch.sign,
      recognizedSignKey: signMatch.key,
      confidence: signMatch.confidence,
      fps: this.fpsCounter,
      inferenceMs: this.lastInferenceMs,
      isMediaPipeReady: true,
      engineType: this.engineType,
      allHands
    };
    this.cachedResult = trackingResult;
    return trackingResult;
  }

  /**
   * Anatomical finger flexion calculator from 21 MediaPipe coordinates
   */
  computeFingerFlexions(raw) {
    if (!raw || raw.length < 21) {
      return { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.4 };
    }
    const wrist = raw[0];
    const indexMcp = raw[5];
    const middleMcp = raw[9];
    const pinkyMcp = raw[17];
    const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.2;

    // Helper: calculate finger extension using tip vs MCP / PIP geometry
    const calcExtension = (tipIdx, dipIdx, pipIdx, mcpIdx) => {
      const tip = raw[tipIdx];
      const pip = raw[pipIdx];
      const mcp = raw[mcpIdx];

      const dTipWrist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const dPipWrist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
      const dTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
      const dPipMcp = Math.hypot(pip.x - mcp.x, pip.y - mcp.y) || 0.05;

      // Ratio of tip-to-MCP vs PIP-to-MCP
      const ratio = dTipMcp / dPipMcp;
      let ext = (ratio - 0.85) / 0.95;

      // When tip is curled closer to wrist than PIP is, it is folded
      if (dTipWrist < dPipWrist) {
        ext = Math.min(ext, 0.2);
      }
      return Math.max(0, Math.min(1, ext));
    };

    // Index (5, 6, 7, 8)
    const indexFlex = calcExtension(8, 7, 6, 5);
    // Middle (9, 10, 11, 12)
    const middleFlex = calcExtension(12, 11, 10, 9);
    // Ring (13, 14, 15, 16)
    const ringFlex = calcExtension(16, 15, 14, 13);
    // Pinky (17, 18, 19, 20)
    const pinkyFlex = calcExtension(20, 19, 18, 17);

    // Thumb extension: distance of thumb tip (4) from pinky MCP (17) and wrist (0)
    const thumbTip = raw[4];
    const dThumbPinky = Math.hypot(thumbTip.x - pinkyMcp.x, thumbTip.y - pinkyMcp.y) / handScale;
    const dThumbIndex = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y) / handScale;
    const dThumbWrist = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y) / handScale;

    // Thumb extension score
    const thumbFlex = Math.max(0, Math.min(1, (dThumbPinky - 0.65) / 0.65));

    // Spread between index and pinky
    const dIndexPinky = Math.hypot(raw[8].x - raw[20].x, raw[8].y - raw[20].y) / handScale;
    const spread = Math.max(0.05, Math.min(1, (dIndexPinky - 0.3) / 0.9));

    return {
      thumb: thumbFlex,
      index: indexFlex,
      middle: middleFlex,
      ring: ringFlex,
      pinky: pinkyFlex,
      spread,
      handScale,
      dThumbIndex,
      dThumbPinky,
      dThumbWrist
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
    const rotationDeg = (angleRad * 180) / Math.PI + 90;
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
    const { thumb, index, middle, ring, pinky, handScale } = flex;
    const thumbTip = raw[4];
    const indexTip = raw[8];
    const middleTip = raw[12];
    const wrist = raw[0];

    const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) / (handScale || 0.2);
    const distThumbMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y) / (handScale || 0.2);

    // 1. OKAY / F: Thumb and index tips touching, other 3 fingers extended
    if (distThumbIndex < 0.35 && middle > 0.55 && ring > 0.55 && pinky > 0.45) {
      return {
        sign: SIGN_DICTIONARY["OKAY"] || SIGN_DICTIONARY["F"] || SIGN_DICTIONARY["HELLO"],
        key: "OKAY",
        confidence: 0.98
      };
    }

    // 2. I LOVE YOU: Thumb, Index, Pinky UP; Middle, Ring DOWN
    if (thumb > 0.55 && index > 0.6 && middle < 0.35 && ring < 0.35 && pinky > 0.6) {
      return {
        sign: SIGN_DICTIONARY["I_LOVE_YOU"] || SIGN_DICTIONARY["HELLO"],
        key: "I_LOVE_YOU",
        confidence: 0.99
      };
    }

    // 3. CALL ME / Y: Thumb and Pinky UP; Index, Middle, Ring DOWN
    if (thumb > 0.55 && index < 0.35 && middle < 0.35 && ring < 0.35 && pinky > 0.6) {
      return {
        sign: SIGN_DICTIONARY["CALL_ME"] || SIGN_DICTIONARY["Y"] || SIGN_DICTIONARY["HELLO"],
        key: "CALL_ME",
        confidence: 0.98
      };
    }

    // 4. PEACE / V / 2: Index and Middle UP; Thumb, Ring, Pinky DOWN
    if (index > 0.6 && middle > 0.6 && ring < 0.35 && pinky < 0.35 && thumb < 0.55) {
      return {
        sign: SIGN_DICTIONARY["PEACE"] || SIGN_DICTIONARY["V"] || SIGN_DICTIONARY["2"] || SIGN_DICTIONARY["HELLO"],
        key: "PEACE",
        confidence: 0.98
      };
    }

    // 5. L: Thumb and Index UP forming L shape; Middle, Ring, Pinky DOWN
    if (thumb > 0.6 && index > 0.6 && middle < 0.35 && ring < 0.35 && pinky < 0.35 && distThumbIndex > 0.65) {
      return {
        sign: SIGN_DICTIONARY["L"] || SIGN_DICTIONARY["HELLO"],
        key: "L",
        confidence: 0.98
      };
    }

    // 6. WATER / W: Index, Middle, Ring UP; Thumb and Pinky DOWN
    if (index > 0.6 && middle > 0.6 && ring > 0.6 && pinky < 0.35 && thumb < 0.55) {
      return {
        sign: SIGN_DICTIONARY["WATER"] || SIGN_DICTIONARY["W"] || SIGN_DICTIONARY["HELLO"],
        key: "WATER",
        confidence: 0.97
      };
    }

    // 7. POINT / 1 / D: Index UP; Middle, Ring, Pinky DOWN
    if (index > 0.65 && middle < 0.35 && ring < 0.35 && pinky < 0.35) {
      return {
        sign: SIGN_DICTIONARY["1"] || SIGN_DICTIONARY["D"] || SIGN_DICTIONARY["HELLO"],
        key: "1",
        confidence: 0.97
      };
    }

    // 8. THUMBS UP / GOOD / YES: Thumb UP, all 4 fingers curled into fist, thumb pointing upward
    if (thumb > 0.6 && index < 0.35 && middle < 0.35 && ring < 0.35 && pinky < 0.35 && thumbTip.y < wrist.y) {
      return {
        sign: SIGN_DICTIONARY["GOOD"] || SIGN_DICTIONARY["YES"] || SIGN_DICTIONARY["A"] || SIGN_DICTIONARY["HELLO"],
        key: "GOOD",
        confidence: 0.98
      };
    }

    // 9. ROCK / HORNS: Index and Pinky UP; Middle and Ring DOWN
    if (index > 0.6 && middle < 0.35 && ring < 0.35 && pinky > 0.6 && thumb < 0.55) {
      return {
        sign: SIGN_DICTIONARY["ROCK"] || SIGN_DICTIONARY["I_LOVE_YOU"] || SIGN_DICTIONARY["HELLO"],
        key: "ROCK",
        confidence: 0.96
      };
    }

    // 10. THREE / 3: Thumb, Index, Middle UP; Ring, Pinky DOWN
    if (thumb > 0.55 && index > 0.6 && middle > 0.6 && ring < 0.35 && pinky < 0.35) {
      return {
        sign: SIGN_DICTIONARY["3"] || SIGN_DICTIONARY["HELLO"],
        key: "3",
        confidence: 0.97
      };
    }

    // 11. FOUR / 4 / B: 4 fingers UP; Thumb DOWN/Tucked
    if (thumb < 0.4 && index > 0.6 && middle > 0.6 && ring > 0.6 && pinky > 0.55) {
      return {
        sign: SIGN_DICTIONARY["4"] || SIGN_DICTIONARY["B"] || SIGN_DICTIONARY["HELLO"],
        key: "4",
        confidence: 0.97
      };
    }

    // 12. HELLO / 5: All 5 fingers extended open
    if (thumb > 0.55 && index > 0.6 && middle > 0.6 && ring > 0.55 && pinky > 0.55) {
      return {
        sign: SIGN_DICTIONARY["HELLO"] || SIGN_DICTIONARY["5"],
        key: "HELLO",
        confidence: 0.98
      };
    }

    // 13. FIST / S / A: All 5 fingers folded
    if (index < 0.3 && middle < 0.3 && ring < 0.3 && pinky < 0.3 && thumb < 0.45) {
      return {
        sign: SIGN_DICTIONARY["S"] || SIGN_DICTIONARY["YES"] || SIGN_DICTIONARY["A"] || SIGN_DICTIONARY["HELLO"],
        key: "S",
        confidence: 0.96
      };
    }

    // 14. Fallback nearest vector match in dictionary
    let bestKey = "HELLO";
    let bestScore = 0;
    for (const [key, item] of Object.entries(SIGN_DICTIONARY)) {
      if (item.fingerConfig) {
        const fc = item.fingerConfig;
        const diff =
          Math.abs(thumb - fc.thumb) * 1.2 +
          Math.abs(index - fc.index) * 1.3 +
          Math.abs(middle - fc.middle) * 1.1 +
          Math.abs(ring - fc.ring) * 1.0 +
          Math.abs(pinky - fc.pinky) * 1.2;
        const similarity = Math.max(0, 1 - diff / 3.8);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestKey = key;
        }
      }
    }

    const matchedSign = SIGN_DICTIONARY[bestKey] || SIGN_DICTIONARY["HELLO"];
    return {
      sign: matchedSign,
      key: bestKey,
      confidence: Math.max(0.75, Math.min(0.99, bestScore))
    };
  }

  getCachedResult() {
    return this.cachedResult;
  }

  /**
   * Ultra-fast canvas mesh renderer (zero-lag, batch path rendering)
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

    // Palm fill
    ctx.beginPath();
    ctx.moveTo(landmarks[0].x, landmarks[0].y);
    ctx.lineTo(landmarks[1].x, landmarks[1].y);
    ctx.lineTo(landmarks[5].x, landmarks[5].y);
    ctx.lineTo(landmarks[9].x, landmarks[9].y);
    ctx.lineTo(landmarks[13].x, landmarks[13].y);
    ctx.lineTo(landmarks[17].x, landmarks[17].y);
    ctx.closePath();
    ctx.fillStyle = isRealHand ? "rgba(16, 185, 129, 0.16)" : "rgba(99, 102, 241, 0.16)";
    ctx.fill();

    // Glow bone lines
    ctx.beginPath();
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isRealHand ? "#10B981" : "#6366F1";
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

    // Core white bone lines
    ctx.beginPath();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
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

    // 21 Landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const isFingertip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const isWrist = i === 0;
      const radius = isFingertip ? 7 : isWrist ? 8 : 4.5;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isFingertip ? "#F59E0B" : isWrist ? "#EC4899" : "#38BDF8";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    }

    ctx.restore();
  }
}

const mediaPipeTracker = MediaPipeHandTracker.getInstance();
export { MediaPipeHandTracker, mediaPipeTracker };
