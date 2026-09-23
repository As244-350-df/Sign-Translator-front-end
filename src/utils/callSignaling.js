import {
  deriveE2EEKey,
  encryptE2EE,
  decryptE2EE,
  computeSafetyFingerprint,
  SecurityValidator
} from "./security";

/**
 * Adaptive Video Resolution & Bandwidth Tiers
 */
export const ADAPTIVE_TIERS = {
  "1080p": { key: "1080p", label: "1080p FHD", width: 1920, height: 1080, maxBitrate: 3200000, scaleDown: 1.0, maxFps: 60 },
  "720p": { key: "720p", label: "720p HD", width: 1280, height: 720, maxBitrate: 1800000, scaleDown: 1.33, maxFps: 30 },
  "480p": { key: "480p", label: "480p Balanced", width: 854, height: 480, maxBitrate: 900000, scaleDown: 2.0, maxFps: 30 },
  "360p": { key: "360p", label: "360p Low-Data", width: 640, height: 360, maxBitrate: 450000, scaleDown: 2.8, maxFps: 24 },
  "240p": { key: "240p", label: "240p Eco / Audio", width: 426, height: 240, maxBitrate: 200000, scaleDown: 4.0, maxFps: 15 }
};

const TIER_ORDER = ["1080p", "720p", "480p", "360p", "240p"];

/**
 * Enterprise Multi-User WebRTC & WebSocket Signaling Engine
 * Provides dual-layer communication:
 * 1. Low-latency WebSocket signaling server for cross-device & network-wide connectivity.
 * 2. WebRTC Peer-to-Peer 60FPS audio/video streaming.
 * 3. Direct WebSocket video frame streaming fallback (guarantees peer video visibility
 *    under restrictive firewalls, cellular networks, or sandboxed iframes).
 * 4. Dual-direction Media Status synchronization (Microphone, Camera, Hand-Raise, Chat).
 * 5. Hardware-accelerated WebCrypto End-to-End Encryption (AES-GCM-256).
 * 6. Real-time WebRTC Performance Monitoring & Adaptive Resolution Controller.
 */

