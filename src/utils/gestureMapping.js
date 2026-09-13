/**
 * Gesture Mapping & Kinematic Sign Classifier Engine
 * Maps 21 3D landmarks from @mediapipe/hands to rich gestures and ASL signs.
 */

export const LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};

export const HAND_CONNECTIONS = [
  // Metacarpals & Palm
  [0, 1], [0, 5], [0, 9], [0, 13], [0, 17],
  [1, 5], [5, 9], [9, 13], [13, 17],
  // Thumb
  [1, 2], [2, 3], [3, 4],
  // Index
  [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20]
];

export const FINGER_COLORS = {
  thumb: "#F59E0B",   // Amber
  index: "#06B6D4",   // Cyan
  middle: "#6366F1",  // Indigo
  ring: "#A855F7",    // Purple
  pinky: "#F43F5E",   // Rose
  palm: "#10B981"     // Emerald
};

/**
 * Distance in 3D (or 2D if z is omitted)
 */
export function euclideanDistance(p1, p2, use3D = true) {
  if (!p1 || !p2) return 0;
  const dx = (p1.x || 0) - (p2.x || 0);
  const dy = (p1.y || 0) - (p2.y || 0);
  const dz = use3D ? ((p1.z || 0) - (p2.z || 0)) : 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 3D Angle in degrees between three points: p1 -> p2 (vertex) -> p3
 */
export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0;
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 * mag2 === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Extract biomechanical finger flexion and extension states
 * Returns values from 0.0 (fully curled) to 1.0 (fully extended)
 */
export function extractFingerMetrics(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return {
      handScale: 0.2,
      flexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 },
      extended: { thumb: false, index: false, middle: false, ring: false, pinky: false },
      distances: {}
    };
  }

  const wrist = landmarks[LANDMARK_INDEX.WRIST];
  const middleMcp = landmarks[LANDMARK_INDEX.MIDDLE_MCP];
  const indexMcp = landmarks[LANDMARK_INDEX.INDEX_MCP];
  const pinkyMcp = landmarks[LANDMARK_INDEX.PINKY_MCP];

  // Reference scale: distance between wrist and middle MCP
  const handScale = Math.max(0.05, euclideanDistance(wrist, middleMcp));

  // Helper for 4 main fingers (Index, Middle, Ring, Pinky)
  const calcFingerFlexion = (tipIdx, dipIdx, pipIdx, mcpIdx) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];

    const dTipMcp = euclideanDistance(tip, mcp);
    const dPipMcp = Math.max(0.02, euclideanDistance(pip, mcp));
    const dTipWrist = euclideanDistance(tip, wrist);
    const dPipWrist = euclideanDistance(pip, wrist);

    // Extension ratio: tip distance vs pip distance from MCP
    const ratio = dTipMcp / dPipMcp;
    let extension = (ratio - 0.85) / 1.05;

    // If fingertip is closer to wrist than PIP is, finger is curled
    if (dTipWrist < dPipWrist) {
      extension = Math.min(extension, 0.25);
    }
    return Math.max(0, Math.min(1, extension));
  };

  const indexFlex = calcFingerFlexion(
    LANDMARK_INDEX.INDEX_TIP,
    LANDMARK_INDEX.INDEX_DIP,
    LANDMARK_INDEX.INDEX_PIP,
    LANDMARK_INDEX.INDEX_MCP
  );
  const middleFlex = calcFingerFlexion(
    LANDMARK_INDEX.MIDDLE_TIP,
    LANDMARK_INDEX.MIDDLE_DIP,
    LANDMARK_INDEX.MIDDLE_PIP,
    LANDMARK_INDEX.MIDDLE_MCP
  );
  const ringFlex = calcFingerFlexion(
    LANDMARK_INDEX.RING_TIP,
    LANDMARK_INDEX.RING_DIP,
    LANDMARK_INDEX.RING_PIP,
    LANDMARK_INDEX.RING_MCP
  );
  const pinkyFlex = calcFingerFlexion(
    LANDMARK_INDEX.PINKY_TIP,
    LANDMARK_INDEX.PINKY_DIP,
    LANDMARK_INDEX.PINKY_PIP,
    LANDMARK_INDEX.PINKY_MCP
  );

  // Thumb flexion based on tip distance from pinky MCP and angle at IP
  const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
  const thumbMcp = landmarks[LANDMARK_INDEX.THUMB_MCP];
  const thumbIp = landmarks[LANDMARK_INDEX.THUMB_IP];

  const dThumbPinky = euclideanDistance(thumbTip, pinkyMcp) / handScale;
  const dThumbIndex = euclideanDistance(thumbTip, indexMcp) / handScale;
  const thumbAngle = calculateAngle(thumbMcp, thumbIp, thumbTip);

  let thumbFlex = (dThumbPinky - 0.7) / 0.65;
  if (thumbAngle < 130) {
    thumbFlex *= 0.7;
  }
  thumbFlex = Math.max(0, Math.min(1, thumbFlex));

  // Normalized key tip-to-tip distances
  const distances = {
    thumbIndexTip: euclideanDistance(thumbTip, landmarks[LANDMARK_INDEX.INDEX_TIP]) / handScale,
    thumbMiddleTip: euclideanDistance(thumbTip, landmarks[LANDMARK_INDEX.MIDDLE_TIP]) / handScale,
    thumbRingTip: euclideanDistance(thumbTip, landmarks[LANDMARK_INDEX.RING_TIP]) / handScale,
    thumbPinkyTip: euclideanDistance(thumbTip, landmarks[LANDMARK_INDEX.PINKY_TIP]) / handScale,
    indexMiddleTip: euclideanDistance(landmarks[LANDMARK_INDEX.INDEX_TIP], landmarks[LANDMARK_INDEX.MIDDLE_TIP]) / handScale,
    middleRingTip: euclideanDistance(landmarks[LANDMARK_INDEX.MIDDLE_TIP], landmarks[LANDMARK_INDEX.RING_TIP]) / handScale,
    ringPinkyTip: euclideanDistance(landmarks[LANDMARK_INDEX.RING_TIP], landmarks[LANDMARK_INDEX.PINKY_TIP]) / handScale
  };

  const flexions = {
    thumb: +thumbFlex.toFixed(3),
    index: +indexFlex.toFixed(3),
    middle: +middleFlex.toFixed(3),
    ring: +ringFlex.toFixed(3),
    pinky: +pinkyFlex.toFixed(3)
  };

  const extended = {
    thumb: thumbFlex > 0.55,
    index: indexFlex > 0.55,
    middle: middleFlex > 0.55,
    ring: ringFlex > 0.55,
    pinky: pinkyFlex > 0.55
  };

  return {
    handScale,
    flexions,
    extended,
    distances
  };
}

