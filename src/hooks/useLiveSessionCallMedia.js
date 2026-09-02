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

  useEffect(() => {
    let isCancelled = false;
    if (useRealCameraLocal && !isCameraOff) {
      const acquireStream = async () => {
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          localVideoRef.current.play().catch(() => {});
        }
        if (mainVideoRef.current && mainViewMode === "camera") {
          mainVideoRef.current.srcObject = s;
          mainVideoRef.current.play().catch(() => {});
        }
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
      }
    };
  }, [useRealCameraLocal, isCameraOff, cameraFacing, mainViewMode, setUseRealCameraLocal]);

  return {
    localVideoRef,
    mainVideoRef,
    localStreamRef
  };
};
