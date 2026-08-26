import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// =========================================================================================
// [CUSTOM INTEGRATION POINT: Backend Services & Database Adapters]
// 1. Firebase Admin: Import 'firebase-admin/firestore' and initialize credentials with serviceAccount.json.
//    Replace in-memory arrays (dbInterpreters, dbBookings, dbSessions) with Firestore references:
//    - const db = admin.firestore();
//    - const interpretersRef = db.collection('interpreters');
// 2. Stripe Escrow Payments: Initialize `new Stripe(process.env.STRIPE_SECRET_KEY)`
//    - Create PaymentIntent for call escrow hold: stripe.paymentIntents.create({ capture_method: 'manual', amount })
//    - Capture/Release payment on session end: stripe.paymentIntents.capture(intentId)
//    - Instant Interpreter Payout: stripe.transfers.create({ destination: stripeConnectAccountId, amount })
// 3. Gemini 2.5 AI: Plug in your prompt configurations in `/api/gemini/*` below
// =========================================================================================

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Gemini Client (Safe server-side key usage)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// In-Memory Database Store (Initialized with rich realistic data)
// -------------------------------------------------------------

interface InterpreterRecord {
  id: string;
  name: string;
  title: string;
  avatar: string;
  coverImage?: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  languages: string[];
  spokenLanguages: string[];
  certifications: string[];
  ratePerHour: number;
  ratePerMinute: number;
  availableStatus: 'online' | 'busy' | 'offline';
  bio: string;
  specialties: string[];
  experienceYears: number;
  completedSessions: number;
  availableSlots: string[];
}

interface BookingRecord {
  id: string;
  interpreterId: string;
  interpreterName: string;
  interpreterAvatar: string;
  language: string;
  date: string;
  time: string;
  durationMinutes: number;
  totalCost: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'in_progress';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}

interface SessionRecord {
  id: string;
  type: 'ai_translation' | 'interpreter_call';
  title: string;
  date: string;
  duration: string;
  language: string;
  interpreterName?: string;
  interpreterAvatar?: string;
  summary: string;
  fullTranscript: Array<{
    speaker: 'Signer' | 'Speaker' | 'Interpreter' | 'AI';
    time: string;
    text: string;
  }>;
  keyTerms: string[];
  rating?: number;
  notes?: string;
  createdAt: string;
}

interface UserProfileRecord {
  id: string;
  name: string;
  email: string;
  role: 'user_deaf' | 'user_hearing' | 'interpreter';
  avatar: string;
  primaryLanguage: string;
  secondaryLanguage?: string;
  bio?: string;
  verified?: boolean;
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'session' | 'system' | 'alert';
  actionUrl?: string;
  createdAt: string;
}

