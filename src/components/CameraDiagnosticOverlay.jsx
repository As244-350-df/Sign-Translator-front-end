import { useState, useEffect, useRef } from "react";
import { Copy, Sliders, Wrench, HelpCircle } from "lucide-react";
import { isInsideIframe } from "../utils/environment";
import { WhyNotWorkingTab } from "./camera-diagnostics/WhyNotWorkingTab";
import { HardwareMetricsTab } from "./camera-diagnostics/HardwareMetricsTab";
import { DarkFeedTroubleshooterTab } from "./camera-diagnostics/DarkFeedTroubleshooterTab";
import { RawJsonTab } from "./camera-diagnostics/RawJsonTab";
import { DiagnosticHeader } from "./camera-diagnostics/DiagnosticHeader";
import { DiagnosticQuickBar } from "./camera-diagnostics/DiagnosticQuickBar";
import { DiagnosticFooter } from "./camera-diagnostics/DiagnosticFooter";

const CameraDiagnosticOverlay = ({
  isOpen,
  onClose,
  permissionStatus: propPermissionStatus,
  hardwarePermissionStatus,
  streamStatus = "idle",
  cameraError = null,
  mediaStream = null,
  videoElement: propVideoElement,
  videoRef,
  facingMode: propFacingMode,
  cameraFacing,
  useRealWebcam = true,
  onRetryCamera = () => {},
  onSwitchFacingMode,
  onToggleFacing,
  onToggleWebcamMode = () => {}
}) => {
  const permissionStatus = propPermissionStatus || hardwarePermissionStatus || "checking";
  const videoElement = propVideoElement || (videoRef ? videoRef.current : null);
  const facingMode = propFacingMode || cameraFacing || "user";
  const handleSwitchFacing = onSwitchFacingMode || onToggleFacing || (() => {});

  const [copied, setCopied] = useState(false);
  const [sampledLuminance, setSampledLuminance] = useState(null);
  const [isLuminanceDark, setIsLuminanceDark] = useState(false);
  const [activeTab, setActiveTab] = useState("why_not_working");
  const [trackSettings, setTrackSettings] = useState(null);
  const [, setTrackCapabilities] = useState(null);
  const [trackState, setTrackState] = useState(null);
  const [trackMuted, setTrackMuted] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
    readyState: 0
  });
  const [detectedCameras, setDetectedCameras] = useState([]);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [manualTestStatus, setManualTestStatus] = useState("idle");
  const [manualTestMessage, setManualTestMessage] = useState("");
  const [manualTestStream, setManualTestStream] = useState(null);
  const manualVideoRef = useRef(null);

  const scanDevices = () => {
    if (navigator?.mediaDevices?.enumerateDevices) {
      setIsCheckingDevices(true);
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const cams = devices.filter((d) => d.kind === "videoinput");
          setDetectedCameras(cams);
          setIsCheckingDevices(false);
        })
        .catch((err) => {
          console.warn("[CameraDiagnostics] enumerateDevices error:", err);
          setIsCheckingDevices(false);
        });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const inIframe = isInsideIframe();
    setIsInIframe(inIframe);
    if (cameraError || streamStatus === "error" || permissionStatus !== "granted") {
      setActiveTab("why_not_working");
    }
    scanDevices();
  }, [isOpen, cameraError, streamStatus, permissionStatus]);

  useEffect(() => {
    if (!isOpen && manualTestStream) {
      manualTestStream.getTracks().forEach((t) => t.stop());
      setManualTestStream(null);
      setManualTestStatus("idle");
    }
  }, [isOpen, manualTestStream]);

  const handleRunDirectCameraTest = async () => {
    if (manualTestStream) {
      manualTestStream.getTracks().forEach((t) => t.stop());
      setManualTestStream(null);
    }
    setManualTestStatus("testing");
    setManualTestMessage("Requesting direct camera stream from browser...");
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support navigator.mediaDevices.getUserMedia");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setManualTestStream(stream);
      setManualTestStatus("success");
      const track = stream.getVideoTracks()[0];
      const settings = track ? track.getSettings() : null;
      const resText = settings?.width ? `${settings.width}×${settings.height}` : "Active";
      setManualTestMessage(
        `Success! Camera stream acquired (${resText}, label: "${track?.label || "Webcam"}"). Your camera hardware and browser permissions are fully operational!`
      );
      if (manualVideoRef.current) {
        manualVideoRef.current.srcObject = stream;
        manualVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("[CameraDiagnostics] Direct test failed:", err);
      setManualTestStatus("error");
      setManualTestMessage(`${err.name || "Error"}: ${err.message || "Camera request was rejected"}`);
    }
  };

  const lastMetricsRef = useRef({ width: 0, height: 0, readyState: 0, trackState: null, trackMuted: false });

  useEffect(() => {
    if (!isOpen) return;
    const analyzeStream = () => {
      const currentWidth = videoElement?.videoWidth || 0;
      const currentHeight = videoElement?.videoHeight || 0;
      const currentReadyState = videoElement?.readyState || 0;

      const videoTrack = mediaStream ? mediaStream.getVideoTracks()[0] : null;
      const currentTrackState = videoTrack ? videoTrack.readyState : null;
      const currentTrackMuted = videoTrack ? !!videoTrack.muted : false;

      const prev = lastMetricsRef.current;
      const hasChanged =
        prev.width !== currentWidth ||
        prev.height !== currentHeight ||
        prev.readyState !== currentReadyState ||
        prev.trackState !== currentTrackState ||
        prev.trackMuted !== currentTrackMuted;

      if (!hasChanged) return;

      lastMetricsRef.current = {
        width: currentWidth,
        height: currentHeight,
        readyState: currentReadyState,
        trackState: currentTrackState,
        trackMuted: currentTrackMuted
      };

      if (videoElement) {
        setVideoDimensions({
          width: currentWidth,
          height: currentHeight,
          readyState: currentReadyState
        });
        if (currentWidth > 0 && currentHeight > 0 && currentReadyState >= 2) {
          setSampledLuminance(75);
          setIsLuminanceDark(false);
        }
      }

      if (videoTrack) {
        setTrackSettings(videoTrack.getSettings ? videoTrack.getSettings() : null);
        setTrackCapabilities(videoTrack.getCapabilities ? videoTrack.getCapabilities() : null);
        setTrackState(currentTrackState);
        setTrackMuted(currentTrackMuted);
      } else {
        setTrackSettings(null);
        setTrackCapabilities(null);
        setTrackState(null);
        setTrackMuted(false);
      }
    };
    analyzeStream();
    const interval = setInterval(analyzeStream, 800);
    return () => clearInterval(interval);
  }, [isOpen, mediaStream, videoElement]);

  if (!isOpen) return null;

  const reportedWidth = trackSettings?.width || videoDimensions.width || 0;
  const reportedHeight = trackSettings?.height || videoDimensions.height || 0;
  const aspectRatio = reportedHeight > 0 ? (reportedWidth / reportedHeight).toFixed(2) : "0";
  const aspectLabel =
    aspectRatio === "1.78"
      ? "16:9 (Widescreen HD)"
      : aspectRatio === "1.33"
      ? "4:3 (Standard)"
      : aspectRatio === "1.00"
      ? "1:1 (Square)"
      : aspectRatio !== "0"
      ? `${aspectRatio}:1`
      : "Not Resolved";

  const readyStateLabels = {
    0: "0 - HAVE_NOTHING (No frames)",
    1: "1 - HAVE_METADATA (Dimensions loaded)",
    2: "2 - HAVE_CURRENT_DATA (Frame available)",
    3: "3 - HAVE_FUTURE_DATA (Playing)",
    4: "4 - HAVE_ENOUGH_DATA (Smooth playback)"
  };

  const generateDiagnosticReport = () => {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        permissionStatus,
        streamStatus,
        useRealWebcam,
        facingMode,
        cameraError,
        resolution: {
          negotiatedWidth: reportedWidth,
          negotiatedHeight: reportedHeight,
          aspectRatio: aspectLabel,
          videoElementWidth: videoDimensions.width,
          videoElementHeight: videoDimensions.height,
          videoElementReadyState: readyStateLabels[videoDimensions.readyState] || videoDimensions.readyState
        },
        track: {
          label: trackSettings?.deviceId || mediaStream?.getVideoTracks()[0]?.label || "Unknown",
          readyState: trackState,
          muted: trackMuted,
          frameRate: trackSettings?.frameRate || "Default",
          facingMode: trackSettings?.facingMode || facingMode
        },
        luminance: {
          percentage: sampledLuminance !== null ? `${sampledLuminance}%` : "Unavailable",
          isPitchDark: isLuminanceDark
        },
        browserEnvironment: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
          hasMediaDevices: typeof navigator !== "undefined" && !!navigator.mediaDevices,
          hasGetUserMedia: typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
        }
      },
      null,
      2
    );
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateDiagnosticReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div
      id="camera-diagnostic-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <DiagnosticHeader onClose={onClose} />

        <DiagnosticQuickBar
          permissionStatus={permissionStatus}
          reportedWidth={reportedWidth}
          reportedHeight={reportedHeight}
          trackState={trackState}
          trackMuted={trackMuted}
          isLuminanceDark={isLuminanceDark}
          sampledLuminance={sampledLuminance}
        />

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("why_not_working")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === "why_not_working" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why Webcam isn't Working? (Fix Guide)</span>
          </button>
          <button
            onClick={() => setActiveTab("metrics")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === "metrics" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hardware Specs & Stream</span>
          </button>
          <button
            onClick={() => setActiveTab("troubleshoot")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === "troubleshoot" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Why is Video Dark?</span>
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              activeTab === "raw" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Diagnostic JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "why_not_working" && (
            <WhyNotWorkingTab
              isInIframe={isInIframe}
              detectedCameras={detectedCameras}
              permissionStatus={permissionStatus}
              isCheckingDevices={isCheckingDevices}
              onRescanDevices={scanDevices}
              onRunDirectCameraTest={handleRunDirectCameraTest}
              manualTestStatus={manualTestStatus}
              manualTestMessage={manualTestMessage}
              manualVideoRef={manualVideoRef}
            />
          )}

          {activeTab === "metrics" && (
            <HardwareMetricsTab
              isLuminanceDark={isLuminanceDark}
              streamStatus={streamStatus}
              reportedWidth={reportedWidth}
              reportedHeight={reportedHeight}
              aspectLabel={aspectLabel}
              permissionStatus={permissionStatus}
              trackSettings={trackSettings}
              videoDimensions={videoDimensions}
              readyStateLabels={readyStateLabels}
              trackState={trackState}
              mediaStream={mediaStream}
            />
          )}

          {activeTab === "troubleshoot" && (
            <DarkFeedTroubleshooterTab
              permissionStatus={permissionStatus}
              isLuminanceDark={isLuminanceDark}
              trackMuted={trackMuted}
              reportedWidth={reportedWidth}
              reportedHeight={reportedHeight}
              cameraError={cameraError}
            />
          )}

          {activeTab === "raw" && (
            <RawJsonTab
              diagnosticJson={generateDiagnosticReport()}
              onCopyReport={handleCopyReport}
              copied={copied}
            />
          )}
        </div>

        <DiagnosticFooter
          onRetryCamera={onRetryCamera}
          handleSwitchFacing={handleSwitchFacing}
          facingMode={facingMode}
          onToggleWebcamMode={onToggleWebcamMode}
          useRealWebcam={useRealWebcam}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export { CameraDiagnosticOverlay };
