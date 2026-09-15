import { useState, useEffect } from "react";
import {
  X,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Database,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound
} from "lucide-react";
import { SIGN_LANGUAGES } from "../data/mockData";
import { useFirebase } from "../context/FirebaseContext";

export const AuthModal = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onNavigateToProfile
}) => {
  const {
    firebaseUser,
    isAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logoutUser,
    authError,
    clearAuthError,
    updateUserProfile
  } = useFirebase();

  // Mode: "signIn" | "signUp" | "forgotPassword" | "profile"
  const [mode, setMode] = useState(isAuthenticated ? "profile" : "signIn");

  // Sign In / Sign Up Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user_deaf");
  const [primaryLang, setPrimaryLang] = useState("ASL");
  const [certification, setCertification] = useState("RID Certified (CI/CT)");
  const [bio, setBio] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", message: string }

  // Sync mode when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      setMode("profile");
      if (currentUser) {
        setName(currentUser.name || "");
        setEmail(currentUser.email || firebaseUser?.email || "");
        setRole(currentUser.role || "user_deaf");
        setPrimaryLang(currentUser.primaryLanguage || "ASL");
        setBio(currentUser.bio || "");
      }
    } else {
      setMode("signIn");
    }
  }, [isAuthenticated, currentUser, firebaseUser]);

  // Clear errors when changing modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setFeedback(null);
    if (clearAuthError) clearAuthError();
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Handle Google Sign-In
  // ----------------------------------------------------
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const loggedUser = await loginWithGoogle();
      setFeedback({
        type: "success",
        message: `Welcome, ${loggedUser.displayName || loggedUser.email}!`
      });
      setTimeout(() => {
        setMode("profile");
      }, 500);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to sign in with Google."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Email / Password Sign-In
  // ----------------------------------------------------
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFeedback({ type: "error", message: "Please enter both email and password." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      await loginWithEmail(email, password);
      setFeedback({ type: "success", message: "Successfully signed in!" });
      setTimeout(() => {
        setMode("profile");
      }, 500);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not sign in with provided credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Email / Password Registration
  // ----------------------------------------------------
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Please enter your name." });
      return;
    }
    if (!email.trim()) {
      setFeedback({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      await registerWithEmail(email, password, {
        name,
        role,
        primaryLanguage: primaryLang,
        certifications: role === "interpreter" ? [certification, "NIC Master"] : [],
        bio
      });
      setFeedback({
        type: "success",
        message: "Account created and profile synced to Firestore!"
      });
      setTimeout(() => {
        setMode("profile");
      }, 600);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to create account. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Password Reset Request
  // ----------------------------------------------------
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: "error", message: "Please enter your account email address." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      await resetPassword(email);
      setFeedback({
        type: "success",
        message: `Password reset link sent to ${email}. Please check your inbox.`
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not send reset link. Verify your email."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Profile Update (Firestore)
  // ----------------------------------------------------
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    try {
      const updated = {
        ...currentUser,
        name: name.trim() || currentUser?.name || "Signer",
        role,
        primaryLanguage: primaryLang,
        bio: bio.trim(),
        certifications: role === "interpreter" ? [certification] : undefined
      };
      await updateUserProfile(updated);
      if (onUpdateUser) onUpdateUser(updated);
      setFeedback({ type: "success", message: "Profile saved to Firestore!" });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to update profile." });
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // Handle Sign Out
  // ----------------------------------------------------
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setFeedback({ type: "success", message: "Signed out successfully." });
      setMode("signIn");
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Sign out failed." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target.id === "auth-modal-backdrop") onClose();
      }}
    >
      <div
        id="auth-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {mode === "signIn" && "Sign In to SignLink"}
            {mode === "signUp" && "Create Your Account"}
            {mode === "forgotPassword" && "Reset Password"}
            {mode === "profile" && "Account & Profile"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === "signIn" && "Sign in with Google or your email and password"}
            {mode === "signUp" && "Register to save sessions, dictionary signs & interpreter bookings"}
            {mode === "forgotPassword" && "Enter your email address to receive password recovery instructions"}
            {mode === "profile" && "Manage your identity, sign language dialect & credentials in Firestore"}
          </p>
        </div>

        {/* Database Live Status Indicator */}
        <div className="mb-4 p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-900 dark:text-indigo-200">
              Firestore Cloud Database:
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {isAuthenticated ? "Live & Synced" : "Ready"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Online</span>
          </div>
        </div>

        {/* Error / Success Feedback Alert */}
        {(feedback || authError) && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-start space-x-2 ${
              feedback?.type === "error" || authError
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            }`}
          >
            {feedback?.type === "error" || authError ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback?.message || authError}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE: SIGN IN */}
        {/* ==================================================== */}
        {mode === "signIn" && (
          <div className="space-y-4">
            {/* Google One-Click Button */}
            <button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center space-x-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
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
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase text-slate-400 absolute">
                or with email
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("forgotPassword")}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signUp")}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE: SIGN UP */}
        {/* ==================================================== */}
        {mode === "signUp" && (
          <div className="space-y-4">
            {/* Google One-Click Button */}
            <button
              id="btn-google-signup"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center space-x-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
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
              )}
              <span>Sign up with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase text-slate-400 absolute">
                or fill details
              </span>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-3">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  I am using SignLink as:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("user_deaf")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "user_deaf"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Deaf / Signer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("user_hearing")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "user_hearing"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Learner / Ally</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("interpreter")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "interpreter"
                        ? "bg-purple-50 dark:bg-purple-950/60 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Interpreter Pro</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sign Language Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Sign Language Dialect
                </label>
                <select
                  id="select-signup-language"
                  value={primaryLang}
                  onChange={(e) => setPrimaryLang(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {SIGN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Certification if Interpreter */}
              {role === "interpreter" && (
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-xs">
                  <label className="font-bold text-purple-900 dark:text-purple-300 block mb-1">
                    Registry Certification
                  </label>
                  <select
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-lg p-1.5 text-xs font-semibold"
                  >
                    <option value="RID Certified (CI/CT)">RID Certified (CI/CT) - USA</option>
                    <option value="NIC Master">NIC Master - Registry of Interpreters</option>
                    <option value="Certified Deaf Interpreter (CDI)">Certified Deaf Interpreter (CDI)</option>
                    <option value="NRCPD Registered BSL">NRCPD Registered - United Kingdom</option>
                    <option value="NAATI Certified Auslan">NAATI Certified - Australia</option>
                  </select>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-signup-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-signup"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signIn")}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE: FORGOT PASSWORD */}
        {/* ==================================================== */}
        {mode === "forgotPassword" && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2 font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Password Recovery</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Enter your account email address. We will dispatch a secure password reset link straight from Firebase Authentication to your inbox.
              </p>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-submit-reset"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode("signIn")}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODE: PROFILE / SIGNED IN */}
        {/* ==================================================== */}
        {mode === "profile" && (
          <div className="space-y-4">
            {/* User Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={firebaseUser?.photoURL || currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full ring-2 ring-indigo-500/40 object-cover"
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {name || firebaseUser?.displayName || currentUser?.name || "SignLink Member"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {firebaseUser?.email || currentUser?.email || "Signed in"}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {firebaseUser?.providerData?.[0]?.providerId === "google.com" ? "Google Account" : "Firebase Auth"}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      UID: {firebaseUser?.uid?.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {onNavigateToProfile && (
                  <button
                    type="button"
                    onClick={onNavigateToProfile}
                    className="px-3 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  id="btn-auth-signout"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-1 text-xs font-semibold cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase text-slate-400 absolute">
                Edit Profile
              </span>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleProfileSave} className="space-y-3">
              {/* Role */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Platform Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("user_deaf")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "user_deaf"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Deaf / Signer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("user_hearing")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "user_hearing"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Learner / Ally</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("interpreter")}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      role === "interpreter"
                        ? "bg-purple-50 dark:bg-purple-950/60 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1" />
                    <span className="text-[10px] block">Interpreter Pro</span>
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Primary Sign Language */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Sign Language
                </label>
                <select
                  value={primaryLang}
                  onChange={(e) => setPrimaryLang(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {SIGN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Bio / Clinical Summary
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients or peers about your communication preferences..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button
                id="btn-submit-profile-update"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Save Profile to Firestore</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
