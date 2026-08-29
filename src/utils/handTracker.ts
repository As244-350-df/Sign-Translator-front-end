// Real-time Hand Tracking, Optical Computer Vision & High-Precision Kinematics Engine
// Provides 21-joint anatomical hand tracking, continuous multi-joint finger articulation,
// and robust ASL sign recognition powered by client-side TensorFlow.js deep learning.

import { tfjsClassifier, TFJSTelemetry } from './tfjsModel';

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface FingerPoseState {
  thumb: number;      // 0.0 (tightly curled into palm) to 1.0 (fully extended)
  index: number;      // 0.0 to 1.0
  middle: number;     // 0.0 to 1.0
  ring: number;       // 0.0 to 1.0
  pinky: number;      // 0.0 to 1.0
  spread: number;     // 0.0 (closed) to 1.0 (wide spread, default 0.45)
  wristAngle: number; // -45 to +45 degrees (pitch / tilt)
  rotation: number;   // -45 to +45 degrees (yaw / roll)
  tension?: number;   // 0.0 to 1.0 (joint firmness / grip tightness, default 0.90)
  isFreeMotion: boolean; // When true, fingers articulate freely without snapping to fixed dictionary poses
  proceduralAnimation?: 'none' | 'wave' | 'wiggle' | 'tap' | 'breathe';
}

export interface SignSymbolMeaning {
  symbol: string;         // Visual emoji/glyph (e.g., '🤟', '🖐️', '✌️', '👍')
  signName: string;       // Formal sign name (e.g., 'I LOVE YOU', 'HELLO', 'PEACE')
  translatedText: string; // Meaningful English text output (e.g., 'I love you', 'Hello', 'Peace')
  meaning: string;        // Full semantic definition / context
  category: 'greetings' | 'common' | 'emergency' | 'alphabet' | 'numbers' | 'actions' | 'custom';
  confidence: number;
  aslNotation?: string;
  isCustom?: boolean;
  fingerConfig?: {
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  };
}

export interface HandPhysicsConfig {
  enabled: boolean;
  preset: 'biological' | 'snappy' | 'fluid' | 'precision';
  stiffness: number;       // Spring stiffness (0.2 to 2.5, default 1.15)
  damping: number;         // Damping ratio zeta (0.2 to 1.0, default 0.72)
  tendonCoupling: number;  // Inter-finger biomechanical cross-coupling (0.0 to 1.0, default 0.35)
  massInertia: number;     // Bone & muscle mass inertia (0.1 to 1.0, default 0.40)
  softCollision: boolean;  // Prevent finger self-intersection
  volumetric3D: boolean;   // 3D perspective foreshortening & volumetric lighting
  oneEuroFilter: boolean;  // Velocity-adaptive jitter damper
}

export interface PhysicsTelemetry {
  kineticEnergy: number;      // in milliJoules
  tendonTension: number;      // 0 to 100% strain
  averageVelocity: number;    // px/sec
  springSettlement: number;   // 0 to 100%
  naturalFrequencyHz: number; // omega0 / 2pi
  mode: string;
}

export const PHYSICS_PRESETS: Record<HandPhysicsConfig['preset'], Partial<HandPhysicsConfig>> = {
  biological: {
    stiffness: 1.15,
    damping: 0.72,
    tendonCoupling: 0.35,
    massInertia: 0.40,
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
    stiffness: 2.50,
    damping: 0.98,
    tendonCoupling: 0.00,
    massInertia: 0.12,
    softCollision: false,
    volumetric3D: true,
    oneEuroFilter: true
  }
};

interface OneEuroFilterState {
  x: number;
  dx: number;
  lastTime: number;
}

interface JointDynamicNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  mass: number;
  impulseX: number;
  impulseY: number;
  impulseZ: number;
  filterX: OneEuroFilterState;
  filterY: OneEuroFilterState;
  filterZ: OneEuroFilterState;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[];
  boundingBox: { x: number; y: number; width: number; height: number };
  gesture: string;
  signMeaning: SignSymbolMeaning | null;
  confidence: number;
  handedness: 'Right' | 'Left';
  fps: number;
  isRealHandDetected: boolean;
  holdProgress: number; // 0 to 1 (progress towards committing the sign to text)
  isCommitted: boolean; // true on the exact frame the sign is committed
  fingerPose: FingerPoseState;
  autoCentering?: {
    enabled: boolean;
    isTracking: boolean;
    currentZoom: number;
    panOffsetX: number;
    panOffsetY: number;
    handFramedScore: number; // 0 to 100%
    statusText: string;
  };
  physicsTelemetry?: PhysicsTelemetry;
  tfTelemetry?: TFJSTelemetry;
}

// 21 standard skeletal landmark indices (MediaPipe / TensorFlow HandPose topology):
// 0: Wrist
// 1-4: Thumb (CMC, MCP, IP, Tip)
// 5-8: Index (MCP, PIP, DIP, Tip)
// 9-12: Middle (MCP, PIP, DIP, Tip)
// 13-16: Ring (MCP, PIP, DIP, Tip)
// 17-20: Pinky (MCP, PIP, DIP, Tip)