/**
 * Hand 3D spatial orientation (wrist roll, pitch, facing)
 */
export function extractHandOrientation(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { roll: 0, pitch: 0, facing: "camera", direction: "up" };
  }

  const wrist = landmarks[LANDMARK_INDEX.WRIST];
  const middleMcp = landmarks[LANDMARK_INDEX.MIDDLE_MCP];
  const indexMcp = landmarks[LANDMARK_INDEX.INDEX_MCP];
  const pinkyMcp = landmarks[LANDMARK_INDEX.PINKY_MCP];

  // 2D In-plane rotation (roll)
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const angleRad = Math.atan2(dy, dx);
  const roll = Math.round((angleRad * 180) / Math.PI + 90);

  // Z-axis pitch
  const dz = (middleMcp.z || 0) - (wrist.z || 0);
  const pitch = Math.round(Math.atan2(dz, Math.hypot(dx, dy)) * (180 / Math.PI));

  // Determine pointing direction of the hand
  let direction = "up";
  if (dy > 0.15) direction = "down";
  else if (dx > 0.2) direction = "right";
  else if (dx < -0.2) direction = "left";

  // Palm facing direction (cross product of palm vectors)
  const v1 = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y, z: (indexMcp.z || 0) - (wrist.z || 0) };
  const v2 = { x: pinkyMcp.x - wrist.x, y: pinkyMcp.y - wrist.y, z: (pinkyMcp.z || 0) - (wrist.z || 0) };
  const crossZ = v1.x * v2.y - v1.y * v2.x;

  const facing = crossZ > 0 ? "camera" : "away";

  return { roll, pitch, facing, direction };
}

/**
 * Calculate 2D bounding box from landmarks
 */
export function calculateBoundingBox(landmarks, width = 1, height = 1, padding = 16) {
  if (!landmarks || landmarks.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  landmarks.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const isNormalized = maxX <= 1.05 && maxY <= 1.05;
  const scaleX = isNormalized ? width : 1;
  const scaleY = isNormalized ? height : 1;

  const x = Math.max(0, minX * scaleX - padding);
  const y = Math.max(0, minY * scaleY - padding);
  const boxWidth = Math.min(width - x, (maxX - minX) * scaleX + padding * 2);
  const boxHeight = Math.min(height - y, (maxY - minY) * scaleY + padding * 2);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(boxWidth),
    height: Math.round(boxHeight)
  };
}

