import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, ExternalLink, HelpCircle } from "lucide-react";
import { SIGN_LANGUAGES } from "../data/mockData";
import { speakText, SpeechToSignListener } from "../utils/speech";
import { SIGN_DICTIONARY } from "../utils/handTracker";
import { LiveSessionRecorder } from "../utils/mediaRecorder";
import { RecordedVideoModal } from "./RecordedVideoModal";
import { AddSignModal } from "./AddSignModal";
import { FreeFingerController } from "./FreeFingerController";
import { TensorFlowEngineHUD } from "./TensorFlowEngineHUD";
import { CameraDiagnosticOverlay } from "./CameraDiagnosticOverlay";
import { SignLanguageAvatar } from "./SignLanguageAvatar";
import { VideoSourcePanel } from "./VideoSourcePanel";
import { isInsideIframe, getSafeCurrentUrl } from "../utils/environment";
import { useCameraHandTracking } from "../hooks/useCameraHandTracking";

import { LiveTranslateHeader } from "./live-translate/LiveTranslateHeader";
import { SignDictionaryPanel } from "./live-translate/SignDictionaryPanel";
import { LiveTranscriptBox } from "./live-translate/LiveTranscriptBox";
import { TextToSignInputPanel } from "./live-translate/TextToSignInputPanel";
import { CameraToolbar } from "./live-translate/CameraToolbar";
import { CameraFeedStage } from "./live-translate/CameraFeedStage";

