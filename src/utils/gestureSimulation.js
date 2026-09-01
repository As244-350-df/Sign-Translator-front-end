function generateHandLandmarks(centerX, centerY, scale = 1, t = 0) {
  const wave = Math.sin(t * 3e-3) * 8;
  const waveThumb = Math.cos(t * 4e-3) * 6;
  const wrist = { x: centerX, y: centerY + 90 * scale + wave * 0.2 };
  const p1 = { x: centerX - 35 * scale, y: centerY + 65 * scale };
  const p2 = { x: centerX - 55 * scale + waveThumb, y: centerY + 35 * scale };
  const p3 = { x: centerX - 65 * scale + waveThumb, y: centerY + 5 * scale };
  const p4 = { x: centerX - 68 * scale + waveThumb, y: centerY - 25 * scale };
  const p5 = { x: centerX - 25 * scale, y: centerY + 15 * scale };
  const p6 = { x: centerX - 30 * scale, y: centerY - 35 * scale + wave * 0.5 };
  const p7 = { x: centerX - 32 * scale, y: centerY - 75 * scale + wave * 0.7 };
  const p8 = { x: centerX - 33 * scale, y: centerY - 110 * scale + wave };
  const p9 = { x: centerX, y: centerY + 10 * scale };
  const p10 = { x: centerX - 2 * scale, y: centerY - 45 * scale + wave * 0.4 };
  const p11 = { x: centerX - 3 * scale, y: centerY - 90 * scale + wave * 0.6 };
  const p12 = { x: centerX - 4 * scale, y: centerY - 125 * scale + wave * 0.9 };
  const p13 = { x: centerX + 25 * scale, y: centerY + 18 * scale };
  const p14 = { x: centerX + 26 * scale, y: centerY - 35 * scale + wave * 0.3 };
  const p15 = { x: centerX + 27 * scale, y: centerY - 75 * scale + wave * 0.5 };
  const p16 = { x: centerX + 28 * scale, y: centerY - 105 * scale + wave * 0.8 };
  const p17 = { x: centerX + 48 * scale, y: centerY + 30 * scale };
  const p18 = { x: centerX + 52 * scale, y: centerY - 15 * scale + wave * 0.2 };
  const p19 = { x: centerX + 55 * scale, y: centerY - 45 * scale + wave * 0.4 };
  const p20 = { x: centerX + 58 * scale, y: centerY - 75 * scale + wave * 0.6 };
  return [wrist, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20];
}
function drawHandSkeleton(ctx, landmarks, color = "#10B981", jointColor = "#38BDF8", showConfidenceBox = true, label = "ASL Hand Tracker", confidence = 0.96) {
  if (landmarks.length < 21) return;
  const bones = [
    // Palm base
    [0, 1],
    [0, 5],
    [0, 9],
    [0, 13],
    [0, 17],
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
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  bones.forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[from].x, landmarks[from].y);
    ctx.lineTo(landmarks[to].x, landmarks[to].y);
    ctx.stroke();
  });
  landmarks.forEach((p, idx) => {
    ctx.beginPath();
    const isTip = [4, 8, 12, 16, 20].includes(idx);
    const radius = isTip ? 6 : idx === 0 ? 7 : 4;
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? "#F59E0B" : jointColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  });
  if (showConfidenceBox) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    landmarks.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const padding = 24;
    const boxX = minX - padding;
    const boxY = minY - padding;
    const boxW = maxX - minX + padding * 2;
    const boxH = maxY - minY + padding * 2;
    const cornerSize = 16;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#38BDF8";
    ctx.shadowColor = "#38BDF8";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + cornerSize);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerSize, boxY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerSize, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cornerSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - cornerSize);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cornerSize, boxY + boxH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize);
    ctx.stroke();
    ctx.font = "600 11px system-ui, sans-serif";
    const tagText = `${label} \u2022 ${Math.round(confidence * 100)}%`;
    const textWidth = ctx.measureText(tagText).width;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY - 24, textWidth + 14, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#38BDF8";
    ctx.fillText(tagText, boxX + 7, boxY - 10);
  }
  ctx.restore();
}
export {
  drawHandSkeleton,
  generateHandLandmarks
};
