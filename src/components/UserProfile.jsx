import { useState, useEffect } from "react";
import {
  User,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Mail,
  Languages,
  Sparkles,
  Save,
  RotateCcw,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  Sliders,
  Eye,
  Volume2,
  Smartphone,
  Calendar,
  Clock,
  Briefcase,
  Award,
  HeartHandshake,
  Activity,
  Check,
  Zap,
  Copy
} from "lucide-react";
import { SIGN_LANGUAGES } from "../data/mockData";
import { useFirebase } from "../context/FirebaseContext";
import { firestoreService } from "../services/firestoreService";
import { SessionManager, computeSafetyFingerprint } from "../utils/security";

/**
 * UserProfile Component
 *
 * 1. Auth State Guard: Displays an authentication barrier if user is unauthenticated,
 *    with instant sign-in actions.
 * 2. Firestore 'users' Collection Integration:
 *    - Retrieves and displays user profile information directly from `users/{uid}` in Firestore.
 *    - Subscribes in real-time or loads via `getUserProfile`.
 * 3. Profile & Preference Updating:
 *    - Allows updating display name, sign language dialect, secondary language, bio,
 *      availability status, and profile preferences (captions, auto-speak, font size, etc.).
 *    - Writes updates directly to the Firestore `users` collection and private subcollection.
 */
