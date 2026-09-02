import { forwardRef } from "react";

export const AvatarSVGRenderer = forwardRef(({
  activePose,
  avatarModel,
  avatarTheme,
  showSkeletalOverlay
}, torsoRef) => {
  const renderHand = (wristX, wristY, rotation, scale, fingers = {}, isRight = true) => {
    const thumbFlex = fingers.thumb ?? 0.8;
    const indexFlex = fingers.index ?? 1;
    const middleFlex = fingers.middle ?? 1;
    const ringFlex = fingers.ring ?? 1;
    const pinkyFlex = fingers.pinky ?? 1;

    const getFingerPoints = (baseX, baseY, angleDeg, maxLen, flex) => {
      const rad = (angleDeg * Math.PI) / 180;
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

    return (
      <g transform={`translate(${wristX}, ${wristY}) rotate(${rotation}) scale(${scale})`}>
        {/* Palm Shadow */}
        <ellipse cx="0" cy="-4" rx="17" ry="15" fill={avatarTheme.skinShadow} opacity="0.85" />

        {/* Hand Palm Flesh */}
        <path
          d="M -15,-2 C -16,-14 -12,-18 0,-18 C 12,-18 16,-14 15,-2 C 14,10 6,14 0,14 C -6,14 -14,10 -15,-2 Z"
          fill={avatarTheme.skinTone}
          stroke={avatarTheme.skinShadow}
          strokeWidth="1.2"
        />

        {/* 5 Articulated Fingers */}
        {fingerList.map((f, idx) => (
          <g key={idx}>
            <line
              x1={f.baseX}
              y1={f.baseY}
              x2={f.tipX}
              y2={f.tipY}
              stroke={avatarTheme.skinTone}
              strokeWidth={idx === 0 ? 5.5 : 4.5}
              strokeLinecap="round"
            />
            <circle cx={f.midX} cy={f.midY} r={idx === 0 ? 2.5 : 2} fill={avatarTheme.skinShadow} opacity="0.7" />
            <circle cx={f.tipX} cy={f.tipY} r={idx === 0 ? 2.8 : 2.2} fill={avatarTheme.skinTone} />

            {showSkeletalOverlay && (
              <>
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
              </>
            )}
          </g>
        ))}

        {showSkeletalOverlay && <circle cx="0" cy="10" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 400 420" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={avatarTheme.skinTone} />
          <stop offset="100%" stopColor={avatarTheme.skinShadow} />
        </linearGradient>

        <linearGradient id="clothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={avatarTheme.clothingAccent} />
          <stop offset="100%" stopColor={avatarTheme.clothingBg} />
        </linearGradient>

        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          @keyframes avatarBlink {
            0%, 94%, 100% { transform: scaleY(1); }
            96%, 98% { transform: scaleY(0.08); }
          }
          .avatar-blink-anim {
            transform-origin: 0px -2px;
            animation: avatarBlink 4.2s infinite ease-in-out;
          }
        `}</style>
      </defs>

      {/* Torso & Shoulders */}
      <g ref={torsoRef} transform="translate(0, 0)">
        <path
          d="M 120,230 Q 200,220 280,230 L 320,420 L 80,420 Z"
          fill="url(#clothGrad)"
          stroke={avatarTheme.clothingBg}
          strokeWidth="2"
        />
        <path
          d="M 170,225 Q 200,250 230,225"
          fill="none"
          stroke={avatarTheme.clothingAccent}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {avatarModel === "nova" && (
          <g filter="url(#neonGlow)" stroke="#22D3EE" strokeWidth="1.5" fill="none" opacity="0.8">
            <path d="M 200,250 L 200,310 M 170,270 L 200,290 L 230,270" />
            <circle cx="200" cy="290" r="3.5" fill="#22D3EE" />
          </g>
        )}

        {showSkeletalOverlay && (
          <g stroke={avatarTheme.jointGlow} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7">
            <line x1="200" y1="225" x2="200" y2="350" />
            <line x1="120" y1="230" x2="280" y2="230" />
            <circle cx="120" cy="230" r="4" fill="#38BDF8" />
            <circle cx="280" cy="230" r="4" fill="#38BDF8" />
          </g>
        )}
      </g>

      {/* Neck */}
      <rect x="185" y="170" width="30" height="55" rx="10" fill="url(#skinGrad)" />

      {/* Head & Face */}
      <g
        transform={`translate(${activePose.head.x}, ${activePose.head.y}) rotate(${activePose.head.tiltDeg})`}
        className="transition-transform duration-300"
      >
        <ellipse cx="0" cy="-8" rx="42" ry="46" fill={avatarTheme.hairColor} />
        <ellipse cx="0" cy="5" rx="34" ry="42" fill="url(#skinGrad)" stroke={avatarTheme.skinShadow} strokeWidth="1" />
        <ellipse cx="-34" cy="5" rx="5" ry="10" fill={avatarTheme.skinTone} />
        <ellipse cx="34" cy="5" rx="5" ry="10" fill={avatarTheme.skinTone} />

        {avatarModel === "maya" ? (
          <path
            d="M -35,-15 Q -10,-45 25,-25 Q 36,-10 35,5 Q 28,-18 0,-18 Q -24,-18 -35,-15 Z"
            fill={avatarTheme.hairColor}
          />
        ) : avatarModel === "kai" ? (
          <path
            d="M -34,-10 Q -5,-48 30,-30 Q 38,-15 36,-5 Q 15,-25 -10,-22 Z"
            fill={avatarTheme.hairColor}
          />
        ) : (
          <path
            d="M -34,-15 Q 0,-40 34,-15 Q 36,-5 32,5 Q 15,-20 -15,-20 Z"
            fill={avatarTheme.hairColor}
          />
        )}

        {/* Eyebrows */}
        <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-300">
          {activePose.eyebrows === "raised" ? (
            <>
              <path d="M -23,-13 Q -15,-18 -7,-12" />
              <path d="M 7,-12 Q 15,-18 23,-13" />
            </>
          ) : activePose.eyebrows === "furrowed" ? (
            <>
              <path d="M -23,-9 Q -15,-14 -7,-17" />
              <path d="M 7,-17 Q 15,-14 23,-9" />
            </>
          ) : activePose.eyebrows === "empathetic" ? (
            <>
              <path d="M -23,-15 Q -15,-12 -7,-10" />
              <path d="M 7,-10 Q 15,-12 23,-15" />
            </>
          ) : (
            <>
              <path d="M -23,-11 Q -15,-14 -7,-11" />
              <path d="M 7,-11 Q 15,-14 23,-11" />
            </>
          )}
        </g>

        {/* Eyes */}
        {avatarModel === "nova" ? (
          <g filter="url(#neonGlow)">
            <path d="M -30,-8 L 30,-8 L 26,6 L -26,6 Z" fill="#0284C7" opacity="0.85" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1="-20" y1="-1" x2="20" y2="-1" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
          </g>
        ) : activePose.eyes === "blink" ? (
          <g stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
            <path d="M -21,-2 Q -15,1 -9,-2" />
            <path d="M 9,-2 Q 15,1 21,-2" />
          </g>
        ) : (
          <g className="avatar-blink-anim">
            <ellipse cx="-15" cy="-2" rx="7" ry="5" fill="#FFFFFF" />
            <ellipse cx="15" cy="-2" rx="7" ry="5" fill="#FFFFFF" />
            <circle cx="-15" cy="-2" r="3.2" fill={avatarTheme.eyeColor} />
            <circle cx="15" cy="-2" r="3.2" fill={avatarTheme.eyeColor} />
            <circle cx="-14" cy="-3.5" r="1.1" fill="#FFFFFF" />
            <circle cx="16" cy="-3.5" r="1.1" fill="#FFFFFF" />
          </g>
        )}

        {/* Nose */}
        <path d="M -1,6 Q 2,12 -3,14 Q 0,16 3,14" fill="none" stroke={avatarTheme.skinShadow} strokeWidth="1.5" strokeLinecap="round" />

        {/* Mouth */}
        <g className="transition-all duration-200">
          {activePose.mouth === "smile" ? (
            <path d="M -11,23 Q 0,33 11,23" fill="#BE185D" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
          ) : activePose.mouth === "open_ah" ? (
            <ellipse cx="0" cy="25" rx="7" ry="5" fill="#881337" stroke="#4C0519" strokeWidth="1" />
          ) : activePose.mouth === "round_oh" ? (
            <ellipse cx="0" cy="25" rx="5" ry="6" fill="#881337" stroke="#4C0519" strokeWidth="1" />
          ) : (
            <path d="M -9,25 Q 0,27 9,25" fill="none" stroke="#9F1239" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
      </g>

      {/* Left Arm */}
      <g className="transition-all duration-300">
        <line
          x1="120"
          y1="230"
          x2={activePose.leftArm.elbow.x}
          y2={activePose.leftArm.elbow.y}
          stroke="url(#clothGrad)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <line
          x1={activePose.leftArm.elbow.x}
          y1={activePose.leftArm.elbow.y}
          x2={activePose.leftArm.wrist.x}
          y2={activePose.leftArm.wrist.y}
          stroke="url(#skinGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {renderHand(
          activePose.leftArm.wrist.x,
          activePose.leftArm.wrist.y,
          activePose.leftArm.rotationDeg,
          activePose.leftArm.scale,
          activePose.leftFingers || { thumb: 0.8, index: 1, middle: 1, ring: 1, pinky: 1 },
          false
        )}
      </g>

      {/* Right Arm */}
      <g className="transition-all duration-300">
        <line
          x1="280"
          y1="230"
          x2={activePose.rightArm.elbow.x}
          y2={activePose.rightArm.elbow.y}
          stroke="url(#clothGrad)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <line
          x1={activePose.rightArm.elbow.x}
          y1={activePose.rightArm.elbow.y}
          x2={activePose.rightArm.wrist.x}
          y2={activePose.rightArm.wrist.y}
          stroke="url(#skinGrad)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {activePose.rightArm.isActive && (
          <circle
            cx={activePose.rightArm.wrist.x}
            cy={activePose.rightArm.wrist.y}
            r="28"
            fill="url(#neonGlow)"
            fillOpacity="0.12"
            className="animate-pulse"
          />
        )}
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
  );
});

AvatarSVGRenderer.displayName = "AvatarSVGRenderer";
