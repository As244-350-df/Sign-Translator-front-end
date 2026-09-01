import { useRef, useMemo } from "react";
import { motion } from "motion/react";
import { FINGER_METADATA } from "../utils/fingerMapping";
const SkeletalHandVisualizer = ({
  profile,
  selectedFingerFilter = null,
  onFingerSelect,
  velocityMode = "auto",
  onVelocityCalculated,
  className = ""
}) => {
  const prevProfileRef = useRef(profile);
  const prevTimeRef = useRef(performance.now());
  const { fingerSprings, overallSpring, velocityMetrics } = useMemo(() => {
    const now = performance.now();
    const dtSeconds = Math.max(0.08, Math.min(1.8, (now - prevTimeRef.current) / 1e3));
    prevTimeRef.current = now;
    const prevFingers = prevProfileRef.current.fingers;
    const currFingers = profile.fingers;
    const movementTypeMultipliers = {
      pulse: 1.35,
      lift: 1.3,
      wave: 1.25,
      pinch: 0.85,
      hook: 0.8,
      circle: 0.75,
      static: 0.9
    };
    const movementMultiplier = movementTypeMultipliers[profile.movementType] ?? 1;
    const keys = ["thumb", "index", "middle", "ring", "pinky"];
    let totalDelta = 0;
    const perFingerVelocity = {};
    keys.forEach((k) => {
      const prevVal = prevFingers[k]?.flexion ?? 0.5;
      const currVal = currFingers[k]?.flexion ?? 0.5;
      const delta = Math.abs(currVal - prevVal);
      totalDelta += delta;
      perFingerVelocity[k] = delta / dtSeconds * movementMultiplier;
    });
    prevProfileRef.current = profile;
    const avgVelocity = totalDelta / 5 / dtSeconds * movementMultiplier;
    let normalizedScore = Math.max(0, Math.min(1, avgVelocity / 2.2));
    if (velocityMode === "snappy") {
      normalizedScore = 1;
    } else if (velocityMode === "deliberate") {
      normalizedScore = 0;
    }
    const computeSpring = (score) => {
      const stiffness = Math.round(260 + score * (640 - 260));
      const damping = Math.round(36 - score * (36 - 22));
      const mass = parseFloat((1.35 - score * (1.35 - 0.55)).toFixed(2));
      return {
        type: "spring",
        stiffness,
        damping,
        mass
      };
    };
    const overall = computeSpring(normalizedScore);
    const fingerSpringMap = {};
    keys.forEach((k) => {
      let fScore = Math.max(0, Math.min(1, perFingerVelocity[k] / 2.5));
      if (velocityMode === "snappy") fScore = 1;
      if (velocityMode === "deliberate") fScore = 0;
      const blendedScore = fScore * 0.6 + normalizedScore * 0.4;
      fingerSpringMap[k] = computeSpring(blendedScore);
    });
    const metrics = {
      velocityScore: normalizedScore,
      effectiveStiffness: overall.stiffness,
      effectiveDamping: overall.damping,
      effectiveMass: overall.mass,
      label: normalizedScore > 0.65 ? "\u26A1 Snappy (Fast Velocity)" : normalizedScore > 0.35 ? "\u{1F3AF} Balanced Kinematics" : "\u23F1 Deliberate (Weighted)"
    };
    if (onVelocityCalculated) {
      onVelocityCalculated(metrics);
    }
    return {
      fingerSprings: fingerSpringMap,
      overallSpring: overall,
      velocityMetrics: metrics
    };
  }, [profile, velocityMode, onVelocityCalculated]);
  const wrist = { x: 160, y: 245 };
  const thumbCmc = { x: 112, y: 202 };
  const indexMcp = { x: 124, y: 142 };
  const middleMcp = { x: 160, y: 132 };
  const ringMcp = { x: 196, y: 142 };
  const pinkyMcp = { x: 228, y: 158 };
  const calculateFingerChain = (key, mcp, angleDeg, l1, l2, l3) => {
    const fingerState = profile.fingers[key];
    const isPrimary = profile.primaryFingers.includes(key);
    const isActive = profile.activeFingers.includes(key);
    const flexion = Math.max(0.05, Math.min(1, fingerState?.flexion ?? 1));
    const meta = FINGER_METADATA[key];
    const curl = 1 - flexion;
    const rad = angleDeg * Math.PI / 180;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);
    let pip;
    let dip;
    let tip;
    if (key === "thumb") {
      const tFlex = flexion;
      const tCurl = 1 - tFlex;
      pip = {
        x: thumbCmc.x - 22 * tFlex + tCurl * 10,
        y: thumbCmc.y - 24 * tFlex - tCurl * 12
      };
      dip = {
        x: pip.x - 24 * tFlex + tCurl * 26,
        y: pip.y - 20 * tFlex + tCurl * 6
      };
      tip = {
        x: dip.x - 20 * tFlex + tCurl * 32,
        y: dip.y - 18 * tFlex + tCurl * 14
      };
    } else {
      pip = {
        x: mcp.x + dirX * l1 * (1 - curl * 0.38),
        y: mcp.y + dirY * l1 * (1 - curl * 0.38) + curl * 18
      };
      dip = {
        x: pip.x + dirX * l2 * (1 - curl * 0.72),
        y: pip.y + dirY * l2 * (1 - curl * 0.72) + curl * 16
      };
      tip = {
        x: dip.x + dirX * l3 * (1 - curl * 0.9),
        y: dip.y + dirY * l3 * (1 - curl * 0.9) + curl * 14
      };
    }
    return {
      key,
      name: meta.name,
      color: meta.color,
      glowColor: meta.glowColor,
      mcp,
      pip,
      dip,
      tip,
      flexion,
      isPrimary,
      isActive,
      isLifted: fingerState?.isLifted ?? false,
      springTransition: fingerSprings[key] ?? overallSpring
    };
  };
  const thumbChain = calculateFingerChain("thumb", thumbCmc, -145, 32, 26, 22);
  const indexChain = calculateFingerChain("index", indexMcp, -96, 36, 28, 22);
  const middleChain = calculateFingerChain("middle", middleMcp, -90, 40, 30, 24);
  const ringChain = calculateFingerChain("ring", ringMcp, -84, 36, 28, 22);
  const pinkyChain = calculateFingerChain("pinky", pinkyMcp, -74, 30, 22, 18);
  const allChains = [thumbChain, indexChain, middleChain, ringChain, pinkyChain];
  const palmWebbingPath = `M ${wrist.x} ${wrist.y} 
    L ${thumbCmc.x} ${thumbCmc.y} 
    L ${indexMcp.x} ${indexMcp.y} 
    L ${middleMcp.x} ${middleMcp.y} 
    L ${ringMcp.x} ${ringMcp.y} 
    L ${pinkyMcp.x} ${pinkyMcp.y} 
    Z`;
  return <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg
    viewBox="0 0 320 270"
    className="w-full h-auto max-h-[220px] select-none overflow-visible"
  >
        <defs>
          {
    /* Subtle glowing filters for active fingers */
  }
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-indigo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="palmGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#312E81" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4338CA" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {
    /* 1. Translucent Anatomical Palm Webbing Mesh */
  }
        <motion.path
    d={palmWebbingPath}
    fill="url(#palmGrad)"
    stroke="#6366F1"
    strokeWidth="1.5"
    strokeDasharray="4 3"
    strokeOpacity="0.4"
    transition={overallSpring}
  />

        {
    /* 2. Palm Metacarpal Radiating Bones (Wrist -> Knuckles) */
  }
        {[
    { from: wrist, to: thumbCmc },
    { from: wrist, to: indexMcp },
    { from: wrist, to: middleMcp },
    { from: wrist, to: ringMcp },
    { from: wrist, to: pinkyMcp }
  ].map((bone, i) => <motion.line
    key={`meta-bone-${i}`}
    x1={bone.from.x}
    y1={bone.from.y}
    x2={bone.to.x}
    y2={bone.to.y}
    stroke="#64748B"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeOpacity="0.5"
    transition={overallSpring}
  />)}

        {
    /* Transverse Metacarpal Arch connecting knuckles */
  }
        {[
    { from: thumbCmc, to: indexMcp },
    { from: indexMcp, to: middleMcp },
    { from: middleMcp, to: ringMcp },
    { from: ringMcp, to: pinkyMcp }
  ].map((arch, i) => <motion.line
    key={`arch-${i}`}
    x1={arch.from.x}
    y1={arch.from.y}
    x2={arch.to.x}
    y2={arch.to.y}
    stroke="#475569"
    strokeWidth="2"
    strokeDasharray="3 3"
    strokeOpacity="0.6"
    transition={overallSpring}
  />)}

        {
    /* 3. 5-Finger Kinematic Ray Bones (MCP -> PIP -> DIP -> Tip) with Velocity-Scaled Transitions */
  }
        {allChains.map((chain) => {
    const isFilterMatch = selectedFingerFilter === chain.key;
    const isHighlighted = chain.isPrimary || isFilterMatch;
    const boneColor = isHighlighted ? chain.key === "thumb" ? "#F59E0B" : chain.key === "index" ? "#06B6D4" : chain.key === "middle" ? "#6366F1" : chain.key === "ring" ? "#A855F7" : "#F43F5E" : "#94A3B8";
    const strokeW = isHighlighted ? 5.5 : 3.5;
    const boneOpacity = isHighlighted ? 1 : chain.flexion > 0.4 ? 0.7 : 0.35;
    const fSpring = chain.springTransition;
    return <g
      key={`chain-${chain.key}`}
      onClick={() => onFingerSelect && onFingerSelect(chain.key)}
      className="cursor-pointer group"
    >
              {
      /* Segment 1: MCP -> PIP */
    }
              <motion.line
      animate={{
        x1: chain.mcp.x,
        y1: chain.mcp.y,
        x2: chain.pip.x,
        y2: chain.pip.y
      }}
      transition={fSpring}
      stroke={boneColor}
      strokeWidth={strokeW}
      strokeLinecap="round"
      strokeOpacity={boneOpacity}
      filter={isHighlighted ? "url(#glow-cyan)" : void 0}
    />

              {
      /* Segment 2: PIP -> DIP */
    }
              <motion.line
      animate={{
        x1: chain.pip.x,
        y1: chain.pip.y,
        x2: chain.dip.x,
        y2: chain.dip.y
      }}
      transition={fSpring}
      stroke={boneColor}
      strokeWidth={strokeW * 0.88}
      strokeLinecap="round"
      strokeOpacity={boneOpacity}
    />

              {
      /* Segment 3: DIP -> Tip */
    }
              <motion.line
      animate={{
        x1: chain.dip.x,
        y1: chain.dip.y,
        x2: chain.tip.x,
        y2: chain.tip.y
      }}
      transition={fSpring}
      stroke={boneColor}
      strokeWidth={strokeW * 0.75}
      strokeLinecap="round"
      strokeOpacity={boneOpacity}
    />

              {
      /* PIP Joint Sphere */
    }
              <motion.circle
      animate={{ cx: chain.pip.x, cy: chain.pip.y }}
      transition={fSpring}
      r={isHighlighted ? 4.5 : 3.5}
      fill={isHighlighted ? "#FFFFFF" : "#CBD5E1"}
      stroke={boneColor}
      strokeWidth="2"
    />

              {
      /* DIP Joint Sphere */
    }
              <motion.circle
      animate={{ cx: chain.dip.x, cy: chain.dip.y }}
      transition={fSpring}
      r={isHighlighted ? 4 : 3}
      fill={isHighlighted ? "#FFFFFF" : "#CBD5E1"}
      stroke={boneColor}
      strokeWidth="1.5"
    />

              {
      /* Distal Fingertip Node (Interactive Pulse & Halo) */
    }
              <motion.circle
      animate={{
        cx: chain.tip.x,
        cy: chain.tip.y,
        r: isHighlighted ? 7.5 : 5
      }}
      transition={fSpring}
      fill={isHighlighted ? boneColor : "#64748B"}
      stroke="#FFFFFF"
      strokeWidth={isHighlighted ? 2.5 : 1.5}
      filter={isHighlighted ? "url(#glow-indigo)" : void 0}
    />

              {
      /* Fingertip Label */
    }
              <motion.text
      animate={{
        x: chain.tip.x,
        y: chain.tip.y - 12
      }}
      transition={fSpring}
      textAnchor="middle"
      fontSize="9"
      fontFamily="monospace"
      fontWeight="bold"
      fill={isHighlighted ? "#FFFFFF" : "#94A3B8"}
      className="pointer-events-none select-none"
    >
                {chain.name.slice(0, 3).toUpperCase()} {Math.round(chain.flexion * 100)}%
              </motion.text>
            </g>;
  })}

        {
    /* 4. Base Knuckle Spheres (MCP Joints) */
  }
        {[
    { pt: thumbCmc, label: "T-CMC" },
    { pt: indexMcp, label: "I-MCP" },
    { pt: middleMcp, label: "M-MCP" },
    { pt: ringMcp, label: "R-MCP" },
    { pt: pinkyMcp, label: "P-MCP" }
  ].map((knuckle, i) => <motion.circle
    key={`mcp-${i}`}
    cx={knuckle.pt.x}
    cy={knuckle.pt.y}
    r="5"
    fill="#1E293B"
    stroke="#38BDF8"
    strokeWidth="2"
    transition={overallSpring}
  />)}

        {
    /* 5. Wrist Root Base Anchor */
  }
        <motion.circle
    cx={wrist.x}
    cy={wrist.y}
    r="8"
    fill="#EC4899"
    stroke="#FFFFFF"
    strokeWidth="2.5"
    transition={overallSpring}
  />
        <text
    x={wrist.x}
    y={wrist.y + 18}
    textAnchor="middle"
    fontSize="9"
    fontFamily="monospace"
    fontWeight="bold"
    fill="#EC4899"
    className="pointer-events-none select-none"
  >
          WRIST (ROOT)
        </text>
      </svg>
    </div>;
};
export {
  SkeletalHandVisualizer
};