/**
 * Standard Built-in Gesture Definitions
 */
export const GESTURE_DICTIONARY = {
  HELLO: {
    id: "HELLO",
    name: "Hello / Open Palm",
    emoji: "🖐️",
    aslGloss: "HELLO / 5",
    category: "greetings",
    meaning: "Standard friendly greeting or the number five",
    description: "All five fingers fully extended with open palm",
    match: ({ flexions, extended }) => {
      return (
        flexions.thumb > 0.5 &&
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring > 0.55 &&
        flexions.pinky > 0.55
      );
    },
    confidence: 0.98
  },

  PEACE: {
    id: "PEACE",
    name: "Peace / Victory",
    emoji: "✌️",
    aslGloss: "V / 2",
    category: "common",
    meaning: "Peace sign, victory, or the number two",
    description: "Index and middle fingers extended in a V-shape, others curled",
    match: ({ flexions, distances }) => {
      return (
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring < 0.38 &&
        flexions.pinky < 0.38 &&
        flexions.thumb < 0.6 &&
        (distances.indexMiddleTip || 0) > 0.35
      );
    },
    confidence: 0.98
  },

  THUMBS_UP: {
    id: "THUMBS_UP",
    name: "Thumbs Up / Good",
    emoji: "👍",
    aslGloss: "GOOD / YES",
    category: "common",
    meaning: "Approval, affirmative, good, or yes",
    description: "Thumb upright with all four fingers clenched into a fist",
    match: ({ flexions, landmarks, orientation }) => {
      const wrist = landmarks[LANDMARK_INDEX.WRIST];
      const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
      const isUpright = thumbTip.y < wrist.y;
      return (
        flexions.thumb > 0.6 &&
        flexions.index < 0.35 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky < 0.35 &&
        isUpright
      );
    },
    confidence: 0.97
  },

  THUMBS_DOWN: {
    id: "THUMBS_DOWN",
    name: "Thumbs Down / Bad",
    emoji: "👎",
    aslGloss: "BAD / NO",
    category: "common",
    meaning: "Disapproval, negative, bad, or no",
    description: "Thumb pointing downward with all four fingers clenched",
    match: ({ flexions, landmarks }) => {
      const wrist = landmarks[LANDMARK_INDEX.WRIST];
      const thumbTip = landmarks[LANDMARK_INDEX.THUMB_TIP];
      const isDownward = thumbTip.y > wrist.y + 0.05;
      return (
        flexions.thumb > 0.55 &&
        flexions.index < 0.35 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky < 0.35 &&
        isDownward
      );
    },
    confidence: 0.97
  },

  FIST: {
    id: "FIST",
    name: "Fist / Clenched",
    emoji: "✊",
    aslGloss: "S / A",
    category: "common",
    meaning: "Fist gesture, power, letter S, or letter A in ASL",
    description: "All five fingers folded into a clenched fist",
    match: ({ flexions }) => {
      return (
        flexions.thumb < 0.45 &&
        flexions.index < 0.32 &&
        flexions.middle < 0.32 &&
        flexions.ring < 0.32 &&
        flexions.pinky < 0.32
      );
    },
    confidence: 0.96
  },

  OKAY: {
    id: "OKAY",
    name: "OK / Perfect",
    emoji: "👌",
    aslGloss: "OK / F",
    category: "common",
    meaning: "Okay, perfect agreement, or ASL letter F",
    description: "Thumb and index tips touching with middle, ring, and pinky extended",
    match: ({ flexions, distances }) => {
      return (
        distances.thumbIndexTip < 0.38 &&
        flexions.middle > 0.55 &&
        flexions.ring > 0.55 &&
        flexions.pinky > 0.45
      );
    },
    confidence: 0.98
  },

  I_LOVE_YOU: {
    id: "I_LOVE_YOU",
    name: "I Love You",
    emoji: "🤟",
    aslGloss: "I-LOVE-YOU",
    category: "asl",
    meaning: "Universal ASL expression for 'I Love You' (combines I, L, Y)",
    description: "Thumb, index, and pinky fingers extended; middle and ring curled",
    match: ({ flexions }) => {
      return (
        flexions.thumb > 0.55 &&
        flexions.index > 0.6 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky > 0.6
      );
    },
    confidence: 0.99
  },

  ROCK_ON: {
    id: "ROCK_ON",
    name: "Rock On / Horns",
    emoji: "🤘",
    aslGloss: "ROCK",
    category: "common",
    meaning: "Rock and roll horns gesture",
    description: "Index and pinky extended; middle, ring, and thumb curled",
    match: ({ flexions }) => {
      return (
        flexions.index > 0.6 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky > 0.6 &&
        flexions.thumb < 0.55
      );
    },
    confidence: 0.96
  },

  CALL_ME: {
    id: "CALL_ME",
    name: "Call Me",
    emoji: "🤙",
    aslGloss: "Y / CALL-ME",
    category: "asl",
    meaning: "Call me, hang loose (shaka), or ASL letter Y",
    description: "Thumb and pinky extended outward; index, middle, and ring curled",
    match: ({ flexions }) => {
      return (
        flexions.thumb > 0.55 &&
        flexions.index < 0.35 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky > 0.6
      );
    },
    confidence: 0.98
  },

  POINTING_UP: {
    id: "POINTING_UP",
    name: "Pointing / One",
    emoji: "☝️",
    aslGloss: "1 / D",
    category: "common",
    meaning: "Pointing upward, directing attention, the number one, or ASL letter D",
    description: "Index finger extended straight up, all other fingers curled",
    match: ({ flexions }) => {
      return (
        flexions.index > 0.65 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky < 0.35 &&
        flexions.thumb < 0.5
      );
    },
    confidence: 0.97
  },

  WATER: {
    id: "WATER",
    name: "Water / Three Fingers",
    emoji: "💧",
    aslGloss: "WATER / W",
    category: "asl",
    meaning: "ASL sign for 'Water' or letter W",
    description: "Index, middle, and ring fingers extended upward; thumb and pinky curled",
    match: ({ flexions }) => {
      return (
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring > 0.6 &&
        flexions.pinky < 0.35 &&
        flexions.thumb < 0.55
      );
    },
    confidence: 0.97
  },

  FOUR: {
    id: "FOUR",
    name: "Four / Letter B",
    emoji: "4️⃣",
    aslGloss: "4 / B",
    category: "numbers",
    meaning: "The number four or ASL letter B (thumb folded)",
    description: "Four fingers extended straight together, thumb folded across palm",
    match: ({ flexions }) => {
      return (
        flexions.thumb < 0.4 &&
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring > 0.6 &&
        flexions.pinky > 0.55
      );
    },
    confidence: 0.97
  },

  THREE: {
    id: "THREE",
    name: "Three / ASL Three",
    emoji: "3️⃣",
    aslGloss: "3",
    category: "numbers",
    meaning: "ASL number three (Thumb, Index, Middle extended)",
    description: "Thumb, index, and middle extended; ring and pinky curled",
    match: ({ flexions }) => {
      return (
        flexions.thumb > 0.55 &&
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring < 0.35 &&
        flexions.pinky < 0.35
      );
    },
    confidence: 0.97
  },

  L_SHAPE: {
    id: "L_SHAPE",
    name: "Letter L",
    emoji: "🇱",
    aslGloss: "L",
    category: "alphabet",
    meaning: "ASL letter L, forming an 90-degree right angle with thumb and index",
    description: "Thumb and index extended at ~90 degrees, other fingers curled",
    match: ({ flexions, distances }) => {
      return (
        flexions.thumb > 0.6 &&
        flexions.index > 0.6 &&
        flexions.middle < 0.35 &&
        flexions.ring < 0.35 &&
        flexions.pinky < 0.35 &&
        distances.thumbIndexTip > 0.6
      );
    },
    confidence: 0.98
  },

  FINGER_HEART: {
    id: "FINGER_HEART",
    name: "Finger Heart",
    emoji: "🫰",
    aslGloss: "HEART",
    category: "social",
    meaning: "Finger heart sign (affection, love, popular Korean heart gesture)",
    description: "Thumb and index crossed slightly with other fingers folded",
    match: ({ flexions, distances }) => {
      return (
        distances.thumbIndexTip < 0.42 &&
        flexions.middle < 0.45 &&
        flexions.ring < 0.45 &&
        flexions.pinky < 0.45 &&
        flexions.thumb > 0.35 &&
        flexions.index > 0.35
      );
    },
    confidence: 0.95
  },

  STOP: {
    id: "STOP",
    name: "Stop / Halt",
    emoji: "🛑",
    aslGloss: "STOP",
    category: "commands",
    meaning: "Stop, halt, or pause command",
    description: "Open palm facing directly toward the camera with fingers upright",
    match: ({ flexions, orientation }) => {
      return (
        flexions.index > 0.6 &&
        flexions.middle > 0.6 &&
        flexions.ring > 0.6 &&
        flexions.pinky > 0.55 &&
        flexions.thumb > 0.45 &&
        orientation.facing === "camera" &&
        orientation.direction === "up"
      );
    },
    confidence: 0.96
  },

  PINCH_CLOSED: {
    id: "PINCH_CLOSED",
    name: "Pinch / Precision",
    emoji: "🤏",
    aslGloss: "LITTLE / PINCH",
    category: "common",
    meaning: "A little bit, tiny, or precision pinch",
    description: "Thumb and index tips very close together, pointing forward",
    match: ({ flexions, distances }) => {
      return (
        distances.thumbIndexTip < 0.25 &&
        flexions.index > 0.35 &&
        flexions.index < 0.75
      );
    },
    confidence: 0.94
  }
};