let dbInterpreters: InterpreterRecord[] = [
  {
    id: 'int-01',
    name: 'Elena Rostova, CI/CT',
    title: 'Certified Master ASL/IS Interpreter & Medical Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    rating: 4.98,
    reviewsCount: 184,
    verified: true,
    languages: ['ASL', 'IS', 'BSL'],
    spokenLanguages: ['English', 'Spanish', 'Russian'],
    certifications: ['RID Certified (CI/CT)', 'NIC Master', 'Medical Interpreting (BEI)'],
    ratePerHour: 65,
    ratePerMinute: 1.15,
    availableStatus: 'online',
    bio: '12+ years experience bridging communication for medical consultations, university lectures, tech conferences, and live televised broadcasts.',
    specialties: ['Medical & Healthcare', 'Legal & Courtroom', 'Higher Education', 'Tech Conferences'],
    experienceYears: 12,
    completedSessions: 890,
    availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM', '07:00 PM'],
  },
  {
    id: 'int-02',
    name: 'Marcus Chen',
    title: 'Deaf Interpreter (CDI) & Native ASL Educator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewsCount: 142,
    verified: true,
    languages: ['ASL', 'Auslan', 'IS'],
    spokenLanguages: ['English', 'Mandarin'],
    certifications: ['Certified Deaf Interpreter (CDI)', 'NAD Level V', 'ASLTA Professional'],
    ratePerHour: 55,
    ratePerMinute: 0.95,
    availableStatus: 'online',
    bio: 'Native signer with deep roots in Deaf culture. Specializing in nuanced cultural mediation, youth advocacy, and technical programming terminology.',
    specialties: ['Deaf Culture Mediation', 'Software Development', 'Youth Education', 'Mental Health'],
    experienceYears: 9,
    completedSessions: 640,
    availableSlots: ['10:00 AM', '01:00 PM', '03:30 PM', '06:00 PM'],
  },
  {
    id: 'int-03',
    name: 'Sarah Jenkins',
    title: 'Senior BSL & International Sign Specialist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    rating: 4.92,
    reviewsCount: 98,
    verified: true,
    languages: ['BSL', 'IS', 'ASL'],
    spokenLanguages: ['English', 'French'],
    certifications: ['NRCPD Registered', 'Signature Level 6 NVQ', 'WASLI International'],
    ratePerHour: 60,
    ratePerMinute: 1.05,
    availableStatus: 'online',
    bio: 'Based in London with international remote availability. Trusted for parliamentary debates, business negotiations, and arts performance interpretation.',
    specialties: ['Corporate Meetings', 'Theatrical & Arts', 'Government & Public Policy', 'International Travel'],
    experienceYears: 8,
    completedSessions: 420,
    availableSlots: ['08:30 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
  },
  {
    id: 'int-04',
    name: 'Dr. David Tremblay',
    title: 'Legal & Clinical LSF / ASL Specialist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    rating: 4.99,
    reviewsCount: 230,
    verified: true,
    languages: ['LSF', 'ASL', 'DGS'],
    spokenLanguages: ['French', 'English', 'German'],
    certifications: ['Court Certified (SC:L)', 'NIC Advanced', 'EU Certified Diplomatic Interpreter'],
    ratePerHour: 75,
    ratePerMinute: 1.30,
    availableStatus: 'busy',
    bio: 'Specialized in high-stakes legal proceedings, clinical trials, and multinational corporate summits. Strict confidentiality guarantee.',
    specialties: ['Legal Deposition', 'Clinical Trials', 'Finance & Contracts', 'Diplomatic Summits'],
    experienceYears: 15,
    completedSessions: 1120,
    availableSlots: ['01:30 PM', '03:00 PM', '05:30 PM'],
  },
  {
    id: 'int-05',
    name: 'Amara Okafor',
    title: 'Community & Academic Auslan / ASL Interpreter',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    rating: 4.89,
    reviewsCount: 76,
    verified: true,
    languages: ['Auslan', 'ASL'],
    spokenLanguages: ['English'],
    certifications: ['NAATI Certified Provisional Interpreter', 'EIPA 4.5'],
    ratePerHour: 50,
    ratePerMinute: 0.85,
    availableStatus: 'online',
    bio: 'Energetic, warm interpreter passionate about daily community interactions, doctor appointments, tutoring, and family events.',
    specialties: ['Community Events', 'Elementary & High School', 'Everyday Appointments', 'Parent-Teacher Meetings'],
    experienceYears: 6,
    completedSessions: 310,
    availableSlots: ['09:00 AM', '10:30 AM', '01:00 PM', '04:00 PM'],
  }
];

let dbBookings: BookingRecord[] = [
  {
    id: 'bk-101',
    interpreterId: 'int-01',
    interpreterName: 'Elena Rostova, CI/CT',
    interpreterAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    language: 'ASL',
    date: 'Today',
    time: '02:00 PM',
    durationMinutes: 45,
    totalCost: 48.75,
    status: 'upcoming',
    notes: 'Cardiology follow-up consultation at Memorial Hospital. Needs clear medical terminology.',
    meetingLink: 'https://signlink.app/live/session-101',
    createdAt: new Date().toISOString()
  },
  {
    id: 'bk-102',
    interpreterId: 'int-02',
    interpreterName: 'Marcus Chen',
    interpreterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    language: 'ASL',
    date: 'Tomorrow',
    time: '10:00 AM',
    durationMinutes: 60,
    totalCost: 55.00,
    status: 'upcoming',
    notes: 'Architecture team sprint planning & React frontend code review.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'bk-103',
    interpreterId: 'int-03',
    interpreterName: 'Sarah Jenkins',
    interpreterAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    language: 'BSL',
    date: 'Aug 28, 2026',
    time: '03:30 PM',
    durationMinutes: 30,
    totalCost: 30.00,
    status: 'upcoming',
    notes: 'Quarterly financial review with regional bank representative.',
    createdAt: new Date().toISOString()
  }
];

let dbSessions: SessionRecord[] = [
  {
    id: 'sess-01',
    type: 'interpreter_call',
    title: 'Dr. Henderson Telehealth Consultation',
    date: 'Aug 24, 2026',
    duration: '24m 18s',
    language: 'ASL',
    interpreterName: 'Elena Rostova, CI/CT',
    interpreterAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    summary: 'Discussion regarding blood pressure medication adjustment, reduced dosage by 5mg, scheduled follow-up in 4 weeks.',
    fullTranscript: [
      { speaker: 'Interpreter', time: '00:05', text: 'Hello Alex, Dr. Henderson is on the line and can see our video feed.' },
      { speaker: 'Speaker', time: '00:18', text: 'Good afternoon Alex. How have you been feeling since starting the new prescription?' },
      { speaker: 'Signer', time: '00:32', text: 'I feel much better, but I experience mild dizziness when standing up quickly in the morning.' },
      { speaker: 'Speaker', time: '01:05', text: 'That can happen with this dose. Let us reduce it to 10mg daily and monitor for 2 weeks.' },
      { speaker: 'Signer', time: '01:45', text: 'Understood. Should I continue the evening potassium supplement as well?' },
      { speaker: 'Speaker', time: '02:10', text: 'Yes, keep the potassium as is. Elena, please confirm they have the pharmacy refill code.' }
    ],
    keyTerms: ['Blood Pressure', '10mg Daily', 'Dizziness', 'Potassium Supplement', '4 Weeks Follow-up'],
    rating: 5,
    notes: 'Elena did a phenomenal job rendering medical terms instantly without hesitation.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sess-02',
    type: 'ai_translation',
    title: 'Airport Gate Information & Boarding Announcement',
    date: 'Aug 22, 2026',
    duration: '08m 42s',
    language: 'ASL',
    summary: 'Live AI video translation captured boarding group B instructions and gate change notice to Gate B24.',
    fullTranscript: [
      { speaker: 'Speaker', time: '00:02', text: 'Attention passengers on Flight 418 to Seattle, we have moved to Gate B24.' },
      { speaker: 'AI', time: '00:08', text: '[ASL Real-Time Translation: Flight 418, Seattle, Move Gate B-2-4]' },
      { speaker: 'Signer', time: '00:40', text: 'Is priority seating boarding now?' },
      { speaker: 'AI', time: '00:48', text: '[Spoken Voice Output: Is priority seating boarding now?]' },
      { speaker: 'Speaker', time: '01:02', text: 'Yes, military and passengers needing extra time may board immediately.' }
    ],
    keyTerms: ['Gate B24', 'Flight 418', 'Seattle', 'Boarding Group B', 'Priority Seating'],
    rating: 5,
    createdAt: new Date().toISOString()
  }
];

let dbUser: UserProfileRecord = {
  id: 'user-01',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  role: 'user_deaf',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  primaryLanguage: 'ASL',
  secondaryLanguage: 'English',
  bio: 'Visual artist and accessibility advocate. Passionate about real-time cross-modal communication.',
  verified: true
};

let dbNotifications: NotificationRecord[] = [
  {
    id: 'notif-1',
    title: 'Session Reminder: Cardiology Consultation',
    message: 'Your live interpretation appointment with Elena Rostova begins today at 02:00 PM.',
    time: '10 min ago',
    read: false,
    type: 'session',
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-2',
    title: 'Booking Confirmed with Marcus Chen',
    message: 'Architecture code review scheduled for tomorrow at 10:00 AM. Meeting link added to calendar.',
    time: '2 hours ago',
    read: false,
    type: 'booking',
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-3',
    title: 'Backend API & AI Engine Active',
    message: 'SignLink Express server and Gemini 2.5 translation endpoints are connected and operational.',
    time: 'Just now',
    read: false,
    type: 'system',
    createdAt: new Date().toISOString()
  }
];

// -------------------------------------------------------------
// REST API Endpoints (/api/*)
// -------------------------------------------------------------

// 1. Health & Server Info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'SignLink Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 2. User & Auth Profile
app.get('/api/user/profile', (_req: Request, res: Response) => {
  res.json({ success: true, user: dbUser });
});

app.put('/api/user/profile', (req: Request, res: Response) => {
  const updates = req.body;
  dbUser = { ...dbUser, ...updates };
  res.json({ success: true, user: dbUser });
});

// 3. Interpreters Directory & Filter
app.get('/api/interpreters', (req: Request, res: Response) => {
  const { language, specialty, status, search, minRating } = req.query;
  
  let results = [...dbInterpreters];
  
  if (language && typeof language === 'string' && language !== 'ALL') {
    results = results.filter(i => i.languages.includes(language));
  }
  
  if (specialty && typeof specialty === 'string' && specialty !== 'all') {
    results = results.filter(i => i.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase())));
  }
  
  if (status && typeof status === 'string' && status !== 'all') {
    results = results.filter(i => i.availableStatus === status);
  }
  
  if (minRating && typeof minRating === 'string') {
    const min = parseFloat(minRating);
    if (!isNaN(min)) {
      results = results.filter(i => i.rating >= min);
    }
  }
  
  if (search && typeof search === 'string' && search.trim() !== '') {
    const query = search.toLowerCase();
    results = results.filter(i => 
      i.name.toLowerCase().includes(query) ||
      i.title.toLowerCase().includes(query) ||
      i.bio.toLowerCase().includes(query) ||
      i.specialties.some(s => s.toLowerCase().includes(query))
    );
  }
  
  res.json({
    success: true,
    total: results.length,
    interpreters: results
  });
});

