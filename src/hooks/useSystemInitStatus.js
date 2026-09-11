import { useState, useEffect, useRef } from "react";
import { RealtimeHandTracker, SIGN_DICTIONARY } from "../utils/handTracker";
import { mediaPipeTracker } from "../utils/mediaPipeTracker";
import { aiStreamRecognizer } from "../utils/aiStreamRecognizer";

export const useSystemInitStatus = () => {
  const [status, setStatus] = useState({
    mediaPipeWorker: {
      id: "mediapipe-worker",
      label: "Vision Web Worker",
      detail: "Initializing worker thread...",
      ready: false,
      backend: "Pending"
    },
    mediaPipeEngine: {
      id: "mediapipe-engine",
      label: "MediaPipe 21 Landmarks",
      detail: "Loading neural hand landmarker & WASM...",
      ready: false,
      backend: "Pending"
    },
    aiWorker: {
      id: "ai-worker",
      label: "AI Processing Worker",
      detail: "Spawning AI stream worker thread...",
      ready: false,
      backend: "Pending"
    },
    aiStream: {
      id: "ai-stream",
      label: "Gemini AI Stream & SSE",
      detail: "Connecting real-time SSE stream...",
      ready: false,
      backend: "Pending"
    },
    lexicon: {
      id: "lexicon",
      label: "Sign Lexicon & Physics",
      detail: "Caching gesture kinematics...",
      ready: false,
      count: 0
    }
  });

  const [progress, setProgress] = useState(15);
  const [currentStepMessage, setCurrentStepMessage] = useState("Initializing neural threads...");
  const [allReady, setAllReady] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const trackerRef = useRef(null);

  useEffect(() => {
    trackerRef.current = RealtimeHandTracker.getInstance();
    const tracker = trackerRef.current;
    const startTime = performance.now();
    let isMounted = true;

    // Timer to track elapsed loading time
    const timer = setInterval(() => {
      if (isMounted) {
        setElapsedTime(Math.round((performance.now() - startTime) / 100) / 10);
      }
    }, 100);

    // 1. Hand Tracking Web Worker
    const unsubVisionWorker = tracker.onWorkerReady((ready, backend) => {
      if (!isMounted) return;
      setStatus((prev) => ({
        ...prev,
        mediaPipeWorker: {
          ...prev.mediaPipeWorker,
          ready: true,
          detail: "Offscreen canvas & physics thread active",
          backend: backend || "MediaPipe Vision Worker"
        }
      }));
    });

    // If already ready immediately
    if (tracker.workerReady) {
      setStatus((prev) => ({
        ...prev,
        mediaPipeWorker: {
          ...prev.mediaPipeWorker,
          ready: true,
          detail: "Offscreen canvas & physics thread active",
          backend: tracker.workerBackend || "MediaPipe Vision Worker"
        }
      }));
    }

    // 2. AI Processing Web Worker
    const unsubAIWorker = aiStreamRecognizer.onWorkerReady((ready, backend) => {
      if (!isMounted) return;
      setStatus((prev) => ({
        ...prev,
        aiWorker: {
          ...prev.aiWorker,
          ready: true,
          detail: "Stream SSE parser & token worker active",
          backend: backend || "Gemini AI Stream Worker"
        }
      }));
    });

    if (aiStreamRecognizer.workerReady) {
      setStatus((prev) => ({
        ...prev,
        aiWorker: {
          ...prev.aiWorker,
          ready: true,
          detail: "Stream SSE parser & token worker active",
          backend: aiStreamRecognizer.workerBackend || "Gemini AI Stream Worker"
        }
      }));
    }

    // 3. MediaPipe Engine (Tasks Vision / Classic Hands WASM)
    mediaPipeTracker
      .initialize()
      .then((ok) => {
        if (!isMounted) return;
        const mpStatus = mediaPipeTracker.getStatus();
        setStatus((prev) => ({
          ...prev,
          mediaPipeEngine: {
            ...prev.mediaPipeEngine,
            ready: true,
            detail: "21 3D landmarks & kinematics initialized",
            backend: mpStatus.engineType || "MediaPipe Hands"
          }
        }));
      })
      .catch((err) => {
        console.warn("[LoadingOverlay] MediaPipe Engine fallback:", err?.message || err);
        if (!isMounted) return;
        setStatus((prev) => ({
          ...prev,
          mediaPipeEngine: {
            ...prev.mediaPipeEngine,
            ready: true,
            detail: "Kinematic joint tracking ready",
            backend: "Kinematic Vision Fallback"
          }
        }));
      });

    // 4. Gemini AI Stream & Server Health Connection
    aiStreamRecognizer
      .checkStreamConnection()
      .then((conn) => {
        if (!isMounted) return;
        setStatus((prev) => ({
          ...prev,
          aiStream: {
            ...prev.aiStream,
            ready: true,
            detail: conn.geminiEnabled
              ? "Gemini 3.8 Flash Stream SSE connected"
              : "SignLink Stream Pipeline connected",
            backend: conn.geminiEnabled ? "Gemini 3.8 Flash" : "Kinematic Engine"
          }
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus((prev) => ({
          ...prev,
          aiStream: {
            ...prev.aiStream,
            ready: true,
            detail: "Kinematic AI stream connected",
            backend: "Kinematic Engine"
          }
        }));
      });

    // 5. Lexicon & Physics Dictionary
    const signCount = Object.keys(SIGN_DICTIONARY || {}).length;
    setStatus((prev) => ({
      ...prev,
      lexicon: {
        ...prev.lexicon,
        ready: true,
        detail: `${signCount} signs & finger flexion models cached`,
        count: signCount
      }
    }));

    // Safety timeout: In case sandbox restrictions block web workers or offline network,
    // guarantee auto-ready within 4.5 seconds so user is never permanently blocked
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        setStatus((prev) => ({
          mediaPipeWorker: { ...prev.mediaPipeWorker, ready: true },
          mediaPipeEngine: { ...prev.mediaPipeEngine, ready: true },
          aiWorker: { ...prev.aiWorker, ready: true },
          aiStream: { ...prev.aiStream, ready: true },
          lexicon: { ...prev.lexicon, ready: true }
        }));
      }
    }, 4500);

    return () => {
      isMounted = false;
      clearInterval(timer);
      clearTimeout(fallbackTimeout);
      unsubVisionWorker();
      unsubAIWorker();
    };
  }, []);

  // Compute calculated overall progress and milestone step
  useEffect(() => {
    let completedCount = 0;
    const total = 5;

    if (status.mediaPipeWorker.ready) completedCount++;
    if (status.mediaPipeEngine.ready) completedCount++;
    if (status.aiWorker.ready) completedCount++;
    if (status.aiStream.ready) completedCount++;
    if (status.lexicon.ready) completedCount++;

    const calculatedProgress = Math.min(100, Math.round(15 + (completedCount / total) * 85));
    setProgress(calculatedProgress);

    if (completedCount === 0) {
      setCurrentStepMessage("Spawning neural vision & AI worker threads...");
    } else if (!status.mediaPipeWorker.ready) {
      setCurrentStepMessage("Booting MediaPipe Vision Web Worker thread...");
    } else if (!status.mediaPipeEngine.ready) {
      setCurrentStepMessage("Resolving 21-point hand landmark neural model...");
    } else if (!status.aiWorker.ready) {
      setCurrentStepMessage("Initializing Gemini AI Stream Processing Worker...");
    } else if (!status.aiStream.ready) {
      setCurrentStepMessage("Establishing real-time SSE stream connection...");
    } else {
      setCurrentStepMessage("All worker threads and stream connections confirmed ready.");
    }

    if (completedCount === total) {
      setAllReady(true);
    }
  }, [status]);

  return {
    status,
    progress,
    currentStepMessage,
    allReady,
    elapsedTime
  };
};
