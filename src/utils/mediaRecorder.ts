// Real-time In-Browser Video & Audio MediaRecorder Engine

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

  public isRecording(): boolean {
    return this.isRecordingState;
  }

  public getDuration(): number {
    return this.currentDuration;
  }

  // Start recording from a canvas and optional audio stream
  public async startRecording(
    canvas: HTMLCanvasElement,
    audioStream?: MediaStream | null,
    onDuration?: (seconds: number) => void
  ): Promise<boolean> {
    this.onDurationUpdate = onDuration;
    this.recordedChunks = [];
    this.currentDuration = 0;

    try {
      // 1. Capture stream from canvas at 30/60 fps
      const canvasStream = canvas.captureStream(30);

      // 2. Combine video track with audio track if available
      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => combinedTracks.push(track));
      } else {
        // Attempt to get user audio if available
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          mic.getAudioTracks().forEach(track => combinedTracks.push(track));
        } catch {
          // Continue with video-only if mic not granted
        }
      }

      const combinedStream = new MediaStream(combinedTracks);

      // 3. Determine best supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps crisp video
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // chunk every 1 second
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
      console.error('Failed to initialize MediaRecorder:', err);
      return false;
    }
  }

  // Stop recording and return final video Blob and metadata
  public async stopRecording(): Promise<RecordedVideoResult | null> {
    if (!this.mediaRecorder || !this.isRecordingState) return null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
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

      this.mediaRecorder.stop();
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
