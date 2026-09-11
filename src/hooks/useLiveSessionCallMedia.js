import { useEffect, useRef, useState, useCallback } from "react";

export const useLiveSessionCallMedia = ({
  useRealCameraLocal,
  isCameraOff,
  cameraFacing,
  mainViewMode,
  setUseRealCameraLocal
}) => {
  const localVideoRef = useRef(null);
  const mainVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  // Helper to safely bind existing media stream to video elements
  const attachStreamToVideos = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (localVideoRef.current && localVideoRef.current.srcObject !== stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }

    if (mainVideoRef.current && mainVideoRef.current.srcObject !== stream) {
      mainVideoRef.current.srcObject = stream;
      mainVideoRef.current.play().catch(() => {});
    }
  }, []);

  // Synchronize stream attachment whenever view mode or video elements toggle
  useEffect(() => {
    attachStreamToVideos();
  }, [mainViewMode, attachStreamToVideos]);

  // Main hardware webcam acquisition and teardown
  useEffect(() => {
    let isCancelled = false;

    if (useRealCameraLocal && !isCameraOff) {
      const acquireStream = async () => {
        // If stream is already active with live tracks, simply re-bind
        if (localStreamRef.current && localStreamRef.current.getTracks().some((t) => t.readyState === "live")) {
          attachStreamToVideos();
          return;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
          setUseRealCameraLocal(false);
          return;
        }

        let s = null;
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing ? { ideal: cameraFacing } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
        } catch {
          try {
            s = await navigator.mediaDevices.getUserMedia({
              video: cameraFacing ? { facingMode: { ideal: cameraFacing } } : true,
              audio: false
            });
          } catch (err) {
            console.warn("Local webcam acquisition failed:", err);
            if (!isCancelled) setUseRealCameraLocal(false);
            return;
          }
        }

        if (isCancelled || !s) {
          if (s) s.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = s;
        attachStreamToVideos();
      };

      acquireStream();
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    }

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [useRealCameraLocal, isCameraOff, cameraFacing, setUseRealCameraLocal, attachStreamToVideos]);

  return {
    localVideoRef,
    mainVideoRef,
    localStreamRef,
    attachStreamToVideos
  };
};
