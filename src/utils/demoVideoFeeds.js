const DEMO_SIGN_PRESETS = [
  {
    id: "HELLO",
    name: "Hello (Greeting)",
    symbol: "\u{1F590}\uFE0F",
    description: "Open hand with waving motion & rhythmic finger flexion",
    category: "Greetings",
    durationSec: 4
  },
  {
    id: "THANK_YOU",
    name: "Thank You",
    symbol: "\u{1F64F}",
    description: "Flat open hand moving outward from chin with fingers together",
    category: "Courtesy",
    durationSec: 4
  },
  {
    id: "I_LOVE_YOU",
    name: "I Love You (ILY)",
    symbol: "\u{1F91F}",
    description: "Thumb, Index & Pinky extended with Ring & Middle curled",
    category: "Expressions",
    durationSec: 4
  },
  {
    id: "PEACE",
    name: "Peace / Victory (V)",
    symbol: "\u270C\uFE0F",
    description: "Index & Middle fingers extended with spread, Thumb over Ring/Pinky",
    category: "Common",
    durationSec: 4
  },
  {
    id: "GOOD",
    name: "Good / Thumbs Up",
    symbol: "\u{1F44D}",
    description: "Curled fingers with upward erect thumb",
    category: "Common",
    durationSec: 4
  },
  {
    id: "WATER",
    name: "Water (W)",
    symbol: "\u{1F4A7}",
    description: "Index, Middle, and Ring extended in W-formation",
    category: "Common",
    durationSec: 4
  },
  {
    id: "OKAY",
    name: "Okay (OK)",
    symbol: "\u{1F44C}",
    description: "Thumb and Index tips touching in a ring, other fingers extended",
    category: "Common",
    durationSec: 4
  },
  {
    id: "HELP",
    name: "Help",
    symbol: "\u{1F198}",
    description: "Thumbs-up hand resting on open flat palm",
    category: "Emergency",
    durationSec: 4
  }
];
class SyntheticVideoEngine {
  canvas = null;
  ctx = null;
  animId = null;
  currentStream = null;
  activePreset = "HELLO";
  startTime = 0;
  constructor() {
    if (typeof document !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 640;
      this.canvas.height = 480;
      this.ctx = this.canvas.getContext("2d");
    }
  }
  generateStream(presetId) {
    if (!this.canvas || !this.ctx) return null;
    this.activePreset = presetId;
    this.startTime = performance.now();
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    const renderLoop = () => {
      this.drawFrame();
      this.animId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
    if (this.canvas.captureStream) {
      this.currentStream = this.canvas.captureStream(30);
      return this.currentStream;
    }
    return null;
  }
  stopStream() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((t) => t.stop());
      this.currentStream = null;
    }
  }
  drawFrame() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const elapsed = (performance.now() - this.startTime) / 1e3;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(99, 102, 241, 0.9)";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText(`DEMO SIGN FEED: ${this.activePreset}`, 20, 30);
    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "11px monospace";
    ctx.fillText(`MediaPipe Optical Test \u2022 Frame: ${(elapsed * 30).toFixed(0)}`, 20, 48);
    const cx = w * 0.5 + Math.sin(elapsed * 1.5) * 12;
    const cy = h * 0.52 + Math.cos(elapsed * 2) * 8;
    const scale = 1;
    ctx.save();
    ctx.translate(cx, cy);
    this.renderStylizedHand(ctx, this.activePreset, elapsed, scale);
    ctx.restore();
  }
  renderStylizedHand(ctx, preset, time, scale) {
    const skinBase = "#f8c9a3";
    const skinShadow = "#e0a982";
    const skinHighlight = "#ffdfc4";
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 40, 50 * scale, 55 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skinShadow;
    ctx.beginPath();
    ctx.roundRect(-30 * scale, 85 * scale, 60 * scale, 60 * scale, 8);
    ctx.fill();
    let thumbExt = 1;
    let indexExt = 1;
    let middleExt = 1;
    let ringExt = 1;
    let pinkyExt = 1;
    let spread = 0.8;
    switch (preset) {
      case "HELLO":
        thumbExt = 1;
        indexExt = 1 + Math.sin(time * 6) * 0.08;
        middleExt = 1 + Math.sin(time * 6 + 0.5) * 0.08;
        ringExt = 1 + Math.sin(time * 6 + 1) * 0.08;
        pinkyExt = 1 + Math.sin(time * 6 + 1.5) * 0.08;
        spread = 0.9;
        break;
      case "THANK_YOU":
        thumbExt = 0.9;
        indexExt = 1;
        middleExt = 1;
        ringExt = 1;
        pinkyExt = 1;
        spread = 0.2;
        break;
      case "I_LOVE_YOU":
        thumbExt = 1;
        indexExt = 1;
        middleExt = 0.15;
        ringExt = 0.15;
        pinkyExt = 1;
        spread = 0.9;
        break;
      case "PEACE":
        thumbExt = 0.2;
        indexExt = 1;
        middleExt = 1;
        ringExt = 0.15;
        pinkyExt = 0.15;
        spread = 0.7;
        break;
      case "GOOD":
        thumbExt = 1;
        indexExt = 0.15;
        middleExt = 0.15;
        ringExt = 0.15;
        pinkyExt = 0.15;
        break;
      case "WATER":
        thumbExt = 0.2;
        indexExt = 1;
        middleExt = 1;
        ringExt = 1;
        pinkyExt = 0.15;
        spread = 0.6;
        break;
      case "OKAY":
        thumbExt = 0.4;
        indexExt = 0.4;
        middleExt = 1;
        ringExt = 1;
        pinkyExt = 1;
        spread = 0.8;
        break;
      case "HELP":
        thumbExt = 1;
        indexExt = 0.2;
        middleExt = 0.2;
        ringExt = 0.2;
        pinkyExt = 0.2;
        break;
    }
    const drawFinger = (angleDeg, length, extension, width, rootX, rootY) => {
      ctx.save();
      ctx.translate(rootX, rootY);
      ctx.rotate(angleDeg * Math.PI / 180);
      const actualLength = length * (0.25 + extension * 0.75) * scale;
      const fWidth = width * scale;
      ctx.fillStyle = skinBase;
      ctx.strokeStyle = skinShadow;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-fWidth / 2, -actualLength, fWidth, actualLength, fWidth / 2);
      ctx.fill();
      ctx.stroke();
      if (extension > 0.6) {
        ctx.fillStyle = skinHighlight;
        ctx.beginPath();
        ctx.ellipse(0, -actualLength + 10, fWidth * 0.35, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };
    drawFinger(18 * spread, 70, pinkyExt, 16, 36, 10);
    drawFinger(6 * spread, 88, ringExt, 18, 14, 0);
    drawFinger(-4 * spread, 98, middleExt, 19, -8, -5);
    drawFinger(-16 * spread, 90, indexExt, 19, -30, 2);
    drawFinger(-45 - (1 - thumbExt) * 20, 65, thumbExt, 22, -42, 38);
  }
}
const syntheticVideoEngine = new SyntheticVideoEngine();
export {
  DEMO_SIGN_PRESETS,
  syntheticVideoEngine
};
