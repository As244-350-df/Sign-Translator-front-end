// Comprehensive Sign Language Dictionary Dataset
// Covers Common Vocabulary, Alphabet (A-Z), Numbers (0-9), Emergency/Medical, and Social Signs

export const SIGN_CATEGORIES = [
  { id: "all", label: "All Signs", icon: "✨" },
  { id: "common", label: "Everyday Core", icon: "💬" },
  { id: "greetings", label: "Greetings & Polite", icon: "👋" },
  { id: "emergency", label: "Medical & Urgent", icon: "🏥" },
  { id: "alphabet", label: "Alphabet (A-Z)", icon: "🔤" },
  { id: "numbers", label: "Numbers (0-9)", icon: "🔢" },
  { id: "family", label: "Family & People", icon: "👥" },
  { id: "questions", label: "Questions & Grammar", icon: "❓" },
  { id: "actions", label: "Actions & Daily", icon: "🏃" }
];

export const HANDSHAPES_LIST = [
  { code: "all", label: "All Handshapes" },
  { code: "open_b", label: "Open B (Flat Hand)" },
  { code: "fist_s", label: "Fist S / A (Closed)" },
  { code: "pointing_1", label: "1 (Index Point)" },
  { code: "v_peace", label: "V / Peace (Two Fingers)" },
  { code: "w_three", label: "W / 3 (Three Fingers)" },
  { code: "c_curve", label: "C (Curved Arc)" },
  { code: "o_circle", label: "O (Closed Loop)" },
  { code: "open_5", label: "5 (Open Spread)" },
  { code: "ily", label: "ILY (I Love You)" },
  { code: "y_shaka", label: "Y (Shaka / Phone)" },
  { code: "l_shape", label: "L (Right Angle)" },
  { code: "bent_index", label: "X (Bent Hook)" }
];