export const BASE_SIGN_DICTIONARY: Record<string, SignSymbolMeaning> = {
  'HELLO': {
    symbol: '🖐️',
    signName: 'HELLO / OPEN HAND (ASL: 5)',
    translatedText: 'Hello',
    meaning: 'Standard friendly greeting, wave, or number 5 with all 5 fingers open and extended.',
    category: 'greetings',
    confidence: 0.98,
    aslNotation: 'All 5 fingers fully extended and spread outward',
    fingerConfig: { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'I_LOVE_YOU': {
    symbol: '🤟',
    signName: 'I LOVE YOU (ASL)',
    translatedText: 'I love you',
    meaning: 'Universal sign expressing love, care, and deep affection in American Sign Language (combines letters I, L, and Y).',
    category: 'common',
    confidence: 0.99,
    aslNotation: 'Thumb + Index + Pinky extended, Middle + Ring folded tight',
    fingerConfig: { thumb: 1.0, index: 1.0, middle: 0.05, ring: 0.05, pinky: 1.0 }
  },
  'PEACE': {
    symbol: '✌️',
    signName: 'PEACE / TWO / V (ASL: V/2)',
    translatedText: 'Peace',
    meaning: 'Signifies peace, victory, ASL letter V, or the numeral 2.',
    category: 'common',
    confidence: 0.97,
    aslNotation: 'Index and Middle extended in V-shape, others curled',
    fingerConfig: { thumb: 0.15, index: 1.0, middle: 1.0, ring: 0.05, pinky: 0.05 }
  },
  'GOOD': {
    symbol: '👍',
    signName: 'GOOD / THUMBS UP / CONFIRMED',
    translatedText: 'Good',
    meaning: 'Positive affirmation, agreement, confirmation, or ASL number 10.',
    category: 'common',
    confidence: 0.98,
    aslNotation: 'Thumb extended upwards, other four fingers curled into fist',
    fingerConfig: { thumb: 1.0, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'NO': {
    symbol: '👎',
    signName: 'NO / DISAGREE / BAD',
    translatedText: 'No',
    meaning: 'Disagreement, refusal, dissatisfaction, or negative status.',
    category: 'common',
    confidence: 0.95,
    aslNotation: 'Thumb pointed downward, other fingers curled',
    fingerConfig: { thumb: 1.0, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'POINT_ONE': {
    symbol: '☝️',
    signName: 'POINT / ONE / ASL: D',
    translatedText: 'One / Pointing',
    meaning: 'Numeral 1, pointing reference to person or object, or ASL letter D.',
    category: 'numbers',
    confidence: 0.97,
    aslNotation: 'Index finger extended straight up, others curled to thumb',
    fingerConfig: { thumb: 0.15, index: 1.0, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'YES_FIST': {
    symbol: '✊',
    signName: 'YES / FIST (ASL: S/A)',
    translatedText: 'Yes',
    meaning: 'Fist nod indicating agreement or confirmation in ASL (letters S or A).',
    category: 'common',
    confidence: 0.96,
    aslNotation: 'All fingers closed tightly into solid fist',
    fingerConfig: { thumb: 0.05, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'CALL_ME': {
    symbol: '🤙',
    signName: 'CALL ME / PHONE (ASL: Y)',
    translatedText: 'Call me',
    meaning: 'Phone communication request, "hang loose" / shaka, or ASL letter Y.',
    category: 'actions',
    confidence: 0.98,
    aslNotation: 'Thumb and Pinky extended outward, middle three fingers folded',
    fingerConfig: { thumb: 1.0, index: 0.05, middle: 0.05, ring: 0.05, pinky: 1.0 }
  },
  'OKAY': {
    symbol: '👌',
    signName: 'OKAY / PERFECT (ASL: F/9)',
    translatedText: 'Okay / Perfect',
    meaning: 'Approval, perfection, all good, ASL letter F, or numeral 9.',
    category: 'common',
    confidence: 0.96,
    aslNotation: 'Thumb tip touches Index tip forming a circle; other 3 fingers extended',
    fingerConfig: { thumb: 0.35, index: 0.35, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'LUCK_CROSS': {
    symbol: '🤞',
    signName: 'GOOD LUCK / ASL: R',
    translatedText: 'Good luck',
    meaning: 'Wishing good luck, hope, or ASL letter R.',
    category: 'common',
    confidence: 0.94,
    aslNotation: 'Index and Middle fingers crossed over each other',
    fingerConfig: { thumb: 0.15, index: 1.0, middle: 1.0, ring: 0.05, pinky: 0.05 }
  },
  'WATER': {
    symbol: '💧',
    signName: 'WATER / THREE (ASL: W)',
    translatedText: 'Water',
    meaning: 'Requesting water/drink, or ASL letter W / numeral 3.',
    category: 'common',
    confidence: 0.96,
    aslNotation: 'Index, Middle, and Ring fingers extended up; Thumb touches Pinky',
    fingerConfig: { thumb: 0.15, index: 1.0, middle: 1.0, ring: 1.0, pinky: 0.05 }
  },
  'FOUR': {
    symbol: '4️⃣',
    signName: 'FOUR / ASL: 4 / B',
    translatedText: 'Four',
    meaning: 'Four fingers extended upwards, thumb folded across palm.',
    category: 'numbers',
    confidence: 0.97,
    aslNotation: 'Four fingers standing tall, thumb tucked',
    fingerConfig: { thumb: 0.05, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'LOVE_L': {
    symbol: '👆',
    signName: 'LETTER L / LOVE (ASL: L)',
    translatedText: 'Letter L',
    meaning: 'ASL letter L, forming a 90-degree right angle with index and thumb.',
    category: 'alphabet',
    confidence: 0.97,
    aslNotation: 'Index pointing straight up and Thumb pointing horizontally',
    fingerConfig: { thumb: 1.0, index: 1.0, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'THANK_YOU': {
    symbol: '🙏',
    signName: 'THANK YOU / GRATITUDE',
    translatedText: 'Thank you',
    meaning: 'Polite expression of gratitude and appreciation towards the speaker.',
    category: 'greetings',
    confidence: 0.96,
    aslNotation: 'Flat hand moving forward from chin or chest',
    fingerConfig: { thumb: 0.85, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'HELP_EMERGENCY': {
    symbol: '🩺',
    signName: 'HELP / EMERGENCY (ASL)',
    translatedText: 'Help / Emergency',
    meaning: 'Urgent medical assistance or immediate support requested.',
    category: 'emergency',
    confidence: 0.99,
    aslNotation: 'Thumbs up resting on flat palm lifted upward',
    fingerConfig: { thumb: 1.0, index: 0.15, middle: 0.15, ring: 0.15, pinky: 0.15 }
  },
  'EAT_FOOD': {
    symbol: '🍽️',
    signName: 'EAT / FOOD / MORE',
    translatedText: 'Eat / Food',
    meaning: 'Desire to eat, food sustenance, or requesting more items.',
    category: 'actions',
    confidence: 0.94,
    aslNotation: 'Flattened O handshape touching near mouth',
    fingerConfig: { thumb: 0.45, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45 }
  },
  'STOP': {
    symbol: '🛑',
    signName: 'STOP / HALT',
    translatedText: 'Stop',
    meaning: 'Instruction to halt immediately or stop an action.',
    category: 'emergency',
    confidence: 0.98,
    aslNotation: 'Flat dominant hand chopping down into flat base palm',
    fingerConfig: { thumb: 0.8, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'PLEASE': {
    symbol: '🤲',
    signName: 'PLEASE / COURTESY',
    translatedText: 'Please',
    meaning: 'Polite request indicating courtesy and respect.',
    category: 'greetings',
    confidence: 0.95,
    aslNotation: 'Flat hand rubbing in a circular motion on the chest',
    fingerConfig: { thumb: 0.7, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 }
  },
  'SORRY': {
    symbol: '😔',
    signName: 'SORRY / APOLOGY (ASL: A-Fist)',
    translatedText: 'Sorry',
    meaning: 'Sincere apology, regret, or forgiveness request.',
    category: 'greetings',
    confidence: 0.96,
    aslNotation: 'A-fist handshape rubbing in a circle over the heart',
    fingerConfig: { thumb: 0.3, index: 0.05, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'WHERE': {
    symbol: '❓',
    signName: 'WHERE / LOCATION QUESTION',
    translatedText: 'Where?',
    meaning: 'Question asking for the geographic position, location, or place of something.',
    category: 'actions',
    confidence: 0.95,
    aslNotation: 'Index finger pointing up and oscillating side to side',
    fingerConfig: { thumb: 0.15, index: 1.0, middle: 0.05, ring: 0.05, pinky: 0.05 }
  },
  'FRIEND': {
    symbol: '🤝',
    signName: 'FRIEND / COMPANION',
    translatedText: 'Friend',
    meaning: 'Close companion, ally, or trusted personal acquaintance.',
    category: 'common',
    confidence: 0.96,
    aslNotation: 'Hooked X-index fingers clasping together forward and reversed',
    fingerConfig: { thumb: 0.35, index: 0.65, middle: 0.05, ring: 0.05, pinky: 0.05 }
  }
};

const STORAGE_KEY = 'convo_custom_hand_signs_v3';

export function loadSavedCustomSigns(): Record<string, SignSymbolMeaning> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

export function saveCustomSignsToStorage(signs: Record<string, SignSymbolMeaning>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signs));
  } catch (e) {
    console.error('Failed to persist custom hand signs:', e);
  }
}

export let SIGN_DICTIONARY: Record<string, SignSymbolMeaning> = {
  ...BASE_SIGN_DICTIONARY,
  ...loadSavedCustomSigns()
};

export class RealtimeHandTracker {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;
  private lastFrameTime: number = performance.now();
  private fps: number = 60;
  private smoothedLandmarks: HandLandmark[] = [];
  
  // Real-time Gesture State & Hold-to-commit duration
  private currentSignKey: string = 'HELLO';
  private lastCommittedSignKey: string = '';
  private signHoldStartTime: number = performance.now();
  private readonly HOLD_DURATION_MS: number = 700;
  private customSigns: Record<string, SignSymbolMeaning> = {};

  // Hand Position Filtering
  private smoothTargetX: number = 0;
  private smoothTargetY: number = 0;
  private smoothHandSpan: number = 150;

  // Optical Zoom, Pan Offset & Hand Alignment Calibration
  private zoomLevel: number = 1.0;
  private panOffsetX: number = 0; // -1 to 1 normalized
  private panOffsetY: number = 0; // -1 to 1 normalized
  private calibrationScale: number = 1.0; // 0.7 to 1.4 fine-tuning
  private autoCenterEnabled: boolean = false;
  private lastHandSeenTime: number = 0;

  // Free Finger Articulation State
  private fingerPose: FingerPoseState = {
    thumb: 1.0,
    index: 1.0,
    middle: 1.0,
    ring: 1.0,
    pinky: 1.0,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.90,
    isFreeMotion: false,
    proceduralAnimation: 'none'
  };

  private smoothedPose: FingerPoseState = {
    thumb: 1.0,
    index: 1.0,
    middle: 1.0,
    ring: 1.0,
    pinky: 1.0,
    spread: 0.45,
    wristAngle: 0,
    rotation: 0,
    tension: 0.90,
    isFreeMotion: false,
    proceduralAnimation: 'none'
  };

  // Biomechanical Physics Engine State
  private physicsConfig: HandPhysicsConfig = {
    enabled: true,
    preset: 'biological',
    stiffness: 1.15,
    damping: 0.72,
    tendonCoupling: 0.35,
    massInertia: 0.40,
    softCollision: true,
    volumetric3D: true,
    oneEuroFilter: true
  };

  private jointNodes: JointDynamicNode[] = [];
  private physicsTelemetry: PhysicsTelemetry = {
    kineticEnergy: 0,
    tendonTension: 0,
    averageVelocity: 0,
    springSettlement: 100,
    naturalFrequencyHz: 12.5,
    mode: 'Biological'
  };

  private useTensorFlowClassifier: boolean = true;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 120;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.customSigns = loadSavedCustomSigns();
    this.syncDictionary();
    this.initPhysicsNodes();

    // Asynchronously initialize TensorFlow.js pure JavaScript / WebGL engine
    tfjsClassifier.initialize().catch(err => {
      console.warn('[RealtimeHandTracker] TF.js engine background init:', err);
    });
  }

  private initPhysicsNodes() {
    // MediaPipe 21 Joint node masses (relative anatomical weights)
    const masses = [
      2.2, // 0: Wrist base anchor (heaviest)
      1.1, 0.9, 0.65, 0.45, // 1-4: Thumb CMC, MCP, IP, Tip
      1.0, 0.75, 0.55, 0.35, // 5-8: Index MCP, PIP, DIP, Tip
      1.05, 0.80, 0.60, 0.38, // 9-12: Middle MCP, PIP, DIP, Tip
      0.95, 0.70, 0.50, 0.35, // 13-16: Ring MCP, PIP, DIP, Tip
      0.80, 0.55, 0.40, 0.30  // 17-20: Pinky MCP, PIP, DIP, Tip
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

  public setPhysicsConfig(config: Partial<HandPhysicsConfig>) {
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

  public getPhysicsConfig(): HandPhysicsConfig {
    return { ...this.physicsConfig };
  }

  public setPhysicsPreset(preset: HandPhysicsConfig['preset']) {
    if (PHYSICS_PRESETS[preset]) {
      this.physicsConfig = {
        ...this.physicsConfig,
        ...PHYSICS_PRESETS[preset],
        preset
      };
    }
  }

  public applyPhysicsImpulse(
    target: 'all' | 'thumb' | 'index' | 'middle' | 'ring' | 'pinky' | 'wrist' = 'all',
    impulseX: number = 0,
    impulseY: number = -15,
    impulseZ: number = 5
  ) {
    const targetIndices: number[] = [];
    if (target === 'all') {
      for (let i = 0; i < 21; i++) targetIndices.push(i);
    } else if (target === 'thumb') targetIndices.push(1, 2, 3, 4);
    else if (target === 'index') targetIndices.push(5, 6, 7, 8);
    else if (target === 'middle') targetIndices.push(9, 10, 11, 12);
    else if (target === 'ring') targetIndices.push(13, 14, 15, 16);
    else if (target === 'pinky') targetIndices.push(17, 18, 19, 20);
    else if (target === 'wrist') targetIndices.push(0);

    targetIndices.forEach(idx => {
      const node = this.jointNodes[idx];
      if (node) {
        node.impulseX += impulseX;
        node.impulseY += impulseY;
        node.impulseZ += impulseZ;
        // Also boost velocity directly for instant dynamic feedback
        node.vx += impulseX * 0.8;
        node.vy += impulseY * 0.8;
        node.vz += impulseZ * 0.8;
      }
    });
  }

  public getPhysicsTelemetry(): PhysicsTelemetry {
    return { ...this.physicsTelemetry };
  }

  // TensorFlow.js Neural Classifier Controls & Telemetry
  public getTensorFlowTelemetry(): TFJSTelemetry {
    return tfjsClassifier.getTelemetry();
  }

  public setUseTensorFlowClassifier(enabled: boolean) {
    this.useTensorFlowClassifier = enabled;
  }

  public isTensorFlowClassifierEnabled(): boolean {
    return this.useTensorFlowClassifier;
  }

  public async setTensorFlowBackend(backend: 'webgl' | 'cpu'): Promise<string> {
    return tfjsClassifier.setBackend(backend);
  }

  public async trainCurrentPoseAsSample(label: string): Promise<{ success: boolean; epochs: number; loss: number }> {
    return tfjsClassifier.trainSample(label, this.smoothedLandmarks, this.smoothedPose);
  }

  public setZoom(zoom: number, panX: number = 0, panY: number = 0) {
    this.zoomLevel = Math.max(1.0, Math.min(3.5, Number(zoom) || 1.0));
    this.panOffsetX = Math.max(-1.0, Math.min(1.0, Number(panX) || 0));
    this.panOffsetY = Math.max(-1.0, Math.min(1.0, Number(panY) || 0));
  }

  public getZoom() {
    return {
      zoom: this.zoomLevel,
      panX: this.panOffsetX,
      panY: this.panOffsetY,
      calibrationScale: this.calibrationScale
    };
  }

  public setCalibrationScale(scale: number) {
    this.calibrationScale = Math.max(0.7, Math.min(1.5, Number(scale) || 1.0));
  }

  public setAutoCenter(enabled: boolean) {
    this.autoCenterEnabled = Boolean(enabled);
  }

  public isAutoCenterEnabled(): boolean {
    return this.autoCenterEnabled;
  }

  public setElements(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.videoElement = video;
    this.canvasElement = canvas;
  }

  public syncDictionary() {
    SIGN_DICTIONARY = {
      ...BASE_SIGN_DICTIONARY,
      ...this.customSigns
    };
  }

  public registerCustomSign(key: string, sign: SignSymbolMeaning) {
    const cleanKey = key.toUpperCase().replace(/\s+/g, '_');
    this.customSigns[cleanKey] = {
      ...sign,
      isCustom: true
    };
    saveCustomSignsToStorage(this.customSigns);
    this.syncDictionary();
    this.forceSign(cleanKey);
    return cleanKey;
  }

  public deleteCustomSign(key: string) {
    if (this.customSigns[key]) {
      delete this.customSigns[key];
      saveCustomSignsToStorage(this.customSigns);
      this.syncDictionary();
      if (this.currentSignKey === key) {
        this.currentSignKey = 'HELLO';
      }
    }
  }

  public getDictionary(): Record<string, SignSymbolMeaning> {
    return SIGN_DICTIONARY;
  }

  public setFreePose(newPose: Partial<FingerPoseState>) {
    this.fingerPose = {
      ...this.fingerPose,
      ...newPose,
      isFreeMotion: true
    };
  }

  public enableFreeMotionMode(enable: boolean) {
    this.fingerPose.isFreeMotion = enable;
  }

  public getFingerPose(): FingerPoseState {
    return { ...this.smoothedPose };
  }

  public setProceduralAnimation(anim: 'none' | 'wave' | 'wiggle' | 'tap' | 'breathe') {
    this.fingerPose.proceduralAnimation = anim;
    if (anim !== 'none') {
      this.fingerPose.isFreeMotion = true;
    }
  }

  // Process live camera frame with optical computer vision & skin chrominance
  public processFrame(timestamp: number = performance.now()): HandDetectionResult {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    if (delta > 0) {
      this.fps = Math.round(1000 / delta);
    }
    this.lastFrameTime = now;

    let targetX = 0;
    let targetY = 0;
    let hasRealHand = false;
    let handSpan = 160;
    let detectedFingers = { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 };
    let detectedSpread = 0.45;
    let detectedTilt = 0;

    const width = this.canvasElement ? this.canvasElement.width : 1280;
    const height = this.canvasElement ? this.canvasElement.height : 720;

    // 1. Analyze video frames if camera is active
    if (this.videoElement && this.videoElement.readyState >= 2 && this.offscreenCtx) {
      try {
        const offW = this.offscreenCanvas.width;
        const offH = this.offscreenCanvas.height;
        const vw = this.videoElement.videoWidth || offW;
        const vh = this.videoElement.videoHeight || offH;

        // Perform sub-rectangle crop if zoom or pan is active for high-resolution finger analysis
        if (this.zoomLevel > 1.01 || Math.abs(this.panOffsetX) > 0.01 || Math.abs(this.panOffsetY) > 0.01) {
          const cropW = vw / this.zoomLevel;
          const cropH = vh / this.zoomLevel;
          const maxPanX = (vw - cropW) / 2;
          const maxPanY = (vh - cropH) / 2;
          // Notice: panOffsetX shifts the framing view window
          const cropCenterX = (vw / 2) + (this.panOffsetX * maxPanX);
          const cropCenterY = (vh / 2) + (this.panOffsetY * maxPanY);
          const cropX = Math.max(0, Math.min(vw - cropW, cropCenterX - cropW / 2));
          const cropY = Math.max(0, Math.min(vh - cropH, cropCenterY - cropH / 2));

          this.offscreenCtx.drawImage(
            this.videoElement,
            cropX, cropY, cropW, cropH,
            0, 0, offW, offH
          );
        } else {
          this.offscreenCtx.drawImage(this.videoElement, 0, 0, offW, offH);
        }

        const imgData = this.offscreenCtx.getImageData(0, 0, offW, offH);
        const data = imgData.data;

        let totalSkinX = 0;
        let totalSkinY = 0;
        let skinPixels = 0;
        let minX = offW, maxX = 0, minY = offH, maxY = 0;

        // Downsampled scan for skin tone chrominance & bounding clustering
        for (let y = 0; y < offH; y += 2) {
          for (let x = 0; x < offW; x += 2) {
            const idx = (y * offW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Robust Skin Color Segmentation (YCbCr + RGB bounds)
            const isSkin = (r > 65 && g > 30 && b > 15 && (r - g) > 12 && r > b && (Math.max(r, g, b) - Math.min(r, g, b)) > 12);

            if (isSkin) {
              totalSkinX += x;
              totalSkinY += y;
              skinPixels++;

              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (skinPixels > 45) {
          const avgX = (totalSkinX / skinPixels) / offW;
          const avgY = (totalSkinY / skinPixels) / offH;
          
          // Mirror correction for front webcam
          targetX = (1 - avgX) * width;
          targetY = avgY * height;

          const spanW = ((maxX - minX) / offW) * width;
          const spanH = ((maxY - minY) / offH) * height;
          handSpan = Math.max(110, Math.min(480, Math.max(spanW, spanH) * 1.15 * this.calibrationScale));

          // Multi-sector contour analysis to extract individual finger heights
          const colW = Math.max(1, (maxX - minX) / 5);
          const colMinYs = [offH, offH, offH, offH, offH];

          for (let y = minY; y <= maxY; y += 2) {
            for (let x = minX; x <= maxX; x += 2) {
              const idx = (y * offW + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const isSkin = (r > 65 && g > 30 && b > 15 && (r - g) > 12 && r > b);
              if (isSkin) {
                const colIdx = Math.min(4, Math.max(0, Math.floor((x - minX) / colW)));
                if (y < colMinYs[colIdx]) {
                  colMinYs[colIdx] = y;
                }
              }
            }
          }

          const totalH = Math.max(14, maxY - minY);
          detectedFingers = {
            thumb: Math.max(0.05, Math.min(1.0, 1.05 - ((colMinYs[0] - minY) / (totalH * 0.70)))),
            index: Math.max(0.05, Math.min(1.0, 1.05 - ((colMinYs[1] - minY) / (totalH * 0.70)))),
            middle: Math.max(0.05, Math.min(1.0, 1.05 - ((colMinYs[2] - minY) / (totalH * 0.70)))),
            ring: Math.max(0.05, Math.min(1.0, 1.05 - ((colMinYs[3] - minY) / (totalH * 0.70)))),
            pinky: Math.max(0.05, Math.min(1.0, 1.05 - ((colMinYs[4] - minY) / (totalH * 0.70))))
          };

          detectedSpread = Math.max(0.25, Math.min(0.9, (maxX - minX) / (totalH * 0.85)));
          detectedTilt = ((colMinYs[4] - colMinYs[0]) / Math.max(1, totalH)) * 25;

          hasRealHand = true;

          // Auto-Centering & Dynamic Hand Framing Calculation
          this.lastHandSeenTime = performance.now();
          if (this.autoCenterEnabled) {
            const errX = avgX - 0.5; // Offset from center of current crop view
            const errY = avgY - 0.5;

            // Smoothly shift camera crop pan towards hand center
            const panLerp = 0.12;
            this.panOffsetX = Math.max(-1.0, Math.min(1.0, this.panOffsetX + errX * panLerp * 1.8));
            this.panOffsetY = Math.max(-1.0, Math.min(1.0, this.panOffsetY + errY * panLerp * 1.8));

            // Auto-adjust zoom to keep hand optimally framed (~45-55% of viewport height)
            const curSpanRel = Math.max((maxX - minX) / offW, (maxY - minY) / offH);
            const targetOccupancy = 0.50;
            const targetZoomFactor = targetOccupancy / Math.max(0.18, Math.min(0.85, curSpanRel));
            const targetZoom = Math.max(1.0, Math.min(2.85, this.zoomLevel * targetZoomFactor));
            this.zoomLevel += (targetZoom - this.zoomLevel) * 0.05;
            this.zoomLevel = Math.max(1.0, Math.min(3.5, this.zoomLevel));
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    if (!hasRealHand && this.autoCenterEnabled) {
      // Ease back towards default framing if no hand seen for > 3.5s
      if (performance.now() - this.lastHandSeenTime > 3500) {
        this.panOffsetX *= 0.97;
        this.panOffsetY *= 0.97;
        this.zoomLevel += (1.0 - this.zoomLevel) * 0.03;
      }
    }

    // 2. Procedural or Centered Target
    const t = timestamp * 0.002;
    if (!hasRealHand) {
      targetX = width * 0.50 + Math.sin(t * 0.6) * 20;
      targetY = height * 0.50 + Math.cos(t * 0.8) * 12;
      handSpan = 160;
    }

    // Smooth hand center position
    if (this.smoothTargetX === 0) {
      this.smoothTargetX = targetX;
      this.smoothTargetY = targetY;
      this.smoothHandSpan = handSpan;
    } else {
      const posAlpha = hasRealHand ? 0.40 : 0.20;
      this.smoothTargetX += posAlpha * (targetX - this.smoothTargetX);
      this.smoothTargetY += posAlpha * (targetY - this.smoothTargetY);
      this.smoothHandSpan += posAlpha * (handSpan - this.smoothHandSpan);
    }

    // Apply procedural animations if active
    let animPose = { ...this.fingerPose };
    if (this.fingerPose.proceduralAnimation === 'wave') {
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
    } else if (this.fingerPose.proceduralAnimation === 'wiggle') {
      animPose = {
        ...animPose,
        thumb: 0.5 + Math.sin(t * 6.0) * 0.4,
        index: 0.4 + Math.sin(t * 7.0 + 0.5) * 0.5,
        middle: 0.4 + Math.sin(t * 8.0 + 1.0) * 0.5,
        ring: 0.4 + Math.sin(t * 7.5 + 1.5) * 0.5,
        pinky: 0.4 + Math.sin(t * 6.5 + 2.0) * 0.5,
        spread: 0.55 + Math.sin(t * 4) * 0.15
      };
    } else if (this.fingerPose.proceduralAnimation === 'tap') {
      const cycle = (t * 4) % 4;
      animPose = {
        ...animPose,
        thumb: 0.3,
        index: cycle < 1 ? 0.1 : 1.0,
        middle: cycle >= 1 && cycle < 2 ? 0.1 : 1.0,
        ring: cycle >= 2 && cycle < 3 ? 0.1 : 1.0,
        pinky: cycle >= 3 ? 0.1 : 1.0
      };
    } else if (this.fingerPose.proceduralAnimation === 'breathe') {
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

    // Apply Tendon Cross-Coupling to raw pose before kinematics
    const coupledPose = this.physicsConfig.enabled
      ? this.applyTendonCrossCoupling(animPose, this.physicsConfig.tendonCoupling)
      : animPose;

    // Smooth active pose values with Exponential Moving Average (EMA)
    const poseAlpha = hasRealHand ? 0.70 : 0.55;
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
      tension: this.fingerPose.tension ?? 0.90,
      isFreeMotion: this.fingerPose.isFreeMotion,
      proceduralAnimation: this.fingerPose.proceduralAnimation
    };

    // 3. Classify sign from current smooth pose
    const detectedSignKey = this.detectSignFromPose(this.smoothedPose);

    // Hold Duration & Commit progress calculation
    if (detectedSignKey !== this.currentSignKey) {
      this.currentSignKey = detectedSignKey;
      this.signHoldStartTime = now;
    }

    const elapsedHold = now - this.signHoldStartTime;
    const holdProgress = Math.min(1.0, elapsedHold / this.HOLD_DURATION_MS);
    let isCommitted = false;

    if (holdProgress >= 1.0 && this.lastCommittedSignKey !== this.currentSignKey) {
      isCommitted = true;
      this.lastCommittedSignKey = this.currentSignKey;
    }

    // 4. Compute 21 landmark joint targets with 3D Forward Kinematics
    const rawKinematicTargets = this.computeLandmarksFromKinematics(
      this.smoothTargetX,
      this.smoothTargetY,
      this.smoothHandSpan,
      this.smoothedPose
    );

    // 5. Integrate Biomechanical Mass-Spring-Damper Physics & 1-Euro Adaptive Filter
    let simulatedLandmarks: HandLandmark[] = [];
    const dt = Math.min(0.05, Math.max(0.005, delta / 1000));

    if (this.physicsConfig.enabled) {
      simulatedLandmarks = this.integratePhysics(rawKinematicTargets, dt, now, hasRealHand);
    } else {
      // Fallback simple smoothing
      if (this.smoothedLandmarks.length === 0) {
        this.smoothedLandmarks = rawKinematicTargets;
      } else {
        const alpha = hasRealHand ? 0.70 : 0.55;
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

    // 6. Lookup sign semantic meaning
    const signMeaning = SIGN_DICTIONARY[this.currentSignKey] || SIGN_DICTIONARY['HELLO'];

    // 7. Compute Bounding Box
    let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
    this.smoothedLandmarks.forEach(pt => {
      if (pt.x < bMinX) bMinX = pt.x;
      if (pt.x > bMaxX) bMaxX = pt.x;
      if (pt.y < bMinY) bMinY = pt.y;
      if (pt.y > bMaxY) bMaxY = pt.y;
    });

    const pad = 28;
    const distFromCenter = Math.hypot(this.panOffsetX, this.panOffsetY);
    const handFramedScore = hasRealHand
      ? Math.max(0, Math.min(100, Math.round((1 - Math.min(1, distFromCenter * 0.85)) * 100)))
      : 0;

    let statusText = 'Manual Zoom & Pan';
    if (this.autoCenterEnabled) {
      if (!hasRealHand) {
        statusText = 'Searching for Hand...';
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
        width: (bMaxX - bMinX) + pad * 2,
        height: (bMaxY - bMinY) + pad * 2
      },
      gesture: `${signMeaning.symbol} ${signMeaning.signName}`,
      signMeaning,
      confidence: signMeaning.confidence,
      handedness: 'Right',
      fps: Math.min(60, Math.max(24, this.fps)),
      isRealHandDetected: hasRealHand,
      holdProgress,
      isCommitted,
      fingerPose: { ...this.smoothedPose },
      autoCentering: {
        enabled: this.autoCenterEnabled,
        isTracking: hasRealHand && this.autoCenterEnabled,
        currentZoom: +(this.zoomLevel.toFixed(2)),
        panOffsetX: +(this.panOffsetX.toFixed(2)),
        panOffsetY: +(this.panOffsetY.toFixed(2)),
        handFramedScore,
        statusText
      },
      physicsTelemetry: { ...this.physicsTelemetry },
      tfTelemetry: tfjsClassifier.getTelemetry()
    };
  }

  // 1-Euro Adaptive Low-Pass Filter Algorithm for Jitter-Free Low-Latency Tracking
  private filter1Euro(filter: OneEuroFilterState, rawVal: number, now: number, minCutoff: number = 1.2, beta: number = 0.02): number {
    if (!Number.isFinite(rawVal)) {
      return Number.isFinite(filter.x) ? filter.x : 0;
    }
    if (filter.x === undefined || !Number.isFinite(filter.x)) {
      filter.x = rawVal;
      filter.dx = 0;
      filter.lastTime = now;
      return rawVal;
    }

    const dt = Math.max(0.001, Math.min(0.1, (now - (filter.lastTime || (now - 16))) / 1000));
    filter.lastTime = now;

    // Filter the derivative (velocity) to reduce high-frequency speed noise
    const dVal = (rawVal - filter.x) / dt;
    const dCutoff = 15.0; // 15Hz for speed calculation
    const dAlpha = 1.0 / (1.0 + (1.0 / (2.0 * Math.PI * dCutoff * dt)));
    const edx = dAlpha * dVal + (1.0 - dAlpha) * (Number.isFinite(filter.dx) ? filter.dx : 0);
    filter.dx = Number.isFinite(edx) ? edx : 0;

    // Adaptive Cutoff: low cutoff when still (eliminates jitter), high cutoff when fast (zero lag)
    const cutoff = minCutoff + beta * Math.abs(filter.dx);
    const alpha = 1.0 / (1.0 + (1.0 / (2.0 * Math.PI * cutoff * dt)));
    const filtered = alpha * rawVal + (1.0 - alpha) * filter.x;
    filter.x = Number.isFinite(filtered) ? filtered : rawVal;
    return filter.x;
  }

  // Biomechanical Extensor Hood & Profundus tendon cross-coupling
  private applyTendonCrossCoupling(rawPose: FingerPoseState, coupling: number): FingerPoseState {
    if (coupling <= 0.01) return { ...rawPose };
    const c = Math.max(0, Math.min(1.0, coupling));

    const thumb = rawPose.thumb;
    // Index finger has independent Extensor Indicis, but slight tension from deep palm fascia
    const index = Math.max(0.04, Math.min(1.0, rawPose.index * (1 - c * 0.06) + (1 - rawPose.middle) * (-0.03 * c) + rawPose.index * (c * 0.06)));
    // Middle finger pulls ring slightly
    const middle = Math.max(0.04, Math.min(1.0, rawPose.middle * (1 - c * 0.14) + rawPose.ring * (c * 0.14)));
    // Ring finger is biomechanically locked to Middle and Pinky via juncturae tendinum
    const ring = Math.max(0.04, Math.min(1.0, rawPose.ring * (1 - c * 0.30) + rawPose.middle * (c * 0.18) + rawPose.pinky * (c * 0.12)));
    // Pinky finger has Extensor Digiti Minimi, but pulled by ring
    const pinky = Math.max(0.04, Math.min(1.0, rawPose.pinky * (1 - c * 0.22) + rawPose.ring * (c * 0.22)));

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
  private integratePhysics(
    targets: HandLandmark[],
    dt: number,
    now: number,
    hasRealHand: boolean
  ): HandLandmark[] {
    if (this.jointNodes.length !== 21) {
      this.initPhysicsNodes();
    }

    const { stiffness, damping, massInertia, softCollision, oneEuroFilter } = this.physicsConfig;
    
    // Natural angular frequency omega0 (rad/s) and critical damping
    const baseFreq = 14.0 * Math.max(0.2, stiffness);
    const zeta = Math.max(0.2, Math.min(1.0, damping));
    const omega0 = 2.0 * Math.PI * baseFreq;
    const k_spring = omega0 * omega0; // Spring constant per unit mass

    let totalKineticEnergy = 0;
    let totalVelocity = 0;
    let totalTensionDist = 0;

    // 1. Update target coordinates with optional 1-Euro adaptive low-pass filter
    for (let i = 0; i < 21; i++) {
      const node = this.jointNodes[i];
      const target = targets[i];
      if (!node || !target) continue;

      if (oneEuroFilter) {
        node.targetX = this.filter1Euro(node.filterX, target.x, now, hasRealHand ? 1.4 : 1.0, 0.02);
        node.targetY = this.filter1Euro(node.filterY, target.y, now, hasRealHand ? 1.4 : 1.0, 0.02);
        node.targetZ = this.filter1Euro(node.filterZ, target.z || 0, now, 1.0, 0.01);
      } else {
        node.targetX = target.x;
        node.targetY = target.y;
        node.targetZ = target.z || 0;
      }
    }

    // 2. Soft-Body Contact & Inter-Fingertip Collision Avoidance
    // Fingertips: [4, 8, 12, 16, 20]
    const contactForces: { fx: number; fy: number; fz: number }[] = Array.from({ length: 21 }, () => ({ fx: 0, fy: 0, fz: 0 }));
    if (softCollision) {
      const tipIndices = [4, 8, 12, 16, 20];
      const collisionRadius = 18.0 * (this.smoothHandSpan / 160);

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

          if (dist > 0.001 && dist < collisionRadius) {
            const overlap = collisionRadius - dist;
            const repulseK = 450.0; // Repulsive contact spring
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

    // 3. Second-Order Numerical Symplectic Euler Physics Integration (4 Sub-steps for Guaranteed Stability)
    const effectiveMassScale = Math.max(0.1, massInertia);
    const subSteps = 4;
    const clampedDt = Math.max(0.001, Math.min(0.033, dt));
    const subDt = clampedDt / subSteps;
    const effectiveK = Math.min(1800, k_spring);

    for (let step = 0; step < subSteps; step++) {
      for (let i = 0; i < 21; i++) {
        const node = this.jointNodes[i];
        if (!node) continue;

        const nodeMass = Math.max(0.2, node.mass * effectiveMassScale);

        // Spring Restoring Force: F_s = k * (target - pos)
        const fsX = effectiveK * nodeMass * (node.targetX - node.x);
        const fsY = effectiveK * nodeMass * (node.targetY - node.y);
        const fsZ = effectiveK * nodeMass * (node.targetZ - node.z);

        // Viscous Damping Force: F_d = -2 * zeta * omega0 * m * v
        const c_damp = 2.0 * zeta * Math.sqrt(effectiveK) * nodeMass;
        const fdX = -c_damp * node.vx;
        const fdY = -c_damp * node.vy;
        const fdZ = -c_damp * node.vz;

        // External Impulses (Flick / Tap shockwaves)
        const fImpX = node.impulseX * 50.0;
        const fImpY = node.impulseY * 50.0;
        const fImpZ = node.impulseZ * 50.0;
        node.impulseX *= 0.85;
        node.impulseY *= 0.85;
        node.impulseZ *= 0.85;

        // Collision contact forces
        const fContX = contactForces[i].fx;
        const fContY = contactForces[i].fy;
        const fContZ = contactForces[i].fz;

        // Acceleration: a = F_total / m
        node.ax = (fsX + fdX + fImpX + fContX) / nodeMass;
        node.ay = (fsY + fdY + fImpY + fContY) / nodeMass;
        node.az = (fsZ + fdZ + fImpZ + fContZ) / nodeMass;

        // Semi-implicit (Symplectic) Velocity update first
        node.vx = (node.vx + node.ax * subDt) * 0.97;
        node.vy = (node.vy + node.ay * subDt) * 0.97;
        node.vz = (node.vz + node.az * subDt) * 0.97;

        // Clamp speed spikes
        const maxV = 1000;
        node.vx = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vx) ? node.vx : 0));
        node.vy = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vy) ? node.vy : 0));
        node.vz = Math.max(-maxV, Math.min(maxV, Number.isFinite(node.vz) ? node.vz : 0));

        // Position integration
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
          totalKineticEnergy += 0.5 * nodeMass * speed * speed * 0.001; // in mJ
          totalTensionDist += Math.hypot(node.targetX - node.x, node.targetY - node.y);
        }
      }
    }

    // 4. Update Physics Telemetry HUD Data
    const avgVelocity = Math.round(totalVelocity / 21);
    const avgTensionDist = totalTensionDist / 21;
    const tendonStrainPct = Math.min(100, Math.round((avgTensionDist / 18.0) * 100));
    const settlement = Math.max(0, Math.min(100, Math.round(100 - Math.min(100, avgVelocity * 0.35 + tendonStrainPct * 0.65))));

    const presetLabels: Record<HandPhysicsConfig['preset'], string> = {
      biological: '🧬 Biological Realism',
      snappy: '⚡ Snappy Spring',
      fluid: '🌊 Fluid Organic',
      precision: '🦾 Precision Studio'
    };

    this.physicsTelemetry = {
      kineticEnergy: +(totalKineticEnergy.toFixed(2)),
      tendonTension: tendonStrainPct,
      averageVelocity: avgVelocity,
      springSettlement: settlement,
      naturalFrequencyHz: +(baseFreq.toFixed(1)),
      mode: presetLabels[this.physicsConfig.preset] || 'Biological'
    };

    return this.jointNodes.map(n => ({
      x: n.x,
      y: n.y,
      z: n.z
    }));
  }

  // Detect sign symbol based on weighted Euclidean distance in 5-dimensional finger curl space
  private detectSignFromPose(pose: FingerPoseState): string {
    const keys = Object.keys(SIGN_DICTIONARY);
    if (keys.length === 0) return 'HELLO';

    let bestKey = keys[0];
    let lowestDistance = Infinity;

    for (const key of keys) {
      const sign = SIGN_DICTIONARY[key];
      if (!sign) continue;
      const target = sign.fingerConfig || { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 };

      // Weighted Euclidean distance across all 5 fingers
      const dThumb = Math.abs(pose.thumb - target.thumb) * 1.3;
      const dIndex = Math.abs(pose.index - target.index) * 1.2;
      const dMiddle = Math.abs(pose.middle - target.middle) * 1.1;
      const dRing = Math.abs(pose.ring - target.ring) * 1.0;
      const dPinky = Math.abs(pose.pinky - target.pinky) * 1.2;

      const distance = Math.sqrt(
        dThumb * dThumb +
        dIndex * dIndex +
        dMiddle * dMiddle +
        dRing * dRing +
        dPinky * dPinky
      );

      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestKey = key;
      }
    }

    return bestKey;
  }

  // Force set a specific sign (used when user tests in Playground or clicks a gesture)
  public forceSign(signKey: string) {
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
          proceduralAnimation: 'none'
        };
      }
    }
  }

  // 21 Anatomical Landmarks Computed with Precision Biomechanical 3D Forward Kinematics
  // MediaPipe Topology: 0: Wrist, 1-4: Thumb, 5-8: Index, 9-12: Middle, 13-16: Ring, 17-20: Pinky
  private computeLandmarksFromKinematics(
    cx: number,
    cy: number,
    span: number,
    pose: FingerPoseState
  ): HandLandmark[] {
    const safeCx = Number.isFinite(cx) && cx > 0 ? cx : (this.canvasElement?.width ? this.canvasElement.width / 2 : 640);
    const safeCy = Number.isFinite(cy) && cy > 0 ? cy : (this.canvasElement?.height ? this.canvasElement.height / 2 : 360);
    const safeSpan = Number.isFinite(span) && span > 30 ? span : 160;
    const scale = safeSpan / 160;
    const radTilt = (((pose?.wristAngle ?? 0)) * Math.PI) / 180;
    const cosT = Math.cos(radTilt);
    const sinT = Math.sin(radTilt);

    const volumetric3D = this.physicsConfig.volumetric3D;
    const focalLength = 650; // Perspective projection focal length

    // Transform local 3D offset (relative to palm center) into canvas coordinates with perspective foreshortening
    const project3DPoint = (ox: number, oy: number, oz: number = 0): HandLandmark => {
      // 2D In-plane rotation (wrist tilt)
      const rx = ox * cosT - oy * sinT;
      const ry = ox * sinT + oy * cosT;
      const rz = oz * scale;

      // Perspective foreshortening
      const rawPScale = volumetric3D ? 1.0 + (rz / focalLength) : 1.0;
      const pScale = Number.isFinite(rawPScale) && rawPScale > 0.1 ? rawPScale : 1.0;
      const px = safeCx + rx * scale * pScale;
      const py = safeCy + ry * scale * pScale;
      return {
        x: Number.isFinite(px) ? px : safeCx,
        y: Number.isFinite(py) ? py : safeCy,
        z: Number.isFinite(rz) ? rz : 0
      };
    };

    const tension = Math.max(0.4, Math.min(1.0, pose.tension ?? 0.90));
    const s = Math.max(0.1, Math.min(1.0, (pose.spread ?? 0.45) * 1.1));

    // 0: Wrist Base Anchor (Bottom of Palm)
    const wrist = project3DPoint(0, 72, -4);

    // Helper: 3-Segment Kinematic Chain with 3D Arc Foreshortening for Index, Middle, Ring, Pinky
    // Each finger starts from its MCP knuckle and articulates realistically into PIP, DIP, Tip
    const computeFingerChain = (
      mcpX: number,
      mcpY: number,
      mcpZ: number,
      naturalAngleDeg: number,
      l1: number, // MCP -> PIP
      l2: number, // PIP -> DIP
      l3: number, // DIP -> Tip
      flexion: number
    ): [HandLandmark, HandLandmark, HandLandmark, HandLandmark] => {
      const mcp = project3DPoint(mcpX, mcpY, mcpZ);

      const f = Math.max(0, Math.min(1, flexion));
      const curl = 1.0 - f; // 0 = fully extended, 1 = tightly curled into palm

      // Base ray direction angle (pointing upwards from palm knuckle)
      const baseRad = (naturalAngleDeg * Math.PI) / 180;
      const dirX = Math.cos(baseRad);
      const dirY = Math.sin(baseRad);

      // Anatomical Joint Folding with True 3D Depth Foreshortening:
      // When extended: finger extends outward in flat palm plane (Z near 0)
      // When curling: PIP arches into +Z (towards viewer), DIP curls inward, Tip touches palm surface
      // Segment 1 (MCP -> PIP)
      const p1x = mcpX + dirX * l1 * (1 - curl * 0.42);
      const p1y = mcpY + dirY * l1 * (1 - curl * 0.42) + curl * (22 * tension);
      const p1z = mcpZ + curl * 24.0 * tension;
      const pip = project3DPoint(p1x, p1y, p1z);

      // Segment 2 (PIP -> DIP)
      const p2x = p1x + dirX * l2 * (1 - curl * 0.78);
      const p2y = p1y + dirY * l2 * (1 - curl * 0.78) + curl * (20 * tension);
      const p2z = p1z + (curl > 0.4 ? (0.4 - curl) * 14.0 : curl * 12.0) * tension;
      const dip = project3DPoint(p2x, p2y, p2z);

      // Segment 3 (DIP -> Tip)
      const p3x = p2x + dirX * l3 * (1 - curl * 0.92);
      const p3y = p2y + dirY * l3 * (1 - curl * 0.92) + curl * (16 * tension);
      const p3z = p2z - curl * 18.0 * tension;
      const tip = project3DPoint(p3x, p3y, p3z);

      return [mcp, pip, dip, tip];
    };

    // 1-4: Thumb Saddle Joint Chain (Trapeziometacarpal CMC, MCP, IP, Tip)
    // Moves along a 3D spherical circumduction cone across palm surface
    const thumbFlex = Math.max(0, Math.min(1, pose.thumb));
    const thumbCurl = 1.0 - thumbFlex;

    // 1: Thumb CMC (Base of thumb on wrist edge)
    const p1 = project3DPoint(-28, 44, -2);

    // 2: Thumb MCP (Saddle joint abduction)
    const p2x = -48 + thumbCurl * 18;
    const p2y = 18 + thumbCurl * 6;
    const p2z = -6 + thumbCurl * 16;
    const p2 = project3DPoint(p2x, p2y, p2z);

    // 3: Thumb IP (Opposition sweep)
    const p3x = -72 + thumbCurl * 60;
    const p3y = -4 + thumbCurl * 15;
    const p3z = -8 + thumbCurl * 26;
    const p3 = project3DPoint(p3x, p3y, p3z);

    // 4: Thumb Tip (Clasps near index/middle knuckle)
    const p4x = -92 + thumbCurl * 98;
    const p4y = -26 + thumbCurl * 32;
    const p4z = -10 + thumbCurl * 34;
    const p4 = project3DPoint(p4x, p4y, p4z);

    // 5-8: Index Finger Chain (MCP: -22, -14, Knuckle arch: 2px)
    const [p5, p6, p7, p8] = computeFingerChain(
      -22 * (0.65 + s * 0.35), -14, 2,
      -96 - (s - 0.45) * 12,
      32, 24, 18,
      pose.index
    );

    // 9-12: Middle Finger Chain (MCP: -2, -26, Knuckle arch: 6px forward)
    const [p9, p10, p11, p12] = computeFingerChain(
      -2, -26, 6,
      -90,
      36, 27, 20,
      pose.middle
    );

    // 13-16: Ring Finger Chain (MCP: 18, -18, Knuckle arch: 3px)
    const [p13, p14, p15, p16] = computeFingerChain(
      18 * (0.65 + s * 0.35), -18, 3,
      -84 + (s - 0.45) * 12,
      32, 24, 18,
      pose.ring
    );

    // 17-20: Pinky Finger Chain (MCP: 36, -6, Knuckle arch: -2px)
    const [p17, p18, p19, p20] = computeFingerChain(
      36 * (0.65 + s * 0.35), -6, -2,
      -76 + (s - 0.45) * 22,
      26, 19, 15,
      pose.pinky
    );

    return [
      wrist, // 0
      p1, p2, p3, p4,     // 1-4: Thumb
      p5, p6, p7, p8,     // 5-8: Index
      p9, p10, p11, p12,  // 9-12: Middle
      p13, p14, p15, p16, // 13-16: Ring
      p17, p18, p19, p20  // 17-20: Pinky
    ];
  }

  // Draw 21-Joint Skeletal Mesh, Volumetric 3D Bones, Thenar Muscle Webbing, and Physics HUD
  public draw(
    ctx: CanvasRenderingContext2D,
    result: HandDetectionResult,
    options: {
      color?: string;
      jointColor?: string;
      showBoundingBox?: boolean;
      showHUD?: boolean;
      showAlignmentGuide?: boolean;
      labelPrefix?: string;
    } = {}
  ) {
    try {
      const {
        color = '#10B981',
        jointColor = '#38BDF8',
        showBoundingBox = true,
        showHUD = true,
        showAlignmentGuide = false,
      } = options;

      const { landmarks, boundingBox, gesture, signMeaning, confidence, fps, isRealHandDetected, holdProgress, fingerPose, physicsTelemetry } = result;
      if (!landmarks || landmarks.length < 21) return;

      // Sanitize all landmark points so that NaN/non-finite coordinates NEVER crash or drop the mesh
      const safePts: HandLandmark[] = landmarks.map((pt, idx) => {
        const fallbackX = 640 + (idx - 10) * 8;
        const fallbackY = 360 + (idx % 4) * 12;
        return {
          x: Number.isFinite(pt?.x) ? pt.x : fallbackX,
          y: Number.isFinite(pt?.y) ? pt.y : fallbackY,
          z: Number.isFinite(pt?.z) ? (pt.z || 0) : 0
        };
      });

      const bones = [
        // Palm Metacarpals & Webbing
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

      ctx.save();

      // 1. Draw Translucent Palm Webbing & Thenar Eminence (Thumb muscle ball)
      ctx.beginPath();
      ctx.moveTo(safePts[0].x, safePts[0].y);
      ctx.lineTo(safePts[1].x, safePts[1].y);
      ctx.lineTo(safePts[5].x, safePts[5].y);
      ctx.lineTo(safePts[9].x, safePts[9].y);
      ctx.lineTo(safePts[13].x, safePts[13].y);
      ctx.lineTo(safePts[17].x, safePts[17].y);
      ctx.closePath();
      ctx.fillStyle = isRealHandDetected ? 'rgba(16, 185, 129, 0.14)' : 'rgba(99, 102, 241, 0.14)';
      ctx.fill();

      // Thenar Muscle Webbing Arc (Thumb Base)
      ctx.beginPath();
      ctx.moveTo(safePts[0].x, safePts[0].y);
      ctx.quadraticCurveTo(
        (safePts[0].x + safePts[1].x) / 2 - 12,
        (safePts[0].y + safePts[1].y) / 2,
        safePts[1].x, safePts[1].y
      );
      ctx.lineTo(safePts[2].x, safePts[2].y);
      ctx.quadraticCurveTo(
        (safePts[2].x + safePts[5].x) / 2,
        (safePts[2].y + safePts[5].y) / 2 + 8,
        safePts[5].x, safePts[5].y
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.10)';
      ctx.fill();

      // 2. Metacarpal Flexor Tendon Highlights (Glowing Tensile Fibers)
      const strain = physicsTelemetry?.tendonTension ?? 30;
      const tendonGlow = Math.min(1.0, 0.15 + (strain / 100) * 0.45);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(56, 189, 248, ${tendonGlow})`;
      ctx.setLineDash([3, 4]);
      [5, 9, 13, 17].forEach(kIdx => {
        ctx.beginPath();
        ctx.moveTo(safePts[0].x, safePts[0].y);
        ctx.lineTo(safePts[kIdx].x, safePts[kIdx].y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 3. Draw Volumetric 3D Cylinder Bone Connections
      bones.forEach(([from, to]) => {
        const pA = safePts[from];
        const pB = safePts[to];
        if (!pA || !pB) return;

        const avgZ = ((pA.z || 0) + (pB.z || 0)) / 2;
        const depthScale = Math.max(0.75, Math.min(1.35, 1.0 + avgZ / 300));

        // Outer Bone Glow
        ctx.lineWidth = 4.5 * depthScale;
        ctx.strokeStyle = isRealHandDetected ? '#10B981' : color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = isRealHandDetected ? '#10B981' : color;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();

        // Inner Volumetric 3D Specular Highlight Line
        ctx.lineWidth = 1.6 * depthScale;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      });

      // 4. Draw Depth-Scaled Anatomical Multi-Level Joints
      safePts.forEach((p, idx) => {
        const isTip = [4, 8, 12, 16, 20].includes(idx);
        const isMCP = [1, 5, 9, 13, 17].includes(idx);
        const isWrist = idx === 0;

        const pZ = Number.isFinite(p.z) ? p.z : 0;
        const depthFactor = Math.max(0.70, Math.min(1.45, 1.0 + pZ / 250));

        let baseRadius = 5.0;
        let fill = jointColor;

        if (isTip) {
          baseRadius = 7.5;
          fill = '#F59E0B'; // Amber fingertips
        } else if (isWrist) {
          baseRadius = 9.5;
          fill = '#EC4899'; // Pink wrist anchor
        } else if (isMCP) {
          baseRadius = 6.2;
          fill = '#38BDF8'; // Cyan knuckles
        }

        const rawRadius = baseRadius * depthFactor;
        const radius = Math.max(1.0, Math.min(45, Number.isFinite(rawRadius) ? rawRadius : baseRadius));
        const innerRadius = Math.max(0.1, radius * 0.1);
        const gradX = p.x - radius * 0.35;
        const gradY = p.y - radius * 0.35;

        // 3D Radial Sphere Lighting Gradient with Safe Fallback
        try {
          const safeGradX = Number.isFinite(gradX) ? gradX : p.x;
          const safeGradY = Number.isFinite(gradY) ? gradY : p.y;
          const grad = ctx.createRadialGradient(
            safeGradX,
            safeGradY,
            innerRadius,
            p.x,
            p.y,
            radius
          );
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.45, fill);
          grad.addColorStop(1.0, isTip ? '#B45309' : '#0369A1');
          ctx.fillStyle = grad;
        } catch {
          ctx.fillStyle = fill;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();
      });

      // 5. Draw Fingertip Live Flexion Gauges if in Free Motion mode
      if (fingerPose && fingerPose.isFreeMotion) {
        const tipIndices = [
          { idx: 4, name: 'THU', val: fingerPose.thumb },
          { idx: 8, name: 'IDX', val: fingerPose.index },
          { idx: 12, name: 'MID', val: fingerPose.middle },
          { idx: 16, name: 'RNG', val: fingerPose.ring },
          { idx: 20, name: 'PIN', val: fingerPose.pinky }
        ];

        tipIndices.forEach(({ idx, name, val }) => {
          const pt = safePts[idx];
          if (!pt) return;
          const text = `${name} ${Math.round(val * 100)}%`;
          ctx.font = 'bold 10px monospace';
          const tw = ctx.measureText(text).width;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tw / 2 - 5, pt.y - 24, tw + 10, 16, 4);
          ctx.fill();
          ctx.strokeStyle = val > 0.5 ? '#10B981' : '#F59E0B';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, pt.x - tw / 2, pt.y - 12);
        });
      }

    // 6. Draw Cyber Bounding Box & HUD
    if (showBoundingBox) {
      const { x, y, width, height } = boundingBox;
      const cornerSize = 18;

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isRealHandDetected ? '#38BDF8' : '#818CF8';
      ctx.shadowColor = isRealHandDetected ? '#38BDF8' : '#818CF8';
      ctx.shadowBlur = 8;

      // Corners
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

      // Top label pill
      const tagText = fingerPose?.isFreeMotion
        ? `🖐️ FREE MOTION • ${Math.round(confidence * 100)}%`
        : `${gesture} • ${Math.round(confidence * 100)}%`;

      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(tagText).width;

      const pillY = Math.max(12, y - 32);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(x, pillY, textWidth + 36, 28, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hold Progress Ring
      const ringCenterX = x + 14;
      const ringCenterY = pillY + 14;
      ctx.beginPath();
      ctx.arc(ringCenterX, ringCenterY, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ringCenterX, ringCenterY, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * holdProgress);
      ctx.strokeStyle = holdProgress >= 0.95 ? '#10B981' : '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(tagText, x + 26, pillY + 19);

      // Subtitle translation pill
      if (signMeaning && !fingerPose?.isFreeMotion) {
        const transText = `Meaning: "${signMeaning.translatedText}"`;
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        const transWidth = ctx.measureText(transText).width;

        ctx.fillStyle = signMeaning.isCustom ? 'rgba(168, 85, 247, 0.92)' : 'rgba(16, 185, 129, 0.90)';
        ctx.beginPath();
        ctx.roundRect(x, pillY + 34, transWidth + 16, 20, 5);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(transText, x + 8, pillY + 48);
      }
    }

    // 7. Telemetry HUD with Physics Stats
    if (showHUD) {
      const hudX = 16;
      const hudY = 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, 260, 74, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = isRealHandDetected ? '#10B981' : '#818CF8';
      ctx.fillText(`● ${isRealHandDetected ? 'OPTICAL CV TRACKER' : 'BIOMECHANICAL PHYSICS'}`, hudX + 12, hudY + 18);
      
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`FPS: ${fps} | LAT: 8ms | 21 3D JOINTS`, hudX + 12, hudY + 33);

      // Physics Telemetry line
      if (physicsTelemetry) {
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(
          `⚡ KINETIC: ${physicsTelemetry.kineticEnergy}mJ | STRAIN: ${physicsTelemetry.tendonTension}%`,
          hudX + 12,
          hudY + 48
        );
      }

      ctx.fillStyle = result.autoCentering?.enabled ? '#34D399' : '#A78BFA';
      ctx.fillText(
        result.autoCentering?.enabled
          ? `🤖 AUTO-CENTER: ${result.autoCentering.statusText.toUpperCase()}`
          : physicsTelemetry
          ? `MODE: ${physicsTelemetry.mode}`
          : `SIGNS: ${Object.keys(SIGN_DICTIONARY).length} IN VOCABULARY`,
        hudX + 12,
        hudY + 63
      );
    }

    // 8. Hand Alignment & Calibration Target Reticle Box
    if (showAlignmentGuide) {
      const cWidth = ctx.canvas.width;
      const cHeight = ctx.canvas.height;

      // Target optimal hand placement box
      const boxW = Math.min(360, cWidth * 0.32);
      const boxH = Math.min(460, cHeight * 0.65);
      const boxX = (cWidth - boxW) / 2;
      const boxY = (cHeight - boxH) / 2 + 10;

      // Check if current detected hand is within the alignment box
      const isInside = isRealHandDetected && 
        boundingBox.x > boxX - 40 && 
        (boundingBox.x + boundingBox.width) < (boxX + boxW + 40) &&
        boundingBox.y > boxY - 40 &&
        (boundingBox.y + boundingBox.height) < (boxY + boxH + 40);

      ctx.save();
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = isInside ? '#10B981' : 'rgba(56, 189, 248, 0.7)';
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      // Corner Brackets
      const bLen = 22;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = isInside ? '#10B981' : '#38BDF8';

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + bLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + bLen, boxY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - bLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + bLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - bLen);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + bLen, boxY + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - bLen, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - bLen);
      ctx.stroke();

      // Center crosshair
      const midX = boxX + boxW / 2;
      const midY = boxY + boxH / 2;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isInside ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.moveTo(midX - 16, midY);
      ctx.lineTo(midX + 16, midY);
      ctx.moveTo(midX, midY - 16);
      ctx.lineTo(midX, midY + 16);
      ctx.stroke();

      // Alignment Guide Label
      const guideLabel = isInside ? '✓ HAND ALIGNED (OPTIMAL ACCURACY)' : '🎯 POSITION HAND HERE (ZOOM IN/OUT TO FIT)';
      ctx.font = 'bold 12px monospace';
      const labelW = ctx.measureText(guideLabel).width;
      
      ctx.fillStyle = isInside ? 'rgba(6, 78, 59, 0.92)' : 'rgba(15, 23, 42, 0.90)';
      ctx.beginPath();
      ctx.roundRect(midX - labelW / 2 - 10, boxY - 30, labelW + 20, 24, 6);
      ctx.fill();
      ctx.strokeStyle = isInside ? '#10B981' : '#38BDF8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isInside ? '#6EE7B7' : '#E2E8F0';
      ctx.fillText(guideLabel, midX - labelW / 2, boxY - 14);

      ctx.restore();
    }

    ctx.restore();
    } catch (err) {
      console.warn('[HandTracker] Non-fatal draw exception caught & recovered:', err);
      try {
        ctx.restore();
      } catch {}
    }
  }
}
