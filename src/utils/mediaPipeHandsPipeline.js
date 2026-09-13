/**
 * Core MediaPipe Hands Pipeline
 * Implements @mediapipe/hands initialization, webcam stream management,
 * real-time frame processing, HTML5 canvas rendering (with @mediapipe/drawing_utils),
 * and live gesture mapping.
 */

import {
  mapLandmarksToGesture,
  drawHandLandmarksCanvas,
  HAND_CONNECTIONS as LOCAL_HAND_CONNECTIONS
} from "./gestureMapping";

// Dynamic loader for @mediapipe/hands
let _HandsClass = null;
let _CameraClass = null;
let _DrawingUtils = null;

async function loadMediaPipeHandsModules() {
  if (!_HandsClass) {
    if (typeof window !== "undefined" && window.Hands) {
      _HandsClass = window.Hands;
    } else {
      try {
        const mod = await import("@mediapipe/hands");
        _HandsClass = mod.Hands || mod.default?.Hands || mod.default;
      } catch (err) {
        console.warn("[MediaPipeHandsPipeline] Import @mediapipe/hands error:", err);
        _HandsClass = typeof window !== "undefined" ? window.Hands : null;
      }
    }
  }

  if (!_CameraClass) {
    if (typeof window !== "undefined" && window.Camera) {
      _CameraClass = window.Camera;
    } else {
      try {
        const mod = await import("@mediapipe/camera_utils");
        _CameraClass = mod.Camera || mod.default?.Camera || mod.default;
      } catch (err) {
        console.warn("[MediaPipeHandsPipeline] Import @mediapipe/camera_utils error:", err);
      }
    }
  }

  if (!_DrawingUtils) {
    try {
      const mod = await import("@mediapipe/drawing_utils");
      _DrawingUtils = {
        drawConnectors: mod.drawConnectors || mod.default?.drawConnectors,
        drawLandmarks: mod.drawLandmarks || mod.default?.drawLandmarks
      };
    } catch (err) {
      console.warn("[MediaPipeHandsPipeline] Import @mediapipe/drawing_utils error:", err);
    }
  }

  return {
    Hands: _HandsClass,
    Camera: _CameraClass,
    drawingUtils: _DrawingUtils
  };
}

export class MediaPipeHandsPipeline {
  constructor(options = {}) {
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.hands = null;
    this.camera = null;
    this.mediaStream = null;

    this.isInitialized = false;
    this.isStreaming = false;
    this.isProcessingFrame = false;
    this.isMirrored = options.isMirrored !== false;

    this.options = {
      maxNumHands: options.maxNumHands || 2,
      modelComplexity: options.modelComplexity ?? 1,
      minDetectionConfidence: options.minDetectionConfidence || 0.5,
      minTrackingConfidence: options.minTrackingConfidence || 0.5,
      useOfficialDrawingUtils: options.useOfficialDrawingUtils ?? false,
      renderCanvas: options.renderCanvas !== false,
      showGestureBadge: options.showGestureBadge !== false,
      showBoundingBox: options.showBoundingBox !== false,
      ...options
    };

    // State & Callbacks
    this.listeners = {
      onResults: new Set(),
      onGesture: new Set(),
      onError: new Set()
    };

    this.lastResults = null;
    this.lastGestures = [];
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.animationFrameId = null;
  }