export const LiveTranslateView = ({
  settings,
  onUpdateSettings,
  onOpenLiveCall,
  onOpenKeyboard,
  onOpenTutorial
}) => {
  const [translationMode, setTranslationMode] = useState("sign_to_text");
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showDiagnosticsOverlay, setShowDiagnosticsOverlay] = useState(false);
  const [isDarkFeedWarning] = useState(false);
  const [showAddSignModal, setShowAddSignModal] = useState(false);
  const [showFreeFingerStudio, setShowFreeFingerStudio] = useState(true);
  const [dictionaryMap, setDictionaryMap] = useState(SIGN_DICTIONARY);
  const [selectedTestSignKey, setSelectedTestSignKey] = useState("HELLO");
  const [isTfModelEnabled, setIsTfModelEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [activeRecordingResult, setActiveRecordingResult] = useState(null);
  const [showRecordedModal, setShowRecordedModal] = useState(false);
  const [recognizedSigns, setRecognizedSigns] = useState([
    { text: "HELLO", confidence: 0.98, timestamp: "10:00:12", hand: "right", type: "word" },
    { text: "I LOVE YOU", confidence: 0.99, timestamp: "10:00:15", hand: "right", type: "word" },
    { text: "PEACE", confidence: 0.96, timestamp: "10:00:19", hand: "both", type: "word" }
  ]);
  const [fullSentence, setFullSentence] = useState("Hello! I love you. Peace to everyone.");
  const [copied, setCopied] = useState(false);
  const [textInput, setTextInput] = useState("Thank you for helping me");
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [animatingGestureIndex, setAnimatingGestureIndex] = useState(0);
  const [isPlayingSignAnimation, setIsPlayingSignAnimation] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedSignCategory, setSelectedSignCategory] = useState("all");

  const isInIframe = isInsideIframe();
  const recorderRef = useRef(new LiveSessionRecorder());
  const speechListenerRef = useRef(null);

  const handleRecognizedDetection = useCallback((detection) => {
    const textOutput = detection.signMeaning.translatedText;
    setFullSentence((prev) => {
      if (!prev || prev.trim() === "") {
        return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
      }
      return `${prev.trim()} ${textOutput}`;
    });
    setRecognizedSigns((prev) => [
      ...prev.slice(-14),
      {
        text: `${detection.signMeaning?.symbol} ${detection.signMeaning?.translatedText.toUpperCase()}`,
        confidence: detection.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        hand: "right",
        type: "word"
      }
    ]);
  }, []);

  const tracking = useCameraHandTracking({
    settings,
    isCameraActive,
    setIsCameraActive,
    translationMode,
    isInIframe,
    onRecognizedSign: handleRecognizedDetection
  });

  const currentLanguage =
    SIGN_LANGUAGES.find((l) => l.code === settings.primarySignLanguage) || SIGN_LANGUAGES[0];

  const handleToggleAutoCenter = () => {
    const nextVal = !tracking.isAutoCentering;
    tracking.setIsAutoCentering(nextVal);
    tracking.handTrackerRef.current.setAutoCenter(nextVal);
    onUpdateSettings({ autoCenterCamera: nextVal });
  };

  const handleZoomIn = () => {
    tracking.setCameraZoom((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };
  const handleZoomOut = () => {
    tracking.setCameraZoom((prev) => Math.max(1, Number((prev - 0.25).toFixed(2))));
  };
  const handleSetZoom = (z) => {
    tracking.setCameraZoom(Math.max(1, Math.min(3.5, Number(z.toFixed(2)))));
  };
  const handleResetZoom = () => {
    tracking.setCameraZoom(1);
    tracking.setCameraPan({ x: 0, y: 0 });
    tracking.setCalibrationScale(1);
  };
  const handlePanNudge = (dx, dy, isCenter = false) => {
    if (isCenter) {
      tracking.setCameraPan({ x: 0, y: 0 });
      return;
    }
    tracking.setCameraPan((prev) => ({
      x: Math.max(-1, Math.min(1, Number((prev.x + dx).toFixed(2)))),
      y: Math.max(-1, Math.min(1, Number((prev.y + dy).toFixed(2))))
    }));
  };

  const handleTestSign = (signKey) => {
    setSelectedTestSignKey(signKey);
    tracking.handTrackerRef.current.forceSign(signKey);
  };
  const handleSaveSign = (key, newSign) => {
    const registeredKey = tracking.handTrackerRef.current.registerCustomSign(key, newSign);
    const updated = tracking.handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
    setSelectedTestSignKey(registeredKey);
    tracking.handTrackerRef.current.forceSign(registeredKey);
  };
  const handleDeleteCustomSign = (e, key) => {
    e.stopPropagation();
    tracking.handTrackerRef.current.deleteCustomSign(key);
    const updated = tracking.handTrackerRef.current.getDictionary();
    setDictionaryMap({ ...updated });
  };
  const handleCommitCurrentSign = (customSign) => {
    const sign = customSign || tracking.handTrackerRef.current.getCurrentSignMeaning();
    if (!sign) return;
    const textOutput = sign.translatedText;
    setFullSentence((prev) => {
      if (!prev || prev.trim() === "") {
        return textOutput.charAt(0).toUpperCase() + textOutput.slice(1);
      }
      return `${prev.trim()} ${textOutput}`;
    });
    setRecognizedSigns((prev) => [
      ...prev.slice(-14),
      {
        text: `${sign.symbol} ${sign.translatedText.toUpperCase()}`,
        confidence: sign.confidence || 0.98,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        hand: "right",
        type: "word"
      }
    ]);
    speakText(textOutput, settings.speechVoiceRate, settings.speechVoicePitch);
  };

  const handleToggleRecording = async () => {
    const recorder = recorderRef.current;
    const canvas = tracking.canvasRef.current;
    if (isRecording) {
      const result = await recorder.stopRecording();
      setIsRecording(false);
      if (result) {
        setActiveRecordingResult(result);
        setShowRecordedModal(true);
      }
    } else {
      if (!canvas) return;
      const videoEl = tracking.useRealWebcam ? tracking.videoRef.current : null;
      const started = await recorder.startRecording(canvas, videoEl, tracking.mediaStreamRef.current);
      if (started) {
        setIsRecording(true);
      }
    }
  };

  useEffect(() => {
    speechListenerRef.current = new SpeechToSignListener();
    return () => {
      speechListenerRef.current?.stop();
    };
  }, []);

  const handleToggleMic = () => {
    if (!speechListenerRef.current?.isSupported()) {
      alert("Speech recognition is not supported in this browser. You can type text directly in the box.");
      return;
    }
    if (isListeningMic) {
      speechListenerRef.current.stop();
      setIsListeningMic(false);
    } else {
      speechListenerRef.current.start(
        (transcript) => {
          setTextInput(transcript);
        },
        (err) => {
          console.warn(err);
          setIsListeningMic(false);
        }
      );
      setIsListeningMic(true);
    }
  };

  const handleTrainSample = async (label) => {
    return tracking.handTrackerRef.current.trainCurrentPoseAsSample(label);
  };
  const handleSwitchBackend = async (backend) => {
    await tracking.handTrackerRef.current.setTensorFlowBackend(backend);
  };
  const handleToggleTfModel = (enabled) => {
    setIsTfModelEnabled(enabled);
    tracking.handTrackerRef.current.setUseTensorFlowClassifier(enabled);
  };
  const handleSpeakTranscript = () => {
    const textToSpeak = fullSentence || recognizedSigns.map((s) => s.text).join(" ");
    speakText(textToSpeak, settings.speechVoiceRate, settings.speechVoicePitch);
  };
  const handleCopy = () => {
    const textToCopy = fullSentence || recognizedSigns.map((s) => s.text).join(" ");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedWords = textInput.toUpperCase().split(/\s+/).filter(Boolean);
  const currentAnimatedWord = parsedWords[animatingGestureIndex % Math.max(1, parsedWords.length)] || "READY";

  useEffect(() => {
    if (!isPlayingSignAnimation || parsedWords.length === 0) return;
    const interval = setInterval(() => {
      setAnimatingGestureIndex((prev) => (prev + 1) % parsedWords.length);
    }, 2000 / animationSpeed);
    return () => clearInterval(interval);
  }, [isPlayingSignAnimation, parsedWords.length, animationSpeed]);

  const dictionaryList = Object.entries(dictionaryMap).map(([key, item]) => ({
    key,
    ...item
  }));
  const filteredDictionary =
    selectedSignCategory === "all"
      ? dictionaryList
      : dictionaryList.filter((d) => d.category === selectedSignCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <LiveTranslateHeader
        currentLanguage={currentLanguage}
        totalRecognizedSigns={dictionaryList.length}
        onOpenAddSignModal={() => setShowAddSignModal(true)}
        translationMode={translationMode}
        onChangeTranslationMode={setTranslationMode}
      />

      {translationMode === "sign_to_text" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <VideoSourcePanel
              inputMode={tracking.inputSourceMode}
              onSelectMode={tracking.handleSelectInputMode}
              onUploadVideo={tracking.handleUploadVideo}
              onSelectDemoClip={tracking.handleSelectDemoClip}
              activeDemoId={tracking.activeDemoId}
              uploadedFileName={tracking.uploadedFileName}
              isPlayingVideo={tracking.isPlayingUploadedVideo}
              onTogglePlayPause={tracking.handleTogglePlayPauseUploadedVideo}
              onRestartVideo={tracking.handleRestartUploadedVideo}
              playbackRate={tracking.videoPlaybackRate}
              onChangePlaybackRate={tracking.handleChangePlaybackRate}
              onOpenDiagnostics={() => setShowDiagnosticsOverlay(true)}
            />

            {isInIframe && tracking.inputSourceMode === "webcam" && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs shadow-md animate-in fade-in">
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs leading-tight">
                    Running inside preview frame: Browser security may restrict camera prompts in iframes.
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={getSafeCurrentUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    onClick={() => setShowDiagnosticsOverlay(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 transition-colors border border-slate-700 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Webcam Guide</span>
                  </button>
                </div>
              </div>
            )}

            <CameraFeedStage
              isCameraActive={isCameraActive}
              setIsCameraActive={setIsCameraActive}
              tracking={tracking}
              isInIframe={isInIframe}
              settings={settings}
              isRecording={isRecording}
              recorder={recorderRef.current}
              onCommitSign={handleCommitCurrentSign}
              onOpenDiagnostics={() => setShowDiagnosticsOverlay(true)}
              onToggleAutoCenter={handleToggleAutoCenter}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onSetZoom={handleSetZoom}
              onResetZoom={handleResetZoom}
              onPanNudge={handlePanNudge}
            />

            <CameraToolbar
              isCameraActive={isCameraActive}
              onToggleCameraActive={() => setIsCameraActive(!isCameraActive)}
              useRealWebcam={tracking.useRealWebcam}
              cameraStreamStatus={tracking.cameraStreamStatus}
              onSwitchInputMode={() => {
                if (!tracking.useRealWebcam) {
                  tracking.handleSelectInputMode("webcam");
                } else {
                  tracking.handleSelectInputMode("simulator");
                }
              }}
              onRetryCamera={tracking.handleRetryCamera}
              showMesh={tracking.showMesh}
              onToggleMesh={() => tracking.setShowMesh(!tracking.showMesh)}
              autoSpeakOnCommit={tracking.autoSpeakOnCommit}
              onToggleAutoSpeak={() => tracking.setAutoSpeakOnCommit(!tracking.autoSpeakOnCommit)}
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
              recorder={recorderRef.current}
              showDiagnosticsOverlay={showDiagnosticsOverlay}
              onOpenDiagnostics={() => setShowDiagnosticsOverlay(true)}
              isDarkFeedWarning={isDarkFeedWarning}
              activeStreamResolution={tracking.activeStreamResolution}
              isAutoCentering={tracking.isAutoCentering}
              onToggleAutoCenter={handleToggleAutoCenter}
              cameraZoom={tracking.cameraZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onOpenZoomMenu={() => tracking.setShowZoomMenu(!tracking.showZoomMenu)}
              showAlignmentGuide={tracking.showAlignmentGuide}
              onToggleAlignmentGuide={() => tracking.setShowAlignmentGuide(!tracking.showAlignmentGuide)}
              showFreeFingerStudio={showFreeFingerStudio}
              onToggleFreeFingerStudio={() => setShowFreeFingerStudio(!showFreeFingerStudio)}
              onOpenKeyboard={onOpenKeyboard}
              onOpenTutorial={onOpenTutorial}
            />

            {showFreeFingerStudio && (
              <FreeFingerController
                handTracker={tracking.handTrackerRef.current}
                currentPose={null}
                onPoseChange={(p) => {
                  tracking.handTrackerRef.current.setFreePose(p);
                }}
              />
            )}

            <TensorFlowEngineHUD
              isEnabled={isTfModelEnabled}
              onToggleEnabled={handleToggleTfModel}
              onTrainSample={handleTrainSample}
              onSwitchBackend={handleSwitchBackend}
            />

            <SignDictionaryPanel
              dictionaryList={dictionaryList}
              filteredDictionary={filteredDictionary}
              selectedSignCategory={selectedSignCategory}
              onSelectCategory={setSelectedSignCategory}
              selectedTestSignKey={selectedTestSignKey}
              onTestSign={handleTestSign}
              onOpenAddSignModal={() => setShowAddSignModal(true)}
              onDeleteCustomSign={handleDeleteCustomSign}
            />
          </div>

          <LiveTranscriptBox
            fullSentence={fullSentence}
            onChangeFullSentence={setFullSentence}
            onClearFullSentence={() => setFullSentence("")}
            onSpeakTranscript={handleSpeakTranscript}
            onCopyTranscript={handleCopy}
            copied={copied}
            highContrastCaptions={settings.highContrastCaptions}
            recognizedSigns={recognizedSigns}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <TextToSignInputPanel
            textInput={textInput}
            onChangeTextInput={setTextInput}
            isListeningMic={isListeningMic}
            onToggleMic={handleToggleMic}
            parsedWords={parsedWords}
            animatingGestureIndex={animatingGestureIndex}
            onSelectWordIndex={setAnimatingGestureIndex}
          />

          <div className="lg:col-span-7 space-y-4">
            <SignLanguageAvatar
              currentWord={currentAnimatedWord}
              fullSentence={textInput}
              wordIndex={animatingGestureIndex}
              totalWords={parsedWords.length}
              isPlaying={isPlayingSignAnimation}
              onTogglePlay={() => setIsPlayingSignAnimation(!isPlayingSignAnimation)}
              playbackSpeed={animationSpeed}
              onChangeSpeed={(spd) => setAnimationSpeed(spd)}
              onNextWord={() =>
                setAnimatingGestureIndex((prev) => (prev + 1) % Math.max(1, parsedWords.length))
              }
              onPrevWord={() =>
                setAnimatingGestureIndex(
                  (prev) => (prev - 1 + Math.max(1, parsedWords.length)) % Math.max(1, parsedWords.length)
                )
              }
              onSelectWordIndex={(idx) => setAnimatingGestureIndex(idx)}
              primarySignLanguage={currentLanguage.code}
              speechVoiceRate={settings.speechVoiceRate}
              speechVoicePitch={settings.speechVoicePitch}
            />
          </div>
        </div>
      )}

      {showAddSignModal && (
        <AddSignModal
          onClose={() => setShowAddSignModal(false)}
          onSaveSign={handleSaveSign}
        />
      )}

      {showRecordedModal && activeRecordingResult && (
        <RecordedVideoModal
          recording={activeRecordingResult}
          onClose={() => setShowRecordedModal(false)}
        />
      )}

      <CameraDiagnosticOverlay
        isOpen={showDiagnosticsOverlay}
        onClose={() => setShowDiagnosticsOverlay(false)}
        permissionStatus={tracking.hardwarePermissionStatus}
        streamStatus={tracking.cameraStreamStatus}
        activeResolution={tracking.activeStreamResolution}
        videoElement={tracking.videoRef.current}
        mediaStream={tracking.mediaStreamRef.current}
        cameraError={tracking.cameraError}
        facingMode={settings.cameraFacing}
        useRealWebcam={tracking.useRealWebcam}
        onRetryCamera={tracking.handleRetryCamera}
        onSwitchFacingMode={() => {
          onUpdateSettings({ cameraFacing: settings.cameraFacing === "user" ? "environment" : "user" });
        }}
        onToggleWebcamMode={() => {
          tracking.setUseRealWebcam(!tracking.useRealWebcam);
        }}
      />
    </div>
  );
};
