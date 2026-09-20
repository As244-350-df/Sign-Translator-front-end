import { useEffect, useRef, useState, useCallback } from "react";

export const useLiveSessionCallMedia = ({
  useRealCameraLocal,
  isCameraOff,
  isMuted = false,
  cameraFacing,
  mainViewMode,
  setUseRealCameraLocal
}) => {
  const localVideoRef = useRef(null);
  const mainVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  // Synchronize microphone hardware mute state
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Synchronize webcam hardware video track state
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff]);

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

    if (useRealCameraLocal) {
      const acquireStream = async () => {
        // If stream is already active with live tracks, simply re-bind
        if (
          localStreamRef.current &&
          localStreamRef.current.getTracks().some((t) => t.readyState === "live")
        ) {
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
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch {
          try {
            s = await navigator.mediaDevices.getUserMedia({
              video: cameraFacing
                ? { facingMode: { ideal: cameraFacing }, frameRate: { ideal: 30, max: 60 } }
                : { frameRate: { ideal: 30, max: 60 } },
              audio: true
            });
          } catch {
            try {
              s = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
              });
            } catch (err) {
              console.warn("Local webcam acquisition failed:", err);
              if (!isCancelled) setUseRealCameraLocal(false);
              return;
            }
          }
        }

        if (isCancelled || !s) {
          if (s) s.getTracks().forEach((t) => t.stop());
          return;
        }

        // Apply initial mute and camera off states
        s.getAudioTracks().forEach((t) => {
          t.enabled = !isMuted;
        });
        s.getVideoTracks().forEach((t) => {
          t.enabled = !isCameraOff;
        });

        localStreamRef.current = s;
        setLocalStream(s);
        attachStreamToVideos();
      };

      acquireStream();
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    }

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, [useRealCameraLocal, cameraFacing, setUseRealCameraLocal, attachStreamToVideos]);

  // Dynamically apply adaptive video resolution & framerate constraints to live camera track
  const applyStreamConstraints = useCallback(async (tierConfig) => {
    if (!localStreamRef.current || !tierConfig) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.applyConstraints === "function") {
      try {
        await videoTrack.applyConstraints({
          width: { ideal: tierConfig.width },
          height: { ideal: tierConfig.height },
          frameRate: { ideal: tierConfig.maxFps || 30 }
        });
        console.log(`[MediaConstraints] Applied adaptive stream constraints: ${tierConfig.width}x${tierConfig.height} @ ${tierConfig.maxFps}fps`);
      } catch (err) {
        console.warn("[MediaConstraints] Adaptive applyConstraints notice:", err?.message);
      }
    }
  }, []);

  return {
    localVideoRef,
    mainVideoRef,
    localStreamRef,
    localStream,
    attachStreamToVideos,
    applyStreamConstraints
  };
};

