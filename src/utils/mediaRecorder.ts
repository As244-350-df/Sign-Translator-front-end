// Real-time In-Browser Video & Audio MediaRecorder Engine with Live Compositor

export interface RecordedVideoResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  fileSizeBytes: number;
  fileName: string;
}

export class LiveSessionRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: NodeJS.Timeout | null = null;
  private currentDuration: number = 0;
  private isRecordingState: boolean = false;
  private onDurationUpdate?: (durationSec: number) => void;

  // Composite Recording Canvas
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;

  public isRecording(): boolean {
    return this.isRecordingState;
  }

  public getDuration(): number {
    return this.currentDuration;
  }

  // Start recording from a canvas and optional video element & audio stream
  public async startRecording(
    canvas: HTMLCanvasElement,
    videoElement?: HTMLVideoElement | null,
    audioStream?: MediaStream | null,
    onDuration?: (seconds: number) => void
  ): Promise<boolean> {
    this.onDurationUpdate = onDuration;
    this.recordedChunks = [];
    this.currentDuration = 0;

    try {
      // 1. Set up high-definition composite canvas (1280x720) to prevent dark/transparent video output
      if (!this.compositeCanvas) {
        this.compositeCanvas = document.createElement('canvas');
        this.compositeCanvas.width = 1280;
        this.compositeCanvas.height = 720;
      }
      this.compositeCtx = this.compositeCanvas.getContext('2d', { alpha: false });

      const compCanvas = this.compositeCanvas;
      const compCtx = this.compositeCtx;

      // 2. Start continuous compositing loop to blend live video feed + tracking mesh
      const renderComposite = () => {
        if (!this.isRecordingState || !compCtx) return;

        const cw = compCanvas.width;
        const ch = compCanvas.height;

        // Background Layer: Real Video Feed or Simulated Cyber Environment
        if (videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
          compCtx.save();
          // Mirror selfie camera horizontally
          compCtx.translate(cw, 0);
          compCtx.scale(-1, 1);
          compCtx.drawImage(videoElement, 0, 0, cw, ch);
          compCtx.restore();
        } else {
          // Elegant dark studio background with subtle tech grid
          const grad = compCtx.createLinearGradient(0, 0, cw, ch);
          grad.addColorStop(0, '#090D16');
          grad.addColorStop(0.5, '#131B2E');
          grad.addColorStop(1, '#090D16');
          compCtx.fillStyle = grad;
          compCtx.fillRect(0, 0, cw, ch);

          // Tech grid lines
          compCtx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
          compCtx.lineWidth = 1;
          for (let x = 0; x < cw; x += 80) {
            compCtx.beginPath();
            compCtx.moveTo(x, 0);
            compCtx.lineTo(x, ch);
            compCtx.stroke();
          }
          for (let y = 0; y < ch; y += 80) {
            compCtx.beginPath();
            compCtx.moveTo(0, y);
            compCtx.lineTo(cw, y);
            compCtx.stroke();
          }
        }

        // Foreground Layer: 21-point Skeleton Landmark Mesh & HUD Canvas
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          compCtx.drawImage(canvas, 0, 0, cw, ch);
        }

        // Live Session Watermark Badge
        compCtx.save();
        compCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        compCtx.beginPath();
        compCtx.roundRect(20, 20, 164, 30, 8);
        compCtx.fill();
        compCtx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        compCtx.lineWidth = 1;
        compCtx.stroke();

        // Pulsing red dot
        compCtx.fillStyle = '#F43F5E';
        compCtx.beginPath();
        compCtx.arc(36, 35, 5, 0, Math.PI * 2);
        compCtx.fill();

        compCtx.fillStyle = '#FFFFFF';
        compCtx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        compCtx.fillText('SIGNLINK • REC', 48, 39);
        compCtx.restore();

        this.animFrameId = requestAnimationFrame(renderComposite);
      };

      // Draw initial frame immediately
      renderComposite();

      // 3. Capture stream from the composited canvas at 30 fps
      const compositeStream = compCanvas.captureStream(30);

      // 4. Combine video track with active audio track if available
      const combinedTracks: MediaStreamTrack[] = [...compositeStream.getVideoTracks()];

      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].readyState === 'live') {
          combinedTracks.push(audioTracks[0]);
        }
      }

      const combinedStream = new MediaStream(combinedTracks);

      // 5. Determine best supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMimeType = mimeTypes.find(type => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      }) || 'video/webm';

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps high fidelity video
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Record in 1 second chunks
      this.isRecordingState = true;
      this.startTime = Date.now();

      this.timerInterval = setInterval(() => {
        this.currentDuration = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.onDurationUpdate) {
          this.onDurationUpdate(this.currentDuration);
        }
      }, 1000);

      return true;
    } catch (err) {
      console.error('[LiveSessionRecorder] Failed to start recording session:', err);
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.isRecordingState = false;
      return false;
    }
  }

  // Stop recording and produce playback blob
  public async stopRecording(): Promise<RecordedVideoResult | null> {
    if (!this.mediaRecorder || !this.isRecordingState) return null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecordingState = false;
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `signlink-session-${dateStr}.webm`;

        resolve({
          blob,
          url,
          durationSeconds: this.currentDuration,
          fileSizeBytes: blob.size,
          fileName
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        console.warn('[LiveSessionRecorder] Error stopping MediaRecorder:', err);
        resolve(null);
      }
    });
  }

  // Helper to trigger instant browser download of recorded file
  public static downloadRecording(result: RecordedVideoResult) {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }
}