export const DICTIONARY_SIGNS = [
  // ==================== GREETINGS & POLITE ====================
  {
    id: "sign-hello",
    name: "Hello / Hi",
    gloss: "HELLO",
    category: "greetings",
    languages: ["ASL", "IS", "Auslan"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_b",
    handshape: "Open B-hand (fingers straight together, thumb relaxed)",
    location: "Forehead / Right Temple",
    orientation: "Palm facing slightly inward then forward toward observer",
    movement: "Salute gesture moving upward and outward from temple in a gentle arc",
    movementType: "wave",
    nonManualSignals: "Warm welcoming smile, direct eye contact, relaxed eyebrows",
    description: "Touch fingertips near the side of your forehead/temple with an open flat hand, then smoothly extend the hand outward toward the other person like a polite salute.",
    tips: "Keep the movement smooth and relaxed. Do not stiffen the elbow. Your face should show greeting warmth.",
    tags: ["greeting", "hi", "salute", "welcome", "starter"],
    fingerFlexions: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "open_b",
      motionPath: "salute_arc",
      arrowDirection: "right_up",
      keyframes: [
        { label: "Start", note: "Fingertips beside temple", handY: 45, handX: 50, rot: 5 },
        { label: "Stroke", note: "Arc outward and forward", handY: 35, handX: 70, rot: -10 },
        { label: "Finish", note: "Held toward receiver", handY: 30, handX: 85, rot: -15 }
      ]
    }
  },
  {
    id: "sign-thankyou",
    name: "Thank You / Thanks",
    gloss: "THANK-YOU",
    category: "greetings",
    languages: ["ASL", "IS"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_b",
    handshape: "Flat open B-hand, fingers extended together",
    location: "Chin / Lips",
    orientation: "Palm facing inward toward chin, then tilting upward toward recipient",
    movement: "Fingertips gently touch chin, then hand floats forward and slightly downward",
    movementType: "lift",
    nonManualSignals: "Slight head nod, appreciative facial expression and pleasant smile",
    description: "Start with the fingertips of your dominant flat hand touching your chin or lips. Move the hand outward and slightly down toward the person you are thanking.",
    tips: "Ensure movement comes from the chin forward. If signed from the chest, it becomes 'Good'.",
    tags: ["polite", "thanks", "gratitude", "manners", "appreciation"],
    fingerFlexions: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "open_b",
      motionPath: "chin_forward",
      arrowDirection: "forward_down",
      keyframes: [
        { label: "Start", note: "Tips touch chin", handY: 40, handX: 50, rot: 0 },
        { label: "Transition", note: "Move outward", handY: 50, handX: 65, rot: -10 },
        { label: "Finish", note: "Open toward receiver", handY: 60, handX: 80, rot: -20 }
      ]
    }
  },
  {
    id: "sign-please",
    name: "Please",
    gloss: "PLEASE",
    category: "greetings",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_b",
    handshape: "Flat B-hand with fingers together and thumb extended",
    location: "Center of Chest",
    orientation: "Palm flat against the chest",
    movement: "Smooth clockwise circular motion flat against the sternum",
    movementType: "circle",
    nonManualSignals: "Pleading or humble facial expression, gentle smile",
    description: "Place your flat open dominant hand in the center of your chest and rub in a gentle clockwise circle 2-3 times.",
    tips: "Keep the palm in light contact with your clothing as you circle.",
    tags: ["polite", "request", "courtesy", "manners"],
    fingerFlexions: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "open_b",
      motionPath: "chest_circle",
      arrowDirection: "circular",
      keyframes: [
        { label: "Top", note: "Upper chest center", handY: 45, handX: 50, rot: 0 },
        { label: "Right", note: "Circle rightward", handY: 55, handX: 62, rot: 15 },
        { label: "Complete", note: "Return in smooth loop", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-sorry",
    name: "Sorry / Apology",
    gloss: "SORRY",
    category: "greetings",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "fist_s",
    handshape: "A-handshape (fist with thumb alongside index)",
    location: "Center of Chest",
    orientation: "Thumb side/knuckles facing or touching the chest",
    movement: "Circular rubbing motion over the heart/chest",
    movementType: "circle",
    nonManualSignals: "Apologetic facial expression with slightly pulled-down brows and remorseful eyes",
    description: "Make a closed fist (A hand) and place it over the center of your chest or heart, rubbing in a gentle circle 2-3 times.",
    tips: "Contrast with 'Please': 'Please' uses an open flat hand, while 'Sorry' uses a closed fist.",
    tags: ["apology", "regret", "forgive", "sorry", "polite"],
    fingerFlexions: { thumb: 0.9, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "fist_a",
      motionPath: "chest_circle",
      arrowDirection: "circular",
      keyframes: [
        { label: "Touch", note: "Fist against chest", handY: 45, handX: 50, rot: 0 },
        { label: "Circle", note: "Gentle rub rotation", handY: 55, handX: 60, rot: -10 },
        { label: "Resolve", note: "Hold with sorry expression", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-yes",
    name: "Yes",
    gloss: "YES",
    category: "common",
    languages: ["ASL", "IS"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "fist_s",
    handshape: "S-hand (tight fist with thumb over fingers)",
    location: "Neutral Space (Chest level, in front of shoulder)",
    orientation: "Knuckles facing forward/outward",
    movement: "Wrist nods downward 2-3 times like a nodding head",
    movementType: "pulse",
    nonManualSignals: "Head nodding synchronously in agreement, affirming smile",
    description: "Form an S-fist in front of your body at chest level. Tilt your wrist forward and down a couple of times mimicking someone nodding 'yes'.",
    tips: "The movement is purely at the wrist joint, not the whole elbow or shoulder.",
    tags: ["affirmation", "agreement", "yes", "nod", "confirm"],
    fingerFlexions: { thumb: 0.2, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "fist_s",
      motionPath: "wrist_nod",
      arrowDirection: "down_up",
      keyframes: [
        { label: "Up", note: "Wrist tilted back", handY: 40, handX: 50, rot: -15 },
        { label: "Down", note: "Nod wrist downward", handY: 60, handX: 50, rot: 25 },
        { label: "Bounce", note: "Repeat subtle nod", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-no",
    name: "No",
    gloss: "NO",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "pointing_1",
    handshape: "Index and middle fingers extended, thumb extended, ring and pinky tucked",
    location: "Neutral Space (Chest level)",
    orientation: "Palm facing slightly inward/forward",
    movement: "Index and middle fingers snap down quickly against the thumb like a bird beak closing",
    movementType: "pinch",
    nonManualSignals: "Head shaking 'no' side-to-side, firm lips, slightly furrowed brow",
    description: "Extend your index and middle finger together with thumb open. Snap the index and middle fingertips quickly down against your thumb pad twice.",
    tips: "Think of fingerspelling N-O quickly fused into a single closing snap.",
    tags: ["negative", "refusal", "deny", "no", "disagree"],
    fingerFlexions: { thumb: 0.6, index: 0.7, middle: 0.7, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "no_beak",
      motionPath: "beak_snap",
      arrowDirection: "down_pinch",
      keyframes: [
        { label: "Open", note: "Fingers apart from thumb", handY: 40, handX: 50, rot: 0 },
        { label: "Snap", note: "Snap down onto thumb", handY: 55, handX: 50, rot: 10 },
        { label: "Re-tap", note: "Quick second tap", handY: 55, handX: 50, rot: 10 }
      ]
    }
  },
  {
    id: "sign-help",
    name: "Help",
    gloss: "HELP",
    category: "emergency",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: true,
    handshapeCode: "fist_s",
    handshape: "Dominant: A-fist (thumbs up); Non-dominant: Open flat palm (B-hand)",
    location: "Center Neutral Space in front of body",
    orientation: "Base palm facing up; fist resting atop the palm with thumb pointed up",
    movement: "Both hands lift together upward and slightly forward",
    movementType: "lift",
    nonManualSignals: "Urgent or supportive expression depending on context, raised or furrowed brows",
    description: "Place your dominant hand in a fist with thumb pointed up (like a thumbs up) on top of your non-dominant flat palm. Raise both hands together upward.",
    tips: "Directional verb: Moving toward yourself means 'Help me'; moving toward someone else means 'Help you'.",
    tags: ["emergency", "assistance", "support", "urgent", "doctor", "save"],
    fingerFlexions: { thumb: 1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "fist_on_palm",
      motionPath: "upward_lift",
      arrowDirection: "up",
      keyframes: [
        { label: "Rest", note: "Fist on base palm", handY: 65, handX: 50, rot: 0 },
        { label: "Lift", note: "Both hands elevate", handY: 45, handX: 50, rot: 0 },
        { label: "Extend", note: "Present assistance", handY: 35, handX: 50, rot: -5 }
      ]
    }
  },
  {
    id: "sign-iloveyou",
    name: "I Love You",
    gloss: "I-LOVE-YOU",
    category: "common",
    languages: ["ASL", "IS"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "ily",
    handshape: "Combination of letters I, L, Y: Thumb, Index, and Pinky extended upright",
    location: "Chest or elevated beside shoulder",
    orientation: "Palm facing outward toward viewer or audience",
    movement: "Held static upright or gently waved side to side",
    movementType: "wave",
    nonManualSignals: "Affectionate warm smile, bright open gaze",
    description: "Extend your thumb, index finger, and pinky finger simultaneously, while keeping middle and ring fingers folded flat into the palm. Hold with palm facing forward.",
    tips: "Do not confuse with 'Rock On' (which has the thumb folded over the middle fingers). ILY MUST have the thumb extended!",
    tags: ["love", "affection", "friendship", "family", "iconic"],
    fingerFlexions: { thumb: 1, index: 1, middle: 0.1, ring: 0.1, pinky: 1 },
    illustration: {
      handshapeType: "ily",
      motionPath: "subtle_wave",
      arrowDirection: "side_side",
      keyframes: [
        { label: "Form", note: "Thumb, Index, Pinky extended", handY: 50, handX: 50, rot: 0 },
        { label: "Wave Left", note: "Slight swivel", handY: 50, handX: 47, rot: -8 },
        { label: "Wave Right", note: "Warm sign hold", handY: 50, handX: 53, rot: 8 }
      ]
    }
  },
  {
    id: "sign-friend",
    name: "Friend",
    gloss: "FRIEND",
    category: "common",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: true,
    handshapeCode: "bent_index",
    handshape: "Both hands: X-hook (bent index fingers, thumbs securing other fingers)",
    location: "Chest / Mid-Neutral Space",
    orientation: "Palms facing down, then flipping opposite",
    movement: "Dominant hooked index links with non-dominant hooked index, then unlinks, flips over, and links reverse",
    movementType: "hook",
    nonManualSignals: "Warm affectionate smile",
    description: "Bend both index fingers into hooks. Hook your dominant index finger over the non-dominant index finger, then reverse hands and hook the opposite way.",
    tips: "Symbolizes two people holding onto each other firmly and reciprocally.",
    tags: ["relationship", "buddy", "companion", "pal", "social"],
    fingerFlexions: { thumb: 0.3, index: 0.5, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "hook_interlock",
      motionPath: "interlock_flip",
      arrowDirection: "circular",
      keyframes: [
        { label: "First Hook", note: "Right hook over Left hook", handY: 50, handX: 50, rot: 10 },
        { label: "Unlink", note: "Release and rotate hands", handY: 45, handX: 50, rot: 0 },
        { label: "Second Hook", note: "Left hook over Right hook", handY: 50, handX: 50, rot: -10 }
      ]
    }
  },
  {
    id: "sign-doctor",
    name: "Doctor",
    gloss: "DOCTOR",
    category: "emergency",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: true,
    handshapeCode: "open_b",
    handshape: "Dominant: Bent M/D hand or cupped fingertips; Non-dominant: Flat palm facing up",
    location: "Wrist / Radial Pulse Point",
    orientation: "Non-dominant palm up; Dominant fingertips tap inner wrist",
    movement: "Dominant fingertips tap twice on the non-dominant wrist (checking pulse)",
    movementType: "tap",
    nonManualSignals: "Alert, attentive, clinical or concerned gaze",
    description: "Hold your non-dominant arm out with palm facing up. With your dominant hand's bent fingertips, tap twice on your non-dominant inner wrist where a pulse is taken.",
    tips: "Mimics a physician checking a patient's radial pulse rhythm.",
    tags: ["medical", "physician", "hospital", "clinic", "health", "urgent"],
    fingerFlexions: { thumb: 0.4, index: 0.6, middle: 0.6, ring: 0.6, pinky: 0.6 },
    illustration: {
      handshapeType: "wrist_pulse_tap",
      motionPath: "double_tap",
      arrowDirection: "down",
      keyframes: [
        { label: "Position", note: "Hover above inner wrist", handY: 40, handX: 50, rot: 0 },
        { label: "Tap 1", note: "Contact wrist pulse", handY: 55, handX: 50, rot: 5 },
        { label: "Tap 2", note: "Double tap beat", handY: 55, handX: 50, rot: 5 }
      ]
    }
  },
  {
    id: "sign-emergency",
    name: "Emergency",
    gloss: "EMERGENCY",
    category: "emergency",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: false,
    handshapeCode: "fist_s",
    handshape: "E-handshape (curled fingers resting above thumb)",
    location: "Neutral Space (Chest / Shoulder height)",
    orientation: "Palm facing outward",
    movement: "Vigorous rapid side-to-side shaking of the E-hand",
    movementType: "wave",
    nonManualSignals: "Wide alert eyes, urgent expression, tense mouth",
    description: "Form an 'E' handshape and shake it rapidly back and forth horizontally in front of you.",
    tips: "The intensity and speed of shaking conveys the gravity of the emergency.",
    tags: ["emergency", "urgent", "911", "danger", "crisis", "critical"],
    fingerFlexions: { thumb: 0.3, index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3 },
    illustration: {
      handshapeType: "e_shake",
      motionPath: "rapid_shake",
      arrowDirection: "side_side",
      keyframes: [
        { label: "Left", note: "Shake E-hand left", handY: 50, handX: 42, rot: -12 },
        { label: "Center", note: "Rapid vibration", handY: 50, handX: 50, rot: 0 },
        { label: "Right", note: "Shake E-hand right", handY: 50, handX: 58, rot: 12 }
      ]
    }
  },
  {
    id: "sign-pain",
    name: "Pain / Hurt",
    gloss: "PAIN / HURT",
    category: "emergency",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: true,
    handshapeCode: "pointing_1",
    handshape: "Both hands: Index fingers extended (number 1)",
    location: "Near area of pain (e.g. head, stomach, tooth) or Neutral Space",
    orientation: "Fingertips pointing toward each other",
    movement: "Twist wrists toward each other in opposing directions while thrusting fingertips inward twice",
    movementType: "pulse",
    nonManualSignals: "Wincing expression, grimacing, squinted eyes reflecting pain",
    description: "Point both index fingers toward each other. Twist your wrists with a jabbing motion so the fingertips almost touch twice near where it hurts.",
    tips: "Sign location is flexible: Sign at forehead for headache, at stomach for stomach ache, at tooth for toothache.",
    tags: ["pain", "hurt", "ache", "injury", "medical", "symptom"],
    fingerFlexions: { thumb: 0.2, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "two_pointers_jab",
      motionPath: "opposing_twist",
      arrowDirection: "converging",
      keyframes: [
        { label: "Apart", note: "Pointers facing each other", handY: 50, handX: 40, rot: -15 },
        { label: "Jab In", note: "Twist inward toward center", handY: 50, handX: 48, rot: 10 },
        { label: "Rebound", note: "Second pain pulse", handY: 50, handX: 48, rot: 10 }
      ]
    }
  },
  {
    id: "sign-water",
    name: "Water",
    gloss: "WATER",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "w_three",
    handshape: "W-handshape (Index, middle, ring extended; thumb pins pinky)",
    location: "Chin",
    orientation: "Palm facing sideways/left, index side facing chin",
    movement: "Side of index finger taps the center of the chin twice",
    movementType: "tap",
    nonManualSignals: "Neutral or thirsty expression",
    description: "Form a 'W' hand with your dominant hand. Tap the side of your index finger against your chin twice.",
    tips: "Remember W for Water. Do not move your head to the hand; bring hand to chin.",
    tags: ["drink", "water", "beverage", "thirst", "hydration", "daily"],
    fingerFlexions: { thumb: 0.3, index: 1, middle: 1, ring: 1, pinky: 0.1 },
    illustration: {
      handshapeType: "w_chin_tap",
      motionPath: "double_chin_tap",
      arrowDirection: "inward_tap",
      keyframes: [
        { label: "Approach", note: "W-hand near mouth", handY: 45, handX: 58, rot: 0 },
        { label: "Tap 1", note: "Index contacts chin", handY: 45, handX: 50, rot: -5 },
        { label: "Tap 2", note: "Second crisp tap", handY: 45, handX: 50, rot: -5 }
      ]
    }
  },
  {
    id: "sign-eat",
    name: "Eat / Food",
    gloss: "EAT / FOOD",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "o_circle",
    handshape: "Squished / flattened O-hand (all fingertips touching thumb tip)",
    location: "Mouth",
    orientation: "Palm facing toward mouth/chin",
    movement: "Fingertips tap lips once for 'Eat' (verb) or twice for 'Food' (noun)",
    movementType: "tap",
    nonManualSignals: "Pleasant eating expression or relaxed mouth",
    description: "Bring all 5 fingertips together touching the thumb (flat O-hand). Tap fingertips to your lips once for eat, twice for food.",
    tips: "Noun-verb pair rule: Single motion = Verb (Eat); Double motion = Noun (Food).",
    tags: ["food", "eat", "meal", "hungry", "dinner", "lunch"],
    fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 },
    illustration: {
      handshapeType: "flat_o_mouth",
      motionPath: "mouth_tap",
      arrowDirection: "inward_tap",
      keyframes: [
        { label: "Forward", note: "Flattened O in front of mouth", handY: 52, handX: 60, rot: 0 },
        { label: "Tap 1", note: "Tips touch lips", handY: 48, handX: 50, rot: -5 },
        { label: "Tap 2", note: "Repeat for food", handY: 48, handX: 50, rot: -5 }
      ]
    }
  },
  {
    id: "sign-stop",
    name: "Stop",
    gloss: "STOP",
    category: "actions",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: true,
    handshapeCode: "open_b",
    handshape: "Dominant: Flat B-hand (pinky edge down); Non-dominant: Flat B-hand (palm up)",
    location: "Center Chest Space",
    orientation: "Dominant palm facing left/inward; Non-dominant palm facing ceiling",
    movement: "Dominant hand chops firmly down onto the non-dominant palm, stopping abruptly",
    movementType: "pulse",
    nonManualSignals: "Firm resolute mouth, alert posture, authoritative brow",
    description: "Hold non-dominant hand flat with palm up. Bring the pinky-edge of your dominant flat hand down sharply onto the palm like a karate chop halting action.",
    tips: "Movement must be crisp and stop dead upon contact with the palm.",
    tags: ["halt", "stop", "freeze", "action", "emergency", "command"],
    fingerFlexions: { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "karate_chop_stop",
      motionPath: "sharp_chop",
      arrowDirection: "down_strike",
      keyframes: [
        { label: "Raised", note: "Chopping hand elevated", handY: 30, handX: 50, rot: -20 },
        { label: "Strike", note: "Chop firmly down", handY: 55, handX: 50, rot: 0 },
        { label: "Hold", note: "Halted abruptly on palm", handY: 55, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-learn",
    name: "Learn / Study",
    gloss: "LEARN",
    category: "common",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: true,
    handshapeCode: "open_5",
    handshape: "Dominant starts open 5 then closes into flattened O; Non-dominant is open base palm",
    location: "Base palm to Forehead",
    orientation: "Non-dominant palm up; Dominant grasps upward to forehead",
    movement: "Dominant fingers gather knowledge from the open palm and place it directly into the forehead",
    movementType: "lift",
    nonManualSignals: "Concentrated, thoughtful, studious expression",
    description: "Hold your non-dominant hand flat like an open book. Use dominant fingertips to 'grab' information off the palm and bring it to touch your forehead, closing fingertips into an O.",
    tips: "Visualizes absorbing knowledge from a page into your brain.",
    tags: ["education", "study", "knowledge", "school", "academy", "learn"],
    fingerFlexions: { thumb: 0.8, index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8 },
    illustration: {
      handshapeType: "book_to_brain",
      motionPath: "palm_to_forehead",
      arrowDirection: "up_inward",
      keyframes: [
        { label: "Grab", note: "Tips gather off base palm", handY: 65, handX: 50, rot: 0 },
        { label: "Ascend", note: "Lifting knowledge up", handY: 45, handX: 50, rot: -10 },
        { label: "Forehead", note: "Place into forehead", handY: 25, handX: 50, rot: -20 }
      ]
    }
  },
  {
    id: "sign-more",
    name: "More",
    gloss: "MORE",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: true,
    handshapeCode: "o_circle",
    handshape: "Both hands in flattened O-hands (all fingertips touching thumb tips)",
    location: "Chest Level in front of body",
    orientation: "Palms facing each other, fingertips pointing together",
    movement: "Fingertips of both hands tap together repeatedly 2-3 times",
    movementType: "tap",
    nonManualSignals: "Anticipatory expression or question face if asking",
    description: "Form flattened O-shapes with both hands. Tap the fingertips of both hands together a couple of times in front of your chest.",
    tips: "One of the most useful signs for toddlers, learners, and daily dining requests.",
    tags: ["quantity", "extra", "additional", "more", "increase"],
    fingerFlexions: { thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5 },
    illustration: {
      handshapeType: "two_flattened_o_tap",
      motionPath: "converging_tap",
      arrowDirection: "converging",
      keyframes: [
        { label: "Apart", note: "Tips slightly separated", handY: 50, handX: 42, rot: -10 },
        { label: "Tap 1", note: "Tips touch together", handY: 50, handX: 50, rot: 0 },
        { label: "Tap 2", note: "Double tap beat", handY: 50, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-good",
    name: "Good / Well",
    gloss: "GOOD",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: true,
    handshapeCode: "open_b",
    handshape: "Dominant: Flat B-hand; Non-dominant: Flat B-hand palm up",
    location: "Chin to Base Palm",
    orientation: "Starts at chin facing in, lands on palm facing up",
    movement: "Dominant fingertips touch chin, then drop smoothly into the open palm of non-dominant hand",
    movementType: "lift",
    nonManualSignals: "Pleasant, affirmative nod, warm smile",
    description: "Touch your dominant fingertips to your chin, then bring the hand downward so the back of your dominant hand slaps gently into the open palm of your non-dominant hand.",
    tips: "Similar start to 'Thank You', but 'Good' finishes on the base hand palm.",
    tags: ["positive", "well", "fine", "great", "nice", "affirmative"],
    fingerFlexions: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "chin_to_palm",
      motionPath: "chin_to_base",
      arrowDirection: "down_forward",
      keyframes: [
        { label: "Chin", note: "Fingertips on chin", handY: 35, handX: 50, rot: 0 },
        { label: "Descend", note: "Move down toward palm", handY: 50, handX: 50, rot: 10 },
        { label: "Land", note: "Rests in non-dominant palm", handY: 65, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-bad",
    name: "Bad",
    gloss: "BAD",
    category: "common",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_b",
    handshape: "Flat B-hand",
    location: "Chin",
    orientation: "Starts with fingertips on chin, flips downward with palm down",
    movement: "Touch fingertips to chin, then forcefully flip hand downward and outward, palm facing down",
    movementType: "lift",
    nonManualSignals: "Disapproving facial expression, slightly turned-down mouth corners, furrowed brow",
    description: "Touch your fingertips to your chin with a flat hand, then suddenly flip the hand downward so your palm faces the floor, accompanied by an expression of distaste.",
    tips: "The downward flip and facial expression carry the negative meaning.",
    tags: ["negative", "poor", "unpleasant", "bad", "dislike"],
    fingerFlexions: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "chin_flip_down",
      motionPath: "flip_downward",
      arrowDirection: "down_turn",
      keyframes: [
        { label: "Chin", note: "Fingertips on chin", handY: 35, handX: 50, rot: 0 },
        { label: "Flip", note: "Rotate wrist downward", handY: 55, handX: 55, rot: 35 },
        { label: "Finish", note: "Palm faces floor firmly", handY: 65, handX: 60, rot: 45 }
      ]
    }
  },
  {
    id: "sign-what",
    name: "What / Huh?",
    gloss: "WHAT",
    category: "questions",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: true,
    handshapeCode: "open_5",
    handshape: "Both hands in relaxed open 5 / curved palms facing upward",
    location: "Waist / Chest level in front of body",
    orientation: "Palms facing upward toward ceiling",
    movement: "Hands move side-to-side horizontally in subtle mirrored shakes",
    movementType: "wave",
    nonManualSignals: "Furrowed eyebrows (WH-question grammar), tilted head, questioning eyes",
    description: "Hold both hands in front of you with palms facing up and fingers relaxed. Shake your hands gently from side to side while scrunching your eyebrows.",
    tips: "WH-Question Rule: In ASL, WH-questions (what, where, who, why) REQUIRE furrowed eyebrows.",
    tags: ["question", "what", "inquiry", "grammar", "wh-word"],
    fingerFlexions: { thumb: 0.8, index: 0.8, middle: 0.8, ring: 0.8, pinky: 0.8 },
    illustration: {
      handshapeType: "palms_up_shake",
      motionPath: "horizontal_shake",
      arrowDirection: "side_side",
      keyframes: [
        { label: "Inward", note: "Palms up angled in", handY: 55, handX: 45, rot: -5 },
        { label: "Outward", note: "Sweep hands outward", handY: 55, handX: 55, rot: 5 },
        { label: "Hold", note: "Questioning brows held", handY: 55, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-where",
    name: "Where",
    gloss: "WHERE",
    category: "questions",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "pointing_1",
    handshape: "Index finger pointing upright (number 1)",
    location: "Chest / Shoulder height",
    orientation: "Palm facing forward or slightly inward",
    movement: "Index finger pivots left and right at the wrist like a car windshield wiper",
    movementType: "wave",
    nonManualSignals: "Furrowed eyebrows, slight head tilt looking around",
    description: "Hold your dominant index finger upright at shoulder level. Pivot your hand back and forth from side to side 2-3 times while furrowing your eyebrows.",
    tips: "Pivot only at the wrist, keep the index finger straight upright.",
    tags: ["question", "where", "location", "place", "directions"],
    fingerFlexions: { thumb: 0.3, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "finger_wag",
      motionPath: "side_to_side_wag",
      arrowDirection: "side_side",
      keyframes: [
        { label: "Left", note: "Index wag left", handY: 45, handX: 45, rot: -15 },
        { label: "Right", note: "Index wag right", handY: 45, handX: 55, rot: 15 },
        { label: "Center", note: "Double wag", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "sign-family",
    name: "Family",
    gloss: "FAMILY",
    category: "family",
    languages: ["ASL"],
    difficulty: "Intermediate",
    isTwoHanded: true,
    handshapeCode: "o_circle",
    handshape: "Both hands in F-handshape (thumb & index forming circles, 3 fingers up)",
    location: "Chest Level",
    orientation: "Starts with index/thumbs touching in front; finishes with pinky sides touching",
    movement: "Both F-hands sweep outward in a wide circle and come together completing a ring",
    movementType: "circle",
    nonManualSignals: "Warm inclusive expression, slight smile",
    description: "Form 'F' with both hands. Touch your thumbs and index fingers together in front of you, circle hands outward away from each other, and bring pinkies together to close the family circle.",
    tips: "Remember F for Family. The circular path represents an unbroken family unit.",
    tags: ["family", "relatives", "parents", "children", "home", "group"],
    fingerFlexions: { thumb: 0.5, index: 0.5, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "f_family_circle",
      motionPath: "enclosing_circle",
      arrowDirection: "circular",
      keyframes: [
        { label: "Front Touch", note: "Thumbs & index meet", handY: 50, handX: 50, rot: 0 },
        { label: "Sweep Out", note: "Circle around outward", handY: 50, handX: 65, rot: 20 },
        { label: "Back Touch", note: "Pinkies meet in back", handY: 50, handX: 50, rot: 0 }
      ]
    }
  },

  // ==================== MANUAL ALPHABET (A - Z) ====================
  {
    id: "asl-letter-a",
    name: "Letter A",
    gloss: "A",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "fist_s",
    handshape: "Closed fist with thumb extended upright against side of index knuckle",
    location: "Shoulder / Mid-Chest Space",
    orientation: "Palm facing forward toward observer",
    movement: "Held static upright with steady wrist",
    movementType: "static",
    nonManualSignals: "Neutral focused expression",
    description: "Make a tight fist with your four fingers curled into the palm. Rest your thumb straight upright along the side of the curled index finger.",
    tips: "Thumb MUST be along the side. If folded across the front, it becomes the letter 'S'!",
    tags: ["alphabet", "letter", "a", "vowel", "fingerspelling"],
    fingerFlexions: { thumb: 0.9, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 },
    illustration: {
      handshapeType: "letter_a",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Form", note: "Four fingers curled into palm", handY: 50, handX: 50, rot: 0 },
        { label: "Thumb", note: "Thumb upright on index side", handY: 50, handX: 50, rot: 0 },
        { label: "Hold", note: "Palm facing forward", handY: 50, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-letter-b",
    name: "Letter B",
    gloss: "B",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_b",
    handshape: "Four fingers extended vertically straight together; thumb tucked across palm",
    location: "Shoulder / Mid-Chest Space",
    orientation: "Palm facing forward",
    movement: "Held static upright",
    movementType: "static",
    nonManualSignals: "Neutral focused expression",
    description: "Hold your four fingers straight up and pressed tightly together. Fold your thumb across your palm flat.",
    tips: "Keep fingers strictly upright and joined together, not spread.",
    tags: ["alphabet", "letter", "b", "consonant", "fingerspelling"],
    fingerFlexions: { thumb: 0.05, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "letter_b",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Extend", note: "Four fingers straight together", handY: 45, handX: 50, rot: 0 },
        { label: "Tuck", note: "Thumb folded across palm", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Vertical alignment", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-letter-c",
    name: "Letter C",
    gloss: "C",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "c_curve",
    handshape: "Fingers and thumb curved to form the shape of a C",
    location: "Shoulder / Mid-Chest Space",
    orientation: "Hand turned slightly sideways so profile forms the letter C",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral focused expression",
    description: "Curve all four fingers and thumb into a smooth semi-circle, perfectly outlining the printed letter 'C'.",
    tips: "Make sure all fingers move in a unified curve, not flat.",
    tags: ["alphabet", "letter", "c", "consonant", "fingerspelling"],
    fingerFlexions: { thumb: 0.55, index: 0.55, middle: 0.55, ring: 0.55, pinky: 0.55 },
    illustration: {
      handshapeType: "letter_c",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Curve", note: "Arc fingers into smooth semi-circle", handY: 50, handX: 50, rot: 15 },
        { label: "Profile", note: "Thumb and fingers form C", handY: 50, handX: 50, rot: 15 },
        { label: "Hold", note: "Facing receiver clearly", handY: 50, handX: 50, rot: 15 }
      ]
    }
  },
  {
    id: "asl-letter-d",
    name: "Letter D",
    gloss: "D",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "pointing_1",
    handshape: "Index pointing straight up; thumb touches tips of middle, ring, pinky in a closed loop",
    location: "Shoulder Space",
    orientation: "Palm facing forward",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral focused expression",
    description: "Point your index finger straight up. Touch your thumb tip to the tips of your middle, ring, and pinky fingers, forming a circle like the round belly of 'd'.",
    tips: "Only the index finger is extended. If all 3 other fingers are upright with index touching thumb, that is 'F'.",
    tags: ["alphabet", "letter", "d", "consonant", "fingerspelling"],
    fingerFlexions: { thumb: 0.4, index: 1, middle: 0.25, ring: 0.25, pinky: 0.25 },
    illustration: {
      handshapeType: "letter_d",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Index Up", note: "Index finger points straight up", handY: 45, handX: 50, rot: 0 },
        { label: "Loop", note: "Thumb meets middle, ring, pinky", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Letter d outline visible", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-letter-l",
    name: "Letter L",
    gloss: "L",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "l_shape",
    handshape: "Index finger points up, thumb extends at 90-degree right angle",
    location: "Shoulder Space",
    orientation: "Palm facing forward",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral focused expression",
    description: "Extend your index finger straight up and your thumb out to the side at a 90-degree angle, perfectly forming an 'L' shape. Keep other fingers curled.",
    tips: "Ensure an exact 90-degree angle between thumb and index.",
    tags: ["alphabet", "letter", "l", "consonant", "fingerspelling"],
    fingerFlexions: { thumb: 1, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "letter_l",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Index", note: "Index straight up", handY: 45, handX: 50, rot: 0 },
        { label: "Thumb", note: "Thumb out 90 degrees", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Clean L angle", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-letter-v",
    name: "Letter V / Peace",
    gloss: "V",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "v_peace",
    handshape: "Index and middle fingers extended upward and spread apart into a V shape",
    location: "Shoulder Space",
    orientation: "Palm facing forward",
    movement: "Static upright",
    movementType: "static",
    nonManualSignals: "Neutral or cheerful expression",
    description: "Extend your index and middle fingers straight up and spread them apart to form the letter V. Tuck your ring finger and pinky with thumb across them.",
    tips: "If index and middle are pressed together, it's letter 'U'. Spread apart, it's 'V'.",
    tags: ["alphabet", "letter", "v", "peace", "victory", "fingerspelling"],
    fingerFlexions: { thumb: 0.2, index: 1, middle: 1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "letter_v",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Spread", note: "Index and middle extended in V", handY: 45, handX: 50, rot: 0 },
        { label: "Fold", note: "Ring and pinky tucked", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Vertical peace / V shape", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-letter-y",
    name: "Letter Y / Call Me",
    gloss: "Y",
    category: "alphabet",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "y_shaka",
    handshape: "Thumb and pinky extended out, middle three fingers folded down",
    location: "Shoulder Space",
    orientation: "Palm facing forward",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral or playful expression",
    description: "Extend your thumb and pinky finger outward while folding your index, middle, and ring fingers tightly against your palm (shaka sign).",
    tips: "Bring hand to your ear and mouth with this shape for the sign 'Call Me'.",
    tags: ["alphabet", "letter", "y", "shaka", "hang loose", "fingerspelling"],
    fingerFlexions: { thumb: 1, index: 0.1, middle: 0.1, ring: 0.1, pinky: 1 },
    illustration: {
      handshapeType: "letter_y",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Thumb & Pinky", note: "Extend both outer digits", handY: 50, handX: 50, rot: 0 },
        { label: "Fold 3", note: "Index, middle, ring down", handY: 50, handX: 50, rot: 0 },
        { label: "Hold", note: "Y shape facing forward", handY: 50, handX: 50, rot: 0 }
      ]
    }
  },

  // ==================== NUMBERS (0 - 9) ====================
  {
    id: "asl-num-1",
    name: "Number 1",
    gloss: "1",
    category: "numbers",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "pointing_1",
    handshape: "Index finger pointing straight up, other fingers curled in fist with thumb across",
    location: "Chest / Shoulder level",
    orientation: "Palm facing inward toward signer (in ASL counting) or forward",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral expression",
    description: "Extend your index finger vertically. Keep thumb folded over curled fingers. In native ASL counting 1-5, palm traditionally faces inward toward your chest.",
    tips: "Notice palm orientation: In ASL counting 1 to 5, palm faces inward; for 6 to 10, palm turns outward.",
    tags: ["number", "digit", "1", "one", "counting"],
    fingerFlexions: { thumb: 0.2, index: 1, middle: 0.1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "num_1",
      motionPath: "static_hold",
      arrowDirection: "up",
      keyframes: [
        { label: "Extend", note: "Single index finger upright", handY: 45, handX: 50, rot: 0 },
        { label: "Align", note: "Thumb folded securely", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Clean 1 posture", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-num-3",
    name: "Number 3",
    gloss: "3",
    category: "numbers",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "w_three",
    handshape: "Thumb, index, and middle fingers extended; ring and pinky curled down",
    location: "Chest / Shoulder level",
    orientation: "Palm facing inward toward chest",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral expression",
    description: "Extend your thumb, index, and middle fingers upward. Ring and pinky fingers are folded down into the palm.",
    tips: "Crucial ASL Distinction: In ASL, '3' uses the THUMB, index, and middle. If you use index, middle, and ring, that is the letter 'W' or number 6!",
    tags: ["number", "digit", "3", "three", "counting"],
    fingerFlexions: { thumb: 1, index: 1, middle: 1, ring: 0.1, pinky: 0.1 },
    illustration: {
      handshapeType: "num_3",
      motionPath: "static_hold",
      arrowDirection: "up",
      keyframes: [
        { label: "Thumb + Two", note: "Thumb, index, middle out", handY: 45, handX: 50, rot: 0 },
        { label: "Curl Two", note: "Ring and pinky tucked", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Standard ASL three", handY: 45, handX: 50, rot: 0 }
      ]
    }
  },
  {
    id: "asl-num-5",
    name: "Number 5",
    gloss: "5",
    category: "numbers",
    languages: ["ASL"],
    difficulty: "Beginner",
    isTwoHanded: false,
    handshapeCode: "open_5",
    handshape: "All five fingers extended and spread comfortably apart",
    location: "Chest / Shoulder level",
    orientation: "Palm facing inward toward signer",
    movement: "Static hold",
    movementType: "static",
    nonManualSignals: "Neutral expression",
    description: "Spread all five fingers and thumb wide open, facing inward toward your body.",
    tips: "Turn palm outward when ordering items or speaking numbers to hearing audiences.",
    tags: ["number", "digit", "5", "five", "counting", "open hand"],
    fingerFlexions: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 },
    illustration: {
      handshapeType: "num_5",
      motionPath: "static_hold",
      arrowDirection: "forward",
      keyframes: [
        { label: "Spread", note: "All 5 digits open wide", handY: 45, handX: 50, rot: 0 },
        { label: "Extend", note: "Comfortable finger spacing", handY: 45, handX: 50, rot: 0 },
        { label: "Hold", note: "Clear number 5 outline", handY: 45, handX: 50, rot: 0 }
      ]
    }
  }
];

export const getSignById = (id) => {
  return DICTIONARY_SIGNS.find((s) => s.id === id);
};

export const searchSigns = ({
  query = "",
  category = "all",
  handshape = "all",
  language = "all",
  difficulty = "all",
  twoHandedOnly = null
}) => {
  const cleanQ = query.trim().toLowerCase();

  return DICTIONARY_SIGNS.filter((sign) => {
    // Search query match
    if (cleanQ) {
      const matchName = sign.name.toLowerCase().includes(cleanQ);
      const matchGloss = sign.gloss.toLowerCase().includes(cleanQ);
      const matchDesc = sign.description.toLowerCase().includes(cleanQ);
      const matchHandshape = sign.handshape.toLowerCase().includes(cleanQ);
      const matchTags = sign.tags.some((t) => t.toLowerCase().includes(cleanQ));

      if (!matchName && !matchGloss && !matchDesc && !matchHandshape && !matchTags) {
        return false;
      }
    }

    // Category filter
    if (category !== "all" && sign.category !== category) {
      return false;
    }

    // Handshape filter
    if (handshape !== "all" && sign.handshapeCode !== handshape) {
      return false;
    }

    // Language filter
    if (language !== "all" && !sign.languages.includes(language)) {
      return false;
    }

    // Difficulty filter
    if (difficulty !== "all" && sign.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
      return false;
    }

    // Two-handed filter
    if (twoHandedOnly !== null && sign.isTwoHanded !== twoHandedOnly) {
      return false;
    }

    return true;
  });
};
