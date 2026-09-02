import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { Eye, BookOpen } from "lucide-react";
import { speakText } from "../utils/speech";
import { getAvatarPoseForWord, getAvatarTheme } from "./avatar/avatarPoseMap";
import { AvatarSVGRenderer } from "./avatar/AvatarSVGRenderer";
import { AvatarHeaderControls } from "./avatar/AvatarHeaderControls";
import { AvatarSignInfoDrawer } from "./avatar/AvatarSignInfoDrawer";
import { AvatarPlaybackControls } from "./avatar/AvatarPlaybackControls";

const SignLanguageAvatar = ({
  currentWord,
  fullSentence,
  wordIndex,
  totalWords,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onNextWord,
  onPrevWord,
  onSelectWordIndex,
  primarySignLanguage = "ASL",
  speechVoiceRate = 1,
  speechVoicePitch = 1,
  className = ""
}) => {
  const [avatarModel, setAvatarModel] = useState("maya");
  const [cameraAngle, setCameraAngle] = useState("front");
  const [showSkeletalOverlay, setShowSkeletalOverlay] = useState(false);
  const [showSignInfoDrawer, setShowSignInfoDrawer] = useState(true);
  const [isAudioSyncEnabled, setIsAudioSyncEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const torsoRef = useRef(null);

  useEffect(() => {
    let animId;
    let t = 0;
    const loop = () => {
      t += 0.035 * playbackSpeed;
      if (torsoRef.current) {
        torsoRef.current.setAttribute("transform", `translate(0, ${(Math.sin(t) * 2.5).toFixed(2)})`);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [playbackSpeed]);

  useEffect(() => {
    if (isAudioSyncEnabled && isPlaying && currentWord && currentWord !== "READY") {
      speakText(currentWord.toLowerCase(), undefined, speechVoiceRate * playbackSpeed, speechVoicePitch);
    }
  }, [currentWord, isAudioSyncEnabled, isPlaying, speechVoiceRate, speechVoicePitch, playbackSpeed]);

  const activePose = useMemo(() => {
    return getAvatarPoseForWord(currentWord, false);
  }, [currentWord]);

  const avatarTheme = useMemo(() => {
    return getAvatarTheme(avatarModel);
  }, [avatarModel]);

  const cameraTransform = useMemo(() => {
    if (cameraAngle === "hands_zoom") {
      return "scale(1.4) translateY(-30px)";
    }
    if (cameraAngle === "angled") {
      return "perspective(600px) rotateY(-8deg) scale(1.05)";
    }
    return "scale(1.0)";
  }, [cameraAngle]);

  const parsedWords = (fullSentence || "").toUpperCase().split(/\s+/).filter(Boolean);

  const handleCycleCameraAngle = () => {
    const next = cameraAngle === "front" ? "angled" : cameraAngle === "angled" ? "hands_zoom" : "front";
    setCameraAngle(next);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-950 rounded-3xl overflow-hidden border ${avatarTheme.borderColor} shadow-2xl transition-all duration-300 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "w-full aspect-4/3"
      } ${className}`}
    >
      <AvatarHeaderControls
        primarySignLanguage={primarySignLanguage}
        avatarTheme={avatarTheme}
        avatarModel={avatarModel}
        onSelectAvatarModel={setAvatarModel}
        cameraAngle={cameraAngle}
        onCycleCameraAngle={handleCycleCameraAngle}
        showSkeletalOverlay={showSkeletalOverlay}
        onToggleSkeletalOverlay={() => setShowSkeletalOverlay(!showSkeletalOverlay)}
        isAudioSyncEnabled={isAudioSyncEnabled}
        onToggleAudioSync={() => setIsAudioSyncEnabled(!isAudioSyncEnabled)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Main Avatar Stage & 2.5D Animated SVG Engine */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${avatarTheme.auraGradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf815_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Ambient Halo behind Avatar Head & Hands */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
          style={{
            background: avatarTheme.jointGlow,
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)"
          }}
        />

        {/* SVG ARTICULATED AVATAR CANVAS */}
        <div
          className="relative w-full h-full max-w-lg max-h-full flex items-center justify-center transition-transform duration-500"
          style={{ transform: cameraTransform }}
        >
          <AvatarSVGRenderer
            ref={torsoRef}
            activePose={activePose}
            avatarModel={avatarModel}
            avatarTheme={avatarTheme}
            showSkeletalOverlay={showSkeletalOverlay}
          />
        </div>

        {/* Live Sign Badge Overlay (Upper Center) */}
        <div className="absolute top-14 inset-x-4 flex flex-col items-center pointer-events-none z-10">
          <motion.div
            key={currentWord}
            initial={{ scale: 0.9, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-indigo-500/40 shadow-xl"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-sm sm:text-base font-black text-white tracking-wide">
              {activePose.gloss}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30">
              #{wordIndex + 1}/{Math.max(1, totalWords)}
            </span>
          </motion.div>
        </div>

        {/* Non-Manual Linguistic Marker Bubble */}
        <div className="absolute bottom-20 left-4 hidden sm:flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-[11px] text-slate-300 max-w-xs shadow-lg z-10">
          <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="line-clamp-1">
            <span className="font-bold text-white">Expression:</span> {activePose.facialDescription}
          </div>
        </div>

        {/* Interactive Sign Info Collapsible Toggle */}
        <button
          onClick={() => setShowSignInfoDrawer(!showSignInfoDrawer)}
          className="absolute bottom-20 right-4 p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-indigo-400 hover:text-white transition-colors cursor-pointer shadow-lg z-10 flex items-center space-x-1 text-xs font-semibold"
          title="Toggle Sign Linguistic Breakdown Drawer"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Details</span>
        </button>
      </div>

      <AvatarSignInfoDrawer isOpen={showSignInfoDrawer} activePose={activePose} />

      <AvatarPlaybackControls
        parsedWords={parsedWords}
        wordIndex={wordIndex}
        totalWords={totalWords}
        onSelectWordIndex={onSelectWordIndex}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onPrevWord={onPrevWord}
        onNextWord={onNextWord}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={onChangeSpeed}
      />
    </div>
  );
};

export { SignLanguageAvatar };