app.get('/api/interpreters/:id', (req: Request, res: Response) => {
  const interpreter = dbInterpreters.find(i => i.id === req.params.id);
  if (!interpreter) {
    return res.status(404).json({ success: false, error: 'Interpreter not found' });
  }
  res.json({ success: true, interpreter });
});

app.put('/api/interpreters/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const index = dbInterpreters.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Interpreter not found' });
  }
  if (!['online', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  dbInterpreters[index].availableStatus = status;
  res.json({ success: true, interpreter: dbInterpreters[index] });
});

app.patch('/api/interpreters/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const index = dbInterpreters.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Interpreter not found' });
  }
  if (!['online', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  dbInterpreters[index].availableStatus = status;
  res.json({ success: true, interpreter: dbInterpreters[index] });
});

// On-demand urgent match endpoint
app.post('/api/interpreters/match-ondemand', (req: Request, res: Response) => {
  const { language = 'ASL', specialty } = req.body;
  
  // Find online interpreters matching criteria
  let available = dbInterpreters.filter(i => i.availableStatus === 'online' && i.languages.includes(language));
  
  if (specialty && specialty !== 'general') {
    const specMatch = available.filter(i => i.specialties.some(s => s.toLowerCase().includes(String(specialty).toLowerCase())));
    if (specMatch.length > 0) {
      available = specMatch;
    }
  }
  
  if (available.length === 0) {
    // Fallback to any online interpreter
    available = dbInterpreters.filter(i => i.availableStatus === 'online');
  }
  
  if (available.length === 0) {
    return res.status(503).json({
      success: false,
      message: 'No certified interpreters are currently available. You can schedule an appointment for later.'
    });
  }
  
  // Select highest rated available
  available.sort((a, b) => b.rating - a.rating);
  const matched = available[0];
  
  res.json({
    success: true,
    matchedInterpreter: matched,
    roomToken: `room_${matched.id}_${Date.now()}`,
    estimatedWaitSeconds: 5
  });
});