  /**
   * 1. Initialize @mediapipe/hands instance with options and locateFile
   */
  async initializeHands() {
    if (this.hands && this.isInitialized) return true;

    const { Hands } = await loadMediaPipeHandsModules();
    if (!Hands) {
      throw new Error("Unable to load @mediapipe/hands. Verify script or package availability.");
    }

    // Try local files first, with fallback to CDN
    try {
      this.hands = new Hands({
        locateFile: (file) => `/mediapipe/hands/${file}`
      });
      this.hands.setOptions({
        maxNumHands: this.options.maxNumHands,
        modelComplexity: this.options.modelComplexity,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });
    } catch {
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });
      this.hands.setOptions({
        maxNumHands: this.options.maxNumHands,
        modelComplexity: this.options.modelComplexity,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence
      });
    }

    // Wire up results callback
    this.hands.onResults((results) => {
      this.handleResults(results);
    });

    this.isInitialized = true;
    return true;
  }

  /**
   * 2. Initialize the webcam stream and bind to video element
   */
  async initializeWebcamStream(videoElement, constraints = {}) {
    if (!videoElement) {
      throw new Error("Target videoElement is required to initialize webcam stream.");
    }
    this.videoElement = videoElement;

    // Stop existing stream if any
    this.stopWebcamStream();

    const defaultConstraints = {
      video: {
        width: { ideal: constraints.width || 1280 },
        height: { ideal: constraints.height || 720 },
        facingMode: constraints.facingMode || "user"
      },
      audio: false
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("navigator.mediaDevices.getUserMedia is not supported on this platform.");
      }

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      this.mediaStream = stream;

      videoElement.muted = true;
      videoElement.defaultMuted = true;
      videoElement.setAttribute("muted", "");
      videoElement.setAttribute("playsinline", "true");
      videoElement.setAttribute("webkit-playsinline", "true");
      videoElement.srcObject = stream;

      await videoElement.play().catch(() => {});
      this.isStreaming = true;

      return stream;
    } catch (err) {
      this.emit("onError", err);
      throw err;
    }
  }

  /**
   * Attach HTML5 canvas element for landmark rendering
   */
  setCanvas(canvasElement) {
    this.canvasElement = canvasElement;
    if (canvasElement) {
      this.ctx = canvasElement.getContext("2d");
    }
  }

  /**
   * 3. Process video frames using @mediapipe/hands
   */
  async processFrame() {
    if (!this.hands || !this.videoElement || this.videoElement.readyState < 2 || this.isProcessingFrame) {
      return;
    }

    this.isProcessingFrame = true;
    try {
      await this.hands.send({ image: this.videoElement });
    } catch (err) {
      console.warn("[MediaPipeHandsPipeline] send frame error:", err);
    } finally {
      this.isProcessingFrame = false;
    }
  }

  /**
   * Continuous animation loop for processing frames and drawing on canvas
   */
  startPipeline(videoElement, canvasElement) {
    if (videoElement) this.videoElement = videoElement;
    if (canvasElement) this.setCanvas(canvasElement);

    const loop = async () => {
      if (!this.isStreaming) return;

      // Update FPS calculation
      const now = performance.now();
      this.frameCount++;
      if (now - this.lastFpsTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      await this.processFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.isStreaming = true;
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stop pipeline and clean up video/stream/animation
   */
  stopPipeline() {
    this.isStreaming = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopWebcamStream();
  }

  stopWebcamStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isStreaming = false;
  }

  /**
   * 4. Results Handler: Computes Gesture Mapping & Draws Landmarks on HTML5 Canvas
   */
  handleResults(results) {
    this.lastResults = results;

    const width = this.canvasElement?.width || 1280;
    const height = this.canvasElement?.height || 720;
    const detectedHands = [];

    // Process all detected hands
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((rawLandmarks, index) => {
        const handLabel = results.multiHandedness?.[index]?.label || (index === 0 ? "Right" : "Left");

        // Map normalized coordinates [0, 1] to pixel canvas space
        const pixelLandmarks = rawLandmarks.map((pt) => {
          const normX = this.isMirrored ? (1 - pt.x) : pt.x;
          return {
            x: normX * width,
            y: pt.y * height,
            z: (pt.z || 0) * width
          };
        });

        // 5. GESTURE MAPPING: Classify 21 3D landmarks into gesture
        const gesture = mapLandmarksToGesture(pixelLandmarks, handLabel, width, height);

        detectedHands.push({
          rawLandmarks,
          pixelLandmarks,
          handedness: handLabel,
          gesture
        });
      });
    }

    this.lastGestures = detectedHands.map((h) => h.gesture);

    // 4. DRAW ON CANVAS
    if (this.options.renderCanvas && this.ctx && this.canvasElement) {
      this.drawOnCanvas(detectedHands, width, height);
    }

    // Emit results
    const payload = {
      hands: detectedHands,
      rawResults: results,
      fps: this.fps,
      isHandDetected: detectedHands.length > 0
    };

    this.emit("onResults", payload);
    if (detectedHands.length > 0) {
      this.emit("onGesture", detectedHands[0].gesture);
    }
  }

  /**
   * Draw the hand landmarks on HTML5 canvas
   */
  drawOnCanvas(detectedHands, width, height) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (detectedHands.length === 0) return;

    detectedHands.forEach((hand) => {
      if (this.options.useOfficialDrawingUtils && _DrawingUtils?.drawConnectors) {
        // Official @mediapipe/drawing_utils rendering
        const normLandmarks = hand.rawLandmarks.map((pt) => ({
          x: this.isMirrored ? (1 - pt.x) : pt.x,
          y: pt.y,
          z: pt.z || 0
        }));

        _DrawingUtils.drawConnectors(ctx, normLandmarks, LOCAL_HAND_CONNECTIONS, {
          color: "#10B981",
          lineWidth: 4
        });
        _DrawingUtils.drawLandmarks(ctx, normLandmarks, {
          color: "#38BDF8",
          lineWidth: 2,
          radius: 5
        });
      } else {
        // High-definition stylized HUD canvas rendering
        drawHandLandmarksCanvas(ctx, hand.pixelLandmarks, hand.gesture, {
          showConnections: true,
          showJoints: true,
          showPalmFill: true,
          showBoundingBox: this.options.showBoundingBox,
          showGestureBadge: this.options.showGestureBadge,
          isMirrored: this.isMirrored
        });
      }
    });
  }

  // Event dispatching
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }
}

export const mediaPipePipeline = new MediaPipeHandsPipeline();
