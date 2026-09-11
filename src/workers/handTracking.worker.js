import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { BASE_SIGN_DICTIONARY, PHYSICS_PRESETS } from "../utils/handTracker";

// Worker state
let handLandmarker = null;
let isInitializingLandmarker = false;
let signDictionary = { ...BASE_SIGN_DICTIONARY };
let customSigns = {};

// Physics state in worker
let physicsConfig = { ...PHYSICS_PRESETS.biological };
let jointNodes = [];
let physicsTelemetry = {
  kineticEnergy: 0,
  tendonTension: 0,
  averageVelocity: 0,
  springSettlement: 100,
  naturalFrequencyHz: 12.5,
  mode: "Biological"
};

// Gesture state in worker
let currentSignKey = "HELLO";
let lastCommittedSignKey = "";
let signHoldStartTime = performance.now();
const HOLD_DURATION_MS = 700;

// Tracking state
let smoothTargetX = 0;
let smoothTargetY = 0;
let smoothHandSpan = 160;
let zoomLevel = 1;
let panOffsetX = 0;
let panOffsetY = 0;
let calibrationScale = 1;
let autoCenterEnabled = false;
let lastHandSeenTime = 0;
let forcedSignKey = null;
let useAIStream = true;
let lastFrameTime = performance.now();
let lastInferenceMs = 8;
let lastMediaPipeTimestamp = 0;

let fingerPose = {
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

let smoothedPose = { ...fingerPose };
let smoothedLandmarks = [];
let prevLandmarks = [];

// Offscreen buffer for MediaPipe downsampled inference in worker
let offscreenCanvas = null;
let offscreenCtx = null;
const DOWNSAMPLE_WIDTH = 400;
const DOWNSAMPLE_HEIGHT = 300;

function initPhysicsNodes() {
  const masses = [
    2.2, 1.1, 0.9, 0.65, 0.45,
    1.0, 0.75, 0.55, 0.35,
    1.05, 0.8, 0.6, 0.38,
    0.95, 0.7, 0.5, 0.35,
    0.8, 0.55, 0.4, 0.3
  ];
  jointNodes = [];
  const now = performance.now();
  for (let i = 0; i < 21; i++) {
    jointNodes.push({
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

async function initMediaPipeVision() {
  if (handLandmarker || isInitializingLandmarker) return;
  isInitializingLandmarker = true;
  try {
    let vision = null;
    try {
      vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    } catch {
      vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
    }

    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/mediapipe/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55
      });
      self.postMessage({ type: "WORKER_READY", backend: "MediaPipe GPU (Web Worker)" });
      return;
    } catch (gpuErr) {
      console.warn("[HandWorker] GPU delegate fallback to CPU:", gpuErr?.message);
    }

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    self.postMessage({ type: "WORKER_READY", backend: "MediaPipe CPU (Web Worker)" });
  } catch (err) {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      self.postMessage({ type: "WORKER_READY", backend: "MediaPipe CDN (Web Worker)" });
    } catch (fallbackErr) {
      self.postMessage({ type: "WORKER_READY", backend: "Algorithmic Simulator (Web Worker)" });
    }
  } finally {
    isInitializingLandmarker = false;
  }
}

function filter1Euro(filter, rawVal, now, minCutoff = 1.2, beta = 0.015, dCutoff = 1.0) {
  if (!filter.lastTime) {
    filter.x = rawVal;
    filter.dx = 0;
    filter.lastTime = now;
    return rawVal;
  }
  const dt = Math.max(1e-4, Math.min(0.1, (now - filter.lastTime) / 1000));
  filter.lastTime = now;
  const dVal = (rawVal - filter.x) / dt;
  const alphaD = 1 / (1 + 1 / (2 * Math.PI * dCutoff * dt));
  filter.dx = alphaD * dVal + (1 - alphaD) * filter.dx;
  const cutoff = minCutoff + beta * Math.abs(filter.dx);
  const alpha = 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
  const filtered = alpha * rawVal + (1 - alpha) * filter.x;
  filter.x = Number.isFinite(filtered) ? filtered : rawVal;
  return filter.x;
}

function computeFingerFlexions(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0.45, wristRotation: 0 };
  }
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const handScale = Math.hypot(wrist.x - middleMcp.x, wrist.y - middleMcp.y) || 100;

  const getFlexion = (mcpIdx, pipIdx, dipIdx, tipIdx) => {
    const mcp = landmarks[mcpIdx];
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const dMcpTip = Math.hypot(mcp.x - tip.x, mcp.y - tip.y);
    const dMcpPip = Math.hypot(mcp.x - pip.x, mcp.y - pip.y);
    const dPipTip = Math.hypot(pip.x - tip.x, pip.y - tip.y);
    const fullLen = dMcpPip + dPipTip;
    const ratio = fullLen > 0 ? dMcpTip / fullLen : 0.5;
    return Math.max(0.04, Math.min(1.0, (ratio - 0.25) / 0.7));
  };

  const thumbFlex = (() => {
    const tip = landmarks[4];
    const ip = landmarks[3];
    const mcp = landmarks[2];
    const indexMcp = landmarks[5];
    const dTipIndex = Math.hypot(tip.x - indexMcp.x, tip.y - indexMcp.y) / handScale;
    const dTipMcp = Math.hypot(tip.x - mcp.x, tip.y - mcp.y) / handScale;
    return Math.max(0.04, Math.min(1.0, (dTipIndex * 0.7 + dTipMcp * 0.5 - 0.2) / 0.8));
  })();

  const indexFlex = getFlexion(5, 6, 7, 8);
  const middleFlex = getFlexion(9, 10, 11, 12);
  const ringFlex = getFlexion(13, 14, 15, 16);
  const pinkyFlex = getFlexion(17, 18, 19, 20);

  const dIndexPinky = Math.hypot(landmarks[8].x - landmarks[20].x, landmarks[8].y - landmarks[20].y);
  const spread = Math.max(0.1, Math.min(1.0, (dIndexPinky / handScale - 0.4) / 1.2));
  const dx = landmarks[9].x - landmarks[0].x;
  const dy = landmarks[9].y - landmarks[0].y;
  const wristRotation = Math.atan2(dx, -dy) * (180 / Math.PI);

  return {
    thumb: thumbFlex,
    index: indexFlex,
    middle: middleFlex,
    ring: ringFlex,
    pinky: pinkyFlex,
    spread,
    wristRotation
  };
}

