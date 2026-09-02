import { getFingerProfileForSign } from "../../utils/fingerMapping";

export const getAvatarPoseForWord = (currentWord, isBlinking = false) => {
  const rawWord = (currentWord || "").toUpperCase().trim();
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
    facialDescription: isSingleChar
      ? "Neutral focused attention with clear visual gaze on the signing space"
      : "Natural conversational engagement matching conversational rhythm",
    movementDescription: profile.description || `Sign gesture posture for "${cleanWord}"`,
    handshapeDescription: `Primary active fingers: ${profile.primaryFingers.join(", ")}`
  };
};

export const getAvatarTheme = (avatarModel) => {
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
};
