# Developer Integration & Custom Extension Guide

This guide highlights the exact files, functions, and comment anchors (`// [CUSTOM INTEGRATION POINT: ...]`) where you should plug in your real services, production credentials, and custom algorithms.

---

## 🗺️ Extension Map

| Feature / Subsystem | Location | What to plug in |
|---|---|---|
| **Real ML Hand Tracking** | `/src/utils/gestureSimulation.ts` | MediaPipe Hands (`@mediapipe/hands`) / TensorFlow.js gesture model |
| **Production WebRTC SFU** | `/src/components/LiveSessionCallView.tsx` | LiveKit, Agora, Twilio Video, or Daily.co client SDKs |
| **Real Cloud Firestore SDK** | `/src/utils/api.ts` | Firebase Client SDK (`firebase/firestore`, `firebase/auth`) |
| **Firestore Backend Sync** | `/server.ts` | Firebase Admin SDK (`firebase-admin`), Cloud Functions, Firestore queries |
| **Payment & Escrow (Stripe)** | `/server.ts` | Stripe PaymentIntents & Stripe Connect Instant Payouts API |
| **Reverse Sign 3D/Video Render** | `/src/components/LiveTranslateView.tsx` | Three.js 3D avatar rig or recorded sign gloss video dictionary |
| **Speech-to-Text / TTS Engine** | `/src/utils/speech.ts` | Deepgram, Whisper, Google Cloud Speech-to-Text / ElevenLabs |

---

## 1. Computer Vision & Hand Landmark Detection
**File:** `/src/utils/gestureSimulation.ts`
- **Anchor:** `// [CUSTOM INTEGRATION POINT: ML Hand Tracking Engine]`
- **Your Task:** Replace the lightweight simulated landmark generation with live MediaPipe Hands / TensorFlow.js tensor inference.

```typescript
// Example snippet to connect:
// const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
// hands.onResults((results) => {
//   const landmarks = results.multiHandLandmarks[0];
//   // Pass coordinates to drawHandSkeleton() and your gesture classifier
// });
```

---

## 2. Production WebRTC Video Calling & SFU
**File:** `/src/components/LiveSessionCallView.tsx`
- **Anchor:** `// [CUSTOM INTEGRATION POINT: WebRTC Media Stream & SFU Connection]`
- **Your Task:** Replace the simulated interpreter video loop with a real WebRTC PeerConnection or room provider token (e.g. LiveKit Room, Agora RTC, or Twilio Video).

```typescript
// Example LiveKit / WebRTC room connect:
// const room = new Room({ adaptiveStream: true, dynacast: true });
// await room.connect('wss://your-livekit-server.com', participantToken);
// room.on(RoomEvent.TrackSubscribed, (track) => {
//   if (track.kind === Track.Kind.Video) track.attach(remoteVideoElement);
// });
```

---

## 3. Database Persistence (Firebase Firestore)
**File:** `/src/utils/api.ts` & `/server.ts`
- **Anchor:** `// [CUSTOM INTEGRATION POINT: Firestore Database Integration]`
- **Your Task:** Replace the local Express in-memory storage arrays (`dbInterpreters`, `dbBookings`, `dbSessions`) with Firestore queries using `getDocs()`, `addDoc()`, and `onSnapshot()` following the schemas in `/firebase-blueprint.json` and `/firestore.rules`.

```typescript
// Example Firestore write:
// import { db } from './firebaseConfig';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// const docRef = await addDoc(collection(db, 'sessions'), {
//   userId: auth.currentUser.uid,
//   interpreterId: selectedInterpreterId,
//   type: 'on_demand_dispatch',
//   status: 'in_progress',
//   createdAt: serverTimestamp()
// });
```

---

## 4. Payment Gateway & Escrow Billing
**File:** `/server.ts`
- **Anchor:** `// [CUSTOM INTEGRATION POINT: Stripe Escrow & Instant Payouts]`
- **Your Task:** Initialize `new Stripe(process.env.STRIPE_SECRET_KEY)` to handle real card authorizations, pre-call holds, and instant transfers to interpreter Stripe Connect accounts.

---

## 5. Gemini 2.5 Multimodal Translation & Diarization
**File:** `/server.ts`
- **Anchor:** `// [CUSTOM INTEGRATION POINT: Gemini Multimodal Analysis]`
- **Your Task:** Expand the `/api/gemini/summarize-session` and `/api/gemini/translate-gesture` endpoints with your custom prompt templates, clinical terminology lexicons, or audio/video chunk streaming.