function integratePhysics(targets, dt, now, hasRealHand) {
  if (jointNodes.length !== 21) {
    initPhysicsNodes();
  }
  const { stiffness, damping, massInertia, softCollision, oneEuroFilter } = physicsConfig;
  const baseFreq = 14 * Math.max(0.2, stiffness);
  const zeta = Math.max(0.2, Math.min(1, damping));
  const omega0 = 2 * Math.PI * baseFreq;
  const k_spring = omega0 * omega0;
  let totalKineticEnergy = 0;
  let totalVelocity = 0;
  let totalTensionDist = 0;

  for (let i = 0; i < 21; i++) {
    const node = jointNodes[i];
    const target = targets[i];
    if (!node || !target) continue;
    if (oneEuroFilter) {
      node.targetX = filter1Euro(node.filterX, target.x, now, hasRealHand ? 1.4 : 1, 0.02);
      node.targetY = filter1Euro(node.filterY, target.y, now, hasRealHand ? 1.4 : 1, 0.02);
      node.targetZ = filter1Euro(node.filterZ, target.z || 0, now, 1, 0.01);
    } else {
      node.targetX = target.x;
      node.targetY = target.y;
      node.targetZ = target.z || 0;
    }
  }

  const effectiveMassScale = Math.max(0.1, massInertia);
  const subSteps = 3;
  const clampedDt = Math.max(1e-3, Math.min(0.033, dt));
  const subDt = clampedDt / subSteps;
  const effectiveK = Math.min(1800, k_spring);

  for (let step = 0; step < subSteps; step++) {
    for (let i = 0; i < 21; i++) {
      const node = jointNodes[i];
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

      node.ax = (fsX + fdX + fImpX) / nodeMass;
      node.ay = (fsY + fdY + fImpY) / nodeMass;
      node.az = (fsZ + fdZ + fImpZ) / nodeMass;
      node.vx = (node.vx + node.ax * subDt) * 0.97;
      node.vy = (node.vy + node.ay * subDt) * 0.97;
      node.vz = (node.vz + node.az * subDt) * 0.97;
      node.x += node.vx * subDt;
      node.y += node.vy * subDt;
      node.z += node.vz * subDt;

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
  const tendonStrainPct = Math.min(100, Math.round((avgTensionDist / 18) * 100));
  const settlement = Math.max(0, Math.min(100, Math.round(100 - Math.min(100, avgVelocity * 0.35 + tendonStrainPct * 0.65))));

  physicsTelemetry = {
    kineticEnergy: +totalKineticEnergy.toFixed(2),
    tendonTension: tendonStrainPct,
    averageVelocity: avgVelocity,
    springSettlement: settlement,
    naturalFrequencyHz: +baseFreq.toFixed(1),
    mode: physicsConfig.preset || "Biological"
  };

  return jointNodes.map((n) => ({ x: n.x, y: n.y, z: n.z }));
}

function detectSignFromPose(pose, rawLandmarks) {
  const keys = Object.keys(signDictionary);
  if (keys.length === 0) return "HELLO";

  if (rawLandmarks && rawLandmarks.length >= 21) {
    const distThumbIndex = Math.hypot(rawLandmarks[4].x - rawLandmarks[8].x, rawLandmarks[4].y - rawLandmarks[8].y);
    const distThumbPinky = Math.hypot(rawLandmarks[4].x - rawLandmarks[20].x, rawLandmarks[4].y - rawLandmarks[20].y);
    if (distThumbPinky < 35 && pose.index > 0.65 && pose.middle > 0.65 && pose.ring > 0.65 && signDictionary["6"]) {
      return "6";
    }
    if (distThumbIndex < 35 && pose.middle > 0.65 && pose.ring > 0.6 && pose.pinky > 0.6) {
      if (signDictionary["F"]) return "F";
      if (signDictionary["9"]) return "9";
      if (signDictionary["OKAY"]) return "OKAY";
    }
    if (pose.thumb > 0.75 && pose.index > 0.75 && pose.middle < 0.25 && pose.ring < 0.25 && pose.pinky < 0.25 && distThumbIndex > 65) {
      if (signDictionary["L"]) return "L";
    }
  }

  let bestKey = keys[0];
  let lowestDistance = Infinity;

  for (const key of keys) {
    const sign = signDictionary[key];
    if (!sign) continue;
    const target = sign.fingerConfig || { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
    const dThumb = Math.abs(pose.thumb - target.thumb) * 1.3;
    const dIndex = Math.abs(pose.index - target.index) * 1.2;
    const dMiddle = Math.abs(pose.middle - target.middle) * 1.1;
    const dRing = Math.abs(pose.ring - target.ring) * 1.0;
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

function generateSyntheticLandmarks(cx, cy, span, pose, tiltDeg = 0) {
  const rad = (tiltDeg * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);
  const rotatePoint = (x, y, ox, oy) => {
    const dx = x - ox;
    const dy = y - oy;
    return {
      x: ox + dx * cosT - dy * sinT,
      y: oy + dx * sinT + dy * cosT
    };
  };

  const wrist = { x: cx, y: cy + span * 0.75, z: 0 };
  const mcpY = cy + span * 0.15;
  const spreadFactor = pose.spread || 0.45;

  const baseMcps = [
    { x: cx - span * 0.4, y: cy + span * 0.4 }, // Thumb CMC
    { x: cx - span * 0.28 * spreadFactor * 1.6, y: mcpY }, // Index
    { x: cx - span * 0.08 * spreadFactor, y: mcpY - span * 0.05 }, // Middle
    { x: cx + span * 0.12 * spreadFactor, y: mcpY }, // Ring
    { x: cx + span * 0.3 * spreadFactor * 1.6, y: mcpY + span * 0.05 } // Pinky
  ];

  const lengths = [
    [span * 0.22, span * 0.2, span * 0.18],
    [span * 0.28, span * 0.22, span * 0.18],
    [span * 0.32, span * 0.24, span * 0.2],
    [span * 0.28, span * 0.22, span * 0.18],
    [span * 0.22, span * 0.18, span * 0.15]
  ];

  const flexions = [pose.thumb, pose.index, pose.middle, pose.ring, pose.pinky];
  const angles = [
    -0.85 + (1 - spreadFactor) * 0.3,
    -0.2 * spreadFactor,
    0,
    0.2 * spreadFactor,
    0.45 * spreadFactor
  ];

  const rawLandmarks = [wrist];

  for (let f = 0; f < 5; f++) {
    const mcp = baseMcps[f];
    const flex = Math.max(0.04, Math.min(1.0, flexions[f]));
    const segLens = lengths[f];
    const baseAngle = angles[f];

    rawLandmarks.push(mcp);

    let curX = mcp.x;
    let curY = mcp.y;
    let curZ = 0;

    for (let seg = 0; seg < 3; seg++) {
      const segLen = segLens[seg];
      const curlProgress = (1 - flex) * (seg + 1) * 0.95;
      const angle = -Math.PI / 2 + baseAngle + curlProgress * 0.9;
      const effectiveLen = segLen * (0.35 + 0.65 * flex);

      curX += Math.cos(angle) * effectiveLen;
      curY += Math.sin(angle) * effectiveLen;
      curZ += (1 - flex) * segLen * 0.6;

      rawLandmarks.push({ x: curX, y: curY, z: curZ });
    }
  }

  return rawLandmarks.map((pt) => {
    const rot = rotatePoint(pt.x, pt.y, cx, cy);
    return { x: rot.x, y: rot.y, z: pt.z || 0 };
  });
}

// Process single frame in worker
function processFrameInWorker(bitmap, timestamp, width, height, forceDetection, isMirrored = true) {
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;

  let targetX = 0;
  let targetY = 0;
  let hasRealHand = false;
  let handSpan = 160;
  let detectedFingers = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 };
  let detectedSpread = 0.45;
  let detectedTilt = 0;
  let realLandmarks = [];
  let detectedAllHands = [];
  let detectedHandedness = "Right";
  let detectedConfidence = 0.95;

  if (bitmap && handLandmarker) {
    try {
      const safeTimestamp = Math.max(Math.round(now), Math.round(lastMediaPipeTimestamp + 4));
      lastMediaPipeTimestamp = safeTimestamp;

      // Downsample using OffscreenCanvas if available
      let detectTarget = bitmap;
      if (typeof OffscreenCanvas !== "undefined") {
        if (!offscreenCanvas) {
          offscreenCanvas = new OffscreenCanvas(DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
          offscreenCtx = offscreenCanvas.getContext("2d");
        }
        offscreenCtx.drawImage(bitmap, 0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
        detectTarget = offscreenCanvas;
      }

      const t0 = performance.now();
      const result = handLandmarker.detectForVideo(detectTarget, safeTimestamp);
      lastInferenceMs = performance.now() - t0;

      if (result && result.landmarks && result.landmarks.length > 0) {
        hasRealHand = true;
        const flipX = isMirrored !== false;

        detectedAllHands = result.landmarks.map((rawHandPts, hIdx) => {
          const handedness = result.handednesses?.[hIdx]?.[0]?.categoryName || (hIdx === 0 ? "Right" : "Left");
          const score = result.handednesses?.[hIdx]?.[0]?.score || 0.95;
          return {
            landmarks: rawHandPts.map((pt) => ({
              x: flipX ? (1 - pt.x) * width : pt.x * width,
              y: pt.y * height,
              z: (pt.z || 0) * width
            })),
            handedness,
            confidence: score
          };
        });

        const primaryHand = detectedAllHands[0];
        realLandmarks = primaryHand.landmarks;
        detectedHandedness = primaryHand.handedness;
        detectedConfidence = primaryHand.confidence;
        lastHandSeenTime = now;

        const flex = computeFingerFlexions(realLandmarks);
        detectedFingers = {
          thumb: flex.thumb,
          index: flex.index,
          middle: flex.middle,
          ring: flex.ring,
          pinky: flex.pinky
        };
        detectedSpread = flex.spread;
        detectedTilt = flex.wristRotation;

        const middleMcp = realLandmarks[9];
        const wrist = realLandmarks[0];
        const middleTip = realLandmarks[12];
        targetX = middleMcp.x;
        targetY = middleMcp.y;
        const dWristMiddle = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y);
        handSpan = Math.max(120, Math.min(480, dWristMiddle * 1.25 * calibrationScale));

        if (autoCenterEnabled) {
          const normX = targetX / width;
          const normY = targetY / height;
          const errX = normX - 0.5;
          const errY = normY - 0.5;
          panOffsetX = Math.max(-1, Math.min(1, panOffsetX + errX * 0.15));
          panOffsetY = Math.max(-1, Math.min(1, panOffsetY + errY * 0.15));
        }
      }
    } catch (err) {
      // Non-fatal vision detection error
    }
  }

  // Close input bitmap to free GPU memory immediately
  if (bitmap && typeof bitmap.close === "function") {
    try {
      bitmap.close();
    } catch {}
  }

  if (!hasRealHand) {
    const t = timestamp * 0.002;
    targetX = width * 0.5 + Math.sin(t * 0.6) * 20;
    targetY = height * 0.5 + Math.cos(t * 0.8) * 12;
    handSpan = 160;
  }

  if (smoothTargetX === 0) {
    smoothTargetX = targetX;
    smoothTargetY = targetY;
    smoothHandSpan = handSpan;
  } else {
    const posAlpha = hasRealHand ? 0.6 : 0.2;
    smoothTargetX += posAlpha * (targetX - smoothTargetX);
    smoothTargetY += posAlpha * (targetY - smoothTargetY);
    smoothHandSpan += posAlpha * (handSpan - smoothHandSpan);
  }

  let animPose = hasRealHand
    ? {
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
      }
    : { ...fingerPose };

  if (forcedSignKey && signDictionary[forcedSignKey]) {
    const sign = signDictionary[forcedSignKey];
    if (sign.fingerConfig) {
      animPose = {
        ...animPose,
        ...sign.fingerConfig,
        spread: 0.45,
        wristAngle: 0
      };
    }
  }

  const poseAlpha = hasRealHand ? 0.65 : 0.18;
  smoothedPose.thumb += poseAlpha * (animPose.thumb - smoothedPose.thumb);
  smoothedPose.index += poseAlpha * (animPose.index - smoothedPose.index);
  smoothedPose.middle += poseAlpha * (animPose.middle - smoothedPose.middle);
  smoothedPose.ring += poseAlpha * (animPose.ring - smoothedPose.ring);
  smoothedPose.pinky += poseAlpha * (animPose.pinky - smoothedPose.pinky);
  smoothedPose.spread += poseAlpha * ((animPose.spread || 0.45) - smoothedPose.spread);
  smoothedPose.wristAngle += poseAlpha * ((animPose.wristAngle || 0) - smoothedPose.wristAngle);
  smoothedPose.rotation = smoothedPose.wristAngle;

  // Generate target landmarks
  const zoomW = width * (1 / zoomLevel);
  const zoomH = height * (1 / zoomLevel);
  const zoomX = (width - zoomW) * 0.5 + panOffsetX * (width * 0.3);
  const zoomY = (height - zoomH) * 0.5 + panOffsetY * (height * 0.3);

  const cx = zoomX + (smoothTargetX / width) * zoomW;
  const cy = zoomY + (smoothTargetY / height) * zoomH;
  const scaledSpan = smoothHandSpan * zoomLevel * calibrationScale;

  let targetLandmarks = [];
  if (hasRealHand && realLandmarks.length === 21) {
    targetLandmarks = realLandmarks.map((pt) => ({
      x: zoomX + (pt.x / width) * zoomW,
      y: zoomY + (pt.y / height) * zoomH,
      z: (pt.z || 0) * zoomLevel
    }));
  } else {
    targetLandmarks = generateSyntheticLandmarks(cx, cy, scaledSpan, smoothedPose, smoothedPose.wristAngle);
  }

  const dt = Math.max(1e-3, Math.min(0.05, delta / 1000));
  const finalLandmarks = integratePhysics(targetLandmarks, dt, now, hasRealHand);
  smoothedLandmarks = finalLandmarks;

  // Sign classification & hold recognition
  let detectedSignKey = forcedSignKey || (hasRealHand ? detectSignFromPose(smoothedPose, finalLandmarks) : "HELLO");
  if (detectedSignKey !== currentSignKey) {
    currentSignKey = detectedSignKey;
    signHoldStartTime = now;
  }

  const holdProgress = Math.min(1, Math.max(0, (now - signHoldStartTime) / HOLD_DURATION_MS));
  const isCommitted = holdProgress >= 1.0 && currentSignKey !== lastCommittedSignKey;
  if (isCommitted) {
    lastCommittedSignKey = currentSignKey;
  }

  const activeSign = signDictionary[currentSignKey] || signDictionary["HELLO"];

  let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
  finalLandmarks.forEach((pt) => {
    if (pt && Number.isFinite(pt.x)) {
      if (pt.x < bMinX) bMinX = pt.x;
      if (pt.x > bMaxX) bMaxX = pt.x;
      if (pt.y < bMinY) bMinY = pt.y;
      if (pt.y > bMaxY) bMaxY = pt.y;
    }
  });
  if (!Number.isFinite(bMinX)) {
    bMinX = width / 2 - 80;
    bMaxX = width / 2 + 80;
    bMinY = height / 2 - 80;
    bMaxY = height / 2 + 80;
  }
  const pad = 24;

  return {
    landmarks: finalLandmarks,
    boundingBox: {
      x: Math.max(0, bMinX - pad),
      y: Math.max(0, bMinY - pad),
      width: bMaxX - bMinX + pad * 2,
      height: bMaxY - bMinY + pad * 2
    },
    gesture: `${activeSign.symbol} ${activeSign.signName}`,
    confidence: hasRealHand ? detectedConfidence : (activeSign.confidence || 0.96),
    handedness: detectedHandedness || "Right",
    allHands: detectedAllHands && detectedAllHands.length > 0 ? detectedAllHands : [{
      landmarks: finalLandmarks,
      handedness: detectedHandedness || "Right",
      confidence: hasRealHand ? detectedConfidence : 0.96
    }],
    pose: { ...smoothedPose },
    isRealHandDetected: hasRealHand,
    currentSignKey,
    signMeaning: activeSign,
    holdProgress,
    isCommitted,
    fps: delta > 0 ? Math.round(1000 / delta) : 60,
    inferenceMs: +lastInferenceMs.toFixed(1),
    physicsTelemetry: { ...physicsTelemetry }
  };
}

// Handle messages from Main UI Thread
self.onmessage = async (e) => {
  const data = e.data;
  if (!data) return;

  switch (data.type) {
    case "INIT": {
      initPhysicsNodes();
      if (data.customSigns) {
        customSigns = { ...data.customSigns };
        signDictionary = { ...BASE_SIGN_DICTIONARY, ...customSigns };
      }
      if (data.physicsPreset && PHYSICS_PRESETS[data.physicsPreset]) {
        physicsConfig = { ...PHYSICS_PRESETS[data.physicsPreset], preset: data.physicsPreset };
      }
      initMediaPipeVision();
      break;
    }

    case "PROCESS_FRAME": {
      const { bitmap, timestamp, width, height, forceDetection, frameId, isMirrored } = data;
      const detection = processFrameInWorker(bitmap, timestamp || performance.now(), width || 1280, height || 720, forceDetection, isMirrored);
      self.postMessage({
        type: "DETECTION_RESULT",
        detection,
        frameId,
        timestamp: performance.now()
      });
      break;
    }

    case "UPDATE_CONFIG": {
      if (typeof data.zoomLevel === "number") zoomLevel = data.zoomLevel;
      if (typeof data.panOffsetX === "number") panOffsetX = data.panOffsetX;
      if (typeof data.panOffsetY === "number") panOffsetY = data.panOffsetY;
      if (typeof data.calibrationScale === "number") calibrationScale = data.calibrationScale;
      if (typeof data.autoCenterEnabled === "boolean") autoCenterEnabled = data.autoCenterEnabled;
      if (data.physicsConfig) physicsConfig = { ...physicsConfig, ...data.physicsConfig };
      if (data.fingerPose) fingerPose = { ...fingerPose, ...data.fingerPose };
      if (data.customSigns) {
        customSigns = { ...data.customSigns };
        signDictionary = { ...BASE_SIGN_DICTIONARY, ...customSigns };
      }
      break;
    }

    case "FORCE_SIGN": {
      forcedSignKey = data.signKey || null;
      if (forcedSignKey) {
        currentSignKey = forcedSignKey;
        signHoldStartTime = performance.now();
      }
      break;
    }

    case "APPLY_IMPULSE": {
      const { target, impulseX, impulseY, impulseZ } = data;
      const targetIndices = [];
      if (target === "all") for (let i = 0; i < 21; i++) targetIndices.push(i);
      else if (target === "thumb") targetIndices.push(1, 2, 3, 4);
      else if (target === "index") targetIndices.push(5, 6, 7, 8);
      else if (target === "middle") targetIndices.push(9, 10, 11, 12);
      else if (target === "ring") targetIndices.push(13, 14, 15, 16);
      else if (target === "pinky") targetIndices.push(17, 18, 19, 20);
      else if (target === "wrist") targetIndices.push(0);

      targetIndices.forEach((idx) => {
        const node = jointNodes[idx];
        if (node) {
          node.impulseX += impulseX || 0;
          node.impulseY += impulseY || -15;
          node.impulseZ += impulseZ || 5;
        }
      });
      break;
    }

    case "SET_PHYSICS_PRESET": {
      if (PHYSICS_PRESETS[data.preset]) {
        physicsConfig = { ...PHYSICS_PRESETS[data.preset], preset: data.preset };
      }
      break;
    }

    case "REGISTER_SIGN": {
      if (data.key && data.sign) {
        customSigns[data.key] = data.sign;
        signDictionary[data.key] = data.sign;
      }
      break;
    }

    case "DELETE_SIGN": {
      if (data.key) {
        delete customSigns[data.key];
        delete signDictionary[data.key];
      }
      break;
    }

    default:
      break;
  }
};
