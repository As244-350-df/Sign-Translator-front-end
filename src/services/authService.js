import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from '../lib/firebase';
import { firestoreService } from './firestoreService';

/**
 * Format Firebase Auth errors into clear, human-readable user messages
 */
export function formatAuthErrorMessage(error) {
  if (!error) return 'An unknown error occurred.';
  const code = error.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled on this Firebase project yet. You can sign in using Demo/Guest mode or enable Email/Password in Firebase Console.';
    case 'auth/network-request-failed':
      return 'Network connection to authentication server failed (often due to iframe popup restrictions). You can sign in with Demo/Guest mode or open the app in a new tab.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to multiple failed login attempts. Please try again later or reset your password.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign in again.';
    default:
      return error.message || 'Authentication operation failed.';
  }
}

export const authService = {
  /**
   * Listen to Firebase auth state changes
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get the current authenticated Firebase user
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Create or restore local guest/demo session
   */
  createGuestSession(profileData = {}) {
    const guestUid = `guest-${Date.now()}`;
    const email = profileData.email || 'guest@signlink.app';
    const name = profileData.name || email.split('@')[0] || 'Guest User';
    const guestUser = {
      uid: guestUid,
      email,
      displayName: name,
      photoURL: profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      isAnonymous: true
    };
    const profile = {
      userId: guestUid,
      name,
      email,
      avatar: profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      role: profileData.role || 'user_deaf',
      primaryLanguage: profileData.primaryLanguage || 'ASL',
      secondaryLanguage: profileData.secondaryLanguage || 'English',
      bio: profileData.bio || 'Guest profile exploring SignLink.',
      verified: true,
      availableStatus: 'online',
      certifications: profileData.certifications || [],
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('signlink_guest_session', JSON.stringify({ user: guestUser, profile }));
    } catch {}

    return { user: guestUser, profile };
  },

  getStoredGuestSession() {
    try {
      const data = localStorage.getItem('signlink_guest_session');
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  },

  clearStoredGuestSession() {
    try {
      localStorage.removeItem('signlink_guest_session');
    } catch {}
  },

  /**
   * Sign in with Google Popup
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user profile already exists in Firestore, or create if first time
      const existingProfile = await firestoreService.getUserProfile(user.uid);
      if (!existingProfile) {
        const initialProfile = {
          userId: user.uid,
          name: user.displayName || 'SignLink User',
          email: user.email || '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          role: 'user_deaf',
          primaryLanguage: 'ASL',
          secondaryLanguage: 'English',
          verified: user.emailVerified || true,
          availableStatus: 'online',
          createdAt: new Date().toISOString()
        };
        await firestoreService.saveUserProfile(user.uid, initialProfile);
      }

      return user;
    } catch (error) {
      console.warn('Sign-in with Google notice:', error?.message || error);
      const err = new Error(formatAuthErrorMessage(error));
      err.code = error?.code;
      throw err;
    }
  },

  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;

      // Verify or initialize user document in Firestore
      const existingProfile = await firestoreService.getUserProfile(user.uid);
      if (!existingProfile) {
        const profile = {
          userId: user.uid,
          name: user.displayName || email.split('@')[0],
          email: user.email || email,
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          role: 'user_deaf',
          primaryLanguage: 'ASL',
          secondaryLanguage: 'English',
          verified: user.emailVerified || false,
          availableStatus: 'online',
          createdAt: new Date().toISOString()
        };
        await firestoreService.saveUserProfile(user.uid, profile);
      }

      return user;
    } catch (error) {
      console.warn('Sign-in with email notice:', error?.message || error);
      const err = new Error(formatAuthErrorMessage(error));
      err.code = error?.code;
      throw err;
    }
  },

  /**
   * Sign up a new user with Email, Password, and Profile metadata
   */
  async signUpWithEmail(email, password, profileData = {}) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = result.user;

      const displayName = profileData.name?.trim() || email.split('@')[0];
      // Update Firebase Auth profile display name
      if (displayName) {
        await updateProfile(user, {
          displayName,
          photoURL: profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
        });
      }

      // Initialize user profile in Firestore
      const newProfile = {
        userId: user.uid,
        name: displayName,
        email: user.email || email,
        avatar: profileData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        role: profileData.role || 'user_deaf',
        primaryLanguage: profileData.primaryLanguage || 'ASL',
        secondaryLanguage: profileData.secondaryLanguage || 'English',
        bio: profileData.bio || '',
        verified: false,
        availableStatus: 'online',
        certifications: profileData.certifications || [],
        createdAt: new Date().toISOString()
      };

      await firestoreService.saveUserProfile(user.uid, newProfile);

      // Initialize default user settings in Firestore
      await firestoreService.saveUserSettings(user.uid, {
        email: user.email,
        autoSpeakTranslation: true,
        highContrastCaptions: false,
        fontSize: 'normal',
        hapticFeedback: true,
        soundEffects: true,
        cameraFacing: 'user',
        darkTheme: false,
        detectionSensitivity: 'balanced'
      });

      return user;
    } catch (error) {
      console.warn('Sign up with email notice:', error?.message || error);
      const err = new Error(formatAuthErrorMessage(error));
      err.code = error?.code;
      throw err;
    }
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error) {
      console.warn('Send password reset notice:', error?.message || error);
      const err = new Error(formatAuthErrorMessage(error));
      err.code = error?.code;
      throw err;
    }
  },

  /**
   * Sign out current user
   */
  async signOutUser() {
    try {
      authService.clearStoredGuestSession();
      await signOut(auth);
      return true;
    } catch (error) {
      console.warn('Sign out notice:', error?.message || error);
      const err = new Error(formatAuthErrorMessage(error));
      err.code = error?.code;
      throw err;
    }
  }
};
