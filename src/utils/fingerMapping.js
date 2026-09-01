const FINGER_METADATA = {
  thumb: {
    name: "Thumb",
    icon: "\u{1F44D}",
    color: "from-amber-500 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.6)",
    bgLight: "bg-amber-100 text-amber-800 border-amber-300",
    bgDark: "dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
    textColor: "text-amber-500 dark:text-amber-400",
    order: 1
  },
  index: {
    name: "Index",
    icon: "\u261D\uFE0F",
    color: "from-cyan-500 to-blue-500",
    glowColor: "rgba(6, 182, 212, 0.6)",
    bgLight: "bg-cyan-100 text-cyan-800 border-cyan-300",
    bgDark: "dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-700/60",
    textColor: "text-cyan-500 dark:text-cyan-400",
    order: 2
  },
  middle: {
    name: "Middle",
    icon: "\u{1F595}",
    color: "from-indigo-500 to-purple-500",
    glowColor: "rgba(99, 102, 241, 0.6)",
    bgLight: "bg-indigo-100 text-indigo-800 border-indigo-300",
    bgDark: "dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60",
    textColor: "text-indigo-500 dark:text-indigo-400",
    order: 3
  },
  ring: {
    name: "Ring",
    icon: "\u{1F48D}",
    color: "from-purple-500 to-pink-500",
    glowColor: "rgba(168, 85, 247, 0.6)",
    bgLight: "bg-purple-100 text-purple-800 border-purple-300",
    bgDark: "dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60",
    textColor: "text-purple-500 dark:text-purple-400",
    order: 4
  },
  pinky: {
    name: "Pinky",
    icon: "\u{1F919}",
    color: "from-rose-500 to-pink-600",
    glowColor: "rgba(244, 63, 94, 0.6)",
    bgLight: "bg-rose-100 text-rose-800 border-rose-300",
    bgDark: "dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60",
    textColor: "text-rose-500 dark:text-rose-400",
    order: 5
  }
};
const ALPHABET_PROFILES = {
  "A": {
    primaryFingers: ["thumb"],
    activeFingers: ["thumb"],
    movementType: "pulse",
    description: "Thumb extended upright against index side, four fingers curled in a fist.",
    fingers: {
      thumb: { flexion: 0.9, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 220,
    hapticPattern: [35]
  },
  "B": {
    primaryFingers: ["index", "middle", "ring", "pinky"],
    activeFingers: ["index", "middle", "ring", "pinky"],
    movementType: "lift",
    description: "Four fingers extended vertically straight, thumb folded across palm.",
    fingers: {
      thumb: { flexion: 0.15, isActive: false, isLifted: false, role: "curled" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 440,
    hapticPattern: [20, 20, 20]
  },
  "C": {
    primaryFingers: ["thumb", "index", "middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "pinch",
    description: "All five fingers curved gracefully to form a open C arch.",
    fingers: {
      thumb: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 330,
    hapticPattern: [25, 25]
  },
  "D": {
    primaryFingers: ["index"],
    activeFingers: ["index", "thumb", "middle", "ring", "pinky"],
    movementType: "lift",
    description: "Index finger pointing straight up; thumb touches tips of middle, ring, pinky in an O-ring.",
    fingers: {
      thumb: { flexion: 0.45, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.35, isActive: false, isLifted: false, role: "touching" },
      ring: { flexion: 0.35, isActive: false, isLifted: false, role: "touching" },
      pinky: { flexion: 0.35, isActive: false, isLifted: false, role: "touching" }
    },
    soundPitch: 520,
    hapticPattern: [40, 15]
  },
  "E": {
    primaryFingers: ["index", "middle", "ring", "pinky"],
    activeFingers: ["index", "middle", "ring", "pinky", "thumb"],
    movementType: "pulse",
    description: "All fingers curled tightly at knuckles with fingertips resting on the thumb.",
    fingers: {
      thumb: { flexion: 0.2, isActive: true, isLifted: false, role: "anchor" },
      index: { flexion: 0.3, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.3, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.3, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.3, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 300,
    hapticPattern: [20]
  },
  "F": {
    primaryFingers: ["middle", "ring", "pinky"],
    activeFingers: ["index", "thumb", "middle", "ring", "pinky"],
    movementType: "lift",
    description: "Index and thumb form an OK circle, remaining three fingers splay upward.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 0.4, isActive: true, isLifted: false, role: "touching" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 480,
    hapticPattern: [15, 15, 30]
  },
  "G": {
    primaryFingers: ["thumb", "index"],
    activeFingers: ["thumb", "index"],
    movementType: "pulse",
    description: "Index finger and thumb pointing horizontally parallel, like holding a thin slice.",
    fingers: {
      thumb: { flexion: 0.85, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.9, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 370,
    hapticPattern: [30, 20]
  },
  "H": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["index", "middle", "thumb"],
    movementType: "lift",
    description: "Index and middle fingers extended together horizontally.",
    fingers: {
      thumb: { flexion: 0.3, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 410,
    hapticPattern: [25, 25]
  },
  "I": {
    primaryFingers: ["pinky"],
    activeFingers: ["pinky"],
    movementType: "lift",
    description: "Pinky finger extended straight up, other fingers folded into a fist with thumb across.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 680,
    hapticPattern: [45]
  },
  "J": {
    primaryFingers: ["pinky"],
    activeFingers: ["pinky"],
    movementType: "wave",
    description: "Pinky finger extended and swoops in a smooth downward J-curve in the air.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 650,
    hapticPattern: [20, 20, 40]
  },
  "K": {
    primaryFingers: ["index", "middle", "thumb"],
    activeFingers: ["index", "middle", "thumb"],
    movementType: "lift",
    description: "Index pointing straight up, middle finger forward, thumb wedged between.",
    fingers: {
      thumb: { flexion: 0.75, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.7, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 460,
    hapticPattern: [30, 20]
  },
  "L": {
    primaryFingers: ["thumb", "index"],
    activeFingers: ["thumb", "index"],
    movementType: "lift",
    description: "Thumb and index finger open at a crisp 90\xB0 right angle forming the letter L.",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 500,
    hapticPattern: [35, 20]
  },
  "M": {
    primaryFingers: ["index", "middle", "ring"],
    activeFingers: ["thumb", "index", "middle", "ring"],
    movementType: "pulse",
    description: "Thumb placed tucked under the first three fingers (index, middle, ring).",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "anchor" },
      index: { flexion: 0.25, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.25, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.25, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 260,
    hapticPattern: [15, 15, 15]
  },
  "N": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["thumb", "index", "middle"],
    movementType: "pulse",
    description: "Thumb tucked under index and middle fingers.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "anchor" },
      index: { flexion: 0.25, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.25, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 280,
    hapticPattern: [20, 20]
  },
  "O": {
    primaryFingers: ["thumb", "index", "middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "pinch",
    description: "All fingertips curve and meet the thumb tip to form a full circle O.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 350,
    hapticPattern: [30]
  },
  "P": {
    primaryFingers: ["index", "middle", "thumb"],
    activeFingers: ["index", "middle", "thumb"],
    movementType: "pulse",
    description: "Downward-angled K handshape with index pointing forward and middle pointing down.",
    fingers: {
      thumb: { flexion: 0.7, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.9, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 320,
    hapticPattern: [25, 20]
  },
  "Q": {
    primaryFingers: ["thumb", "index"],
    activeFingers: ["thumb", "index"],
    movementType: "pulse",
    description: "G handshape pointing downward with thumb and index fingers spread.",
    fingers: {
      thumb: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 340,
    hapticPattern: [25, 20]
  },
  "R": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["index", "middle"],
    movementType: "lift",
    description: "Index and middle fingers crossed over one another (good luck gesture).",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 430,
    hapticPattern: [20, 30]
  },
  "S": {
    primaryFingers: ["thumb"],
    activeFingers: ["thumb"],
    movementType: "pulse",
    description: "Tight fist with the thumb wrapped firmly across the front of all curled fingers.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 240,
    hapticPattern: [40]
  },
  "T": {
    primaryFingers: ["thumb", "index"],
    activeFingers: ["thumb", "index", "middle"],
    movementType: "pulse",
    description: "Thumb tucked between index and middle fingers of a closed fist.",
    fingers: {
      thumb: { flexion: 0.6, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.2, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 290,
    hapticPattern: [30]
  },
  "U": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["index", "middle"],
    movementType: "lift",
    description: "Index and middle fingers extended vertically straight and pressed together.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 470,
    hapticPattern: [25, 25]
  },
  "V": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["index", "middle"],
    movementType: "lift",
    description: "Index and middle fingers spread in a V (Peace / Victory sign).",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 510,
    hapticPattern: [30, 30]
  },
  "W": {
    primaryFingers: ["index", "middle", "ring"],
    activeFingers: ["index", "middle", "ring"],
    movementType: "lift",
    description: "Three fingers (index, middle, ring) extended upward in a wide W formation.",
    fingers: {
      thumb: { flexion: 0.3, isActive: false, isLifted: false, role: "touching" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.2, isActive: false, isLifted: false, role: "touching" }
    },
    soundPitch: 550,
    hapticPattern: [20, 20, 20]
  },
  "X": {
    primaryFingers: ["index"],
    activeFingers: ["index"],
    movementType: "hook",
    description: "Index finger hooked/crooked like a key or pirate hook, others closed.",
    fingers: {
      thumb: { flexion: 0.3, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 400,
    hapticPattern: [35]
  },
  "Y": {
    primaryFingers: ["thumb", "pinky"],
    activeFingers: ["thumb", "pinky"],
    movementType: "lift",
    description: "Thumb and pinky outstretched wide (Shaka / phone call posture).",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 600,
    hapticPattern: [40, 20, 40]
  },
  "Z": {
    primaryFingers: ["index"],
    activeFingers: ["index"],
    movementType: "wave",
    description: "Index finger extended tracing a dynamic zigzag Z stroke in the air.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 580,
    hapticPattern: [15, 15, 15, 30]
  }
};
const NUMBER_PROFILES = {
  "0": {
    primaryFingers: ["thumb", "index", "middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "pinch",
    description: "O shape with all fingertips touching thumb tip.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 300,
    hapticPattern: [30]
  },
  "1": {
    primaryFingers: ["index"],
    activeFingers: ["index"],
    movementType: "lift",
    description: "Index finger extended upward.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 380,
    hapticPattern: [35]
  },
  "2": {
    primaryFingers: ["index", "middle"],
    activeFingers: ["index", "middle"],
    movementType: "lift",
    description: "Index and middle fingers extended upward.",
    fingers: {
      thumb: { flexion: 0.2, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 420,
    hapticPattern: [25, 25]
  },
  "3": {
    primaryFingers: ["thumb", "index", "middle"],
    activeFingers: ["thumb", "index", "middle"],
    movementType: "lift",
    description: "Thumb, index, and middle fingers extended (ASL 3).",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 460,
    hapticPattern: [20, 20, 20]
  },
  "4": {
    primaryFingers: ["index", "middle", "ring", "pinky"],
    activeFingers: ["index", "middle", "ring", "pinky"],
    movementType: "lift",
    description: "Four fingers extended upward, thumb tucked in palm.",
    fingers: {
      thumb: { flexion: 0.1, isActive: false, isLifted: false, role: "anchor" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 500,
    hapticPattern: [15, 15, 15, 15]
  },
  "5": {
    primaryFingers: ["thumb", "index", "middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "lift",
    description: "All five fingers spread open and extended.",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 540,
    hapticPattern: [40, 20]
  },
  "6": {
    primaryFingers: ["index", "middle", "ring"],
    activeFingers: ["thumb", "pinky", "index", "middle", "ring"],
    movementType: "pinch",
    description: "Thumb touches pinky tip, other three fingers up.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 0.4, isActive: true, isLifted: false, role: "touching" }
    },
    soundPitch: 480,
    hapticPattern: [20, 30]
  },
  "7": {
    primaryFingers: ["index", "middle", "pinky"],
    activeFingers: ["thumb", "ring", "index", "middle", "pinky"],
    movementType: "pinch",
    description: "Thumb touches ring finger tip, three fingers up.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.4, isActive: true, isLifted: false, role: "touching" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 520,
    hapticPattern: [20, 30]
  },
  "8": {
    primaryFingers: ["index", "ring", "pinky"],
    activeFingers: ["thumb", "middle", "index", "ring", "pinky"],
    movementType: "pinch",
    description: "Thumb touches middle finger tip, three fingers up.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.4, isActive: true, isLifted: false, role: "touching" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 560,
    hapticPattern: [20, 30]
  },
  "9": {
    primaryFingers: ["middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "pinch",
    description: "Thumb touches index finger tip, three fingers up (F handshape).",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: false, role: "touching" },
      index: { flexion: 0.4, isActive: true, isLifted: false, role: "touching" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 600,
    hapticPattern: [20, 30]
  }
};
const WORD_PROFILES = {
  "Hello": {
    primaryFingers: ["thumb", "index", "middle", "ring", "pinky"],
    activeFingers: ["thumb", "index", "middle", "ring", "pinky"],
    movementType: "wave",
    description: "Open palm salute moving gracefully outward from forehead.",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 520,
    hapticPattern: [30, 20, 40]
  },
  "I Love You": {
    primaryFingers: ["thumb", "index", "pinky"],
    activeFingers: ["thumb", "index", "pinky"],
    movementType: "lift",
    description: "Thumb, index, and pinky fingers extended together (ILY gesture).",
    fingers: {
      thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 640,
    hapticPattern: [20, 20, 50]
  },
  "Thank You": {
    primaryFingers: ["index", "middle", "ring", "pinky", "thumb"],
    activeFingers: ["index", "middle", "ring", "pinky", "thumb"],
    movementType: "wave",
    description: "Flat open fingertips from chin moving gently forward.",
    fingers: {
      thumb: { flexion: 0.9, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
    },
    soundPitch: 480,
    hapticPattern: [25, 25]
  },
  "Yes": {
    primaryFingers: ["thumb"],
    activeFingers: ["thumb"],
    movementType: "pulse",
    description: "S-fist nods up and down at the wrist.",
    fingers: {
      thumb: { flexion: 0.5, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      middle: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 350,
    hapticPattern: [40, 20, 40]
  },
  "No": {
    primaryFingers: ["index", "middle", "thumb"],
    activeFingers: ["index", "middle", "thumb"],
    movementType: "pinch",
    description: "Index and middle fingers snap down against thumb.",
    fingers: {
      thumb: { flexion: 0.7, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      ring: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.1, isActive: false, isLifted: false, role: "curled" }
    },
    soundPitch: 400,
    hapticPattern: [30, 15, 30]
  }
};
function getFingerProfileForSign(signName) {
  const upper = signName.toUpperCase().trim();
  if (ALPHABET_PROFILES[upper]) {
    const raw = ALPHABET_PROFILES[upper];
    return {
      name: upper,
      category: "alphabet",
      primaryFingers: raw.primaryFingers || ["index"],
      activeFingers: raw.activeFingers || ["index"],
      fingers: raw.fingers || getDefaultFingers(),
      description: raw.description || `Sign gesture for letter ${upper}`,
      movementType: raw.movementType || "lift",
      hapticPattern: raw.hapticPattern || [25],
      soundPitch: raw.soundPitch || 440
    };
  }
  if (NUMBER_PROFILES[signName]) {
    const raw = NUMBER_PROFILES[signName];
    return {
      name: signName,
      category: "number",
      primaryFingers: raw.primaryFingers || ["index"],
      activeFingers: raw.activeFingers || ["index"],
      fingers: raw.fingers || getDefaultFingers(),
      description: raw.description || `Sign digit for ${signName}`,
      movementType: raw.movementType || "lift",
      hapticPattern: raw.hapticPattern || [25],
      soundPitch: raw.soundPitch || 440
    };
  }
  const matchedWordKey = Object.keys(WORD_PROFILES).find(
    (k) => k.toLowerCase() === signName.toLowerCase()
  );
  if (matchedWordKey) {
    const raw = WORD_PROFILES[matchedWordKey];
    return {
      name: matchedWordKey,
      category: "word",
      primaryFingers: raw.primaryFingers || ["thumb", "index"],
      activeFingers: raw.activeFingers || ["thumb", "index"],
      fingers: raw.fingers || getDefaultFingers(),
      description: raw.description || `Sign gesture for "${matchedWordKey}"`,
      movementType: raw.movementType || "wave",
      hapticPattern: raw.hapticPattern || [30, 20],
      soundPitch: raw.soundPitch || 480
    };
  }
  return {
    name: signName,
    category: "alphabet",
    primaryFingers: ["index"],
    activeFingers: ["index", "thumb"],
    fingers: {
      thumb: { flexion: 0.8, isActive: true, isLifted: true, role: "primary" },
      index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
      middle: { flexion: 0.3, isActive: false, isLifted: false, role: "curled" },
      ring: { flexion: 0.2, isActive: false, isLifted: false, role: "curled" },
      pinky: { flexion: 0.2, isActive: false, isLifted: false, role: "curled" }
    },
    description: `Dynamic hand articulation for "${signName}"`,
    movementType: "lift",
    hapticPattern: [25],
    soundPitch: 440
  };
}
function getDefaultFingers() {
  return {
    thumb: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
    index: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
    middle: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
    ring: { flexion: 1, isActive: true, isLifted: true, role: "primary" },
    pinky: { flexion: 1, isActive: true, isLifted: true, role: "primary" }
  };
}
function triggerHapticFeedback(pattern = [25], soundFreq = 440, soundEnabled = true) {
  try {
    if (typeof window !== "undefined" && "navigator" in window && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch (e) {
  }
  if (soundEnabled && typeof window !== "undefined") {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(soundFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(soundFreq * 0.5, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
        setTimeout(() => {
          ctx.close().catch(() => {
          });
        }, 120);
      }
    } catch (e) {
    }
  }
}
export {
  FINGER_METADATA,
  getFingerProfileForSign,
  triggerHapticFeedback
};