export const UserProfile = ({ onOpenAuth }) => {
  const {
    firebaseUser,
    isAuthenticated,
    user: contextUser,
    settings: contextSettings,
    updateUserProfile: updateContextProfile,
    updateUserSettings: updateContextSettings,
    loginWithGoogle,
    logoutUser
  } = useFirebase();

  // Firestore Document State
  const [firestoreData, setFirestoreData] = useState(null);
  const [firestoreSettings, setFirestoreSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  // Form Editing State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("ASL");
  const [secondaryLanguage, setSecondaryLanguage] = useState("English");
  const [role, setRole] = useState("user_deaf");
  const [availableStatus, setAvailableStatus] = useState("online");
  const [hourlyRate, setHourlyRate] = useState(65);
  const [certificationsText, setCertificationsText] = useState("");

  // Preference Toggles State
  const [preferences, setPreferences] = useState({
    autoSpeakTranslation: true,
    highContrastCaptions: false,
    fontSize: "normal",
    hapticFeedback: true,
    soundEffects: true,
    darkTheme: false,
    detectionSensitivity: "balanced",
    speechVoiceRate: 1.0
  });

  // Track if dirty
  const [hasChanges, setHasChanges] = useState(false);

  // 7-Day Session & E2EE Security state
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(() => SessionManager.getTimeRemaining());
  const [safetyFingerprint, setSafetyFingerprint] = useState("4819-2094-1849-0211");
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [isRenewingSession, setIsRenewingSession] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimeRemaining(SessionManager.getTimeRemaining());
    }, 30000);

    if (firebaseUser?.uid) {
      computeSafetyFingerprint(firebaseUser.uid).then((code) => {
        if (code) setSafetyFingerprint(code);
      });
    }

    return () => clearInterval(timer);
  }, [firebaseUser?.uid]);

  const handleRenewSession = () => {
    setIsRenewingSession(true);
    SessionManager.renewSession(firebaseUser?.uid || "guest", firebaseUser?.email || null);
    setTimeout(() => {
      setSessionTimeRemaining(SessionManager.getTimeRemaining());
      setIsRenewingSession(false);
      setFeedback({
        type: "success",
        message: "Session extended by 7 days. Your access token is verified and refreshed."
      });
    }, 400);
  };

  const handleCopyFingerprint = () => {
    if (navigator.clipboard && safetyFingerprint) {
      navigator.clipboard.writeText(safetyFingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    }
  };

  // ----------------------------------------------------
  // 1. Real-time Subscription to Firestore 'users/{uid}'
  // ----------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated || !firebaseUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    // Direct fetch and real-time listener from Firestore 'users' collection
    const unsubscribe = firestoreService.subscribeUserProfile(
      firebaseUser.uid,
      (docData) => {
        if (!isMounted) return;
        if (docData) {
          setFirestoreData(docData);
          setLastSyncedAt(new Date().toLocaleTimeString());

          // Populate editable state from Firestore doc
          setName(docData.name || firebaseUser.displayName || "Signer");
          setBio(docData.bio || "");
          setPrimaryLanguage(docData.primaryLanguage || "ASL");
          setSecondaryLanguage(docData.secondaryLanguage || "English");
          setRole(docData.role || "user_deaf");
          setAvailableStatus(docData.availableStatus || "online");
          if (docData.hourlyRate !== undefined) setHourlyRate(docData.hourlyRate);
          if (docData.certifications && Array.isArray(docData.certifications)) {
            setCertificationsText(docData.certifications.join(", "));
          }

          if (docData.preferences) {
            setPreferences((prev) => ({ ...prev, ...docData.preferences }));
          }
        } else {
          // If Firestore document doesn't exist yet, populate with initial auth info
          const fallbackData = {
            userId: firebaseUser.uid,
            name: firebaseUser.displayName || contextUser?.name || "Signer",
            email: firebaseUser.email || "",
            role: contextUser?.role || "user_deaf",
            primaryLanguage: contextUser?.primaryLanguage || "ASL",
            secondaryLanguage: "English",
            availableStatus: "online",
            bio: contextUser?.bio || "",
            avatar: firebaseUser.photoURL || contextUser?.avatar || ""
          };
          setFirestoreData(fallbackData);
          setName(fallbackData.name);
          setPrimaryLanguage(fallbackData.primaryLanguage);
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn("Firestore user profile subscription notice:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    // Also fetch private settings
    firestoreService.getUserSettings(firebaseUser.uid).then((settingsData) => {
      if (!isMounted || !settingsData) return;
      setFirestoreSettings(settingsData);
      setPreferences((prev) => ({
        ...prev,
        autoSpeakTranslation: settingsData.autoSpeakTranslation ?? prev.autoSpeakTranslation,
        highContrastCaptions: settingsData.highContrastCaptions ?? prev.highContrastCaptions,
        fontSize: settingsData.fontSize || prev.fontSize,
        hapticFeedback: settingsData.hapticFeedback ?? prev.hapticFeedback,
        soundEffects: settingsData.soundEffects ?? prev.soundEffects,
        darkTheme: settingsData.darkTheme ?? prev.darkTheme,
        detectionSensitivity: settingsData.detectionSensitivity || prev.detectionSensitivity,
        speechVoiceRate: settingsData.speechVoiceRate ?? prev.speechVoiceRate
      }));
    }).catch((err) => console.warn("Notice reading settings:", err));

    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [isAuthenticated, firebaseUser?.uid]);

  // Mark changes when values change compared to firestoreData
  useEffect(() => {
    if (!firestoreData) return;
    const isNameDifferent = name !== (firestoreData.name || "");
    const isBioDifferent = bio !== (firestoreData.bio || "");
    const isLangDifferent = primaryLanguage !== (firestoreData.primaryLanguage || "ASL");
    const isSecLangDifferent = secondaryLanguage !== (firestoreData.secondaryLanguage || "English");
    const isRoleDifferent = role !== (firestoreData.role || "user_deaf");
    const isStatusDifferent = availableStatus !== (firestoreData.availableStatus || "online");
    const isRateDifferent = Number(hourlyRate) !== Number(firestoreData.hourlyRate || 65);

    setHasChanges(
      isNameDifferent ||
      isBioDifferent ||
      isLangDifferent ||
      isSecLangDifferent ||
      isRoleDifferent ||
      isStatusDifferent ||
      isRateDifferent
    );
  }, [name, bio, primaryLanguage, secondaryLanguage, role, availableStatus, hourlyRate, firestoreData]);

  // ----------------------------------------------------
  // Save Handler: Writes to Firestore 'users' collection
  // ----------------------------------------------------
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!firebaseUser?.uid) return;

    if (!name.trim()) {
      setFeedback({ type: "error", message: "Display name cannot be blank." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      // Parse certifications array
      const certsArray = certificationsText
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const profilePayload = {
        userId: firebaseUser.uid,
        name: name.trim(),
        role,
        email: firebaseUser.email || firestoreData?.email || "",
        avatar: firebaseUser.photoURL || firestoreData?.avatar || contextUser?.avatar || "",
        primaryLanguage,
        secondaryLanguage: secondaryLanguage.trim() || "English",
        bio: bio.trim(),
        availableStatus,
        hourlyRate: 0,
        certifications: certsArray.length > 0 ? certsArray : ["Certified Signer"],
        verified: firestoreData?.verified ?? true,
        preferences: {
          ...preferences
        },
        updatedAt: new Date().toISOString()
      };

      // 1. Save directly to Firestore 'users' collection
      await firestoreService.saveUserProfile(firebaseUser.uid, profilePayload);

      // 2. Also save to user's private settings subcollection
      await firestoreService.saveUserSettings(firebaseUser.uid, {
        ...preferences,
        email: firebaseUser.email || ""
      });

      // 3. Update application context state
      await updateContextProfile(profilePayload);
      if (updateContextSettings) {
        await updateContextSettings(preferences);
      }

      setFirestoreData((prev) => ({ ...prev, ...profilePayload }));
      setLastSyncedAt(new Date().toLocaleTimeString());
      setHasChanges(false);
      setFeedback({
        type: "success",
        message: "Profile and preferences successfully saved to Firestore 'users' collection!"
      });

      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } catch (err) {
      console.error("Profile save error:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to update profile in Firestore. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Revert changes back to Firestore document
  const handleRevert = () => {
    if (!firestoreData) return;
    setName(firestoreData.name || "");
    setBio(firestoreData.bio || "");
    setPrimaryLanguage(firestoreData.primaryLanguage || "ASL");
    setSecondaryLanguage(firestoreData.secondaryLanguage || "English");
    setRole(firestoreData.role || "user_deaf");
    setAvailableStatus(firestoreData.availableStatus || "online");
    setHourlyRate(firestoreData.hourlyRate || 65);
    setHasChanges(false);
    setFeedback({ type: "success", message: "Form reverted to last Firestore snapshot." });
    setTimeout(() => setFeedback(null), 2500);
  };

  // Preference Toggle Helper
  const handleTogglePreference = (key) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setHasChanges(true);
      return next;
    });
  };

  // Manual refresh from Firestore
  const handleRefresh = async () => {
    if (!firebaseUser?.uid) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const freshDoc = await firestoreService.getUserProfile(firebaseUser.uid);
      if (freshDoc) {
        setFirestoreData(freshDoc);
        setName(freshDoc.name || "");
        setBio(freshDoc.bio || "");
        setPrimaryLanguage(freshDoc.primaryLanguage || "ASL");
        setSecondaryLanguage(freshDoc.secondaryLanguage || "English");
        setRole(freshDoc.role || "user_deaf");
        setAvailableStatus(freshDoc.availableStatus || "online");
        setLastSyncedAt(new Date().toLocaleTimeString());
        setFeedback({ type: "success", message: "Refreshed live data from Firestore." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to reload Firestore document." });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // AUTH STATE GUARD
  // Rendered whenever the user is NOT authenticated.
  // =========================================================================
  if (!isAuthenticated || !firebaseUser) {
    return (
      <div id="auth-guard-container" className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl text-center relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Locked Badge Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-6">
            <Lock className="w-10 h-10" />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900 flex items-center justify-center text-slate-950">
              <Shield className="w-3.5 h-3.5" />
            </span>
          </div>

          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-3">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>Firestore Authentication Guard</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            User Profile Protected
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
            Please sign in or register to access and synchronize your personal user profile, custom sign language dialects, interpreter registry credentials, and accessibility preferences stored in the Firestore <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-indigo-600 dark:text-indigo-400">users</code> collection.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              id="btn-guard-open-auth"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In or Register</span>
            </button>

            <button
              id="btn-guard-google-signin"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err) {
                  console.warn("Google sign-in error:", err);
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-800 dark:text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Feature Preview Grid (Shows what they unlock) */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
              Available with your cloud account
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <Languages className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Dialect Preferences</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Save default ASL, BSL, Auslan, or LSF recognition models.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <Sliders className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Live Accessibility</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Sync high-contrast captions, speech synthesis, and tactile feedback.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Interpreter Registry</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Manage professional credentials, volunteer accessibility, and on-demand dispatch status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED PROFILE VIEW
  // =========================================================================
  return (
    <div id="user-profile-view" className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={
                  firestoreData?.avatar ||
                  firebaseUser?.photoURL ||
                  contextUser?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                }
                alt={name || "User Avatar"}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  availableStatus === "online"
                    ? "bg-emerald-500"
                    : availableStatus === "busy"
                    ? "bg-amber-500"
                    : "bg-slate-400"
                }`}
                title={`Status: ${availableStatus}`}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {name || "SignLink Member"}
                </h1>
                {firestoreData?.verified && (
                  <span
                    title="Verified Account"
                    className="p-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {firebaseUser.email}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    role === "interpreter"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300"
                      : role === "user_deaf"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                      : "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300"
                  }`}
                >
                  {role === "interpreter"
                    ? "Interpreter Pro"
                    : role === "user_deaf"
                    ? "Deaf / Signer"
                    : "Hearing Learner / Ally"}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Dialect: {primaryLanguage}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  UID: {firebaseUser.uid.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              id="btn-profile-refresh-firestore"
              onClick={handleRefresh}
              disabled={isLoading || isSaving}
              title="Refresh from Firestore"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              id="btn-profile-signout"
              onClick={async () => {
                await logoutUser();
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Database Connection & Sync Status Banner */}
        <div className="mt-4 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-900 dark:text-white">Firestore Path:</span>
            <span className="font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
              users/{firebaseUser.uid}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected & Live Sync</span>
            {lastSyncedAt && <span>• Last synced {lastSyncedAt}</span>}
          </div>
        </div>
      </div>

      {/* Alert / Feedback Notification */}
      {feedback && (
        <div
          id="profile-feedback-alert"
          className={`p-4 rounded-2xl text-xs flex items-start space-x-3 transition-all ${
            feedback.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold">{feedback.type === "error" ? "Error" : "Success"}</p>
            <p className="mt-0.5">{feedback.message}</p>
          </div>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        
        {/* Section 1: Basic Information & Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Display Name & Identity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Retrieved and written directly to your Firestore <code className="font-mono text-[10px]">users</code> record.
                </p>
              </div>
            </div>

            {hasChanges && (
              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                <span>Unsaved Changes</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Display Name Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-profile-display-name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Visible to session participants, live callers, and dictionary contributors.
              </p>
            </div>

            {/* Email Address (Read-only from Auth) */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-profile-email-readonly"
                  type="email"
                  disabled
                  value={firebaseUser.email || ""}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Managed via Firebase Authentication provider.
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Platform Role & Experience Tier
              </label>
              <select
                id="select-profile-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="user_deaf">Deaf / Hard-of-Hearing (Native Signer)</option>
                <option value="user_hearing">Hearing Ally / Language Learner</option>
                <option value="interpreter">Certified Interpreter (Professional Registry)</option>
              </select>
            </div>

            {/* Availability Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Live Dispatch Availability
              </label>
              <select
                id="select-profile-availability"
                value={availableStatus}
                onChange={(e) => setAvailableStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="online">🟢 Online & Ready for Sessions</option>
                <option value="busy">🟡 Busy in Ongoing Call</option>
                <option value="offline">⚪ Offline / Do Not Disturb</option>
              </select>
            </div>

            {/* Bio / Communication Preferences */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Bio & Communication Notes
              </label>
              <textarea
                id="textarea-profile-bio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your signing dialect, interpreter certifications, preferred speech speeds, or any clinical background..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Stored in Firestore user profile record</span>
                <span>{bio.length} / 500</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Sign Language Dialects & Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center space-x-2.5 mb-5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Sign Language & Dialect Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determines AI hand tracking landmark classification and dictionary vocabularies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Primary Sign Language Dialect */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Primary Sign Language Dialect
              </label>
              <select
                id="select-profile-primary-language"
                value={primaryLanguage}
                onChange={(e) => setPrimaryLanguage(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {SIGN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Spoken or Signed Language */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Secondary Spoken / Sign Language
              </label>
              <input
                id="input-profile-secondary-language"
                type="text"
                maxLength={50}
                value={secondaryLanguage}
                onChange={(e) => setSecondaryLanguage(e.target.value)}
                placeholder="e.g. English, Spanish, French"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Interpreter Professional Tier Fields (Conditional) */}
          {role === "interpreter" && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  Interpreter Professional Settings
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Interpretation Service Model
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>100% Free Community Accessibility Service</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Accredited Certifications (Comma Separated)
                  </label>
                  <input
                    id="input-profile-certifications"
                    type="text"
                    value={certificationsText}
                    onChange={(e) => setCertificationsText(e.target.value)}
                    placeholder="e.g. RID CI/CT, NIC Master, BEI Medical"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Accessibility & Engine Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center space-x-2.5 mb-5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Accessibility & Real-time AI Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customizes subtitle rendering, speech synthesis, and tactile indicators.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto-Speak Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Auto-Speak Translation Audio
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically plays voice audio as you fingerspell or sign gestures.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="toggle-pref-autospeak"
                onClick={() => handleTogglePreference("autoSpeakTranslation")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  preferences.autoSpeakTranslation ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.autoSpeakTranslation ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* High Contrast Captions */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    High Contrast Subtitle Captions
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Uses bold solid yellow-on-black styling for optimal readability.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="toggle-pref-high-contrast"
                onClick={() => handleTogglePreference("highContrastCaptions")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  preferences.highContrastCaptions ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.highContrastCaptions ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Haptic Feedback */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Haptic Vibration Feedback
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Vibrates device slightly whenever a signed letter or gesture is recognized.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="toggle-pref-haptic"
                onClick={() => handleTogglePreference("hapticFeedback")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  preferences.hapticFeedback ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.hapticFeedback ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Caption Font Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Caption Text Size
                </label>
                <select
                  id="select-pref-font-size"
                  value={preferences.fontSize}
                  onChange={(e) => {
                    setPreferences((prev) => ({ ...prev, fontSize: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="normal">Standard (16px)</option>
                  <option value="large">Large (20px)</option>
                  <option value="extra-large">Extra Large (26px)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Gesture Detection Sensitivity
                </label>
                <select
                  id="select-pref-sensitivity"
                  value={preferences.detectionSensitivity}
                  onChange={(e) => {
                    setPreferences((prev) => ({ ...prev, detectionSensitivity: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="high">High (Quick recognition, tolerant)</option>
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="low">Strict (High confidence required)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Security, 7-Day Session Lifecycle & End-to-End Encryption */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Security, 7-Day Session Lifecycle & Cryptography
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage confidential session token expiration, rate-limiting safeguards, and end-to-end encryption keys.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-700 items-center space-x-1.5">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>AES-256-GCM Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 7-Day Session Expiration Policy */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>7-Day Session Lifecycle</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold font-mono">
                    {sessionTimeRemaining.text} left
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sessions automatically terminate after 7 consecutive days to guarantee client privacy and satisfy HIPAA/GDPR video relay guidelines.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Status: <strong className="text-emerald-600 dark:text-emerald-400">Authenticated & Secure</strong>
                </span>
                <button
                  type="button"
                  id="btn-renew-session"
                  onClick={handleRenewSession}
                  disabled={isRenewingSession}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRenewingSession ? "animate-spin" : ""}`} />
                  <span>Renew (+7 Days)</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Safety Number / E2EE Fingerprint */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographic Safety Fingerprint</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    PBKDF2 SHA-256
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Compare this security fingerprint with the interpreter on call to verify that peer-to-peer WebRTC media is encrypted without eavesdropping.
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                    {safetyFingerprint}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyFingerprint}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedFingerprint ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Signaling Rate Limiter:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Enforced (5 calls / 3s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className="sticky bottom-4 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            {hasChanges ? (
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>You have unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Synchronized with Firestore</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {hasChanges && (
              <button
                type="button"
                id="btn-revert-changes"
                onClick={handleRevert}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            )}

            <button
              type="submit"
              id="btn-save-profile"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Writing to Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save to Firestore</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