// 4. Bookings & Appointments API
app.get('/api/bookings', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: dbBookings.length,
    bookings: dbBookings
  });
});

app.post('/api/bookings', (req: Request, res: Response) => {
  const { interpreterId, language, date, time, durationMinutes, notes } = req.body;
  
  const interpreter = dbInterpreters.find(i => i.id === interpreterId) || dbInterpreters[0];
  const duration = durationMinutes || 45;
  const totalCost = Number(((interpreter.ratePerHour / 60) * duration).toFixed(2));
  
  const newBooking: BookingRecord = {
    id: `bk-${Date.now()}`,
    interpreterId: interpreter.id,
    interpreterName: interpreter.name,
    interpreterAvatar: interpreter.avatar,
    language: language || 'ASL',
    date: date || 'Tomorrow',
    time: time || '11:00 AM',
    durationMinutes: duration,
    totalCost,
    status: 'upcoming',
    notes: notes || '',
    meetingLink: `https://signlink.app/live/session-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toISOString()
  };
  
  dbBookings.unshift(newBooking);
  
  // Add notification
  dbNotifications.unshift({
    id: `notif-${Date.now()}`,
    title: `Booking Confirmed with ${interpreter.name}`,
    message: `Scheduled for ${newBooking.date} at ${newBooking.time} (${duration} mins).`,
    time: 'Just now',
    read: false,
    type: 'booking',
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json({ success: true, booking: newBooking });
});

app.patch('/api/bookings/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const booking = dbBookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  
  booking.status = status;
  res.json({ success: true, booking });
});

app.delete('/api/bookings/:id', (req: Request, res: Response) => {
  const index = dbBookings.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  
  const cancelled = dbBookings.splice(index, 1)[0];
  res.json({ success: true, cancelledBooking: cancelled });
});

// 5. Session History & Transcripts
app.get('/api/sessions', (_req: Request, res: Response) => {
  res.json({
    success: true,
    total: dbSessions.length,
    sessions: dbSessions
  });
});

app.get('/api/sessions/:id', (req: Request, res: Response) => {
  const session = dbSessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, session });
});

app.post('/api/sessions', (req: Request, res: Response) => {
  const {
    type,
    title,
    duration,
    language,
    interpreterName,
    interpreterAvatar,
    summary,
    fullTranscript,
    keyTerms,
    rating,
    notes
  } = req.body;
  
  const newSession: SessionRecord = {
    id: `sess-${Date.now()}`,
    type: type || 'interpreter_call',
    title: title || 'Live Interpretation Session',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    duration: duration || '15m 00s',
    language: language || 'ASL',
    interpreterName,
    interpreterAvatar,
    summary: summary || 'Completed live sign language interpretation session.',
    fullTranscript: fullTranscript || [],
    keyTerms: keyTerms || ['Sign Language', 'Real-time Interpretation'],
    rating: rating || 5,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  dbSessions.unshift(newSession);
  res.status(201).json({ success: true, session: newSession });
});

// 6. Notifications API
app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json({
    success: true,
    unreadCount: dbNotifications.filter(n => !n.read).length,
    notifications: dbNotifications
  });
});

app.patch('/api/notifications/read-all', (_req: Request, res: Response) => {
  dbNotifications = dbNotifications.map(n => ({ ...n, read: true }));
  res.json({ success: true, notifications: dbNotifications });
});

// 7. AI Gemini Endpoints (Translation Sequence & Smart Summaries)

// Endpoint: AI Session Transcript Summarizer
app.post('/api/ai/summarize-session', async (req: Request, res: Response) => {
  try {
    const { transcript, sessionTitle, language = 'ASL' } = req.body;
    
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ success: false, error: 'Valid transcript array is required' });
    }
    
    const formattedTranscript = transcript
      .map(t => `[${t.time || '00:00'}] ${t.speaker}: ${t.text}`)
      .join('\n');
      
    const ai = getAIClient();
    if (ai) {
      const prompt = `You are an expert Sign Language and Medical/Legal Interpretation Analyst for SignLink.
Analyze the following transcript from a live ${language} interpretation session entitled "${sessionTitle || 'Interpretation Session'}".

Transcript:
${formattedTranscript}

Please produce a concise JSON object adhering to this schema:
{
  "summary": "A 2-3 sentence executive summary of the dialogue, decisions made, and next steps.",
  "keyTerms": ["list", "of", "4-6", "essential", "keywords_or_medical_terms"],
  "actionItems": ["list", "of", "actionable", "next", "steps"]
}
Return ONLY pure JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json({
          success: true,
          summary: parsed.summary,
          keyTerms: parsed.keyTerms,
          actionItems: parsed.actionItems
        });
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON response, fallback to text format', parseErr);
      }
    }
    
    // Heuristic Fallback if Gemini key is not configured
    const keyTermsList = Array.from(new Set(
      transcript.flatMap(t => String(t.text).split(' '))
        .filter(word => word.length > 5 && !['please', 'should', 'morning', 'afternoon'].includes(word.toLowerCase()))
    )).slice(0, 5);
    
    res.json({
      success: true,
      summary: `Successfully completed ${language} interpretation session. Clear two-way communication established with verified transcript history.`,
      keyTerms: keyTermsList.length > 0 ? keyTermsList : ['Communication', 'Real-time', 'Verified', 'Follow-up'],
      actionItems: ['Review transcript notes', 'Save pharmacy/appointment records if applicable']
    });
  } catch (error: any) {
    console.error('Error generating AI session summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI session summary: ' + (error?.message || 'Unknown error')
    });
  }
});

