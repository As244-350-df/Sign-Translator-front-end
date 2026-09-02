let lastSpeakTime = 0;
let lastSpokenText = "";
let cachedVoices = [];
let voiceInitDone = false;

// Pre-fetch and cache available voices immediately on module load
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const loadVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
        voiceInitDone = true;
      }
    } catch {
      // Ignored
    }
  };
  loadVoices();
  if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function getBestVoice() {
  if (!cachedVoices.length && typeof window !== "undefined" && "speechSynthesis" in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return (
    cachedVoices.find((v) => (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Premium")) && v.lang.startsWith("en")) ||
    cachedVoices.find((v) => v.lang.startsWith("en")) ||
    cachedVoices[0] ||
    null
  );
}

function speakText(text, onEndOrRate, rateOrPitch = 1, pitch = 1) {
  let onEnd;
  let rate = 1;
  let pitchVal = 1;
  if (typeof onEndOrRate === "function") {
    onEnd = onEndOrRate;
    rate = typeof rateOrPitch === "number" ? rateOrPitch : 1;
    pitchVal = typeof pitch === "number" ? pitch : 1;
  } else if (typeof onEndOrRate === "number") {
    rate = onEndOrRate;
    pitchVal = typeof rateOrPitch === "number" ? rateOrPitch : 1;
  } else {
    rate = typeof rateOrPitch === "number" ? rateOrPitch : 1;
    pitchVal = typeof pitch === "number" ? pitch : 1;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }
  const cleanText = text ? text.trim() : "";
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }
  const now = performance.now();
  // Prevent duplicate rapid repeat within 250ms
  if (cleanText === lastSpokenText && now - lastSpeakTime < 250) {
    if (onEnd) onEnd();
    return;
  }
  lastSpeakTime = now;
  lastSpokenText = cleanText;

  try {
    // Unblock any paused audio buffer
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Math.max(0.5, Math.min(2, rate));
    utterance.pitch = Math.max(0.5, Math.min(1.5, pitchVal));
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    const naturalVoice = getBestVoice();
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[Speech] Speech synthesis error:", err);
    if (onEnd) onEnd();
  }
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

class SpeechToSignListener {
  recognition = null;
  isListening = false;
  onResultCallback = null;
  onErrorCallback = null;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              finalTranscript += item[0].transcript;
            } else {
              interimTranscript += item[0].transcript;
            }
          }
          if (this.onResultCallback) {
            const combined = finalTranscript || interimTranscript;
            this.onResultCallback(combined, !!finalTranscript);
          }
        };

        this.recognition.onerror = (event) => {
          if (event.error !== "no-speech") {
            console.warn("Speech recognition warning:", event.error);
          }
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Ignore already started errors
            }
          }
        };
      }
    }
  }

  start(onResult, onError) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn("SpeechRecognition start note:", err);
      }
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
  }

  isSupported() {
    return !!this.recognition;
  }
}

export {
  SpeechToSignListener,
  speakText,
  stopSpeaking
};