/**
 * Custom registered gestures
 */
const customGestures = {};

export function registerCustomGesture(gestureDef) {
  if (!gestureDef || !gestureDef.id) return false;
  customGestures[gestureDef.id] = {
    ...gestureDef,
    isCustom: true
  };
  return true;
}

/**
 * Maps 21 3D landmarks into recognized gesture
 * @param {Array<{x: number, y: number, z: number}>} landmarks
 * @param {string} handedness "Left" | "Right"
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function mapLandmarksToGesture(landmarks, handedness = "Right", canvasWidth = 1280, canvasHeight = 720) {
  if (!landmarks || landmarks.length < 21) {
    return {
      gestureId: "UNKNOWN",
      name: "Searching...",
      emoji: "🔍",
      confidence: 0,
      aslGloss: "",
      meaning: "Waiting for hand detection...",
      category: "none",
      handedness,
      fingerStates: null,
      orientation: null,
      boundingBox: null,
      alternatives: []
    };
  }

  const metrics = extractFingerMetrics(landmarks);
  const orientation = extractHandOrientation(landmarks);
  const boundingBox = calculateBoundingBox(landmarks, canvasWidth, canvasHeight);

  const context = {
    ...metrics,
    orientation,
    landmarks,
    handedness
  };

  // 1. Check custom gestures first
  for (const [id, gesture] of Object.entries(customGestures)) {
    try {
      if (typeof gesture.match === "function" && gesture.match(context)) {
        return {
          gestureId: id,
          name: gesture.name || id,
          emoji: gesture.emoji || "✨",
          confidence: gesture.confidence || 0.95,
          aslGloss: gesture.aslGloss || id,
          meaning: gesture.meaning || gesture.name || id,
          category: gesture.category || "custom",
          description: gesture.description || "",
          handedness,
          fingerStates: metrics.flexions,
          orientation,
          boundingBox,
          alternatives: []
        };
      }
    } catch {
      // Continue to built-ins
    }
  }

  // 2. Evaluate built-in gestures
  const matches = [];
  for (const [id, gesture] of Object.entries(GESTURE_DICTIONARY)) {
    try {
      if (typeof gesture.match === "function" && gesture.match(context)) {
        matches.push(gesture);
      }
    } catch {
      // Continue
    }
  }

  if (matches.length > 0) {
    // Sort by confidence or precision
    matches.sort((a, b) => (b.confidence || 0.95) - (a.confidence || 0.95));
    const primary = matches[0];
    const alternatives = matches.slice(1).map((m) => ({
      gestureId: m.id,
      name: m.name,
      emoji: m.emoji,
      confidence: m.confidence || 0.9
    }));

    return {
      gestureId: primary.id,
      name: primary.name,
      emoji: primary.emoji,
      confidence: primary.confidence || 0.96,
      aslGloss: primary.aslGloss,
      meaning: primary.meaning,
      description: primary.description,
      category: primary.category,
      handedness,
      fingerStates: metrics.flexions,
      orientation,
      boundingBox,
      alternatives
    };
  }

  // 3. Fallback: closest match based on finger flexion vector
  return {
    gestureId: "OPEN_PALM",
    name: "Open Hand",
    emoji: "✋",
    confidence: 0.85,
    aslGloss: "5",
    meaning: "Open hand position",
    description: "Neutral open hand posture",
    category: "general",
    handedness,
    fingerStates: metrics.flexions,
    orientation,
    boundingBox,
    alternatives: []
  };
}

/**
 * Draw complete stylized hand landmarks, connections, and gesture HUD on HTML5 Canvas
 */