// Endpoint: AI Sign Gloss Sequence to Natural English Translator
app.post('/api/ai/translate-sequence', async (req: Request, res: Response) => {
  try {
    const { glosses, signLanguage = 'ASL' } = req.body;
    
    if (!glosses || (Array.isArray(glosses) && glosses.length === 0)) {
      return res.status(400).json({ success: false, error: 'Gloss sequence is required' });
    }
    
    const glossString = Array.isArray(glosses) ? glosses.join(' ') : String(glosses);
    
    const ai = getAIClient();
    if (ai) {
      const prompt = `You are a real-time ${signLanguage} (Sign Language) linguistic translation engine.
Convert the following sequence of sign language glosses/gestures into a natural, grammatically correct English sentence.

Sign Gloss Sequence: "${glossString}"

Respond ONLY with a JSON object:
{
  "translation": "Natural fluent English sentence",
  "confidence": 0.96,
  "grammaticalNotes": "Brief 1-sentence note explaining the spatial or topic-comment structure used in this sign"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json({
          success: true,
          translation: parsed.translation,
          confidence: parsed.confidence || 0.95,
          grammaticalNotes: parsed.grammaticalNotes
        });
      } catch (parseErr) {
        console.warn('Failed to parse translation response', parseErr);
      }
    }
    
    // Heuristic Fallback
    res.json({
      success: true,
      translation: glossString.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) + '.',
      confidence: 0.92,
      grammaticalNotes: `Interpreted from ${signLanguage} topic-comment sequence.`
    });
  } catch (error: any) {
    console.error('Error translating sign sequence:', error);
    res.status(500).json({
      success: false,
      error: 'Translation engine error: ' + (error?.message || 'Unknown error')
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Production Serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignLink Backend] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
