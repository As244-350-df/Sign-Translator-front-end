/**
 * Enterprise Multi-User WebRTC & WebSocket Signaling Engine
 * Provides dual-layer communication:
 * 1. Low-latency WebSocket signaling server for cross-device & network-wide connectivity.
 * 2. WebRTC Peer-to-Peer 60FPS audio/video streaming.
 * 3. Direct WebSocket video frame streaming fallback (guarantees peer video visibility
 *    under restrictive firewalls, cellular networks, or sandboxed iframes).
 * 4. Dual-direction Media Status synchronization (Microphone, Camera, Hand-Raise, Chat).
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

    this.initBroadcastChannel();
    this.connectWebSocket();
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
          // Reconnect with backoff
          this.reconnectTimer = setTimeout(() => {
            if (!this.isDestroyed) {
              console.log("[Signaling WS] Attempting reconnection...");
              this.connectWebSocket();
            }
          }, 2500);
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

  sendChatMessage(messageText) {
    this.sendMessage({
      type: "CHAT_MESSAGE",
      message: messageText,
      senderName: this.userInfo?.name || (this.localRole === "interpreter" ? "Elena Rostova" : "Alex Morgan")
    });
  }

  sendTranslatedMessage(payload) {
    this.sendMessage({
      type: "TRANSLATED_MESSAGE",
      text: typeof payload === "string" ? payload : payload.text,
      symbol: payload.symbol || "",
      signLanguage: payload.signLanguage || "ASL",
      confidence: payload.confidence || 0.98,
      isAi: !!payload.isAi,
      senderName: this.userInfo?.name || (this.localRole === "interpreter" ? "Elena Rostova" : "Alex Morgan")
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

          // As the newcomer, start WebRTC offer to existing peer
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

        // We are existing peer; if newcomer didn't initiate within 1.5s, initiate offer
        if (this.localStream && !this.peerConnection) {
          setTimeout(() => {
            if (!this.peerConnection && !this.isConnected) {
              this.startWebRTC(true);
            }
          }, 1500);
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
        if (data.message && this.onRemoteChatMessage) {
          this.onRemoteChatMessage(
            {
              text: data.message,
              senderName: data.senderName,
              senderId: data.senderId
            },
            data.senderId
          );
        }
        break;
      }

      case "TRANSLATED_MESSAGE": {
        if (this.onRemoteTranslatedMessage) {
          this.onRemoteTranslatedMessage(data, data.senderId);
        } else if (this.onRemoteChatMessage) {
          this.onRemoteChatMessage(
            {
              text: data.symbol ? `${data.symbol} ${data.text}` : data.text,
              senderName: data.senderName,
              isTranslated: true,
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
          { urls: "stun:stun2.l.google.com:19302" }
        ]
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

      // Incoming remote stream tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream && this.onRemoteStream) {
          this.isConnected = true;
          this.onRemoteStream(remoteStream);
          if (this.onPeerStateChange) {
            this.onPeerStateChange({
              status: "connected",
              peerRole: this.remotePeerRole,
              peerInfo: this.remotePeerInfo,
              transport: "webrtc"
            });
          }
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
          if (this.onPeerStateChange) {
            this.onPeerStateChange({
              status: "connected",
              peerRole: this.remotePeerRole,
              peerInfo: this.remotePeerInfo,
              transport: "webrtc"
            });
          }
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          this.isConnected = false;
          if (this.onPeerStateChange) {
            this.onPeerStateChange({
              status: "degraded",
              transport: "websocket_fallback"
            });
          }
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        this.sendMessage({
          type: "WEBRTC_OFFER",
          offer
        });
      }
    } catch (err) {
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
        console.warn("[Signaling WebRTC] Buffered ICE candidate add notice:", err);
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
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
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
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.drainPendingIceCandidates();
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

  closePeerConnection() {
    this.pendingIceCandidates = [];
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
  }
}
