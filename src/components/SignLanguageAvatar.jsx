import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  User,
  Activity,
  Sliders,
  BookOpen,
  Check
} from "lucide-react";
import { getFingerProfileForSign } from "../utils/fingerMapping";
import { speakText } from "../utils/speech";
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
  const [isBlinking, setIsBlinking] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const containerRef = useRef(null);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2e3);
    return () => clearInterval(blinkInterval);
  }, []);
  useEffect(() => {
    let animId;
    let t = 0;
    const loop = () => {
      t += 0.035 * playbackSpeed;
      setBreathingPhase(Math.sin(t));
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [playbackSpeed]);
  useEffect(() => {
    if (isAudioSyncEnabled && isPlaying && currentWord && currentWord !== "READY") {
      speakText(currentWord.toLowerCase(), void 0, speechVoiceRate * playbackSpeed, speechVoicePitch);
    }
  }, [currentWord, isAudioSyncEnabled, isPlaying, speechVoiceRate, speechVoicePitch, playbackSpeed]);
  const activePose = useMemo(() => {
    const rawWord = currentWord.toUpperCase().trim();
    const cleanWord = rawWord.replace(/[^A-Z0-9]/g, "");
    if (cleanWord === "HELLO" || cleanWord === "HI") {
      return {
        head: { x: 200, y: 112, tiltDeg: 3 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 100, y: 290 },
          wrist: { x: 95, y: 350 },
          rotationDeg: 10,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 310, y: 190 },
          wrist: { x: 285, y: 125 },
          rotationDeg: -22,
          scale: 1.1,
          isActive: true
        },
        rightFingers: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
        gloss: "HELLO (Salute Wave)",
        category: "Greetings",
        facialDescription: "Friendly warm smile with slightly raised welcoming eyebrows",
        movementDescription: "Open flat B-palm extends outward smoothly from right temple/brow",
        handshapeDescription: "Open B-Handshape (all 5 fingers extended flat together)"
      };
    }
    if (cleanWord === "THANK" || cleanWord === "THANKS" || cleanWord === "THANKYOU") {
      return {
        head: { x: 200, y: 115, tiltDeg: 0 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 105, y: 295 },
          wrist: { x: 100, y: 355 },
          rotationDeg: 5,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 275, y: 230 },
          wrist: { x: 215, y: 185 },
          rotationDeg: -5,
          scale: 1.15,
          isActive: true
        },
        rightFingers: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 },
        gloss: "THANK-YOU",
        category: "Courtesy",
        facialDescription: "Warm appreciative smile with direct eye gaze and subtle nod",
        movementDescription: "Flat fingertips touch chin and sweep outward toward the recipient",
        handshapeDescription: "Flat open palm facing inward, sweeping gently forward-down"
      };
    }
    if (cleanWord === "PLEASE") {
      return {
        head: { x: 200, y: 115, tiltDeg: 2 },
        eyebrows: "empathetic",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 105, y: 295 },
          wrist: { x: 100, y: 355 },
          rotationDeg: 5,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 280, y: 250 },
          wrist: { x: 200, y: 230 },
          rotationDeg: 12,
          scale: 1.1,
          isActive: true
        },
        rightFingers: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
        gloss: "PLEASE (Circular Chest Rub)",
        category: "Courtesy",
        facialDescription: "Polite, gentle expression with slight head tilt",
        movementDescription: "Flat open palm rubs in a smooth clockwise circle over center of chest",
        handshapeDescription: "Open flat B-hand placed flat against breastbone"
      };
    }
    if (cleanWord === "HELP") {
      return {
        head: { x: 200, y: 114, tiltDeg: -2 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "open_ah",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 125, y: 275 },
          wrist: { x: 180, y: 260 },
          rotationDeg: -10,
          scale: 1.05,
          isActive: true
        },
        rightArm: {
          elbow: { x: 275, y: 265 },
          wrist: { x: 195, y: 230 },
          rotationDeg: 15,
          scale: 1.1,
          isActive: true
        },
        leftFingers: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
        rightFingers: { thumb: 1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 },
        gloss: "HELP (Two-Handed Lift)",
        category: "Emergency / Action",
        facialDescription: "Attentive, earnest expression with eyes open wide",
        movementDescription: "A-fist rests atop open flat base palm; both hands lift upward together",
        handshapeDescription: "Right: A-Fist with thumb up; Left: Flat supporting palm"
      };
    }
    if (cleanWord === "YES") {
      return {
        head: { x: 200, y: 116, tiltDeg: 0 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 100, y: 290 },
          wrist: { x: 95, y: 350 },
          rotationDeg: 0,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 285, y: 240 },
          wrist: { x: 260, y: 180 },
          rotationDeg: -10,
          scale: 1.1,
          isActive: true
        },
        rightFingers: { thumb: 0.5, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 },
        gloss: "YES (Nodding S-Fist)",
        category: "Affirmation",
        facialDescription: "Head nods downward in synchronous agreement with hand motion",
        movementDescription: "S-fist nods up and down at the wrist twice like a head nodding",
        handshapeDescription: "S-Handshape (closed fist with thumb wrapped across front)"
      };
    }
    if (cleanWord === "NO") {
      return {
        head: { x: 200, y: 113, tiltDeg: 3 },
        eyebrows: "furrowed",
        eyes: isBlinking ? "blink" : "open",
        mouth: "fist_firm",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 100, y: 290 },
          wrist: { x: 95, y: 350 },
          rotationDeg: 0,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 280, y: 235 },
          wrist: { x: 240, y: 190 },
          rotationDeg: -12,
          scale: 1.1,
          isActive: true
        },
        rightFingers: { thumb: 0.6, index: 0.4, middle: 0.4, ring: 0.1, pinky: 0.1 },
        gloss: "NO (Snap Beak)",
        category: "Negation",
        facialDescription: "Subtle head shake with firm set lips and slightly furrowed brows",
        movementDescription: "Extended index and middle fingers snap down firmly onto the thumb",
        handshapeDescription: "Index & Middle snap shut against thumb pad twice"
      };
    }
    if (cleanWord === "LOVE" || cleanWord === "ILOVEYOU" || cleanWord === "ILY") {
      return {
        head: { x: 200, y: 114, tiltDeg: 4 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 100, y: 290 },
          wrist: { x: 95, y: 350 },
          rotationDeg: 0,
          scale: 0.9,
          isActive: false
        },
        rightArm: {
          elbow: { x: 290, y: 230 },
          wrist: { x: 255, y: 165 },
          rotationDeg: -15,
          scale: 1.2,
          isActive: true
        },
        rightFingers: { thumb: 1, index: 1, middle: 0.1, ring: 0.1, pinky: 1 },
        gloss: "I-LOVE-YOU (ILY Sign)",
        category: "Affection",
        facialDescription: "Radiant, gentle smile with warm direct eye contact",
        movementDescription: "Hand held upright at chest/shoulder height, pulsing gently forward",
        handshapeDescription: "ILY Handshape (Thumb, Index, Pinky extended; Middle & Ring folded)"
      };
    }
    if (cleanWord === "WHERE" || cleanWord === "WHY" || cleanWord === "WHAT") {
      return {
        head: { x: 200, y: 113, tiltDeg: 4 },
        eyebrows: "furrowed",
        eyes: isBlinking ? "blink" : "squint",
        mouth: "round_oh",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 115, y: 260 },
          wrist: { x: 145, y: 235 },
          rotationDeg: -20,
          scale: 1.05,
          isActive: true
        },
        rightArm: {
          elbow: { x: 285, y: 260 },
          wrist: { x: 255, y: 235 },
          rotationDeg: 20,
          scale: 1.05,
          isActive: true
        },
        leftFingers: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
        rightFingers: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
        gloss: `${cleanWord} (Wh-Question)`,
        category: "Question Non-Manual",
        facialDescription: "Furrowed eyebrows, squinted inquisitive eyes, and head tilt (WH-question marker)",
        movementDescription: "Both open palms face upward, swaying side to side in questioning motion",
        handshapeDescription: "Two flat open palms facing upward at chest height"
      };
    }
    if (cleanWord === "DOCTOR" || cleanWord === "HOSPITAL" || cleanWord === "NURSE") {
      return {
        head: { x: 200, y: 114, tiltDeg: -2 },
        eyebrows: "neutral",
        eyes: isBlinking ? "blink" : "open",
        mouth: "neutral",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 125, y: 275 },
          wrist: { x: 165, y: 245 },
          rotationDeg: -10,
          scale: 1.05,
          isActive: true
        },
        rightArm: {
          elbow: { x: 275, y: 260 },
          wrist: { x: 175, y: 230 },
          rotationDeg: 25,
          scale: 1.1,
          isActive: true
        },
        leftFingers: { thumb: 0.8, index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8 },
        rightFingers: { thumb: 0.5, index: 0.8, middle: 0.8, ring: 0.1, pinky: 0.1 },
        gloss: "DOCTOR (Pulse Check)",
        category: "Medical",
        facialDescription: "Attentive, professional and focused gaze towards wrists",
        movementDescription: "Curved right fingertips tap the radial pulse of the upturned left wrist twice",
        handshapeDescription: "Bent M-fingertips tapping inner wrist artery"
      };
    }
    if (cleanWord === "FRIEND" || cleanWord === "BUDDY") {
      return {
        head: { x: 200, y: 114, tiltDeg: 3 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 130, y: 265 },
          wrist: { x: 185, y: 225 },
          rotationDeg: -15,
          scale: 1.05,
          isActive: true
        },
        rightArm: {
          elbow: { x: 270, y: 265 },
          wrist: { x: 215, y: 225 },
          rotationDeg: 15,
          scale: 1.05,
          isActive: true
        },
        leftFingers: { thumb: 0.2, index: 0.6, middle: 0.1, ring: 0.1, pinky: 0.1 },
        rightFingers: { thumb: 0.2, index: 0.6, middle: 0.1, ring: 0.1, pinky: 0.1 },
        gloss: "FRIEND (Interlocking Hooks)",
        category: "Relationship",
        facialDescription: "Warm, affectionate smile and engaged eye gaze",
        movementDescription: "Index fingers of both hands hook together, then reverse and hook opposite",
        handshapeDescription: "Two hooked X-index fingers interlocking together"
      };
    }
    if (cleanWord === "PEACE") {
      return {
        head: { x: 200, y: 114, tiltDeg: 0 },
        eyebrows: "raised",
        eyes: isBlinking ? "blink" : "open",
        mouth: "smile",
        chest: { x: 200, y: 240 },
        leftArm: {
          elbow: { x: 120, y: 250 },
          wrist: { x: 145, y: 180 },
          rotationDeg: -20,
          scale: 1.1,
          isActive: true
        },
        rightArm: {
          elbow: { x: 280, y: 250 },
          wrist: { x: 255, y: 180 },
          rotationDeg: 20,
          scale: 1.1,
          isActive: true
        },
        leftFingers: { thumb: 0.2, index: 1, middle: 1, ring: 0.1, pinky: 0.1 },
        rightFingers: { thumb: 0.2, index: 1, middle: 1, ring: 0.1, pinky: 0.1 },
        gloss: "PEACE (V-Sign)",
        category: "Symbolic",
        facialDescription: "Serene, calm smile and gentle posture",
        movementDescription: "Both hands form V-handshapes (Index and Middle extended) held outward",
        handshapeDescription: "Two V-handshapes spread upright in harmonious balance"
      };
    }
    const profile = getFingerProfileForSign(cleanWord);
    const isSingleChar = cleanWord.length === 1;
    const rFingers = {
      thumb: profile.fingers.thumb?.flexion ?? 0.8,
      index: profile.fingers.index?.flexion ?? 1,
      middle: profile.fingers.middle?.flexion ?? 1,
      ring: profile.fingers.ring?.flexion ?? 1,
      pinky: profile.fingers.pinky?.flexion ?? 1
    };
    return {
      head: { x: 200, y: 114, tiltDeg: isSingleChar ? 1 : 2 },
      eyebrows: isSingleChar ? "neutral" : "raised",
      eyes: isBlinking ? "blink" : "open",
      mouth: isSingleChar ? "neutral" : "smile",
      chest: { x: 200, y: 240 },
      leftArm: {
        elbow: { x: 100, y: 290 },
        wrist: { x: 95, y: 350 },
        rotationDeg: 0,
        scale: 0.9,
        isActive: false
      },
      rightArm: {
        elbow: { x: 285, y: 235 },
        wrist: { x: 265, y: 175 },
        rotationDeg: -12,
        scale: 1.15,
        isActive: true
      },
      rightFingers: rFingers,
      gloss: isSingleChar ? `LETTER [${cleanWord}]` : `${cleanWord}`,
      category: isSingleChar ? "Alphabet Finger Spelling" : profile.category.toUpperCase(),
      facialDescription: isSingleChar ? "Neutral focused attention with clear visual gaze on the signing space" : "Natural conversational engagement matching conversational rhythm",
      movementDescription: profile.description || `Sign gesture posture for "${cleanWord}"`,
      handshapeDescription: `Primary active fingers: ${profile.primaryFingers.join(", ")}`
    };
  }, [currentWord, isBlinking]);
  const avatarTheme = useMemo(() => {
    switch (avatarModel) {
      case "nova":
        return {
          name: "Nova Cyber-AI",
          badge: "Holographic Cybernetic",
          skinTone: "#93C5FD",
          skinShadow: "#60A5FA",
          clothingBg: "#0F172A",
          clothingAccent: "#06B6D4",
          hairColor: "#38BDF8",
          eyeColor: "#22D3EE",
          jointGlow: "#00F0FF",
          visor: true,
          auraGradient: "from-cyan-950/40 via-indigo-950/60 to-slate-950",
          borderColor: "border-cyan-500/40",
          hudAccent: "text-cyan-400"
        };
      case "kai":
        return {
          name: "Kai Modern",
          badge: "Urban Casual",
          skinTone: "#E2A27F",
          skinShadow: "#C87D59",
          clothingBg: "#0D9488",
          clothingAccent: "#14B8A6",
          hairColor: "#1E293B",
          eyeColor: "#475569",
          jointGlow: "#14B8A6",
          visor: false,
          auraGradient: "from-teal-950/30 via-slate-900 to-slate-950",
          borderColor: "border-teal-500/40",
          hudAccent: "text-teal-400"
        };
      case "skeletal":
        return {
          name: "Bio-Kinematic Skeleton",
          badge: "Biomechanical X-Ray",
          skinTone: "#1E293B",
          skinShadow: "#0F172A",
          clothingBg: "#020617",
          clothingAccent: "#6366F1",
          hairColor: "#475569",
          eyeColor: "#818CF8",
          jointGlow: "#A855F7",
          visor: false,
          auraGradient: "from-purple-950/40 via-slate-950 to-black",
          borderColor: "border-purple-500/40",
          hudAccent: "text-purple-400"
        };
      case "maya":
      default:
        return {
          name: "Maya ASL Specialist",
          badge: "Realistic ASL Interpreter",
          skinTone: "#D4A373",
          skinShadow: "#BC8A5F",
          clothingBg: "#1E1B4B",
          clothingAccent: "#4F46E5",
          hairColor: "#2A1810",
          eyeColor: "#3E2723",
          jointGlow: "#6366F1",
          visor: false,
          auraGradient: "from-indigo-950/50 via-slate-900 to-slate-950",
          borderColor: "border-indigo-500/40",
          hudAccent: "text-indigo-400"
        };
    }
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
  const renderHand = (wristX, wristY, rotation, scale, fingers = {}, isRight = true) => {
    const thumbFlex = fingers.thumb ?? 0.8;
    const indexFlex = fingers.index ?? 1;
    const middleFlex = fingers.middle ?? 1;
    const ringFlex = fingers.ring ?? 1;
    const pinkyFlex = fingers.pinky ?? 1;
    const getFingerPoints = (baseX, baseY, angleDeg, maxLen, flex) => {
      const rad = angleDeg * Math.PI / 180;
      const len = maxLen * (0.35 + flex * 0.65);
      const tipX = baseX + Math.cos(rad) * len;
      const tipY = baseY + Math.sin(rad) * len;
      const midX = baseX + Math.cos(rad) * len * 0.55;
      const midY = baseY + Math.sin(rad) * len * 0.55;
      return { baseX, baseY, midX, midY, tipX, tipY, flex };
    };
    const dir = isRight ? 1 : -1;
    const thumbData = getFingerPoints(dir * -14, 2, -140 * dir, 20, thumbFlex);
    const indexData = getFingerPoints(dir * -9, -15, -95 * dir, 25, indexFlex);
    const middleData = getFingerPoints(dir * -1, -17, -90 * dir, 27, middleFlex);
    const ringData = getFingerPoints(dir * 7, -15, -85 * dir, 24, ringFlex);
    const pinkyData = getFingerPoints(dir * 14, -10, -75 * dir, 21, pinkyFlex);
    const fingerList = [thumbData, indexData, middleData, ringData, pinkyData];
    return <g transform={`translate(${wristX}, ${wristY}) rotate(${rotation}) scale(${scale})`}>
        {
      /* Palm Shadow / Base glow */
    }
        <ellipse cx="0" cy="-4" rx="17" ry="15" fill={avatarTheme.skinShadow} opacity="0.85" />

        {
      /* Hand Palm Flesh */
    }
        <path
      d="M -15,-2 C -16,-14 -12,-18 0,-18 C 12,-18 16,-14 15,-2 C 14,10 6,14 0,14 C -6,14 -14,10 -15,-2 Z"
      fill={avatarTheme.skinTone}
      stroke={avatarTheme.skinShadow}
      strokeWidth="1.2"
    />

        {
      /* Articulated 5 Fingers */
    }
        {fingerList.map((f, idx) => <g key={idx}>
            {
      /* Finger Flesh Tube */
    }
            <line
      x1={f.baseX}
      y1={f.baseY}
      x2={f.tipX}
      y2={f.tipY}
      stroke={avatarTheme.skinTone}
      strokeWidth={idx === 0 ? 5.5 : 4.5}
      strokeLinecap="round"
    />
            {
      /* Knuckle Joint Shade */
    }
            <circle cx={f.midX} cy={f.midY} r={idx === 0 ? 2.5 : 2} fill={avatarTheme.skinShadow} opacity="0.7" />
            <circle cx={f.tipX} cy={f.tipY} r={idx === 0 ? 2.8 : 2.2} fill={avatarTheme.skinTone} />

            {
      /* Skeletal Landmark Node Overlay if active */
    }
            {showSkeletalOverlay && <>
                <line
      x1={f.baseX}
      y1={f.baseY}
      x2={f.midX}
      y2={f.midY}
      stroke={avatarTheme.jointGlow}
      strokeWidth="1.2"
      strokeDasharray="2 1"
    />
                <line
      x1={f.midX}
      y1={f.midY}
      x2={f.tipX}
      y2={f.tipY}
      stroke={avatarTheme.jointGlow}
      strokeWidth="1.2"
    />
                <circle cx={f.midX} cy={f.midY} r="2" fill="#FFFFFF" stroke={avatarTheme.jointGlow} strokeWidth="1" />
                <circle cx={f.tipX} cy={f.tipY} r="2.5" fill="#38BDF8" />
              </>}
          </g>)}

        {
      /* Wrist Base Landmark */
    }
        {showSkeletalOverlay && <circle cx="0" cy="10" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />}
      </g>;
  };
  const parsedWords = fullSentence.toUpperCase().split(/\s+/).filter(Boolean);
  return <div
    ref={containerRef}
    className={`relative flex flex-col bg-slate-950 rounded-3xl overflow-hidden border ${avatarTheme.borderColor} shadow-2xl transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "w-full aspect-4/3"} ${className}`}
  >
      {
    /* Top HUD Overlay Bar */
  }
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-xs">
        {
    /* Left Status & Sign Language Badge */
  }
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-slate-200">
              AI SIGN AVATAR
            </span>
            <span className="text-slate-600">|</span>
            <span className={`text-[11px] font-bold ${avatarTheme.hudAccent}`}>
              {primarySignLanguage}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-bold text-indigo-200">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{avatarTheme.badge}</span>
          </div>
        </div>

        {
    /* Right HUD Controls: Model Switcher & Camera Angle */
  }
        <div className="flex items-center space-x-1.5">
          {
    /* Avatar Model Selector Dropdown */
  }
          <div className="relative group">
            <button
    className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md"
    title="Switch Sign Avatar Persona"
  >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="capitalize">{avatarModel}</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-1 hidden group-hover:block z-30 animate-in fade-in">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                Avatar Persona
              </span>
              {[
    { id: "maya", name: "Maya (ASL Pro)", icon: "\u{1F469}\u200D\u{1F4BC}" },
    { id: "nova", name: "Nova (Cyber AI)", icon: "\u{1F916}" },
    { id: "kai", name: "Kai (Casual 3D)", icon: "\u{1F9D1}" },
    { id: "skeletal", name: "Biomechanical", icon: "\u26A1" }
  ].map((m) => <button
    key={m.id}
    onClick={() => setAvatarModel(m.id)}
    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${avatarModel === m.id ? "bg-indigo-600 text-white font-bold" : "text-slate-300 hover:bg-slate-800"}`}
  >
                  <span className="flex items-center space-x-2">
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </span>
                  {avatarModel === m.id && <Check className="w-3 h-3" />}
                </button>)}
            </div>
          </div>

          {
    /* Camera View Angle Selector */
  }
          <button
    onClick={() => {
      const next = cameraAngle === "front" ? "angled" : cameraAngle === "angled" ? "hands_zoom" : "front";
      setCameraAngle(next);
    }}
    className="px-2 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
    title="Switch Camera View: Front / Angled / Hands Zoom"
  >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span className="capitalize">{cameraAngle.replace("_", " ")}</span>
          </button>

          {
    /* 3D Skeletal Mesh Overlay Toggle */
  }
          <button
    onClick={() => setShowSkeletalOverlay(!showSkeletalOverlay)}
    className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${showSkeletalOverlay ? "bg-emerald-600/30 border-emerald-500 text-emerald-300" : "bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white"}`}
    title="Toggle 21-Node Skeletal Landmark Overlay"
  >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {
    /* Audio Vocalizer Sync Toggle */
  }
          <button
    onClick={() => setIsAudioSyncEnabled(!isAudioSyncEnabled)}
    className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${isAudioSyncEnabled ? "bg-indigo-600/30 border-indigo-500 text-indigo-300" : "bg-slate-900/90 border-slate-700/80 text-slate-500 hover:text-white"}`}
    title={isAudioSyncEnabled ? "Audio Vocalization Active" : "Audio Vocalization Muted"}
  >
            {isAudioSyncEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {
    /* Fullscreen Toggle */
  }
          <button
    onClick={() => setIsFullscreen(!isFullscreen)}
    className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Theatre View"}
  >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {
    /* Main Avatar Stage & 2.5D Animated SVG Engine */
  }
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {
    /* Background Ambient Studio Lighting & Grid Canvas */
  }
        <div className={`absolute inset-0 bg-gradient-to-b ${avatarTheme.auraGradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf815_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {
    /* Ambient Halo behind Avatar Head & Hands */
  }
        <div
    className="absolute w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
    style={{
      background: avatarTheme.jointGlow,
      top: "15%",
      left: "50%",
      transform: "translateX(-50%)"
    }}
  />

        {
    /* SVG ARTICULATED AVATAR CANVAS */
  }
        <div
    className="relative w-full h-full max-w-lg max-h-full flex items-center justify-center transition-transform duration-500"
    style={{ transform: cameraTransform }}
  >
          <svg
    viewBox="0 0 400 420"
    className="w-full h-full select-none"
    xmlns="http://www.w3.org/2000/svg"
  >
            <defs>
              {
    /* Avatar Skin Gradient */
  }
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={avatarTheme.skinTone} />
                <stop offset="100%" stopColor={avatarTheme.skinShadow} />
              </linearGradient>

              {
    /* Clothing Gradient */
  }
              <linearGradient id="clothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={avatarTheme.clothingAccent} />
                <stop offset="100%" stopColor={avatarTheme.clothingBg} />
              </linearGradient>

              {
    /* Cyber Circuit Glow Filter */
  }
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {
    /* TORSO & SHOULDERS (with subtle organic breathing offset) */
  }
            <g transform={`translate(0, ${breathingPhase * 2.5})`}>
              {
    /* Torso Silhouette */
  }
              <path
    d="M 120,230 Q 200,220 280,230 L 320,420 L 80,420 Z"
    fill="url(#clothGrad)"
    stroke={avatarTheme.clothingBg}
    strokeWidth="2"
  />

              {
    /* Collar & Neckline Trim */
  }
              <path
    d="M 170,225 Q 200,250 230,225"
    fill="none"
    stroke={avatarTheme.clothingAccent}
    strokeWidth="3.5"
    strokeLinecap="round"
  />

              {
    /* Nova Cybernetic Circuit Lines on Chest */
  }
              {avatarModel === "nova" && <g filter="url(#neonGlow)" stroke="#22D3EE" strokeWidth="1.5" fill="none" opacity="0.8">
                  <path d="M 200,250 L 200,310 M 170,270 L 200,290 L 230,270" />
                  <circle cx="200" cy="290" r="3.5" fill="#22D3EE" />
                </g>}

              {
    /* Skeletal Torso Bones if active */
  }
              {showSkeletalOverlay && <g stroke={avatarTheme.jointGlow} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
                  <line x1="200" y1="225" x2="200" y2="350" />
                  <line x1="120" y1="230" x2="280" y2="230" />
                  <circle cx="120" cy="230" r="4" fill="#38BDF8" />
                  <circle cx="280" cy="230" r="4" fill="#38BDF8" />
                </g>}
            </g>

            {
    /* NECK */
  }
            <rect
    x="185"
    y="170"
    width="30"
    height="55"
    rx="10"
    fill="url(#skinGrad)"
  />

            {
    /* HEAD & FACE (Animated with head tilt and non-manual marker angles) */
  }
            <g
    transform={`translate(${activePose.head.x}, ${activePose.head.y}) rotate(${activePose.head.tiltDeg})`}
    className="transition-transform duration-300"
  >
              {
    /* Hair Back (Behind Face) */
  }
              <ellipse cx="0" cy="-8" rx="42" ry="46" fill={avatarTheme.hairColor} />

              {
    /* Face Contour */
  }
              <ellipse cx="0" cy="5" rx="34" ry="42" fill="url(#skinGrad)" stroke={avatarTheme.skinShadow} strokeWidth="1" />

              {
    /* Ears */
  }
              <ellipse cx="-34" cy="5" rx="5" ry="10" fill={avatarTheme.skinTone} />
              <ellipse cx="34" cy="5" rx="5" ry="10" fill={avatarTheme.skinTone} />

              {
    /* Stylized Hair Bangs / Front Style */
  }
              {avatarModel === "maya" ? <path
    d="M -35,-15 Q -10,-45 25,-25 Q 36,-10 35,5 Q 28,-18 0,-18 Q -24,-18 -35,-15 Z"
    fill={avatarTheme.hairColor}
  /> : avatarModel === "kai" ? <path
    d="M -34,-10 Q -5,-48 30,-30 Q 38,-15 36,-5 Q 15,-25 -10,-22 Z"
    fill={avatarTheme.hairColor}
  /> : <path
    d="M -34,-15 Q 0,-40 34,-15 Q 36,-5 32,5 Q 15,-20 -15,-20 Z"
    fill={avatarTheme.hairColor}
  />}

              {
    /* EYEBROWS (Non-manual markers: raised, furrowed, or neutral) */
  }
              <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-300">
                {activePose.eyebrows === "raised" ? <>
                    <path d="M -23,-13 Q -15,-18 -7,-12" />
                    <path d="M 7,-12 Q 15,-18 23,-13" />
                  </> : activePose.eyebrows === "furrowed" ? <>
                    <path d="M -23,-9 Q -15,-14 -7,-17" />
                    <path d="M 7,-17 Q 15,-14 23,-9" />
                  </> : activePose.eyebrows === "empathetic" ? <>
                    <path d="M -23,-15 Q -15,-12 -7,-10" />
                    <path d="M 7,-10 Q 15,-12 23,-15" />
                  </> : <>
                    <path d="M -23,-11 Q -15,-14 -7,-11" />
                    <path d="M 7,-11 Q 15,-14 23,-11" />
                  </>}
              </g>

              {
    /* EYES (With blinking animation & gaze) */
  }
              {avatarModel === "nova" ? (
    /* Nova Holographic Visor */
    <g filter="url(#neonGlow)">
                  <path
      d="M -30,-8 L 30,-8 L 26,6 L -26,6 Z"
      fill="#0284C7"
      opacity="0.85"
      stroke="#38BDF8"
      strokeWidth="1.5"
    />
                  <line x1="-20" y1="-1" x2="20" y2="-1" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
                </g>
  ) : activePose.eyes === "blink" ? (
    /* Closed eye line when blinking */
    <g stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
                  <path d="M -21,-2 Q -15,1 -9,-2" />
                  <path d="M 9,-2 Q 15,1 21,-2" />
                </g>
  ) : (
    /* Expressive open eyes */
    <g>
                  {
      /* Eyeball Whites */
    }
                  <ellipse cx="-15" cy="-2" rx="7" ry="5" fill="#FFFFFF" />
                  <ellipse cx="15" cy="-2" rx="7" ry="5" fill="#FFFFFF" />
                  {
      /* Irises */
    }
                  <circle cx="-15" cy="-2" r="3.2" fill={avatarTheme.eyeColor} />
                  <circle cx="15" cy="-2" r="3.2" fill={avatarTheme.eyeColor} />
                  {
      /* Pupil sparkle */
    }
                  <circle cx="-14" cy="-3.5" r="1.1" fill="#FFFFFF" />
                  <circle cx="16" cy="-3.5" r="1.1" fill="#FFFFFF" />
                </g>
  )}

              {
    /* NOSE */
  }
              <path
    d="M -1,6 Q 2,12 -3,14 Q 0,16 3,14"
    fill="none"
    stroke={avatarTheme.skinShadow}
    strokeWidth="1.5"
    strokeLinecap="round"
  />

              {
    /* MOUTH (Articulates non-manual visemes/morphemes) */
  }
              <g className="transition-all duration-200">
                {activePose.mouth === "smile" ? <path
    d="M -11,23 Q 0,33 11,23"
    fill="#BE185D"
    stroke="#831843"
    strokeWidth="1.5"
    strokeLinecap="round"
  /> : activePose.mouth === "open_ah" ? <ellipse cx="0" cy="25" rx="7" ry="5" fill="#881337" stroke="#4C0519" strokeWidth="1" /> : activePose.mouth === "round_oh" ? <ellipse cx="0" cy="25" rx="5" ry="6" fill="#881337" stroke="#4C0519" strokeWidth="1" /> : <path
    d="M -9,25 Q 0,27 9,25"
    fill="none"
    stroke="#9F1239"
    strokeWidth="2"
    strokeLinecap="round"
  />}
              </g>
            </g>

            {
    /* ARMS & ARTICULATED HANDS */
  }
            {
    /* LEFT ARM (Upper Arm & Forearm) */
  }
            <g className="transition-all duration-300">
              {
    /* Upper arm connecting left shoulder (120, 230) to left elbow */
  }
              <line
    x1="120"
    y1="230"
    x2={activePose.leftArm.elbow.x}
    y2={activePose.leftArm.elbow.y}
    stroke="url(#clothGrad)"
    strokeWidth="18"
    strokeLinecap="round"
  />
              {
    /* Forearm connecting left elbow to left wrist */
  }
              <line
    x1={activePose.leftArm.elbow.x}
    y1={activePose.leftArm.elbow.y}
    x2={activePose.leftArm.wrist.x}
    y2={activePose.leftArm.wrist.y}
    stroke="url(#skinGrad)"
    strokeWidth="14"
    strokeLinecap="round"
  />
              {
    /* Left Hand with 5 fingers */
  }
              {renderHand(
    activePose.leftArm.wrist.x,
    activePose.leftArm.wrist.y,
    activePose.leftArm.rotationDeg,
    activePose.leftArm.scale,
    activePose.leftFingers || { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
    false
  )}
            </g>

            {
    /* RIGHT ARM (Dominant signing arm) */
  }
            <g className="transition-all duration-300">
              {
    /* Upper arm connecting right shoulder (280, 230) to right elbow */
  }
              <line
    x1="280"
    y1="230"
    x2={activePose.rightArm.elbow.x}
    y2={activePose.rightArm.elbow.y}
    stroke="url(#clothGrad)"
    strokeWidth="18"
    strokeLinecap="round"
  />
              {
    /* Forearm connecting right elbow to right wrist */
  }
              <line
    x1={activePose.rightArm.elbow.x}
    y1={activePose.rightArm.elbow.y}
    x2={activePose.rightArm.wrist.x}
    y2={activePose.rightArm.wrist.y}
    stroke="url(#skinGrad)"
    strokeWidth="14"
    strokeLinecap="round"
  />
              {
    /* Dynamic Gesture Motion Trail / Spatial Glow */
  }
              {activePose.rightArm.isActive && <circle
    cx={activePose.rightArm.wrist.x}
    cy={activePose.rightArm.wrist.y}
    r="28"
    fill="url(#neonGlow)"
    fillOpacity="0.12"
    className="animate-pulse"
  />}
              {
    /* Right Hand with 5 articulated fingers */
  }
              {renderHand(
    activePose.rightArm.wrist.x,
    activePose.rightArm.wrist.y,
    activePose.rightArm.rotationDeg,
    activePose.rightArm.scale,
    activePose.rightFingers || { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
    true
  )}
            </g>
          </svg>
        </div>

        {
    /* Live Sign Badge Overlay (Upper Center) */
  }
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

        {
    /* Non-Manual Linguistic Marker Bubble (Floating bottom-left) */
  }
        <div className="absolute bottom-20 left-4 hidden sm:flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-[11px] text-slate-300 max-w-xs shadow-lg z-10">
          <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="line-clamp-1">
            <span className="font-bold text-white">Expression:</span> {activePose.facialDescription}
          </div>
        </div>

        {
    /* Interactive Sign Info Collapsible Toggle (Floating bottom-right) */
  }
        <button
    onClick={() => setShowSignInfoDrawer(!showSignInfoDrawer)}
    className="absolute bottom-20 right-4 p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-indigo-400 hover:text-white transition-colors cursor-pointer shadow-lg z-10 flex items-center space-x-1 text-xs font-semibold"
    title="Toggle Sign Linguistic Breakdown Drawer"
  >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Details</span>
        </button>
      </div>

      {
    /* Expandable Sign Linguistic Details Drawer */
  }
      <AnimatePresence>
        {showSignInfoDrawer && <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="bg-slate-900/95 border-t border-slate-800 p-3 sm:p-4 z-20 overflow-hidden text-xs"
  >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Handshape & Articulation
                </span>
                <p className="font-semibold text-slate-200 line-clamp-2">
                  {activePose.handshapeDescription}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Spatial Movement Path
                </span>
                <p className="font-semibold text-slate-200 line-clamp-2">
                  {activePose.movementDescription}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Grammar & Non-Manual Marker
                </span>
                <p className="font-semibold text-slate-200 line-clamp-2">
                  {activePose.facialDescription}
                </p>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {
    /* Sentence Scrubber & Playback Controls Bar (Bottom) */
  }
      <div className="bg-slate-950/95 border-t border-slate-800 p-3 sm:px-4 flex flex-col space-y-2 z-20">
        {
    /* Scrubbable Sentence Token Strip */
  }
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {parsedWords.map((word, idx) => <button
    key={idx}
    onClick={() => onSelectWordIndex(idx)}
    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${wordIndex === idx ? "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md scale-105" : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
  >
              <span>{word}</span>
            </button>)}
        </div>

        {
    /* Transport Controls (Play, Step, Speed, Audio) */
  }
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
    onClick={onTogglePlay}
    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center"
    title={isPlaying ? "Pause Avatar Signing" : "Play Avatar Signing"}
  >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
    onClick={onPrevWord}
    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
    title="Previous Sign Gesture"
  >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
    onClick={onNextWord}
    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
    title="Next Sign Gesture"
  >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs font-medium text-slate-400 pl-2">
              Word <strong className="text-white">{wordIndex + 1}</strong> of {Math.max(1, totalWords)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Speed:</span>
            {[0.5, 0.75, 1, 1.5].map((spd) => <button
    key={spd}
    onClick={() => onChangeSpeed(spd)}
    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${playbackSpeed === spd ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"}`}
  >
                {spd}x
              </button>)}
          </div>
        </div>
      </div>
    </div>;
};
export {
  SignLanguageAvatar
};