export class CallSignalingEngine {
  constructor(roomId = "default-call-room") {
    this.roomId = roomId;
    this.instanceId = `peer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.ws = null;
    this.broadcastChannel = null;
    this.peerConnection = null;
    this.localStream = null;
    this.onRemoteStream = null;
    this.onRemoteVideoFrame = null;
    this.onPeerStateChange = null;
    this.onPeerMediaStatus = null;
    this.onRemoteChatMessage = null;
    this.onRemoteHandRaise = null;
    this.onRemoteTranslatedMessage = null;

    this.role = "client"; // 'client' | 'interpreter'
    this.userInfo = {};
    this.mediaStatus = { isMuted: false, isCameraOff: false, isHandRaised: false };
    this.remotePeerId = null;
    this.remotePeerRole = null;
    this.remotePeerInfo = null;
    this.isConnected = false;
    this.isDestroyed = false;
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.pendingIceCandidates = [];
    this.remoteMediaStream = null;
    this.makingOffer = false;
    this.isPolite = false;

    // End-to-End Encryption (E2EE) State
    this.e2eeKey = null;
    this.safetyNumber = "----";
    this.e2eeActive = false;
    this.onE2EEStatusChange = null;

    // WebRTC Real-Time Performance Monitor & Adaptive Controller
    this.statsInterval = null;
    this.prevStatsSample = null;
    this.statsHistory = [];
    this.currentMetrics = {
      bitrateRecvKbps: 0,
      bitrateSentKbps: 0,
      fpsRecv: 0,
      fpsSent: 0,
      resolutionRecv: "1280x720",
      resolutionSent: "1280x720",
      jitterMs: 0,
      rttMs: 25,
      packetsLost: 0,
      packetLossPercentage: 0,
      videoCodec: "VP9",
      audioCodec: "Opus",
      health: "excellent",
      tier: "720p",
      tierConfig: ADAPTIVE_TIERS["720p"],
      qualityMode: "auto",
      adaptationReason: "Optimal initial stream configuration"
    };
    this.qualityMode = "auto";
    this.currentQualityTier = "720p";
    this.degradeStreak = 0;
    this.healthyStreak = 0;
    this.onStatsUpdate = null;
    this.onQualityTierChange = null;
    this.onSecurityAlert = null;

    this.initE2EE();
    this.initBroadcastChannel();
    this.connectWebSocket();
  }

  async initE2EE() {
    try {
      this.e2eeKey = await deriveE2EEKey(this.roomId);
      this.safetyNumber = await computeSafetyFingerprint(this.roomId);
      this.e2eeActive = true;
      if (this.onE2EEStatusChange) {
        this.onE2EEStatusChange({
          active: true,
          safetyNumber: this.safetyNumber
        });
      }
    } catch (err) {
      console.warn("[Signaling E2EE] Key derivation error:", err);
    }
  }

  initBroadcastChannel() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`signlink-${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => this.handleMessage(event.data, "broadcast");
      } catch (err) {
        console.warn("[Signaling] BroadcastChannel init notice:", err);
      }
    }
  }

  connectWebSocket() {
    if (typeof window === "undefined" || this.isDestroyed) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/call`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isDestroyed) {
          this.ws.close();
          return;
        }
        this.reconnectAttempts = 0;
        console.log(`[Signaling WS] Connected to ${wsUrl} for room ${this.roomId}`);

        // Join room immediately on open
        this.sendMessage({
          type: "JOIN_ROOM",
          roomId: this.roomId,
          senderId: this.instanceId,
          role: this.role,
          userInfo: this.userInfo,
          mediaStatus: this.mediaStatus
        });

        // Setup ping/pong heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data, "websocket");
        } catch (e) {
          console.warn("[Signaling WS] Non-JSON payload received:", e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[Signaling WS] Connection event:", err?.message || err);
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (!this.isDestroyed) {
          // Reconnect with exponential backoff
          const attempts = this.reconnectAttempts || 0;
          const delay = Math.min(10000, 1200 * Math.pow(1.5, attempts));
          this.reconnectAttempts = attempts + 1;
          this.reconnectTimer = setTimeout(() => {
            if (!this.isDestroyed) {
              console.log(`[Signaling WS] Attempting reconnection (attempt ${this.reconnectAttempts})...`);
              this.connectWebSocket();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.warn("[Signaling WS] WebSocket initialization failed:", err);
    }
  }

  sendMessage(payload) {
    const enriched = {
      ...payload,
      senderId: this.instanceId,
      roomId: this.roomId,
      timestamp: Date.now()
    };
    const jsonStr = JSON.stringify(enriched);

    // Primary: WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(jsonStr);
      } catch (err) {
        console.warn("[Signaling] WS send error:", err);
      }
    }

    // Secondary local fallback: BroadcastChannel (for cross-tab tests on same device)
    if (this.broadcastChannel && payload.type !== "VIDEO_FRAME") {
      try {
        this.broadcastChannel.postMessage(enriched);
      } catch (e) {}
    }
  }

  setStreams(localStream, onRemoteStream, onPeerStateChange, onRemoteVideoFrame) {
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
    this.onPeerStateChange = onPeerStateChange;
    if (onRemoteVideoFrame) {
      this.onRemoteVideoFrame = onRemoteVideoFrame;
    }
  }

  updateLocalStream(newStream) {
    this.localStream = newStream;
    if (this.peerConnection && newStream) {
      try {
        const senders = this.peerConnection.getSenders();
        newStream.getTracks().forEach((track) => {
          const sender = senders.find((s) => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch((err) =>
              console.warn("[Signaling WebRTC] replaceTrack notice:", err)
            );
          } else {
            try {
              this.peerConnection.addTrack(track, newStream);
            } catch (e) {}
          }
        });
      } catch (err) {
        console.warn("[Signaling WebRTC] updateLocalStream notice:", err);
      }
    } else if (!this.peerConnection && newStream && (this.remotePeerId || this.remotePeerRole)) {
      this.startWebRTC(true);
    }
  }

  announcePresence(role = "client", userInfo = {}, mediaStatus = {}) {
    this.role = role;
    this.userInfo = userInfo;
    this.mediaStatus = { ...this.mediaStatus, ...mediaStatus };

    this.sendMessage({
      type: "JOIN_ROOM",
      role: this.role,
      userInfo: this.userInfo,
      mediaStatus: this.mediaStatus
    });
  }

  sendMediaStatus(mediaStatusUpdates) {
    this.mediaStatus = { ...this.mediaStatus, ...mediaStatusUpdates };
    this.sendMessage({
      type: "MEDIA_STATUS",
      mediaStatus: this.mediaStatus
    });
  }

  sendVideoFrame(base64Frame) {
    if (!base64Frame || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(
        JSON.stringify({
          type: "VIDEO_FRAME",
          roomId: this.roomId,
          senderId: this.instanceId,
          role: this.role,
          frame: base64Frame,
          timestamp: Date.now()
        })
      );
    } catch (e) {}
  }

  async sendChatMessage(messageText) {
    const cleanText = SecurityValidator.sanitizeText(messageText, 1500);
    if (!cleanText) return;

    let payloadMessage = cleanText;
    let isEncrypted = false;
    if (this.e2eeKey) {
      try {
        payloadMessage = await encryptE2EE(cleanText, this.e2eeKey);
        isEncrypted = true;
      } catch (e) {
        console.warn("[E2EE] Fallback to plaintext for chat message:", e);
      }
    }

    this.sendMessage({
      type: "CHAT_MESSAGE",
      message: payloadMessage,
      isEncrypted,
      senderName: this.userInfo?.name || (this.role === "interpreter" ? "Elena Rostova" : "Alex Morgan")
    });
  }

  async sendTranslatedMessage(payload) {
    const rawText = typeof payload === "string" ? payload : payload.text;
    const cleanText = SecurityValidator.sanitizeText(rawText, 1500);
    if (!cleanText) return;

    let payloadText = cleanText;
    let isEncrypted = false;
    if (this.e2eeKey) {
      try {
        payloadText = await encryptE2EE(cleanText, this.e2eeKey);
        isEncrypted = true;
      } catch (e) {
        console.warn("[E2EE] Fallback to plaintext for translation:", e);
      }
    }

    this.sendMessage({
      type: "TRANSLATED_MESSAGE",
      text: payloadText,
      symbol: payload.symbol || "",
      signLanguage: payload.signLanguage || "ASL",
      confidence: payload.confidence || 0.98,
      isAi: !!payload.isAi,
      isEncrypted,
      senderName: this.userInfo?.name || (this.role === "interpreter" ? "Elena Rostova" : "Alex Morgan")
    });
  }

  sendHandRaise(isRaised) {
    this.mediaStatus.isHandRaised = isRaised;
    this.sendMessage({
      type: "HAND_RAISE",
      isHandRaised: isRaised
    });
  }

  async handleMessage(data, source = "websocket") {
    if (!data || data.senderId === this.instanceId) return;

    switch (data.type) {
      case "ROOM_PEERS": {
        // We received the list of existing peers in the room
        if (data.peers && data.peers.length > 0) {
          const peer = data.peers[0];
          this.remotePeerId = peer.senderId;
          this.remotePeerRole = peer.role;
          this.remotePeerInfo = peer.userInfo;
          this.isPolite = this.instanceId > peer.senderId;

          if (this.onPeerStateChange) {
            this.onPeerStateChange({
              status: "detected",
              peerRole: peer.role,
              peerInfo: peer.userInfo,
              mediaStatus: peer.mediaStatus,
              transport: source,
              expiresAt: data.expiresAt
            });
          }

          if (peer.mediaStatus && this.onPeerMediaStatus) {
            this.onPeerMediaStatus(peer.mediaStatus);
          }

          // As the newcomer, initiate WebRTC offer
          if (this.localStream) {
            this.startWebRTC(true);
          }
        }
        break;
      }

      case "PEER_JOINED": {
        const peer = data.peer;
        if (!peer) break;
        this.remotePeerId = peer.senderId;
        this.remotePeerRole = peer.role;
        this.remotePeerInfo = peer.userInfo;
        this.isPolite = this.instanceId > peer.senderId;

        if (this.onPeerStateChange) {
          this.onPeerStateChange({
            status: "detected",
            peerRole: peer.role,
            peerInfo: peer.userInfo,
            mediaStatus: peer.mediaStatus,
            transport: source
          });
        }

        if (peer.mediaStatus && this.onPeerMediaStatus) {
          this.onPeerMediaStatus(peer.mediaStatus);
        }

        // If newcomer hasn't initiated after 1s and we are impolite, initiate offer
        if (this.localStream && !this.peerConnection && !this.isPolite) {
          setTimeout(() => {
            if (!this.peerConnection && !this.isConnected) {
              this.startWebRTC(true);
            }
          }, 800);
        }
        break;
      }

      case "VIDEO_FRAME": {
        // Direct WebSocket video frame from remote peer
        if (data.frame && this.onRemoteVideoFrame) {
          this.onRemoteVideoFrame(data.frame, {
            senderId: data.senderId,
            role: data.role,
            timestamp: data.timestamp
          });
        }
        break;
      }

      case "PEER_MEDIA_STATUS": {
        if (data.mediaStatus && this.onPeerMediaStatus) {
          this.onPeerMediaStatus(data.mediaStatus);
        }
        break;
      }

      case "CHAT_MESSAGE": {
        let msgText = data.message;
        if (data.isEncrypted && this.e2eeKey) {
          try {
            msgText = await decryptE2EE(msgText, this.e2eeKey);
          } catch (e) {
            console.warn("[E2EE] Could not decrypt chat message:", e);
          }
        }
        if (this.onRemoteChatMessage) {
          this.onRemoteChatMessage(
            {
              text: msgText,
              senderName: data.senderName,
              senderId: data.senderId,
              isEncrypted: !!data.isEncrypted
            },
            data.senderId
          );
        }
        break;
      }

      case "TRANSLATED_MESSAGE": {
        let transText = data.text;
        if (data.isEncrypted && this.e2eeKey) {
          try {
            transText = await decryptE2EE(transText, this.e2eeKey);
          } catch (e) {
            console.warn("[E2EE] Could not decrypt translated text:", e);
          }
        }
        const cleanPayload = { ...data, text: transText };
        if (this.onRemoteTranslatedMessage) {
          this.onRemoteTranslatedMessage(cleanPayload, data.senderId);
        } else if (this.onRemoteChatMessage) {
          this.onRemoteChatMessage(
            {
              text: data.symbol ? `${data.symbol} ${transText}` : transText,
              senderName: data.senderName,
              isTranslated: true,
              isEncrypted: !!data.isEncrypted,
              symbol: data.symbol,
              confidence: data.confidence,
              isAi: data.isAi,
              signLanguage: data.signLanguage
            },
            data.senderId
          );
        }
        break;
      }

      case "HAND_RAISE": {
        if (this.onRemoteHandRaise) {
          this.onRemoteHandRaise(data.isHandRaised, data.senderId);
        }
        break;
      }

      case "ERROR": {
        console.warn("[Signaling Security Alert]", data.code, data.message);
        if (this.onSecurityAlert) {
          this.onSecurityAlert({ code: data.code, message: data.message });
        }
        break;
      }

      case "RATE_LIMITED": {
        console.warn("[Signaling Security] Flood protection trigger:", data.message);
        if (this.onSecurityAlert) {
          this.onSecurityAlert({ code: "RATE_LIMITED", message: data.message });
        }
        break;
      }

      case "WEBRTC_OFFER": {
        if (data.offer) {
          await this.handleOffer(data.offer);
        }
        break;
      }

      case "WEBRTC_ANSWER": {
        if (data.answer) {
          await this.handleAnswer(data.answer);
        }
        break;
      }

      case "WEBRTC_ICE": {
        if (data.candidate) {
          await this.handleIceCandidate(data.candidate);
        }
        break;
      }

      case "PEER_LEFT": {
        this.closePeerConnection();
        if (this.onPeerStateChange) {
          this.onPeerStateChange({
            status: "disconnected",
            peerRole: data.role
          });
        }
        break;
      }

      default:
        break;
    }
  }

  async startWebRTC(isInitiator = false) {
    if (this.peerConnection) return;

    try {
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun.services.mozilla.com" }
        ],
        iceCandidatePoolSize: 4
      };

      const pc = new RTCPeerConnection(config);
      this.peerConnection = pc;

      // Add local media tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, this.localStream);
          } catch (e) {
            console.warn("[Signaling WebRTC] Could not add track:", e);
          }
        });
      }

      // Incoming remote stream tracks - robust aggregation for modern browsers
      pc.ontrack = (event) => {
        if (!this.remoteMediaStream) {
          this.remoteMediaStream = new MediaStream();
        }

        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            if (!this.remoteMediaStream.getTracks().some((t) => t.id === track.id)) {
              this.remoteMediaStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!this.remoteMediaStream.getTracks().some((t) => t.id === event.track.id)) {
            this.remoteMediaStream.addTrack(event.track);
          }
        }

        this.isConnected = true;
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteMediaStream);
        }
        if (this.onPeerStateChange) {
          this.onPeerStateChange({
            status: "connected",
            peerRole: this.remotePeerRole,
            peerInfo: this.remotePeerInfo,
            transport: "webrtc"
          });
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: "WEBRTC_ICE",
            candidate: event.candidate
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          this.isConnected = true;
          this.iceRestartRetries = 0;
          if (this.iceRestartTimer) {
            clearTimeout(this.iceRestartTimer);
            this.iceRestartTimer = null;
          }
          this.startStatsMonitoring(1500);
          if (this.onPeerStateChange) {
            this.onPeerStateChange({
              status: "connected",
              peerRole: this.remotePeerRole,
              peerInfo: this.remotePeerInfo,
              transport: "webrtc"
            });
          }
        } else if (pc.connectionState === "disconnected") {
          console.warn("[Signaling WebRTC] Peer connection disconnected, waiting for transient network recovery...");
        } else if (pc.connectionState === "failed") {
          console.warn("[Signaling WebRTC] Peer connection failed. Triggering ICE restart...");
          this.isConnected = false;
          this.stopStatsMonitoring();
          this.triggerIceRestart();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") {
          console.warn("[Signaling WebRTC] ICE connection state: failed. Triggering ICE restart...");
          this.triggerIceRestart();
        }
      };

      if (isInitiator) {
        this.makingOffer = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        this.makingOffer = false;
        this.sendMessage({
          type: "WEBRTC_OFFER",
          offer
        });
      }
    } catch (err) {
      this.makingOffer = false;
      console.warn("[Signaling WebRTC] Setup notice:", err?.message || err);
    }
  }

  async drainPendingIceCandidates() {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;
    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[Signaling WebRTC] Buffered ICE candidate notice:", err);
      }
    }
  }

  async handleOffer(offer) {
    if (!this.peerConnection) {
      await this.startWebRTC(false);
    }
    const pc = this.peerConnection;
    if (!pc) return;

    try {
      const isCollision = this.makingOffer || (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer");
      if (isCollision) {
        if (!this.isPolite) {
          console.log("[Signaling WebRTC] Glare collision: impolite peer discarding offer.");
          return;
        }
        await Promise.all([
          pc.setLocalDescription({ type: "rollback" }),
          pc.setRemoteDescription(new RTCSessionDescription(offer))
        ]);
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      }

      await this.drainPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.sendMessage({
        type: "WEBRTC_ANSWER",
        answer
      });
    } catch (err) {
      console.warn("[Signaling WebRTC] Error handling offer:", err);
    }
  }

  async handleAnswer(answer) {
    const pc = this.peerConnection;
    if (!pc) return;
    try {
      if (pc.signalingState === "have-local-offer" || pc.signalingState === "have-remote-pranswer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await this.drainPendingIceCandidates();
      }
    } catch (err) {
      console.warn("[Signaling WebRTC] Error handling answer:", err);
    }
  }

  async handleIceCandidate(candidate) {
    const pc = this.peerConnection;
    if (!pc || !pc.remoteDescription) {
      if (candidate) {
        this.pendingIceCandidates.push(candidate);
      }
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[Signaling WebRTC] Error adding ICE candidate:", err);
    }
  }

  startStatsMonitoring(intervalMs = 1500) {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.statsInterval = setInterval(async () => {
      await this.collectPeerStats();
    }, intervalMs);
    // Initial run
    setTimeout(() => this.collectPeerStats(), 400);
  }

  stopStatsMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    this.prevStatsSample = null;
  }

  async collectPeerStats() {
    if (!this.peerConnection || this.isDestroyed) return;
    try {
      const stats = await this.peerConnection.getStats();
      const now = Date.now();
      let bytesRecv = 0;
      let bytesSent = 0;
      let framesDecoded = 0;
      let framesSent = 0;
      let frameWidthRecv = 0;
      let frameHeightRecv = 0;
      let frameWidthSent = 0;
      let frameHeightSent = 0;
      let jitter = 0;
      let rtt = 25;
      let packetsLost = 0;
      let packetsReceived = 0;
      let videoCodec = "VP9";
      let audioCodec = "Opus";

      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          bytesRecv += report.bytesReceived || 0;
          framesDecoded += report.framesDecoded || 0;
          packetsLost += report.packetsLost || 0;
          packetsReceived += report.packetsReceived || 0;
          if (report.frameWidth) frameWidthRecv = report.frameWidth;
          if (report.frameHeight) frameHeightRecv = report.frameHeight;
          if (report.jitter !== undefined) jitter = report.jitter * 1000;
        } else if (report.type === "outbound-rtp" && report.kind === "video") {
          bytesSent += report.bytesSent || 0;
          framesSent += report.framesSent || 0;
          if (report.frameWidth) frameWidthSent = report.frameWidth;
          if (report.frameHeight) frameHeightSent = report.frameHeight;
        } else if (report.type === "candidate-pair" && (report.state === "succeeded" || report.nominated)) {
          if (report.currentRoundTripTime !== undefined) {
            rtt = Math.round(report.currentRoundTripTime * 1000);
          }
        } else if (report.type === "codec") {
          if (report.mimeType?.toLowerCase().includes("video")) {
            videoCodec = report.mimeType.replace(/^video\//i, "").toUpperCase();
          } else if (report.mimeType?.toLowerCase().includes("audio")) {
            audioCodec = report.mimeType.replace(/^audio\//i, "").toUpperCase();
          }
        }
      });

      let bitrateRecvKbps = 0;
      let bitrateSentKbps = 0;
      let fpsRecv = 0;
      let fpsSent = 0;

      if (this.prevStatsSample) {
        const timeDiffSec = (now - this.prevStatsSample.timestamp) / 1000;
        if (timeDiffSec > 0) {
          bitrateRecvKbps = Math.round(((bytesRecv - this.prevStatsSample.bytesRecv) * 8) / (timeDiffSec * 1000));
          bitrateSentKbps = Math.round(((bytesSent - this.prevStatsSample.bytesSent) * 8) / (timeDiffSec * 1000));
          fpsRecv = Math.round((framesDecoded - this.prevStatsSample.framesDecoded) / timeDiffSec);
          fpsSent = Math.round((framesSent - this.prevStatsSample.framesSent) / timeDiffSec);
        }
      }

      this.prevStatsSample = {
        timestamp: now,
        bytesRecv,
        bytesSent,
        framesDecoded,
        framesSent
      };

      const totalPackets = packetsLost + packetsReceived;
      const packetLossPercentage = totalPackets > 0 ? Math.min(100, Math.round((packetsLost / totalPackets) * 1000) / 10) : 0;

      // Calculate connection health
      let health = "excellent";
      if (packetLossPercentage > 7 || rtt > 320) {
        health = "poor";
      } else if (packetLossPercentage > 2.5 || rtt > 180 || jitter > 60) {
        health = "fair";
      } else if (packetLossPercentage > 0.8 || rtt > 95) {
        health = "good";
      }

      // Adaptive Resolution Logic
      if (this.qualityMode === "auto") {
        const currentIdx = TIER_ORDER.indexOf(this.currentQualityTier);
        if (packetLossPercentage > 4.0 || rtt > 260 || jitter > 60) {
          this.degradeStreak++;
          this.healthyStreak = 0;
          if (this.degradeStreak >= 2 && currentIdx < TIER_ORDER.length - 1) {
            const nextTier = TIER_ORDER[currentIdx + 1];
            this.applyQualityTier(nextTier, `Network congestion detected (loss: ${packetLossPercentage}%, RTT: ${rtt}ms)`);
            this.degradeStreak = 0;
          }
        } else if (packetLossPercentage <= 0.8 && rtt < 120 && jitter < 30) {
          this.healthyStreak++;
          this.degradeStreak = 0;
          if (this.healthyStreak >= 4 && currentIdx > 0) {
            const prevTier = TIER_ORDER[currentIdx - 1];
            this.applyQualityTier(prevTier, `Network conditions stable and clear (RTT: ${rtt}ms)`);
            this.healthyStreak = 0;
          }
        }
      }

      const activeConfig = ADAPTIVE_TIERS[this.currentQualityTier] || ADAPTIVE_TIERS["720p"];
      const metrics = {
        bitrateRecvKbps: Math.max(0, bitrateRecvKbps),
        bitrateSentKbps: Math.max(0, bitrateSentKbps),
        fpsRecv: Math.max(0, fpsRecv),
        fpsSent: Math.max(0, fpsSent),
        resolutionRecv: frameWidthRecv && frameHeightRecv ? `${frameWidthRecv}x${frameHeightRecv}` : `${activeConfig.width}x${activeConfig.height}`,
        resolutionSent: frameWidthSent && frameHeightSent ? `${frameWidthSent}x${frameHeightSent}` : `${activeConfig.width}x${activeConfig.height}`,
        jitterMs: Math.round(jitter),
        rttMs: Math.max(1, rtt),
        packetsLost,
        packetLossPercentage,
        videoCodec,
        audioCodec,
        health,
        tier: this.currentQualityTier,
        tierConfig: activeConfig,
        qualityMode: this.qualityMode,
        safetyNumber: this.safetyNumber,
        e2eeActive: !!this.e2eeKey
      };

      this.currentMetrics = metrics;
      this.statsHistory.push({
        time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        bitrate: bitrateRecvKbps || bitrateSentKbps || 1200,
        fps: fpsRecv || fpsSent || 30,
        rtt: rtt || 25,
        loss: packetLossPercentage
      });
      if (this.statsHistory.length > 25) {
        this.statsHistory.shift();
      }

      if (this.onStatsUpdate) {
        this.onStatsUpdate(metrics, this.statsHistory);
      }
    } catch (err) {
      console.warn("[Signaling Stats] Collection warning:", err?.message);
    }
  }

  async setQualityMode(mode, manualTier = null) {
    this.qualityMode = mode === "manual" ? "manual" : "auto";
    if (manualTier && ADAPTIVE_TIERS[manualTier]) {
      await this.applyQualityTier(manualTier, "User manual quality override");
    } else if (mode === "auto") {
      this.degradeStreak = 0;
      this.healthyStreak = 0;
    }
  }

  async applyQualityTier(tierKey, reason = "") {
    if (!ADAPTIVE_TIERS[tierKey]) return;
    this.currentQualityTier = tierKey;
    const config = ADAPTIVE_TIERS[tierKey];
    console.log(`[Signaling Adaptive] Switching to tier ${tierKey} (${config.label}) - ${reason}`);

    if (this.peerConnection) {
      try {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          const params = videoSender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].scaleResolutionDownBy = config.scaleDown;
          params.encodings[0].maxBitrate = config.maxBitrate;
          params.encodings[0].maxFramerate = config.maxFps;
          await videoSender.setParameters(params);
        }
      } catch (err) {
        console.warn("[Signaling Adaptive] setParameters warning:", err);
      }
    }

    if (this.onQualityTierChange) {
      this.onQualityTierChange(tierKey, reason, config);
    }
  }

  async triggerIceRestart() {
    if (this.isDestroyed || !this.peerConnection) return;
    if ((this.iceRestartRetries || 0) >= 3) {
      console.warn("[Signaling WebRTC] Max ICE restart attempts reached, switching to websocket fallback.");
      if (this.onPeerStateChange) {
        this.onPeerStateChange({
          status: "degraded",
          transport: "websocket_fallback"
        });
      }
      return;
    }

    this.iceRestartRetries = (this.iceRestartRetries || 0) + 1;
    const backoffMs = Math.min(6000, 1000 * Math.pow(1.8, this.iceRestartRetries - 1));

    if (this.iceRestartTimer) clearTimeout(this.iceRestartTimer);
    this.iceRestartTimer = setTimeout(async () => {
      if (this.isDestroyed || !this.peerConnection) return;
      try {
        console.log(`[Signaling WebRTC] Attempting ICE restart (attempt ${this.iceRestartRetries})...`);
        if (typeof this.peerConnection.restartIce === "function") {
          this.peerConnection.restartIce();
        }
        if (!this.isPolite) {
          this.makingOffer = true;
          const offer = await this.peerConnection.createOffer({
            iceRestart: true,
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          await this.peerConnection.setLocalDescription(offer);
          this.makingOffer = false;
          this.sendMessage({
            type: "WEBRTC_OFFER",
            offer
          });
        }
      } catch (err) {
        console.warn("[Signaling WebRTC] ICE restart attempt error:", err);
        this.closePeerConnection();
        if (this.localStream && (this.remotePeerId || this.remotePeerRole)) {
          this.startWebRTC(!this.isPolite);
        }
      }
    }, backoffMs);
  }

  closePeerConnection() {
    if (this.iceRestartTimer) {
      clearTimeout(this.iceRestartTimer);
      this.iceRestartTimer = null;
    }
    this.stopStatsMonitoring();
    this.pendingIceCandidates = [];
    if (this.remoteMediaStream) {
      try {
        this.remoteMediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.remoteMediaStream = null;
    }
    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    this.isConnected = false;
  }

  destroy() {
    this.isDestroyed = true;
    this.stopStatsMonitoring();
    if (this.iceRestartTimer) {
      clearTimeout(this.iceRestartTimer);
      this.iceRestartTimer = null;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);

    try {
      this.sendMessage({
        type: "LEAVE_ROOM",
        role: this.role
      });
    } catch {}

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    this.closePeerConnection();

    // Detach callbacks to free closures from memory
    this.onRemoteStream = null;
    this.onRemoteVideoFrame = null;
    this.onPeerStateChange = null;
    this.onPeerMediaStatus = null;
    this.onRemoteChatMessage = null;
    this.onRemoteHandRaise = null;
    this.onRemoteTranslatedMessage = null;
    this.onStatsUpdate = null;
    this.onQualityTierChange = null;
    this.onSecurityAlert = null;
    this.onE2EEStatusChange = null;
  }
}
