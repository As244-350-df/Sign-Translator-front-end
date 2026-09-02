import { tfjsClassifier } from "./tfjsModel";
import { mediaPipeTracker } from "./mediaPipeTracker";
const PHYSICS_PRESETS = {
  biological: {
    stiffness: 1.15,
    damping: 0.72,
    tendonCoupling: 0.35,
    massInertia: 0.4,
    softCollision: true,
    volumetric3D: true,
    oneEuroFilter: true
  },
  snappy: {
    stiffness: 1.85,
    damping: 0.65,
    tendonCoupling: 0.15,
    massInertia: 0.25,
    softCollision: true,
    volumetric3D: true,
    oneEuroFilter: true
  },
  fluid: {
    stiffness: 0.75,
    damping: 0.88,
    tendonCoupling: 0.55,
    massInertia: 0.65,
    softCollision: true,
    volumetric3D: true,
    oneEuroFilter: true
  },
  precision: {
    stiffness: 2.5,
    damping: 0.98,
    tendonCoupling: 0,
    massInertia: 0.12,
    softCollision: false,
    volumetric3D: true,
    oneEuroFilter: true
  }
};
const BASE_SIGN_DICTIONARY = {
  // ==================== ALPHABET (A - Z) ====================
  "A": {
    symbol: "\u{1F170}\uFE0F",
    signName: "LETTER A (ASL)",
    translatedText: "A",
    meaning: "Closed fist with thumb resting upright on the side of index finger.",
    category: "alphabet",
    confidence: 0.98,
    aslNotation: "Fist with thumb resting upright on index side",
    fingerConfig: { thumb: 0.9, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "B": {
    symbol: "\u{1F171}\uFE0F",
    signName: "LETTER B (ASL)",
    translatedText: "B",
    meaning: "Four fingers extended vertically straight, thumb folded across palm.",
    category: "alphabet",
    confidence: 0.98,
    aslNotation: "Four fingers up, thumb folded flat against palm",
    fingerConfig: { thumb: 0.05, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "C": {
    symbol: "\xA9\uFE0F",
    signName: "LETTER C (ASL)",
    translatedText: "C",
    meaning: "All five fingers curved to form an open C arch.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Curved fingers and thumb forming an open C shape",
    fingerConfig: { thumb: 0.55, index: 0.55, middle: 0.55, ring: 0.55, pinky: 0.55 }
  },
  "D": {
    symbol: "\u{1F1E9}",
    signName: "LETTER D (ASL)",
    translatedText: "D",
    meaning: "Index finger pointing straight up; thumb touches tips of middle, ring, pinky in a loop.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Index up, thumb touches middle/ring/pinky tips in loop",
    fingerConfig: { thumb: 0.4, index: 1, middle: 0.25, ring: 0.25, pinky: 0.25 }
  },
  "E": {
    symbol: "\u{1F1EA}",
    signName: "LETTER E (ASL)",
    translatedText: "E",
    meaning: "Fingers curled inward with fingertips resting directly above folded thumb.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Curled fingers resting above bent thumb",
    fingerConfig: { thumb: 0.25, index: 0.25, middle: 0.25, ring: 0.25, pinky: 0.25 }
  },
  "F": {
    symbol: "\u{1F1EB}",
    signName: "LETTER F (ASL)",
    translatedText: "F",
    meaning: "Thumb tip touches index tip forming a circle (OK sign), remaining three fingers fan upward.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Thumb and index form circle, 3 fingers up",
    fingerConfig: { thumb: 0.35, index: 0.35, middle: 1, ring: 1, pinky: 1 }
  },
  "G": {
    symbol: "\u{1F1EC}",
    signName: "LETTER G (ASL)",
    translatedText: "G",
    meaning: "Index finger and thumb pointing horizontally parallel, like holding a thin slice.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Horizontal index and thumb parallel pinch",
    fingerConfig: { thumb: 0.7, index: 0.85, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "H": {
    symbol: "\u{1F1ED}",
    signName: "LETTER H (ASL)",
    translatedText: "H",
    meaning: "Index and middle fingers extended horizontally together.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Index and middle extended horizontal together",
    fingerConfig: { thumb: 0.2, index: 0.95, middle: 0.95, ring: 0.05, pinky: 0.05 }
  },
  "I": {
    symbol: "\u{1F1EE}",
    signName: "LETTER I (ASL)",
    translatedText: "I",
    meaning: "Pinky finger extended upright, other fingers closed into a fist with thumb across.",
    category: "alphabet",
    confidence: 0.98,
    aslNotation: "Pinky up tall, others closed into fist",
    fingerConfig: { thumb: 0.15, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1 }
  },
  "J": {
    symbol: "\u{1F1EF}",
    signName: "LETTER J (ASL)",
    translatedText: "J",
    meaning: "Pinky finger extended upright and traces a J curve downward in the air.",
    category: "alphabet",
    confidence: 0.95,
    aslNotation: "Pinky finger extended tracing J curve",
    fingerConfig: { thumb: 0.15, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1 }
  },
  "K": {
    symbol: "\u{1F1F0}",
    signName: "LETTER K (ASL)",
    translatedText: "K",
    meaning: "Index finger up, middle finger angled forward, thumb wedged between them.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Index up, middle angled forward with thumb wedge",
    fingerConfig: { thumb: 0.55, index: 1, middle: 0.75, ring: 0.05, pinky: 0.05 }
  },
  "L": {
    symbol: "\u{1F1F1}",
    signName: "LETTER L (ASL)",
    translatedText: "L",
    meaning: "Index finger points straight up, thumb extends horizontally at 90\xB0 angle.",
    category: "alphabet",
    confidence: 0.99,
    aslNotation: "Index up, thumb out horizontally forming 90\xB0 L",
    fingerConfig: { thumb: 1, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "M": {
    symbol: "\u{1F1F2}",
    signName: "LETTER M (ASL)",
    translatedText: "M",
    meaning: "Thumb tucked under index, middle, and ring fingers of closed fist.",
    category: "alphabet",
    confidence: 0.94,
    aslNotation: "Thumb tucked under three fingers",
    fingerConfig: { thumb: 0.3, index: 0.2, middle: 0.2, ring: 0.2, pinky: 0.05 }
  },
  "N": {
    symbol: "\u{1F1F3}",
    signName: "LETTER N (ASL)",
    translatedText: "N",
    meaning: "Thumb tucked under index and middle fingers of closed fist.",
    category: "alphabet",
    confidence: 0.95,
    aslNotation: "Thumb tucked under two fingers",
    fingerConfig: { thumb: 0.3, index: 0.2, middle: 0.2, ring: 0.05, pinky: 0.05 }
  },
  "O": {
    symbol: "\u{1F1F4}",
    signName: "LETTER O (ASL)",
    translatedText: "O",
    meaning: "All fingertips touch thumb tip forming a circular O ring.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "All fingertips touching thumb tip in circle",
    fingerConfig: { thumb: 0.45, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45 }
  },
  "P": {
    symbol: "\u{1F1F5}",
    signName: "LETTER P (ASL)",
    translatedText: "P",
    meaning: "K-handshape pointing downward.",
    category: "alphabet",
    confidence: 0.95,
    aslNotation: "K-shape oriented pointing downward",
    fingerConfig: { thumb: 0.5, index: 0.9, middle: 0.7, ring: 0.05, pinky: 0.05 }
  },
  "Q": {
    symbol: "\u{1F1F6}",
    signName: "LETTER Q (ASL)",
    translatedText: "Q",
    meaning: "G-handshape pointing downward.",
    category: "alphabet",
    confidence: 0.95,
    aslNotation: "G-shape oriented pointing downward",
    fingerConfig: { thumb: 0.65, index: 0.8, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "R": {
    symbol: "\u{1F1F7}",
    signName: "LETTER R (ASL)",
    translatedText: "R",
    meaning: "Index and middle fingers crossed over each other (good luck gesture).",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Index and middle fingers crossed tightly",
    fingerConfig: { thumb: 0.15, index: 0.95, middle: 0.95, ring: 0.05, pinky: 0.05 }
  },
  "S": {
    symbol: "\u{1F1F8}",
    signName: "LETTER S (ASL)",
    translatedText: "S",
    meaning: "Solid fist with thumb folded across the front of fingers.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Fist with thumb wrapped across front",
    fingerConfig: { thumb: 0.05, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "T": {
    symbol: "\u{1F1F9}",
    signName: "LETTER T (ASL)",
    translatedText: "T",
    meaning: "Thumb tucked between index and middle fingers of closed fist.",
    category: "alphabet",
    confidence: 0.95,
    aslNotation: "Thumb wedged between index & middle",
    fingerConfig: { thumb: 0.45, index: 0.15, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "U": {
    symbol: "\u{1F1FA}",
    signName: "LETTER U (ASL)",
    translatedText: "U",
    meaning: "Index and middle fingers extended vertically straight and joined together.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Index and middle held straight up together",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 0.05, pinky: 0.05 }
  },
  "V": {
    symbol: "\u{1F1FB}",
    signName: "LETTER V (ASL)",
    translatedText: "V",
    meaning: "Index and middle fingers spread in a V (Peace / Victory sign).",
    category: "alphabet",
    confidence: 0.98,
    aslNotation: "Index and middle spread apart in V shape",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 0.05, pinky: 0.05 }
  },
  "W": {
    symbol: "\u{1F1FC}",
    signName: "LETTER W (ASL)",
    translatedText: "W",
    meaning: "Three fingers (index, middle, ring) extended upward in wide W formation.",
    category: "alphabet",
    confidence: 0.97,
    aslNotation: "Index, middle, and ring extended upward in W",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 1, pinky: 0.05 }
  },
  "X": {
    symbol: "\u{1F1FD}",
    signName: "LETTER X (ASL)",
    translatedText: "X",
    meaning: "Index finger hooked/crooked like a key or hook, others closed in fist.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Index bent into hook, other fingers folded",
    fingerConfig: { thumb: 0.25, index: 0.5, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "Y": {
    symbol: "\u{1F1FE}",
    signName: "LETTER Y (ASL)",
    translatedText: "Y",
    meaning: "Thumb and pinky outstretched wide (Shaka / Phone posture).",
    category: "alphabet",
    confidence: 0.99,
    aslNotation: "Thumb and pinky extended, middle 3 folded",
    fingerConfig: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1 }
  },
  "Z": {
    symbol: "\u{1F1FF}",
    signName: "LETTER Z (ASL)",
    translatedText: "Z",
    meaning: "Index finger extended tracing a dynamic zigzag Z stroke in the air.",
    category: "alphabet",
    confidence: 0.96,
    aslNotation: "Index finger pointing up and tracing Z path",
    fingerConfig: { thumb: 0.15, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  // ==================== NUMBERS (0 - 9) ====================
  "0": {
    symbol: "0\uFE0F\u20E3",
    signName: "NUMBER 0 (ASL)",
    translatedText: "0",
    meaning: "O shape with all fingertips touching thumb tip.",
    category: "numbers",
    confidence: 0.97,
    aslNotation: "All 5 fingers touch in circular O-shape",
    fingerConfig: { thumb: 0.45, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45 }
  },
  "1": {
    symbol: "1\uFE0F\u20E3",
    signName: "NUMBER 1 (ASL)",
    translatedText: "1",
    meaning: "Index finger extended straight up.",
    category: "numbers",
    confidence: 0.98,
    aslNotation: "Index finger extended upward, others curled",
    fingerConfig: { thumb: 0.15, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "2": {
    symbol: "2\uFE0F\u20E3",
    signName: "NUMBER 2 (ASL)",
    translatedText: "2",
    meaning: "Index and middle fingers extended upward.",
    category: "numbers",
    confidence: 0.98,
    aslNotation: "Index and middle fingers extended up",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 0.05, pinky: 0.05 }
  },
  "3": {
    symbol: "3\uFE0F\u20E3",
    signName: "NUMBER 3 (ASL)",
    translatedText: "3",
    meaning: "Thumb, index, and middle fingers extended.",
    category: "numbers",
    confidence: 0.97,
    aslNotation: "Thumb, index, and middle extended up (ASL 3)",
    fingerConfig: { thumb: 1, index: 1, middle: 1, ring: 0.05, pinky: 0.05 }
  },
  "4": {
    symbol: "4\uFE0F\u20E3",
    signName: "NUMBER 4 (ASL)",
    translatedText: "4",
    meaning: "Four fingers extended upward, thumb tucked in palm.",
    category: "numbers",
    confidence: 0.98,
    aslNotation: "Four fingers standing tall, thumb tucked",
    fingerConfig: { thumb: 0.05, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "5": {
    symbol: "5\uFE0F\u20E3",
    signName: "NUMBER 5 (ASL)",
    translatedText: "5",
    meaning: "All five fingers spread open and extended.",
    category: "numbers",
    confidence: 0.99,
    aslNotation: "All 5 fingers open and extended wide",
    fingerConfig: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "6": {
    symbol: "6\uFE0F\u20E3",
    signName: "NUMBER 6 (ASL)",
    translatedText: "6",
    meaning: "Thumb touches pinky tip, other three fingers upright.",
    category: "numbers",
    confidence: 0.96,
    aslNotation: "Thumb tip touches pinky tip, index/middle/ring up",
    fingerConfig: { thumb: 0.45, index: 1, middle: 1, ring: 1, pinky: 0.35 }
  },
  "7": {
    symbol: "7\uFE0F\u20E3",
    signName: "NUMBER 7 (ASL)",
    translatedText: "7",
    meaning: "Thumb touches ring finger tip, other three fingers upright.",
    category: "numbers",
    confidence: 0.96,
    aslNotation: "Thumb tip touches ring tip, index/middle/pinky up",
    fingerConfig: { thumb: 0.45, index: 1, middle: 1, ring: 0.35, pinky: 1 }
  },
  "8": {
    symbol: "8\uFE0F\u20E3",
    signName: "NUMBER 8 (ASL)",
    translatedText: "8",
    meaning: "Thumb touches middle finger tip, other three fingers upright.",
    category: "numbers",
    confidence: 0.96,
    aslNotation: "Thumb tip touches middle tip, index/ring/pinky up",
    fingerConfig: { thumb: 0.45, index: 1, middle: 0.35, ring: 1, pinky: 1 }
  },
  "9": {
    symbol: "9\uFE0F\u20E3",
    signName: "NUMBER 9 (ASL)",
    translatedText: "9",
    meaning: "Thumb touches index finger tip, other three fingers upright (F handshape).",
    category: "numbers",
    confidence: 0.96,
    aslNotation: "Thumb tip touches index tip, middle/ring/pinky up",
    fingerConfig: { thumb: 0.35, index: 0.35, middle: 1, ring: 1, pinky: 1 }
  },
  // ==================== BASIC CONVERSATIONAL WORDS & GREETINGS ====================
  "HELLO": {
    symbol: "\u{1F590}\uFE0F",
    signName: "HELLO / OPEN HAND",
    translatedText: "Hello",
    meaning: "Standard friendly greeting, wave, or open hand with all 5 fingers extended.",
    category: "greetings",
    confidence: 0.98,
    aslNotation: "All 5 fingers fully extended and spread outward",
    fingerConfig: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "THANK_YOU": {
    symbol: "\u{1F64F}",
    signName: "THANK YOU / GRATITUDE",
    translatedText: "Thank you",
    meaning: "Polite expression of gratitude and appreciation towards the speaker.",
    category: "greetings",
    confidence: 0.97,
    aslNotation: "Flat hand moving forward from chin or chest",
    fingerConfig: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "PLEASE": {
    symbol: "\u{1F932}",
    signName: "PLEASE / COURTESY",
    translatedText: "Please",
    meaning: "Polite request indicating courtesy and respect.",
    category: "greetings",
    confidence: 0.96,
    aslNotation: "Flat hand rubbing in a circular motion on the chest",
    fingerConfig: { thumb: 0.7, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "YES": {
    symbol: "\u270A",
    signName: "YES / FIST NOD",
    translatedText: "Yes",
    meaning: "Fist nod indicating agreement or affirmative confirmation in ASL.",
    category: "common",
    confidence: 0.97,
    aslNotation: "All fingers closed tightly into solid fist (S-hand)",
    fingerConfig: { thumb: 0.05, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "NO": {
    symbol: "\u{1F44E}",
    signName: "NO / DISAGREE / SNAP",
    translatedText: "No",
    meaning: "Index and middle fingers snap down against thumb to express refusal or disagreement.",
    category: "common",
    confidence: 0.96,
    aslNotation: "Index and middle fingers tap thumb shut",
    fingerConfig: { thumb: 0.65, index: 0.75, middle: 0.75, ring: 0.05, pinky: 0.05 }
  },
  "HELP": {
    symbol: "\u{1FA7A}",
    signName: "HELP / EMERGENCY (ASL)",
    translatedText: "Help",
    meaning: "Urgent assistance or immediate support requested.",
    category: "emergency",
    confidence: 0.99,
    aslNotation: "Thumbs up resting on flat palm lifted upward",
    fingerConfig: { thumb: 1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 }
  },
  "I_LOVE_YOU": {
    symbol: "\u{1F91F}",
    signName: "I LOVE YOU (ASL)",
    translatedText: "I love you",
    meaning: "Universal sign expressing love and care in American Sign Language (combines letters I, L, Y).",
    category: "common",
    confidence: 0.99,
    aslNotation: "Thumb + Index + Pinky extended, Middle + Ring folded tight",
    fingerConfig: { thumb: 1, index: 1, middle: 0.05, ring: 0.05, pinky: 1 }
  },
  "GOOD": {
    symbol: "\u{1F44D}",
    signName: "GOOD / THUMBS UP / CONFIRMED",
    translatedText: "Good",
    meaning: "Positive affirmation, agreement, confirmation, or satisfaction.",
    category: "common",
    confidence: 0.98,
    aslNotation: "Thumb extended upwards, other four fingers curled into fist",
    fingerConfig: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "FRIEND": {
    symbol: "\u{1F91D}",
    signName: "FRIEND / COMPANION",
    translatedText: "Friend",
    meaning: "Close companion, ally, or trusted personal acquaintance.",
    category: "common",
    confidence: 0.96,
    aslNotation: "Hooked X-index fingers clasping together forward and reversed",
    fingerConfig: { thumb: 0.35, index: 0.65, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "WATER": {
    symbol: "\u{1F4A7}",
    signName: "WATER (ASL: W)",
    translatedText: "Water",
    meaning: "Requesting water or a drink (ASL letter W tapped at chin).",
    category: "common",
    confidence: 0.96,
    aslNotation: "Index, Middle, and Ring fingers extended up; Thumb touches Pinky",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 1, pinky: 0.05 }
  },
  "STOP": {
    symbol: "\u{1F6D1}",
    signName: "STOP / HALT",
    translatedText: "Stop",
    meaning: "Instruction to halt immediately or cease an action.",
    category: "emergency",
    confidence: 0.98,
    aslNotation: "Flat dominant hand chopping down into flat base palm",
    fingerConfig: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 }
  },
  "SORRY": {
    symbol: "\u{1F614}",
    signName: "SORRY / APOLOGY (ASL: A-Fist)",
    translatedText: "Sorry",
    meaning: "Sincere apology, regret, or forgiveness request.",
    category: "greetings",
    confidence: 0.96,
    aslNotation: "A-fist handshape rubbing in a circle over the heart",
    fingerConfig: { thumb: 0.3, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "EAT": {
    symbol: "\u{1F37D}\uFE0F",
    signName: "EAT / FOOD",
    translatedText: "Eat",
    meaning: "Desire to eat or request food sustenance.",
    category: "actions",
    confidence: 0.95,
    aslNotation: "Flattened O handshape touching near mouth",
    fingerConfig: { thumb: 0.45, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45 }
  },
  "MORE": {
    symbol: "\u2795",
    signName: "MORE / ADDITIONAL",
    translatedText: "More",
    meaning: "Requesting more items, continued activity, or additional amount.",
    category: "common",
    confidence: 0.95,
    aslNotation: "Both flattened O hands tapping fingertips together",
    fingerConfig: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 }
  },
  "WHERE": {
    symbol: "\u2753",
    signName: "WHERE / LOCATION QUESTION",
    translatedText: "Where?",
    meaning: "Question asking for the location, position, or direction of something.",
    category: "actions",
    confidence: 0.95,
    aslNotation: "Index finger pointing up and oscillating side to side",
    fingerConfig: { thumb: 0.15, index: 1, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  "DOCTOR": {
    symbol: "\u{1FA7A}",
    signName: "DOCTOR / MEDICAL",
    translatedText: "Doctor",
    meaning: "Physician, medical professional, hospital, or healthcare practitioner.",
    category: "emergency",
    confidence: 0.96,
    aslNotation: "Bent fingertips tapping the pulse on upturned wrist",
    fingerConfig: { thumb: 0.35, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.05 }
  },
  "FAMILY": {
    symbol: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
    signName: "FAMILY / RELATIVES",
    translatedText: "Family",
    meaning: "Family members, household, relatives, or community.",
    category: "family",
    confidence: 0.96,
    aslNotation: "F-hands circling outward from index/thumbs to pinkies touching",
    fingerConfig: { thumb: 0.35, index: 0.35, middle: 1, ring: 1, pinky: 1 }
  },
  "CALL_ME": {
    symbol: "\u{1F919}",
    signName: "CALL ME / PHONE (ASL: Y)",
    translatedText: "Call me",
    meaning: "Phone communication request or shaka sign.",
    category: "actions",
    confidence: 0.98,
    aslNotation: "Thumb and Pinky extended outward, middle three fingers folded",
    fingerConfig: { thumb: 1, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1 }
  },
  "OKAY": {
    symbol: "\u{1F44C}",
    signName: "OKAY / PERFECT (ASL: F)",
    translatedText: "Okay / Perfect",
    meaning: "Approval, perfection, all good, or agreement.",
    category: "common",
    confidence: 0.96,
    aslNotation: "Thumb tip touches Index tip forming a circle; other 3 fingers extended",
    fingerConfig: { thumb: 0.35, index: 0.35, middle: 1, ring: 1, pinky: 1 }
  },
  "PEACE": {
    symbol: "\u270C\uFE0F",
    signName: "PEACE / VICTORY (ASL: V)",
    translatedText: "Peace",
    meaning: "Signifies peace, victory, or goodwill.",
    category: "common",
    confidence: 0.97,
    aslNotation: "Index and Middle extended in V-shape, others curled",
    fingerConfig: { thumb: 0.15, index: 1, middle: 1, ring: 0.05, pinky: 0.05 }
  }
};
const STORAGE_KEY = "convo_custom_hand_signs_v3";
function loadSavedCustomSigns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}
function saveCustomSignsToStorage(signs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signs));
  } catch (e) {
    console.error("Failed to persist custom hand signs:", e);
  }
}
let SIGN_DICTIONARY = {
  ...BASE_SIGN_DICTIONARY,
  ...loadSavedCustomSigns()
};
class RealtimeHandTracker {
  videoElement = null;
  canvasElement = null;
  offscreenCanvas;
  offscreenCtx;
  lastFrameTime = performance.now();
  fps = 60;
  smoothedLandmarks = [];
  // Real-time Gesture State & Hold-to-commit duration
  currentSignKey = "HELLO";
  lastCommittedSignKey = "";
  signHoldStartTime = performance.now();
  HOLD_DURATION_MS = 700;
  customSigns = {};
  // Hand Position Filtering
  smoothTargetX = 0;
  smoothTargetY = 0;
  smoothHandSpan = 150;
  // Optical Zoom, Pan Offset & Hand Alignment Calibration
  zoomLevel = 1;
  panOffsetX = 0;
  // -1 to 1 normalized
  panOffsetY = 0;
  // -1 to 1 normalized
  calibrationScale = 1;
  // 0.7 to 1.4 fine-tuning
  autoCenterEnabled = false;
  lastHandSeenTime = 0;
  // Free Finger Articulation State
  fingerPose = {
    thumb: 1,
    index: 1,
    middle: 1,
    ring: 1,
    pinky: 1,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.9,
    isFreeMotion: false,
    proceduralAnimation: "none"
  };
  smoothedPose = {
    thumb: 1,
    index: 1,
    middle: 1,
    ring: 1,
    pinky: 1,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.9,
    isFreeMotion: false,
    proceduralAnimation: "none"
  };
  // Biomechanical Physics Engine State
  physicsConfig = {
    enabled: true,
    preset: "biological",
    stiffness: 1.15,
    damping: 0.72,
    tendonCoupling: 0.35,
    massInertia: 0.4,
    softCollision: true,
    volumetric3D: true,
    oneEuroFilter: true
  };
  jointNodes = [];
  physicsTelemetry = {
    kineticEnergy: 0,
    tendonTension: 0,
    averageVelocity: 0,
    springSettlement: 100,
    naturalFrequencyHz: 12.5,
    mode: "Biological"
  };
  useTensorFlowClassifier = true;
  constructor() {
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 120;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d", { willReadFrequently: true });
    this.customSigns = loadSavedCustomSigns();
    this.syncDictionary();
    this.initPhysicsNodes();
    tfjsClassifier.initialize().catch((err) => {
      console.warn("[RealtimeHandTracker] TF.js engine background init:", err);
    });
  }
  initPhysicsNodes() {
    const masses = [
      2.2,
      // 0: Wrist base anchor (heaviest)
      1.1,
      0.9,
      0.65,
      0.45,
      // 1-4: Thumb CMC, MCP, IP, Tip
      1,
      0.75,
      0.55,
      0.35,
      // 5-8: Index MCP, PIP, DIP, Tip
      1.05,
      0.8,
      0.6,
      0.38,
      // 9-12: Middle MCP, PIP, DIP, Tip
      0.95,
      0.7,
      0.5,
      0.35,
      // 13-16: Ring MCP, PIP, DIP, Tip
      0.8,
      0.55,
      0.4,
      0.3
      // 17-20: Pinky MCP, PIP, DIP, Tip
    ];
    this.jointNodes = [];
    const now = performance.now();
    for (let i = 0; i < 21; i++) {
      this.jointNodes.push({
        x: 640,
        y: 360,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        targetX: 640,
        targetY: 360,
        targetZ: 0,
        mass: masses[i] || 0.6,
        impulseX: 0,
        impulseY: 0,
        impulseZ: 0,
        filterX: { x: 640, dx: 0, lastTime: now },
        filterY: { x: 360, dx: 0, lastTime: now },
        filterZ: { x: 0, dx: 0, lastTime: now }
      });
    }
  }
  setPhysicsConfig(config) {
    this.physicsConfig = {
      ...this.physicsConfig,
      ...config
    };
    if (config.preset && PHYSICS_PRESETS[config.preset]) {
      this.physicsConfig = {
        ...this.physicsConfig,
        ...PHYSICS_PRESETS[config.preset],
        preset: config.preset
      };
    }
  }
  getPhysicsConfig() {
    return { ...this.physicsConfig };
  }
  setPhysicsPreset(preset) {
    if (PHYSICS_PRESETS[preset]) {
      this.physicsConfig = {
        ...this.physicsConfig,
        ...PHYSICS_PRESETS[preset],
        preset
      };
    }
  }
  applyPhysicsImpulse(target = "all", impulseX = 0, impulseY = -15, impulseZ = 5) {
    const targetIndices = [];
    if (target === "all") {
      for (let i = 0; i < 21; i++) targetIndices.push(i);
    } else if (target === "thumb") targetIndices.push(1, 2, 3, 4);
    else if (target === "index") targetIndices.push(5, 6, 7, 8);
    else if (target === "middle") targetIndices.push(9, 10, 11, 12);
    else if (target === "ring") targetIndices.push(13, 14, 15, 16);
    else if (target === "pinky") targetIndices.push(17, 18, 19, 20);
    else if (target === "wrist") targetIndices.push(0);
    targetIndices.forEach((idx) => {
      const node = this.jointNodes[idx];
      if (node) {
        node.impulseX += impulseX;
        node.impulseY += impulseY;
        node.impulseZ += impulseZ;
        node.vx += impulseX * 0.8;
        node.vy += impulseY * 0.8;
        node.vz += impulseZ * 0.8;
      }
    });
  }
  getPhysicsTelemetry() {
    return { ...this.physicsTelemetry };
  }
  // TensorFlow.js Neural Classifier Controls & Telemetry
  getTensorFlowTelemetry() {
    return tfjsClassifier.getTelemetry();
  }
  setUseTensorFlowClassifier(enabled) {
    this.useTensorFlowClassifier = enabled;
  }
  isTensorFlowClassifierEnabled() {
    return this.useTensorFlowClassifier;
  }
  async setTensorFlowBackend(backend) {
    return tfjsClassifier.setBackend(backend);
  }
  async trainCurrentPoseAsSample(label) {
    return tfjsClassifier.trainSample(label, this.smoothedLandmarks, this.smoothedPose);
  }
  setZoom(zoom, panX = 0, panY = 0) {
    this.zoomLevel = Math.max(1, Math.min(3.5, Number(zoom) || 1));
    this.panOffsetX = Math.max(-1, Math.min(1, Number(panX) || 0));
    this.panOffsetY = Math.max(-1, Math.min(1, Number(panY) || 0));
  }
  getZoom() {
    return {
      zoom: this.zoomLevel,
      panX: this.panOffsetX,
      panY: this.panOffsetY,
      calibrationScale: this.calibrationScale
    };
  }
  setCalibrationScale(scale) {
    this.calibrationScale = Math.max(0.7, Math.min(1.5, Number(scale) || 1));
  }
  setAutoCenter(enabled) {
    this.autoCenterEnabled = Boolean(enabled);
  }
  isAutoCenterEnabled() {
    return this.autoCenterEnabled;
  }
  setElements(video, canvas) {
    this.videoElement = video;
    this.canvasElement = canvas;
    mediaPipeTracker.initialize().catch((err) => {
      console.warn("[HandTracker] MediaPipe background init note:", err);
    });
  }
  syncDictionary() {
    SIGN_DICTIONARY = {
      ...BASE_SIGN_DICTIONARY,
      ...this.customSigns
    };
  }
  registerCustomSign(key, sign) {
    const cleanKey = key.toUpperCase().replace(/\s+/g, "_");
    this.customSigns[cleanKey] = {
      ...sign,
      isCustom: true
    };
    saveCustomSignsToStorage(this.customSigns);
    this.syncDictionary();
    this.forceSign(cleanKey);
    return cleanKey;
  }
  deleteCustomSign(key) {
    if (this.customSigns[key]) {
      delete this.customSigns[key];
      saveCustomSignsToStorage(this.customSigns);
      this.syncDictionary();
      if (this.currentSignKey === key) {
        this.currentSignKey = "HELLO";
      }
    }
  }
  getDictionary() {
    return SIGN_DICTIONARY;
  }
  getCurrentSignMeaning() {
    return SIGN_DICTIONARY[this.currentSignKey] || SIGN_DICTIONARY["HELLO"];
  }
  getHoldProgress() {
    const elapsed = performance.now() - this.signHoldStartTime;
    return Math.min(1, Math.max(0, elapsed / this.HOLD_DURATION_MS));
  }
  setFreePose(newPose) {
    this.fingerPose = {
      ...this.fingerPose,
      ...newPose,
      isFreeMotion: true
    };
  }
  enableFreeMotionMode(enable) {
    this.fingerPose.isFreeMotion = enable;
  }
  getFingerPose() {
    return { ...this.smoothedPose };
  }
  setProceduralAnimation(anim) {
    this.fingerPose.proceduralAnimation = anim;
    if (anim !== "none") {
      this.fingerPose.isFreeMotion = true;
    }
  }
  // Process live camera frame with optical computer vision & skin chrominance
  processFrame(timestamp = performance.now(), forceDetection = false) {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    if (delta > 0) {
      this.fps = Math.round(1e3 / delta);
    }
    this.lastFrameTime = now;
    let targetX = 0;
    let targetY = 0;
    let hasRealHand = false;
    let handSpan = 160;
    let detectedFingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
    let detectedSpread = 0.45;
    let detectedTilt = 0;
    let realMediaPipeLandmarks = [];
    const width = this.canvasElement ? this.canvasElement.width : 1280;
    const height = this.canvasElement ? this.canvasElement.height : 720;
    if (this.videoElement && this.videoElement.readyState >= 2) {
      try {
        const mpResult = mediaPipeTracker.processVideoFrame(this.videoElement, width, height, timestamp, forceDetection);
        if (mpResult && mpResult.hasHand && mpResult.landmarks.length >= 21) {
          hasRealHand = true;
          realMediaPipeLandmarks = mpResult.landmarks;
          this.lastHandSeenTime = performance.now();
          const middleMcp = mpResult.landmarks[9];
          const wrist = mpResult.landmarks[0];
          const middleTip = mpResult.landmarks[12];
          targetX = middleMcp.x;
          targetY = middleMcp.y;
          const dWristMiddle = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y);
          handSpan = Math.max(120, Math.min(480, dWristMiddle * 1.25 * this.calibrationScale));
          detectedFingers = {
            thumb: mpResult.fingerFlexions.thumb,
            index: mpResult.fingerFlexions.index,
            middle: mpResult.fingerFlexions.middle,
            ring: mpResult.fingerFlexions.ring,
            pinky: mpResult.fingerFlexions.pinky
          };
          detectedSpread = mpResult.fingerFlexions.spread;
          detectedTilt = mpResult.wristRotation;
          if (this.autoCenterEnabled) {
            const normX = targetX / width;
            const normY = targetY / height;
            const errX = normX - 0.5;
            const errY = normY - 0.5;
            const panLerp = 0.1;
            this.panOffsetX = Math.max(-1, Math.min(1, this.panOffsetX + errX * panLerp * 1.5));
            this.panOffsetY = Math.max(-1, Math.min(1, this.panOffsetY + errY * panLerp * 1.5));
          }
        }
      } catch (e) {
      }
    }
    if (!hasRealHand && this.autoCenterEnabled) {
      if (performance.now() - this.lastHandSeenTime > 3500) {
        this.panOffsetX *= 0.97;
        this.panOffsetY *= 0.97;
        this.zoomLevel += (1 - this.zoomLevel) * 0.03;
      }
    }
    const t = timestamp * 2e-3;
    if (!hasRealHand) {
      targetX = width * 0.5 + Math.sin(t * 0.6) * 20;
      targetY = height * 0.5 + Math.cos(t * 0.8) * 12;
      handSpan = 160;
    }
    if (this.smoothTargetX === 0) {
      this.smoothTargetX = targetX;
      this.smoothTargetY = targetY;
      this.smoothHandSpan = handSpan;
    } else {
      const posAlpha = hasRealHand ? 0.6 : 0.2;
      this.smoothTargetX += posAlpha * (targetX - this.smoothTargetX);
      this.smoothTargetY += posAlpha * (targetY - this.smoothTargetY);
      this.smoothHandSpan += posAlpha * (handSpan - this.smoothHandSpan);
    }
    let animPose = hasRealHand ? {
      thumb: detectedFingers.thumb,
      index: detectedFingers.index,
      middle: detectedFingers.middle,
      ring: detectedFingers.ring,
      pinky: detectedFingers.pinky,
      spread: detectedSpread,
      wristAngle: detectedTilt,
      rotation: detectedTilt,
      tension: 0.9,
      isFreeMotion: true
    } : { ...this.fingerPose };
    if (!hasRealHand) {
      if (this.fingerPose.proceduralAnimation === "wave") {
        const w1 = Math.sin(t * 3.5) * 0.5 + 0.5;
        const w2 = Math.sin(t * 3.5 - 0.7) * 0.5 + 0.5;
        const w3 = Math.sin(t * 3.5 - 1.4) * 0.5 + 0.5;
        const w4 = Math.sin(t * 3.5 - 2.1) * 0.5 + 0.5;
        const w5 = Math.sin(t * 3.5 - 2.8) * 0.5 + 0.5;
        animPose = {
          ...animPose,
          thumb: 0.2 + w1 * 0.8,
          index: 0.1 + w2 * 0.9,
          middle: 0.1 + w3 * 0.9,
          ring: 0.1 + w4 * 0.9,
          pinky: 0.1 + w5 * 0.9,
          spread: 0.45 + Math.sin(t * 2) * 0.2,
          wristAngle: Math.sin(t * 1.5) * 15
        };
      } else if (this.fingerPose.proceduralAnimation === "wiggle") {
        animPose = {
          ...animPose,
          thumb: 0.5 + Math.sin(t * 6) * 0.4,
          index: 0.4 + Math.sin(t * 7 + 0.5) * 0.5,
          middle: 0.4 + Math.sin(t * 8 + 1) * 0.5,
          ring: 0.4 + Math.sin(t * 7.5 + 1.5) * 0.5,
          pinky: 0.4 + Math.sin(t * 6.5 + 2) * 0.5,
          spread: 0.55 + Math.sin(t * 4) * 0.15
        };
      } else if (this.fingerPose.proceduralAnimation === "tap") {
        const cycle = t * 4 % 4;
        animPose = {
          ...animPose,
          thumb: 0.3,
          index: cycle < 1 ? 0.1 : 1,
          middle: cycle >= 1 && cycle < 2 ? 0.1 : 1,
          ring: cycle >= 2 && cycle < 3 ? 0.1 : 1,
          pinky: cycle >= 3 ? 0.1 : 1
        };
      } else if (this.fingerPose.proceduralAnimation === "breathe") {
        const s = Math.sin(t * 1.5) * 0.5 + 0.5;
        animPose = {
          ...animPose,
          thumb: 0.3 + s * 0.7,
          index: 0.1 + s * 0.9,
          middle: 0.1 + s * 0.9,
          ring: 0.1 + s * 0.9,
          pinky: 0.1 + s * 0.9,
          spread: 0.3 + s * 0.4
        };
      }
    }
    const coupledPose = this.physicsConfig.enabled ? this.applyTendonCrossCoupling(animPose, this.physicsConfig.tendonCoupling) : animPose;
    const poseAlpha = hasRealHand ? 0.7 : 0.55;
    this.smoothedPose = {
      ...this.smoothedPose,
      thumb: this.smoothedPose.thumb + poseAlpha * (coupledPose.thumb - this.smoothedPose.thumb),
      index: this.smoothedPose.index + poseAlpha * (coupledPose.index - this.smoothedPose.index),
      middle: this.smoothedPose.middle + poseAlpha * (coupledPose.middle - this.smoothedPose.middle),
      ring: this.smoothedPose.ring + poseAlpha * (coupledPose.ring - this.smoothedPose.ring),
      pinky: this.smoothedPose.pinky + poseAlpha * (coupledPose.pinky - this.smoothedPose.pinky),
      spread: this.smoothedPose.spread + poseAlpha * (coupledPose.spread - this.smoothedPose.spread),
      wristAngle: this.smoothedPose.wristAngle + poseAlpha * (coupledPose.wristAngle - this.smoothedPose.wristAngle),
      rotation: this.smoothedPose.rotation + poseAlpha * (coupledPose.rotation - this.smoothedPose.rotation),
      tension: this.fingerPose.tension ?? 0.9,
      isFreeMotion: this.fingerPose.isFreeMotion,
      proceduralAnimation: this.fingerPose.proceduralAnimation
    };
    let detectedSignKey = this.detectSignFromPose(this.smoothedPose, hasRealHand ? realMediaPipeLandmarks : void 0);
    if (detectedSignKey !== this.currentSignKey) {
      this.currentSignKey = detectedSignKey;
      this.signHoldStartTime = now;
    }
    const elapsedHold = now - this.signHoldStartTime;
    const holdProgress = Math.min(1, elapsedHold / this.HOLD_DURATION_MS);
    let isCommitted = false;
    if (holdProgress >= 1 && this.lastCommittedSignKey !== this.currentSignKey) {
      isCommitted = true;
      this.lastCommittedSignKey = this.currentSignKey;
    }
    let rawKinematicTargets = [];
    if (hasRealHand && realMediaPipeLandmarks.length >= 21) {
      rawKinematicTargets = realMediaPipeLandmarks;
    } else {
      rawKinematicTargets = this.computeLandmarksFromKinematics(
        this.smoothTargetX,
        this.smoothTargetY,
        this.smoothHandSpan,
        this.smoothedPose
      );
    }
    let simulatedLandmarks = [];
    const dt = Math.min(0.05, Math.max(5e-3, delta / 1e3));
    if (this.physicsConfig.enabled) {
      simulatedLandmarks = this.integratePhysics(rawKinematicTargets, dt, now, hasRealHand);
    } else {
      if (this.smoothedLandmarks.length === 0) {
        this.smoothedLandmarks = rawKinematicTargets;
      } else {
        const alpha = hasRealHand ? 0.7 : 0.55;
        this.smoothedLandmarks = rawKinematicTargets.map((pt, i) => {
          const prev = this.smoothedLandmarks[i] || pt;
          return {
            x: prev.x + alpha * (pt.x - prev.x),
            y: prev.y + alpha * (pt.y - prev.y),
            z: pt.z
          };
        });
      }
      simulatedLandmarks = this.smoothedLandmarks;
    }
    this.smoothedLandmarks = simulatedLandmarks;
    const signMeaning = SIGN_DICTIONARY[this.currentSignKey] || SIGN_DICTIONARY["HELLO"];
    let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
    this.smoothedLandmarks.forEach((pt) => {
      if (pt.x < bMinX) bMinX = pt.x;
      if (pt.x > bMaxX) bMaxX = pt.x;
      if (pt.y < bMinY) bMinY = pt.y;
      if (pt.y > bMaxY) bMaxY = pt.y;
    });
    const pad = 28;
    const distFromCenter = Math.hypot(this.panOffsetX, this.panOffsetY);
    const handFramedScore = hasRealHand ? Math.max(0, Math.min(100, Math.round((1 - Math.min(1, distFromCenter * 0.85)) * 100))) : 0;
    let statusText = "Manual Zoom & Pan";
    if (this.autoCenterEnabled) {
      if (!hasRealHand) {
        statusText = "Searching for Hand...";
      } else if (handFramedScore >= 80) {
        statusText = `Hand Centered (${handFramedScore}%)`;
      } else {
        statusText = `Auto-Framing (${handFramedScore}%)`;
      }
    }
    return {
      landmarks: this.smoothedLandmarks,
      boundingBox: {
        x: Math.max(0, bMinX - pad),
        y: Math.max(0, bMinY - pad),
        width: bMaxX - bMinX + pad * 2,
        height: bMaxY - bMinY + pad * 2
      },
      gesture: `${signMeaning.symbol} ${signMeaning.signName}`,
      signMeaning,
      confidence: signMeaning.confidence,
      handedness: "Right",
      fps: Math.min(60, Math.max(24, this.fps)),
      isRealHandDetected: hasRealHand,
      holdProgress,
      isCommitted,
      fingerPose: { ...this.smoothedPose },
      autoCentering: {
        enabled: this.autoCenterEnabled,
        isTracking: hasRealHand && this.autoCenterEnabled,
        currentZoom: +this.zoomLevel.toFixed(2),
        panOffsetX: +this.panOffsetX.toFixed(2),
        panOffsetY: +this.panOffsetY.toFixed(2),
        handFramedScore,
        statusText
      },
      physicsTelemetry: { ...this.physicsTelemetry },
      tfTelemetry: tfjsClassifier.getTelemetry()
    };
  }
  // 1-Euro Adaptive Low-Pass Filter Algorithm for Jitter-Free Low-Latency Tracking
  filter1Euro(filter, rawVal, now, minCutoff = 1.2, beta = 0.02) {
    if (!Number.isFinite(rawVal)) {
      return Number.isFinite(filter.x) ? filter.x : 0;
    }
    if (filter.x === void 0 || !Number.isFinite(filter.x)) {
      filter.x = rawVal;
      filter.dx = 0;
      filter.lastTime = now;
      return rawVal;
    }
    const dt = Math.max(1e-3, Math.min(0.1, (now - (filter.lastTime || now - 16)) / 1e3));
    filter.lastTime = now;
    const dVal = (rawVal - filter.x) / dt;
    const dCutoff = 15;
    const dAlpha = 1 / (1 + 1 / (2 * Math.PI * dCutoff * dt));
    const edx = dAlpha * dVal + (1 - dAlpha) * (Number.isFinite(filter.dx) ? filter.dx : 0);
    filter.dx = Number.isFinite(edx) ? edx : 0;
    const cutoff = minCutoff + beta * Math.abs(filter.dx);
    const alpha = 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
    const filtered = alpha * rawVal + (1 - alpha) * filter.x;
    filter.x = Number.isFinite(filtered) ? filtered : rawVal;
    return filter.x;
  }
  // Biomechanical Extensor Hood & Profundus tendon cross-coupling
  applyTendonCrossCoupling(rawPose, coupling) {
    if (coupling <= 0.01) return { ...rawPose };
    const c = Math.max(0, Math.min(1, coupling));
    const thumb = rawPose.thumb;
    const index = Math.max(0.04, Math.min(1, rawPose.index * (1 - c * 0.06) + (1 - rawPose.middle) * (-0.03 * c) + rawPose.index * (c * 0.06)));
    const middle = Math.max(0.04, Math.min(1, rawPose.middle * (1 - c * 0.14) + rawPose.ring * (c * 0.14)));
    const ring = Math.max(0.04, Math.min(1, rawPose.ring * (1 - c * 0.3) + rawPose.middle * (c * 0.18) + rawPose.pinky * (c * 0.12)));
    const pinky = Math.max(0.04, Math.min(1, rawPose.pinky * (1 - c * 0.22) + rawPose.ring * (c * 0.22)));
    return {
      ...rawPose,
      thumb,
      index,
      middle,
      ring,
      pinky
    };
  }
  // Mass-Spring-Damper Second-Order Numerical Integration Engine
  integratePhysics(targets, dt, now, hasRealHand) {
    if (this.jointNodes.length !== 21) {
      this.initPhysicsNodes();
    }
    const { stiffness, damping, massInertia, softCollision, oneEuroFilter } = this.physicsConfig;
    const baseFreq = 14 * Math.max(0.2, stiffness);
    const zeta = Math.max(0.2, Math.min(1, damping));
    const omega0 = 2 * Math.PI * baseFreq;
    const k_spring = omega0 * omega0;
    let totalKineticEnergy = 0;
    let totalVelocity = 0;
    let totalTensionDist = 0;
    for (let i = 0; i < 21; i++) {
      const node = this.jointNodes[i];
      const target = targets[i];
      if (!node || !target) continue;
      if (oneEuroFilter) {
        node.targetX = this.filter1Euro(node.filterX, target.x, now, hasRealHand ? 1.4 : 1, 0.02);
        node.targetY = this.filter1Euro(node.filterY, target.y, now, hasRealHand ? 1.4 : 1, 0.02);
        node.targetZ = this.filter1Euro(node.filterZ, target.z || 0, now, 1, 0.01);
      } else {
        node.targetX = target.x;
        node.targetY = target.y;
        node.targetZ = target.z || 0;
      }
    }
    const contactForces = Array.from({ length: 21 }, () => ({ fx: 0, fy: 0, fz: 0 }));
    if (softCollision && !hasRealHand) {
      const tipIndices = [4, 8, 12, 16, 20];
      const collisionRadius = 18 * (this.smoothHandSpan / 160);
      for (let i = 0; i < tipIndices.length; i++) {
        for (let j = i + 1; j < tipIndices.length; j++) {
          const idxA = tipIndices[i];
          const idxB = tipIndices[j];
          const nodeA = this.jointNodes[idxA];
          const nodeB = this.jointNodes[idxB];
          if (!nodeA || !nodeB) continue;
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dz = (nodeB.z || 0) - (nodeA.z || 0);
          const dist = Math.hypot(dx, dy, dz);
          if (dist > 1e-3 && dist < collisionRadius) {
            const overlap = collisionRadius - dist;
            const repulseK = 450;
            const forceMag = overlap * repulseK;
            const nx = dx / dist;
            const ny = dy / dist;
            const nz = dz / dist;
            contactForces[idxA].fx -= nx * forceMag;
            contactForces[idxA].fy -= ny * forceMag;
            contactForces[idxA].fz -= nz * forceMag;
            contactForces[idxB].fx += nx * forceMag;
            contactForces[idxB].fy += ny * forceMag;
            contactForces[idxB].fz += nz * forceMag;
          }
        }
      }
    }
    const effectiveMassScale = Math.max(0.1, massInertia);
    const subSteps = 4;
    const clampedDt = Math.max(1e-3, Math.min(0.033, dt));
    const subDt = clampedDt / subSteps;
    const effectiveK = Math.min(1800, k_spring);
    for (let step = 0; step < subSteps; step++) {
      for (let i = 0; i < 21; i++) {
        const node = this.jointNodes[i];
        if (!node) continue;
        const nodeMass = Math.max(0.2, node.mass * effectiveMassScale);
        const fsX = effectiveK * nodeMass * (node.targetX - node.x);
        const fsY = effectiveK * nodeMass * (node.targetY - node.y);
        const fsZ = effectiveK * nodeMass * (node.targetZ - node.z);
        const c_damp = 2 * zeta * Math.sqrt(effectiveK) * nodeMass;
        const fdX = -c_damp * node.vx;
        const fdY = -c_damp * node.vy;
        const fdZ = -c_damp * node.vz;
        const fImpX = node.impulseX * 50;
        const fImpY = node.impulseY * 50;
        const fImpZ = node.impulseZ * 50;
        node.impulseX *= 0.85;
        node.impulseY *= 0.85;
        node.impulseZ *= 0.85;
        const fContX = contactForces[i].fx;
        const fContY = contactForces[i].fy;
        const fContZ = contactForces[i].fz;
        node.ax = (fsX + fdX + fImpX + fContX) / nodeMass;
        node.ay = (fsY + fdY + fImpY + fContY) / nodeMass;
        node.az = (fsZ + fdZ + fImpZ + fContZ) / nodeMass;
        node.vx = (node.vx + node.ax * subDt) * 0.97;
        node.vy = (node.vy + node.ay * subDt) * 0.97;
        node.vz = (node.vz + node.az * subDt) * 0.97;
        const maxV = 1e3;
        node.vx = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vx) ? node.vx : 0));
        node.vy = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vy) ? node.vy : 0));
        node.vz = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vz) ? node.vz : 0));
        node.x += node.vx * subDt;
        node.y += node.vy * subDt;
        node.z += node.vz * subDt;
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.z)) {
          node.x = Number.isFinite(node.targetX) ? node.targetX : 640;
          node.y = Number.isFinite(node.targetY) ? node.targetY : 360;
          node.z = Number.isFinite(node.targetZ) ? node.targetZ : 0;
          node.vx = 0;
          node.vy = 0;
          node.vz = 0;
        }
        if (step === subSteps - 1) {
          const speed = Math.hypot(node.vx, node.vy, node.vz);
          totalVelocity += speed;
          totalKineticEnergy += 0.5 * nodeMass * speed * speed * 1e-3;
          totalTensionDist += Math.hypot(node.targetX - node.x, node.targetY - node.y);
        }
      }
    }
    const avgVelocity = Math.round(totalVelocity / 21);
    const avgTensionDist = totalTensionDist / 21;
    const tendonStrainPct = Math.min(100, Math.round(avgTensionDist / 18 * 100));
    const settlement = Math.max(0, Math.min(100, Math.round(100 - Math.min(100, avgVelocity * 0.35 + tendonStrainPct * 0.65))));
    const presetLabels = {
      biological: "\u{1F9EC} Biological Realism",
      snappy: "\u26A1 Snappy Spring",
      fluid: "\u{1F30A} Fluid Organic",
      precision: "\u{1F9BE} Precision Studio"
    };
    this.physicsTelemetry = {
      kineticEnergy: +totalKineticEnergy.toFixed(2),
      tendonTension: tendonStrainPct,
      averageVelocity: avgVelocity,
      springSettlement: settlement,
      naturalFrequencyHz: +baseFreq.toFixed(1),
      mode: presetLabels[this.physicsConfig.preset] || "Biological"
    };
    return this.jointNodes.map((n) => ({
      x: n.x,
      y: n.y,
      z: n.z
    }));
  }
  // Detect sign symbol based on dataset configurations and weighted Euclidean distance in 5-dimensional finger curl space
  detectSignFromPose(pose, rawLandmarks) {
    const keys = Object.keys(SIGN_DICTIONARY);
    if (keys.length === 0) return "HELLO";
    if (rawLandmarks && rawLandmarks.length >= 21) {
      const distThumbIndex = Math.hypot(rawLandmarks[4].x - rawLandmarks[8].x, rawLandmarks[4].y - rawLandmarks[8].y);
      const distThumbMiddle = Math.hypot(rawLandmarks[4].x - rawLandmarks[12].x, rawLandmarks[4].y - rawLandmarks[12].y);
      const distThumbRing = Math.hypot(rawLandmarks[4].x - rawLandmarks[16].x, rawLandmarks[4].y - rawLandmarks[16].y);
      const distThumbPinky = Math.hypot(rawLandmarks[4].x - rawLandmarks[20].x, rawLandmarks[4].y - rawLandmarks[20].y);
      if (distThumbPinky < 35 && pose.index > 0.65 && pose.middle > 0.65 && pose.ring > 0.65 && SIGN_DICTIONARY["6"]) {
        return "6";
      }
      if (distThumbRing < 35 && pose.index > 0.65 && pose.middle > 0.65 && pose.pinky > 0.65 && SIGN_DICTIONARY["7"]) {
        return "7";
      }
      if (distThumbMiddle < 35 && pose.index > 0.65 && pose.ring > 0.65 && pose.pinky > 0.65 && SIGN_DICTIONARY["8"]) {
        return "8";
      }
      if (distThumbIndex < 35 && pose.middle > 0.65 && pose.ring > 0.6 && pose.pinky > 0.6) {
        if (SIGN_DICTIONARY["F"]) return "F";
        if (SIGN_DICTIONARY["9"]) return "9";
        if (SIGN_DICTIONARY["OKAY"]) return "OKAY";
      }
      if (pose.thumb > 0.75 && pose.index > 0.75 && pose.middle < 0.25 && pose.ring < 0.25 && pose.pinky < 0.25 && distThumbIndex > 65) {
        if (SIGN_DICTIONARY["L"]) return "L";
      }
    }
    let bestKey = keys[0];
    let lowestDistance = Infinity;
    for (const key of keys) {
      const sign = SIGN_DICTIONARY[key];
      if (!sign) continue;
      const target = sign.fingerConfig || { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
      const dThumb = Math.abs(pose.thumb - target.thumb) * 1.3;
      const dIndex = Math.abs(pose.index - target.index) * 1.2;
      const dMiddle = Math.abs(pose.middle - target.middle) * 1.1;
      const dRing = Math.abs(pose.ring - target.ring) * 1;
      const dPinky = Math.abs(pose.pinky - target.pinky) * 1.2;
      const distance = Math.sqrt(
        dThumb * dThumb + dIndex * dIndex + dMiddle * dMiddle + dRing * dRing + dPinky * dPinky
      );
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestKey = key;
      }
    }
    return bestKey;
  }
  // Force set a specific sign (used when user tests in Playground or clicks a gesture)
  forceSign(signKey) {
    if (SIGN_DICTIONARY[signKey]) {
      this.currentSignKey = signKey;
      this.signHoldStartTime = performance.now();
      const sign = SIGN_DICTIONARY[signKey];
      if (sign.fingerConfig) {
        this.fingerPose = {
          ...this.fingerPose,
          thumb: sign.fingerConfig.thumb,
          index: sign.fingerConfig.index,
          middle: sign.fingerConfig.middle,
          ring: sign.fingerConfig.ring,
          pinky: sign.fingerConfig.pinky,
          isFreeMotion: false,
          proceduralAnimation: "none"
        };
      }
    }
  }
  // 21 Anatomical Landmarks Computed with Precision Biomechanical 3D Forward Kinematics
  // MediaPipe Topology: 0: Wrist, 1-4: Thumb, 5-8: Index, 9-12: Middle, 13-16: Ring, 17-20: Pinky
  computeLandmarksFromKinematics(cx, cy, span, pose) {
    const safeCx = Number.isFinite(cx) && cx > 0 ? cx : this.canvasElement?.width ? this.canvasElement.width / 2 : 640;
    const safeCy = Number.isFinite(cy) && cy > 0 ? cy : this.canvasElement?.height ? this.canvasElement.height / 2 : 360;
    const safeSpan = Number.isFinite(span) && span > 30 ? span : 160;
    const scale = safeSpan / 160;
    const radTilt = (pose?.wristAngle ?? 0) * Math.PI / 180;
    const cosT = Math.cos(radTilt);
    const sinT = Math.sin(radTilt);
    const volumetric3D = this.physicsConfig.volumetric3D;
    const focalLength = 650;
    const project3DPoint = (ox, oy, oz = 0) => {
      const rx = ox * cosT - oy * sinT;
      const ry = ox * sinT + oy * cosT;
      const rz = oz * scale;
      const rawPScale = volumetric3D ? 1 + rz / focalLength : 1;
      const pScale = Number.isFinite(rawPScale) && rawPScale > 0.1 ? rawPScale : 1;
      const px = safeCx + rx * scale * pScale;
      const py = safeCy + ry * scale * pScale;
      return {
        x: Number.isFinite(px) ? px : safeCx,
        y: Number.isFinite(py) ? py : safeCy,
        z: Number.isFinite(rz) ? rz : 0
      };
    };
    const tension = Math.max(0.4, Math.min(1, pose.tension ?? 0.9));
    const s = Math.max(0.1, Math.min(1, (pose.spread ?? 0.45) * 1.1));
    const wrist = project3DPoint(0, 72, -4);
    const computeFingerChain = (mcpX, mcpY, mcpZ, naturalAngleDeg, l1, l2, l3, flexion) => {
      const mcp = project3DPoint(mcpX, mcpY, mcpZ);
      const f = Math.max(0, Math.min(1, flexion));
      const curl = 1 - f;
      const baseRad = naturalAngleDeg * Math.PI / 180;
      const dirX = Math.cos(baseRad);
      const dirY = Math.sin(baseRad);
      const p1x = mcpX + dirX * l1 * (1 - curl * 0.42);
      const p1y = mcpY + dirY * l1 * (1 - curl * 0.42) + curl * (22 * tension);
      const p1z = mcpZ + curl * 24 * tension;
      const pip = project3DPoint(p1x, p1y, p1z);
      const p2x2 = p1x + dirX * l2 * (1 - curl * 0.78);
      const p2y2 = p1y + dirY * l2 * (1 - curl * 0.78) + curl * (20 * tension);
      const p2z2 = p1z + (curl > 0.4 ? (0.4 - curl) * 14 : curl * 12) * tension;
      const dip = project3DPoint(p2x2, p2y2, p2z2);
      const p3x2 = p2x2 + dirX * l3 * (1 - curl * 0.92);
      const p3y2 = p2y2 + dirY * l3 * (1 - curl * 0.92) + curl * (16 * tension);
      const p3z2 = p2z2 - curl * 18 * tension;
      const tip = project3DPoint(p3x2, p3y2, p3z2);
      return [mcp, pip, dip, tip];
    };
    const thumbFlex = Math.max(0, Math.min(1, pose.thumb));
    const thumbCurl = 1 - thumbFlex;
    const thumbSpreadOffset = (s - 0.45) * 32;
    const p1 = project3DPoint(-28 - (s - 0.45) * 8, 44, -2);
    const p2x = -48 + thumbCurl * 18 - thumbSpreadOffset * 0.75;
    const p2y = 18 + thumbCurl * 6 - (s - 0.45) * 10;
    const p2z = -6 + thumbCurl * 16;
    const p2 = project3DPoint(p2x, p2y, p2z);
    const p3x = -72 + thumbCurl * 60 - thumbSpreadOffset * 1.1;
    const p3y = -4 + thumbCurl * 15 - (s - 0.45) * 14;
    const p3z = -8 + thumbCurl * 26;
    const p3 = project3DPoint(p3x, p3y, p3z);
    const p4x = -92 + thumbCurl * 98 - thumbSpreadOffset * 1.5;
    const p4y = -26 + thumbCurl * 32 - (s - 0.45) * 18;
    const p4z = -10 + thumbCurl * 34;
    const p4 = project3DPoint(p4x, p4y, p4z);
    const [p5, p6, p7, p8] = computeFingerChain(
      -22 * (0.55 + s * 0.7),
      -14,
      2,
      -94 - (s - 0.45) * 26,
      32,
      24,
      18,
      pose.index
    );
    const [p9, p10, p11, p12] = computeFingerChain(
      -2,
      -26,
      6,
      -90 + (s - 0.45) * 2,
      36,
      27,
      20,
      pose.middle
    );
    const [p13, p14, p15, p16] = computeFingerChain(
      18 * (0.55 + s * 0.7),
      -18,
      3,
      -86 + (s - 0.45) * 22,
      32,
      24,
      18,
      pose.ring
    );
    const [p17, p18, p19, p20] = computeFingerChain(
      36 * (0.55 + s * 0.7),
      -6,
      -2,
      -78 + (s - 0.45) * 36,
      26,
      19,
      15,
      pose.pinky
    );
    return [
      wrist,
      // 0
      p1,
      p2,
      p3,
      p4,
      // 1-4: Thumb
      p5,
      p6,
      p7,
      p8,
      // 5-8: Index
      p9,
      p10,
      p11,
      p12,
      // 9-12: Middle
      p13,
      p14,
      p15,
      p16,
      // 13-16: Ring
      p17,
      p18,
      p19,
      p20
      // 17-20: Pinky
    ];
  }
  // Draw 21-Joint Skeletal Mesh, Volumetric 3D Bones, Thenar Muscle Webbing, and Physics HUD
  draw(ctx, result, options = {}) {
    try {
      const {
        color = "#10B981",
        jointColor = "#38BDF8",
        showBoundingBox = true,
        showHUD = true,
        showAlignmentGuide = false
      } = options;
      const { landmarks, boundingBox, gesture, signMeaning, confidence, fps, isRealHandDetected, holdProgress, fingerPose, physicsTelemetry } = result;
      if (!landmarks || landmarks.length < 21) return;
      const safePts = landmarks.map((pt, idx) => {
        const fallbackX = 640 + (idx - 10) * 8;
        const fallbackY = 360 + idx % 4 * 12;
        return {
          x: Number.isFinite(pt?.x) ? pt.x : fallbackX,
          y: Number.isFinite(pt?.y) ? pt.y : fallbackY,
          z: Number.isFinite(pt?.z) ? pt.z || 0 : 0
        };
      });
      const bones = [
        // Palm Metacarpals & Webbing
        [0, 1],
        [0, 5],
        [0, 9],
        [0, 13],
        [0, 17],
        [1, 5],
        [5, 9],
        [9, 13],
        [13, 17],
        // Thumb
        [1, 2],
        [2, 3],
        [3, 4],
        // Index
        [5, 6],
        [6, 7],
        [7, 8],
        // Middle
        [9, 10],
        [10, 11],
        [11, 12],
        // Ring
        [13, 14],
        [14, 15],
        [15, 16],
        // Pinky
        [17, 18],
        [18, 19],
        [19, 20]
      ];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(safePts[0].x, safePts[0].y);
      ctx.lineTo(safePts[1].x, safePts[1].y);
      ctx.lineTo(safePts[5].x, safePts[5].y);
      ctx.lineTo(safePts[9].x, safePts[9].y);
      ctx.lineTo(safePts[13].x, safePts[13].y);
      ctx.lineTo(safePts[17].x, safePts[17].y);
      ctx.closePath();
      ctx.fillStyle = isRealHandDetected ? "rgba(16, 185, 129, 0.14)" : "rgba(99, 102, 241, 0.14)";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(safePts[0].x, safePts[0].y);
      ctx.quadraticCurveTo(
        (safePts[0].x + safePts[1].x) / 2 - 12,
        (safePts[0].y + safePts[1].y) / 2,
        safePts[1].x,
        safePts[1].y
      );
      ctx.lineTo(safePts[2].x, safePts[2].y);
      ctx.quadraticCurveTo(
        (safePts[2].x + safePts[5].x) / 2,
        (safePts[2].y + safePts[5].y) / 2 + 8,
        safePts[5].x,
        safePts[5].y
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(56, 189, 248, 0.10)";
      ctx.fill();
      const strain = physicsTelemetry?.tendonTension ?? 30;
      const tendonGlow = Math.min(1, 0.15 + strain / 100 * 0.45);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(56, 189, 248, ${tendonGlow})`;
      ctx.setLineDash([3, 4]);
      [5, 9, 13, 17].forEach((kIdx) => {
        ctx.beginPath();
        ctx.moveTo(safePts[0].x, safePts[0].y);
        ctx.lineTo(safePts[kIdx].x, safePts[kIdx].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = isRealHandDetected ? "#10B981" : color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < bones.length; i++) {
        const [from, to] = bones[i];
        const pA = safePts[from];
        const pB = safePts[to];
        if (pA && pB) {
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
        }
      }
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      for (let i = 0; i < bones.length; i++) {
        const [from, to] = bones[i];
        const pA = safePts[from];
        const pB = safePts[to];
        if (pA && pB) {
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
        }
      }
      ctx.stroke();
      for (let idx = 0; idx < safePts.length; idx++) {
        const p = safePts[idx];
        const isTip = idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20;
        const isMCP = idx === 1 || idx === 5 || idx === 9 || idx === 13 || idx === 17;
        const isWrist = idx === 0;
        const pZ = typeof p.z === "number" && Number.isFinite(p.z) ? p.z : 0;
        const depthFactor = Math.max(0.7, Math.min(1.45, 1 + pZ / 250));
        let baseRadius = 5;
        let fill = jointColor;
        if (isTip) {
          baseRadius = 7;
          fill = "#F59E0B";
        } else if (isWrist) {
          baseRadius = 8.5;
          fill = "#EC4899";
        } else if (isMCP) {
          baseRadius = 5.8;
          fill = "#38BDF8";
        }
        const radius = Math.max(2, Math.min(30, baseRadius * depthFactor));
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.stroke();
      }
      if (fingerPose && fingerPose.isFreeMotion) {
        const tipIndices = [
          { idx: 4, name: "THU", val: fingerPose.thumb },
          { idx: 8, name: "IDX", val: fingerPose.index },
          { idx: 12, name: "MID", val: fingerPose.middle },
          { idx: 16, name: "RNG", val: fingerPose.ring },
          { idx: 20, name: "PIN", val: fingerPose.pinky }
        ];
        tipIndices.forEach(({ idx, name, val }) => {
          const pt = safePts[idx];
          if (!pt) return;
          const text = `${name} ${Math.round(val * 100)}%`;
          ctx.font = "bold 10px monospace";
          const tw = ctx.measureText(text).width;
          ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
          ctx.beginPath();
          ctx.roundRect(pt.x - tw / 2 - 5, pt.y - 24, tw + 10, 16, 4);
          ctx.fill();
          ctx.strokeStyle = val > 0.5 ? "#10B981" : "#F59E0B";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(text, pt.x - tw / 2, pt.y - 12);
        });
      }
      if (showBoundingBox) {
        const { x, y, width, height } = boundingBox;
        const cornerSize = 18;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isRealHandDetected ? "#38BDF8" : "#818CF8";
        ctx.shadowColor = isRealHandDetected ? "#38BDF8" : "#818CF8";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerSize);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerSize, y + height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerSize);
        ctx.stroke();
        const tagText = fingerPose?.isFreeMotion ? `\u{1F590}\uFE0F FREE MOTION \u2022 ${Math.round(confidence * 100)}%` : `${gesture} \u2022 ${Math.round(confidence * 100)}%`;
        ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
        const textWidth = ctx.measureText(tagText).width;
        const pillY = Math.max(12, y - 32);
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.beginPath();
        ctx.roundRect(x, pillY, textWidth + 36, 28, 8);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        const ringCenterX = x + 14;
        const ringCenterY = pillY + 14;
        ctx.beginPath();
        ctx.arc(ringCenterX, ringCenterY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ringCenterX, ringCenterY, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * holdProgress);
        ctx.strokeStyle = holdProgress >= 0.95 ? "#10B981" : "#F59E0B";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(tagText, x + 26, pillY + 19);
        if (signMeaning && !fingerPose?.isFreeMotion) {
          const transText = `Meaning: "${signMeaning.translatedText}"`;
          ctx.font = "11px system-ui, -apple-system, sans-serif";
          const transWidth = ctx.measureText(transText).width;
          ctx.fillStyle = signMeaning.isCustom ? "rgba(168, 85, 247, 0.92)" : "rgba(16, 185, 129, 0.90)";
          ctx.beginPath();
          ctx.roundRect(x, pillY + 34, transWidth + 16, 20, 5);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(transText, x + 8, pillY + 48);
        }
      }
      if (showHUD) {
        const hudX = 16;
        const hudY = 16;
        ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, 260, 74, 12);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = isRealHandDetected ? "#10B981" : "#818CF8";
        ctx.fillText(`\u25CF ${isRealHandDetected ? "OPTICAL CV TRACKER" : "BIOMECHANICAL PHYSICS"}`, hudX + 12, hudY + 18);
        ctx.font = "10px monospace";
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(`FPS: ${fps} | LAT: 8ms | 21 3D JOINTS`, hudX + 12, hudY + 33);
        if (physicsTelemetry) {
          ctx.fillStyle = "#38BDF8";
          ctx.fillText(
            `\u26A1 KINETIC: ${physicsTelemetry.kineticEnergy}mJ | STRAIN: ${physicsTelemetry.tendonTension}%`,
            hudX + 12,
            hudY + 48
          );
        }
        ctx.fillStyle = result.autoCentering?.enabled ? "#34D399" : "#A78BFA";
        ctx.fillText(
          result.autoCentering?.enabled ? `\u{1F916} AUTO-CENTER: ${result.autoCentering.statusText.toUpperCase()}` : physicsTelemetry ? `MODE: ${physicsTelemetry.mode}` : `SIGNS: ${Object.keys(SIGN_DICTIONARY).length} IN VOCABULARY`,
          hudX + 12,
          hudY + 63
        );
      }
      if (showAlignmentGuide) {
        const cWidth = ctx.canvas.width;
        const cHeight = ctx.canvas.height;
        const boxW = Math.min(360, cWidth * 0.32);
        const boxH = Math.min(460, cHeight * 0.65);
        const boxX = (cWidth - boxW) / 2;
        const boxY = (cHeight - boxH) / 2 + 10;
        const isInside = isRealHandDetected && boundingBox.x > boxX - 40 && boundingBox.x + boundingBox.width < boxX + boxW + 40 && boundingBox.y > boxY - 40 && boundingBox.y + boundingBox.height < boxY + boxH + 40;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = isInside ? "#10B981" : "rgba(56, 189, 248, 0.7)";
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.setLineDash([]);
        const bLen = 22;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = isInside ? "#10B981" : "#38BDF8";
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + bLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + bLen, boxY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + bLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - bLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + bLen, boxY + boxH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - bLen);
        ctx.stroke();
        const midX = boxX + boxW / 2;
        const midY = boxY + boxH / 2;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isInside ? "rgba(16, 185, 129, 0.5)" : "rgba(56, 189, 248, 0.4)";
        ctx.beginPath();
        ctx.moveTo(midX - 16, midY);
        ctx.lineTo(midX + 16, midY);
        ctx.moveTo(midX, midY - 16);
        ctx.lineTo(midX, midY + 16);
        ctx.stroke();
        const guideLabel = isInside ? "\u2713 HAND ALIGNED (OPTIMAL ACCURACY)" : "\u{1F3AF} POSITION HAND HERE (ZOOM IN/OUT TO FIT)";
        ctx.font = "bold 12px monospace";
        const labelW = ctx.measureText(guideLabel).width;
        ctx.fillStyle = isInside ? "rgba(6, 78, 59, 0.92)" : "rgba(15, 23, 42, 0.90)";
        ctx.beginPath();
        ctx.roundRect(midX - labelW / 2 - 10, boxY - 30, labelW + 20, 24, 6);
        ctx.fill();
        ctx.strokeStyle = isInside ? "#10B981" : "#38BDF8";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isInside ? "#6EE7B7" : "#E2E8F0";
        ctx.fillText(guideLabel, midX - labelW / 2, boxY - 14);
        ctx.restore();
      }
      ctx.restore();
    } catch (err) {
      console.warn("[HandTracker] Non-fatal draw exception caught & recovered:", err);
      try {
        ctx.restore();
      } catch {
      }
    }
  }
}
export {
  BASE_SIGN_DICTIONARY,
  PHYSICS_PRESETS,
  RealtimeHandTracker,
  SIGN_DICTIONARY,
  loadSavedCustomSigns,
  saveCustomSignsToStorage
};
