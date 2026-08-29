export type SignLanguageCode = 'ASL' | 'BSL' | 'Auslan' | 'LSF' | 'DGS' | 'IS';

export interface SignLanguageOption {
  code: SignLanguageCode;
  name: string;
  region: string;
  flag: string;
  alphabetType: 'one-handed' | 'two-handed';
}

export type UserRole = 'user_deaf' | 'user_hearing' | 'interpreter';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  primaryLanguage: SignLanguageCode;
  secondaryLanguage?: string;
  bio?: string;
  verified?: boolean;
  certifications?: string[];
  hourlyRate?: number;
  rating?: number;
  totalHours?: number;
  availableStatus?: 'online' | 'busy' | 'offline';
}

export interface SignGestureItem {
  id: string;
  name: string;
  category: 'alphabet' | 'number' | 'greetings' | 'common' | 'emergency' | 'questions' | 'family';
  language: SignLanguageCode;
  description: string;
  handshape: string;
  movement: string;
  svgHandPath?: string;
  phoneticTip?: string;
  tags: string[];
}

export interface RecognizedSign {
  text: string;
  confidence: number;
  timestamp: string;
  hand: 'left' | 'right' | 'both';
  type: 'word' | 'letter';
}

export interface Interpreter {
  id: string;
  name: string;
  title: string;
  avatar: string;
  coverImage?: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  languages: SignLanguageCode[];
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

export interface Booking {
  id: string;
  interpreterId: string;
  interpreterName: string;
  interpreterAvatar: string;
  language: SignLanguageCode;
  date: string;
  time: string;
  durationMinutes: number;
  totalCost: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'in_progress';
  notes?: string;
  meetingLink?: string;
}

export interface SessionHistoryItem {
  id: string;
  type: 'ai_translation' | 'interpreter_call';
  title: string;
  date: string;
  duration: string;
  language: SignLanguageCode;
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
}

export interface ResourceItem {
  id: string;
  title: string;
  category: 'dictionary' | 'tutorials' | 'fingerspelling' | 'grammar';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  description: string;
  signsCovered: string[];
  thumbnail: string;
  videoUrl?: string;
  views: number;
  likes: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'session' | 'system' | 'alert';
  actionUrl?: string;
}

export interface HandPhysicsConfig {
  enabled: boolean;
  preset: 'biological' | 'snappy' | 'fluid' | 'precision';
  stiffness: number;       // 0.2 to 2.5 (spring stiffness k)
  damping: number;         // 0.2 to 1.0 (damping ratio zeta)
  tendonCoupling: number;  // 0.0 to 1.0 (inter-finger biomechanical coupling)
  massInertia: number;     // 0.1 to 1.0 (joint bone mass & inertia)
  softCollision: boolean;  // Prevents finger self-intersection
  volumetric3D: boolean;   // 3D depth & perspective foreshortening
  oneEuroFilter: boolean;  // Velocity-adaptive jitter damper
}

export interface AppSettings {
  primarySignLanguage: SignLanguageCode;
  autoSpeakTranslation: boolean;
  speechVoiceRate: number;
  speechVoicePitch: number;
  highContrastCaptions: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  hapticFeedback: boolean;
  soundEffects: boolean;
  cameraFacing: 'user' | 'environment';
  darkTheme: boolean;
  detectionSensitivity: 'high' | 'balanced' | 'low';
  gestureTrackingOverlay: boolean;
  autoCenterCamera?: boolean;
  handPhysics?: HandPhysicsConfig;
}
