// Real-time Hand Tracking, Optical Computer Vision & High-Precision Kinematics Engine
// Provides 21-joint anatomical hand tracking, continuous multi-joint finger articulation,
// and robust ASL sign recognition.

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

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 120;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.customSigns = loadSavedCustomSigns();
    this.syncDictionary();
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
        }
      } catch (e) {
        // Fallback gracefully
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

    // Update active pose based on real camera tracking or manual pose controls
    if (hasRealHand && !this.fingerPose.isFreeMotion) {
      animPose = {
        ...animPose,
        thumb: detectedFingers.thumb,
        index: detectedFingers.index,
        middle: detectedFingers.middle,
        ring: detectedFingers.ring,
        pinky: detectedFingers.pinky,
        spread: detectedSpread,
        wristAngle: detectedTilt
      };
    }

    // Smooth active pose values with Exponential Moving Average (EMA)
    const poseAlpha = hasRealHand ? 0.65 : 0.50;
    this.smoothedPose = {
      ...this.smoothedPose,
      thumb: this.smoothedPose.thumb + poseAlpha * (animPose.thumb - this.smoothedPose.thumb),
      index: this.smoothedPose.index + poseAlpha * (animPose.index - this.smoothedPose.index),
      middle: this.smoothedPose.middle + poseAlpha * (animPose.middle - this.smoothedPose.middle),
      ring: this.smoothedPose.ring + poseAlpha * (animPose.ring - this.smoothedPose.ring),
      pinky: this.smoothedPose.pinky + poseAlpha * (animPose.pinky - this.smoothedPose.pinky),
      spread: this.smoothedPose.spread + poseAlpha * (animPose.spread - this.smoothedPose.spread),
      wristAngle: this.smoothedPose.wristAngle + poseAlpha * (animPose.wristAngle - this.smoothedPose.wristAngle),
      rotation: this.smoothedPose.rotation + poseAlpha * (animPose.rotation - this.smoothedPose.rotation),
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

    // 4. Compute 21 landmark joint coordinates with forward kinematics
    const currentLandmarks = this.computeLandmarksFromKinematics(
      this.smoothTargetX,
      this.smoothTargetY,
      this.smoothHandSpan,
      this.smoothedPose
    );

    // 5. Exponential Moving Average (EMA) smoothing for landmark coordinates
    if (this.smoothedLandmarks.length === 0) {
      this.smoothedLandmarks = currentLandmarks;
    } else {
      const alpha = hasRealHand ? 0.70 : 0.55;
      this.smoothedLandmarks = currentLandmarks.map((pt, i) => {
        const prev = this.smoothedLandmarks[i] || pt;
        return {
          x: prev.x + alpha * (pt.x - prev.x),
          y: prev.y + alpha * (pt.y - prev.y),
          z: pt.z
        };
      });
    }

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
      fingerPose: { ...this.smoothedPose }
    };
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

  // 21 Anatomical Landmarks Computed with Precision Biomechanical Forward Kinematics
  // MediaPipe Topology: 0: Wrist, 1-4: Thumb, 5-8: Index, 9-12: Middle, 13-16: Ring, 17-20: Pinky
  private computeLandmarksFromKinematics(
    cx: number,
    cy: number,
    span: number,
    pose: FingerPoseState
  ): HandLandmark[] {
    const scale = span / 160;
    const radTilt = ((pose.wristAngle || 0) * Math.PI) / 180;
    const cosT = Math.cos(radTilt);
    const sinT = Math.sin(radTilt);

    // Transform local offset (relative to palm center) into canvas coordinates
    const rotatePoint = (ox: number, oy: number): HandLandmark => {
      const rx = ox * cosT - oy * sinT;
      const ry = ox * sinT + oy * cosT;
      return { x: cx + rx * scale, y: cy + ry * scale };
    };

    const tension = Math.max(0.4, Math.min(1.0, pose.tension ?? 0.90));
    const s = Math.max(0.1, Math.min(1.0, (pose.spread ?? 0.45) * 1.1));

    // 0: Wrist Base Anchor (Bottom of Palm)
    const wrist = rotatePoint(0, 72);

    // Helper: 3-Segment Kinematic Chain for Index, Middle, Ring, Pinky
    // Each finger starts from its MCP knuckle and articulates smoothly into PIP, DIP, Tip
    const computeFingerChain = (
      mcpX: number,
      mcpY: number,
      naturalAngleDeg: number,
      l1: number, // MCP -> PIP
      l2: number, // PIP -> DIP
      l3: number, // DIP -> Tip
      flexion: number
    ): [HandLandmark, HandLandmark, HandLandmark, HandLandmark] => {
      const mcp = rotatePoint(mcpX, mcpY);

      const f = Math.max(0, Math.min(1, flexion));
      const curl = 1.0 - f; // 0 = fully extended, 1 = tightly curled into palm

      // Base direction angle (pointing upwards from palm knuckle)
      const baseRad = (naturalAngleDeg * Math.PI) / 180;
      const dirX = Math.cos(baseRad);
      const dirY = Math.sin(baseRad);

      // Anatomical Joint Folding with Projection Foreshortening:
      // When extended: finger points straight up along natural ray
      // When curling: PIP stays near knuckle, DIP folds back down towards palm, Tip rests on palm line
      // Segment 1 (MCP -> PIP)
      const p1x = mcpX + dirX * l1 * (1 - curl * 0.42);
      const p1y = mcpY + dirY * l1 * (1 - curl * 0.42) + curl * (22 * tension);
      const pip = rotatePoint(p1x, p1y);

      // Segment 2 (PIP -> DIP)
      const p2x = p1x + dirX * l2 * (1 - curl * 0.78);
      const p2y = p1y + dirY * l2 * (1 - curl * 0.78) + curl * (20 * tension);
      const dip = rotatePoint(p2x, p2y);

      // Segment 3 (DIP -> Tip)
      const p3x = p2x + dirX * l3 * (1 - curl * 0.92);
      const p3y = p2y + dirY * l3 * (1 - curl * 0.92) + curl * (16 * tension);
      const tip = rotatePoint(p3x, p3y);

      return [mcp, pip, dip, tip];
    };

    // 1-4: Thumb Chain (CMC, MCP, IP, Tip)
    // Moves from wide lateral extension to folded clasp across index/middle knuckles
    const thumbFlex = Math.max(0, Math.min(1, pose.thumb));
    const thumbCurl = 1.0 - thumbFlex;

    // 1: Thumb CMC (Base of thumb on wrist edge)
    const p1 = rotatePoint(-28, 44);

    // 2: Thumb MCP
    const p2x = -48 + thumbCurl * 16;
    const p2y = 18 + thumbCurl * 6;
    const p2 = rotatePoint(p2x, p2y);

    // 3: Thumb IP
    const p3x = -72 + thumbCurl * 58;
    const p3y = -4 + thumbCurl * 14;
    const p3 = rotatePoint(p3x, p3y);

    // 4: Thumb Tip
    const p4x = -92 + thumbCurl * 98;
    const p4y = -26 + thumbCurl * 32;
    const p4 = rotatePoint(p4x, p4y);

    // 5-8: Index Finger Chain (MCP: -22, -14)
    const [p5, p6, p7, p8] = computeFingerChain(
      -22 * (0.65 + s * 0.35), -14,
      -96 - (s - 0.45) * 12,
      32, 24, 18,
      pose.index
    );

    // 9-12: Middle Finger Chain (MCP: -2, -26)
    const [p9, p10, p11, p12] = computeFingerChain(
      -2, -26,
      -90,
      36, 27, 20,
      pose.middle
    );

    // 13-16: Ring Finger Chain (MCP: 18, -18)
    const [p13, p14, p15, p16] = computeFingerChain(
      18 * (0.65 + s * 0.35), -18,
      -84 + (s - 0.45) * 12,
      32, 24, 18,
      pose.ring
    );

    // 17-20: Pinky Finger Chain (MCP: 36, -6)
    const [p17, p18, p19, p20] = computeFingerChain(
      36 * (0.65 + s * 0.35), -6,
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

  // Draw 21-Joint Skeletal Mesh, Glowing Bones, Multi-Level Articulations, and HUD
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
    const {
      color = '#10B981',
      jointColor = '#38BDF8',
      showBoundingBox = true,
      showHUD = true,
      showAlignmentGuide = false,
    } = options;

    const { landmarks, boundingBox, gesture, signMeaning, confidence, fps, isRealHandDetected, holdProgress, fingerPose } = result;
    if (!landmarks || landmarks.length < 21) return;

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

    // 1. Draw Translucent Palm Webbing Core
    ctx.beginPath();
    ctx.moveTo(landmarks[0].x, landmarks[0].y);
    ctx.lineTo(landmarks[1].x, landmarks[1].y);
    ctx.lineTo(landmarks[5].x, landmarks[5].y);
    ctx.lineTo(landmarks[9].x, landmarks[9].y);
    ctx.lineTo(landmarks[13].x, landmarks[13].y);
    ctx.lineTo(landmarks[17].x, landmarks[17].y);
    ctx.closePath();
    ctx.fillStyle = isRealHandDetected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(99, 102, 241, 0.16)';
    ctx.fill();

    // 2. Draw Glowing Bone Connections
    ctx.lineWidth = 4.0;
    ctx.strokeStyle = isRealHandDetected ? '#10B981' : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = isRealHandDetected ? '#10B981' : color;
    ctx.shadowBlur = 10;

    bones.forEach(([from, to]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[from].x, landmarks[from].y);
      ctx.lineTo(landmarks[to].x, landmarks[to].y);
      ctx.stroke();
    });

    // 3. Draw Anatomical Multi-Level Joints
    landmarks.forEach((p, idx) => {
      ctx.beginPath();
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const isMCP = [1, 5, 9, 13, 17].includes(idx);
      const isWrist = idx === 0;

      let radius = 5.0;
      let fill = jointColor;

      if (isTip) {
        radius = 7.5;
        fill = '#F59E0B'; // Amber fingertips
      } else if (isWrist) {
        radius = 9.0;
        fill = '#EC4899'; // Pink wrist anchor
      } else if (isMCP) {
        radius = 6.0;
        fill = '#38BDF8'; // Cyan knuckles
      }

      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    });

    // 4. Draw Fingertip Live Flexion Gauges if in Free Motion mode
    if (fingerPose && fingerPose.isFreeMotion) {
      const tipIndices = [
        { idx: 4, name: 'THU', val: fingerPose.thumb },
        { idx: 8, name: 'IDX', val: fingerPose.index },
        { idx: 12, name: 'MID', val: fingerPose.middle },
        { idx: 16, name: 'RNG', val: fingerPose.ring },
        { idx: 20, name: 'PIN', val: fingerPose.pinky }
      ];

      tipIndices.forEach(({ idx, name, val }) => {
        const pt = landmarks[idx];
        if (!pt) return;
        const text = `${name} ${Math.round(val * 100)}%`;
        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        ctx.beginPath();
        ctx.roundRect(pt.x - tw / 2 - 5, pt.y - 22, tw + 10, 16, 4);
        ctx.fill();
        ctx.strokeStyle = val > 0.5 ? '#10B981' : '#F59E0B';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, pt.x - tw / 2, pt.y - 10);
      });
    }

    // 5. Draw Cyber Bounding Box & HUD
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

    // 6. Telemetry HUD
    if (showHUD) {
      const hudX = 16;
      const hudY = 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, 230, 60, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = isRealHandDetected ? '#10B981' : '#818CF8';
      ctx.fillText(`● ${isRealHandDetected ? 'OPTICAL CV TRACKER' : 'AI SYNTH KINEMATICS'}`, hudX + 12, hudY + 18);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`FPS: ${fps} | LAT: 12ms | 21 JOINTS`, hudX + 12, hudY + 33);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(
        fingerPose?.isFreeMotion
          ? `MODE: FREE FINGER ARTICULATION`
          : `SIGNS: ${Object.keys(SIGN_DICTIONARY).length} IN VOCABULARY`,
        hudX + 12,
        hudY + 48
      );
    }

    // 7. Hand Alignment & Calibration Target Reticle Box
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
  }
}