export function drawHandLandmarksCanvas(ctx, landmarks, gestureResult = null, options = {}) {
  if (!ctx || !landmarks || landmarks.length < 21) return;

  const {
    showConnections = true,
    showJoints = true,
    showPalmFill = true,
    showBoundingBox = true,
    showGestureBadge = true,
    showFingerMeters = false,
    colorScheme = "dynamic", // "dynamic" | "emerald" | "amber" | "cyber"
    isMirrored = false
  } = options;

  ctx.save();

  // 1. Palm Shading / Fill
  if (showPalmFill) {
    ctx.beginPath();
    ctx.moveTo(landmarks[0].x, landmarks[0].y);
    ctx.lineTo(landmarks[1].x, landmarks[1].y);
    ctx.lineTo(landmarks[5].x, landmarks[5].y);
    ctx.lineTo(landmarks[9].x, landmarks[9].y);
    ctx.lineTo(landmarks[13].x, landmarks[13].y);
    ctx.lineTo(landmarks[17].x, landmarks[17].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
    ctx.fill();
  }

  // 2. Bone Skeletal Connectors
  if (showConnections) {
    // Outer glow
    ctx.beginPath();
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.75)";
    for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
      const [from, to] = HAND_CONNECTIONS[i];
      const p1 = landmarks[from];
      const p2 = landmarks[to];
      if (p1 && p2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();

    // Inner bright core
    ctx.beginPath();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    for (let i = 0; i < HAND_CONNECTIONS.length; i++) {
      const [from, to] = HAND_CONNECTIONS[i];
      const p1 = landmarks[from];
      const p2 = landmarks[to];
      if (p1 && p2) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
    }
    ctx.stroke();
  }

  // 3. Joint Landmark Nodes
  if (showJoints) {
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const isFingertip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
      const isWrist = i === 0;

      let jointColor = "#38BDF8"; // Cyan
      if (isWrist) jointColor = "#EC4899"; // Pink
      else if (i <= 4) jointColor = "#F59E0B"; // Thumb (Amber)
      else if (i <= 8) jointColor = "#06B6D4"; // Index (Cyan)
      else if (i <= 12) jointColor = "#6366F1"; // Middle (Indigo)
      else if (i <= 16) jointColor = "#A855F7"; // Ring (Purple)
      else if (i <= 20) jointColor = "#F43F5E"; // Pinky (Rose)

      const radius = isFingertip ? 7 : isWrist ? 8 : 4.5;

      // Radial pulsating ring for fingertips
      if (isFingertip) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = jointColor + "66";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = jointColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    }
  }

  // 4. Bounding Box & Corner Brackets
  if (showBoundingBox && gestureResult?.boundingBox) {
    const box = gestureResult.boundingBox;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);

    // Corner brackets
    const bracketLen = Math.min(20, box.width * 0.2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#38BDF8";
    ctx.lineCap = "round";

    // Top-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + bracketLen);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + bracketLen, box.y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - bracketLen, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + bracketLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - bracketLen);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + bracketLen, box.y + box.height);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - bracketLen, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - bracketLen);
    ctx.stroke();
  }

  // 5. On-Canvas Gesture Badge
  if (showGestureBadge && gestureResult && gestureResult.gestureId !== "UNKNOWN") {
    const wrist = landmarks[0];
    const badgeX = Math.max(16, wrist.x - 60);
    const badgeY = Math.max(30, wrist.y + 35);

    const text = `${gestureResult.emoji || ""} ${gestureResult.name || gestureResult.gestureId}`;
    const subText = `${gestureResult.handedness || "Hand"} • ${Math.round((gestureResult.confidence || 0.95) * 100)}%`;

    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const badgeW = Math.max(textWidth + 24, 130);
    const badgeH = 42;

    // Background pill
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text labels
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, badgeX + 10, badgeY + 18);

    ctx.font = "10px monospace";
    ctx.fillStyle = "#34D399";
    ctx.fillText(subText, badgeX + 10, badgeY + 34);
  }

  ctx.restore();
}
