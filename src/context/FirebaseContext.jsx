import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth
} from '../lib/firebase';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { INITIAL_USER, INITIAL_SETTINGS, MOCK_SESSION_HISTORY, MOCK_BOOKINGS, MOCK_NOTIFICATIONS } from '../data/mockData';

const FirebaseContext = createContext(null);

export const FirebaseProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(INITIAL_USER);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [sessions, setSessions] = useState(MOCK_SESSION_HISTORY);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [bookmarks, setBookmarks] = useState([]);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setFirebaseUser(currentUser);
      setIsLoadingAuth(false);

      if (currentUser) {
        // Authenticated user: Load profile from Firestore
        try {
          const profile = await firestoreService.getUserProfile(currentUser.uid);
          if (profile) {
            setUser(profile);
          } else {
            // First-time sign in: Initialize profile in Firestore
            const initialData = {
              userId: currentUser.uid,
              name: currentUser.displayName || 'SignLink User',
              email: currentUser.email || '',
              avatar: currentUser.photoURL || '',
              role: 'user_deaf',
              primaryLanguage: 'ASL',
              secondaryLanguage: 'English',
              verified: currentUser.emailVerified || false,
              availableStatus: 'online',
              createdAt: new Date().toISOString()
            };
            await firestoreService.saveUserProfile(currentUser.uid, initialData);
            setUser(initialData);
          }

          // Load private settings
          const userSettings = await firestoreService.getUserSettings(currentUser.uid);
          if (userSettings) {
            setSettings(prev => ({ ...prev, ...userSettings }));
          }
        } catch (err) {
          console.warn('User profile sync notice:', err?.message || err);
        }
      } else {
        // Check for stored guest session
        const storedGuest = authService.getStoredGuestSession();
        if (storedGuest?.user && storedGuest?.profile) {
          setFirebaseUser(storedGuest.user);
          setUser(storedGuest.profile);
        } else {
          // Fallback to default user
          setUser(INITIAL_USER);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to real-time collections when user is logged in
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubSessions = firestoreService.subscribeSessions(firebaseUser.uid, (data) => {
      if (data && data.length > 0) {
        setSessions(data);
      }
    });

    const unsubBookings = firestoreService.subscribeBookings(firebaseUser.uid, (data) => {
      if (data && data.length > 0) {
        setBookings(data);
      }
    });

    const unsubBookmarks = firestoreService.subscribeBookmarks(firebaseUser.uid, (data) => {
      setBookmarks(data);
    });

    const unsubNotifs = firestoreService.subscribeNotifications(firebaseUser.uid, (data) => {
      if (data && data.length > 0) {
        setNotifications(data);
      }
    });

    return () => {
      unsubSessions();
      unsubBookings();
      unsubBookmarks();
      unsubNotifs();
    };
  }, [firebaseUser]);

  // Google Login
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const resultUser = await authService.signInWithGoogle();
      return resultUser;
    } catch (err) {
      console.warn('Firebase Google Auth notice:', err?.message || err);
      setAuthError(err.message);
      throw err;
    }
  };

  // Email / Password Login
  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      const resultUser = await authService.signInWithEmail(email, password);
      return resultUser;
    } catch (err) {
      console.warn('Firebase Email Sign-In notice:', err?.message || err);
      setAuthError(err.message);
      throw err;
    }
  };

  // Email / Password Registration
  const registerWithEmail = async (email, password, profileData) => {
    setAuthError(null);
    try {
      const resultUser = await authService.signUpWithEmail(email, password, profileData);
      return resultUser;
    } catch (err) {
      console.warn('Firebase Email Registration notice:', err?.message || err);
      setAuthError(err.message);
      throw err;
    }
  };

  // Local / Guest Login
  const loginAsGuest = (profileData = {}) => {
    setAuthError(null);
    const { user: guestUser, profile: guestProfile } = authService.createGuestSession(profileData);
    setFirebaseUser(guestUser);
    setUser(guestProfile);
    return guestUser;
  };

  // Reset Password
  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await authService.sendPasswordReset(email);
      return true;
    } catch (err) {
      console.warn('Reset Password notice:', err?.message || err);
      setAuthError(err.message);
      throw err;
    }
  };

  // Logout
  const logoutUser = async () => {
    setAuthError(null);
    try {
      await authService.signOutUser();
    } catch (err) {
      console.warn('Logout notice:', err?.message || err);
    } finally {
      authService.clearStoredGuestSession();
      setFirebaseUser(null);
      setUser(INITIAL_USER);
    }
  };

  const clearAuthError = () => setAuthError(null);

  // Update Profile
  const updateUserProfile = async (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    if (firebaseUser) {
      await firestoreService.saveUserProfile(firebaseUser.uid, updated);
    }
    return updated;
  };

  // Update Settings
  const updateUserSettings = async (updates) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    if (firebaseUser) {
      await firestoreService.saveUserSettings(firebaseUser.uid, updated);
    }
    return updated;
  };

  // Save Session
  const recordSession = async (sessionData) => {
    const uid = firebaseUser?.uid || 'demo-user-01';
    const completeData = {
      ...sessionData,
      userId: uid
    };

    if (firebaseUser) {
      const saved = await firestoreService.saveSession(completeData);
      if (saved) {
        setSessions(prev => [saved, ...prev.filter(s => s.id !== saved.sessionId && s.sessionId !== saved.sessionId)]);
        return saved;
      }
    }

    const fallback = {
      id: `sess-${Date.now()}`,
      sessionId: `sess-${Date.now()}`,
      ...completeData,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setSessions(prev => [fallback, ...prev]);
    return fallback;
  };

  // Bookings
  const addBooking = async (bookingData) => {
    if (firebaseUser) {
      const created = await firestoreService.createBooking(firebaseUser.uid, bookingData);
      if (created) {
        setBookings(prev => [created, ...prev]);
        return created;
      }
    }
    const fallback = {
      id: `bk-${Date.now()}`,
      ...bookingData,
      status: 'upcoming'
    };
    setBookings(prev => [fallback, ...prev]);
    return fallback;
  };

  const removeBooking = async (bookingId) => {
    if (firebaseUser) {
      await firestoreService.cancelBooking(firebaseUser.uid, bookingId);
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  // Bookmarks
  const toggleBookmark = async (signItem) => {
    const signId = signItem.id || signItem.signId || signItem.name;
    const exists = bookmarks.some(b => b.id === signId || b.signId === signId);
    if (exists) {
      if (firebaseUser) {
        await firestoreService.removeBookmark(firebaseUser.uid, signId);
      }
      setBookmarks(prev => prev.filter(b => b.id !== signId && b.signId !== signId));
    } else {
      if (firebaseUser) {
        await firestoreService.saveBookmark(firebaseUser.uid, signItem);
      }
      setBookmarks(prev => [...prev, { id: signId, ...signItem }]);
    }
  };

  const value = {
    firebaseUser,
    user,
    settings,
    sessions,
    bookings,
    bookmarks,
    notifications,
    isLoadingAuth,
    authError,
    isAuthenticated: Boolean(firebaseUser),
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginAsGuest,
    resetPassword,
    logoutUser,
    clearAuthError,
    updateUserProfile,
    updateUserSettings,
    recordSession,
    addBooking,
    removeBooking,
    toggleBookmark,
    setNotifications
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
