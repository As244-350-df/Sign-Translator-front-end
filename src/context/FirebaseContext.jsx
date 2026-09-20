import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth
} from '../lib/firebase';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { SessionManager } from '../utils/security';
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
  const [interpreters, setInterpreters] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Load and subscribe to live interpreters from Firestore
  useEffect(() => {
    let isMounted = true;
    const loadInterpreters = async () => {
      try {
        const liveList = await firestoreService.getInterpreters();
        if (isMounted && liveList && liveList.length > 0) {
          setInterpreters(liveList);
        }
      } catch (err) {
        console.warn('Initial interpreter fetch notice:', err?.message);
      }
    };
    loadInterpreters();

    // Subscribe to real-time interpreter status changes in Firestore
    const unsubscribeInterpreters = firestoreService.subscribeInterpreters((updatedList) => {
      if (isMounted && updatedList && updatedList.length > 0) {
        setInterpreters((prev) => {
          // Merge with any existing user-based interpreters
          const map = new Map();
          updatedList.forEach(item => map.set(item.id || item.interpreterId, item));
          prev.forEach(item => {
            const id = item.id || item.interpreterId;
            if (!map.has(id)) map.set(id, item);
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribeInterpreters();
    };
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      if (currentUser) {
        // Enforce 7-Day Session Expiration Policy
        if (SessionManager.isSessionExpired(currentUser.uid)) {
          console.warn('[Security] User session expired (> 7 days). Logging out.');
          try {
            await authService.signOutUser();
          } catch {}
          SessionManager.clearSession(currentUser.uid);
          authService.clearStoredGuestSession();
          setFirebaseUser(null);
          setUser(INITIAL_USER);
          setAuthError('Your session expired after 7 days for security. Please sign in again.');
          setIsLoadingAuth(false);
          return;
        }

        // Initialize / refresh 7-day session record
        SessionManager.initSession(currentUser.uid, currentUser.email);
        setFirebaseUser(currentUser);
        setIsLoadingAuth(false);

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
        setFirebaseUser(null);
        setIsLoadingAuth(false);
        // Check for stored guest session
        const storedGuest = authService.getStoredGuestSession();
        if (storedGuest?.user && storedGuest?.profile) {
          // Check guest session 7-day expiry as well
          if (SessionManager.isSessionExpired(storedGuest.user.uid)) {
            authService.clearStoredGuestSession();
            SessionManager.clearSession(storedGuest.user.uid);
            setUser(INITIAL_USER);
          } else {
            SessionManager.initSession(storedGuest.user.uid, 'guest@signlink.app');
            setFirebaseUser(storedGuest.user);
            setUser(storedGuest.profile);
          }
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
      if (firebaseUser?.uid) {
        SessionManager.clearSession(firebaseUser.uid);
      }
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
    const uid = firebaseUser?.uid || user?.userId || user?.id || 'client-demo-01';
    const clientName = user?.name || bookingData.clientName || 'Client';
    const payload = {
      ...bookingData,
      clientName,
      clientUserId: uid
    };

    try {
      const created = await firestoreService.createBooking(uid, payload);
      if (created) {
        setBookings(prev => [created, ...prev.filter(b => b.id !== created.id)]);
        return created;
      }
    } catch (err) {
      console.warn('Booking create notice:', err);
    }

    const fallback = {
      id: `bk-${Date.now()}`,
      ...payload,
      status: 'upcoming'
    };
    setBookings(prev => [fallback, ...prev]);
    return fallback;
  };

  const removeBooking = async (bookingId) => {
    const uid = firebaseUser?.uid || user?.userId || user?.id || 'client-demo-01';
    await firestoreService.cancelBooking(uid, bookingId).catch(() => {});
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  // Real-Time Calls Dispatch
  const initiateCall = async (callParams) => {
    const clientUid = firebaseUser?.uid || user?.userId || user?.id || 'client-user';
    const clientName = user?.name || 'SignLink Client';
    const clientAvatar = user?.avatar || '';
    return await firestoreService.initiateCall({
      clientUserId: clientUid,
      clientName,
      clientAvatar,
      ...callParams
    });
  };

  const acceptCall = async (sessionId, interpreterData) => {
    return await firestoreService.acceptCall(sessionId, interpreterData || {
      name: user?.name,
      avatar: user?.avatar
    });
  };

  const declineCall = async (sessionId, reason) => {
    return await firestoreService.declineCall(sessionId, reason);
  };

  const searchDatabase = async (searchTerm, options) => {
    return await firestoreService.searchDatabase(searchTerm, options);
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

  // Live Interpreters Refresh & Publishing
  const refreshInterpreters = async (filters = {}) => {
    try {
      const list = await firestoreService.getInterpreters(filters);
      if (list && list.length > 0) {
        setInterpreters(list);
      }
      return list;
    } catch (err) {
      console.warn('Refresh interpreters error:', err);
      return interpreters;
    }
  };

  const publishAsInterpreter = async (customDetails = {}) => {
    const uid = firebaseUser?.uid || user?.userId || 'guest-interpreter';
    const profile = {
      name: user?.name || 'Registered Interpreter',
      title: customDetails.title || 'Certified ASL / English Interpreter',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      ratePerHour: Number(customDetails.ratePerHour || 65),
      ratePerMinute: 1.10,
      languages: customDetails.languages || ['ASL', 'English'],
      spokenLanguages: ['English'],
      specialties: customDetails.specialties || ['Medical & Healthcare', 'Legal', 'Educational'],
      availableStatus: 'online',
      bio: customDetails.bio || 'Certified sign language interpreter active and ready for live video interpretation.',
      certifications: ['RID NIC-Master', 'BEI Advanced'],
      availableSlots: ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
      experienceYears: 6,
      completedSessions: 42,
      verified: true
    };

    if (firebaseUser) {
      await firestoreService.saveInterpreterProfile(uid, profile);
      await firestoreService.saveUserProfile(uid, {
        ...user,
        role: 'interpreter',
        availableStatus: 'online'
      });
      setUser(prev => ({ ...prev, role: 'interpreter', availableStatus: 'online' }));
    }

    setInterpreters(prev => {
      const filtered = prev.filter(i => (i.id || i.interpreterId) !== uid);
      return [{ id: uid, interpreterId: uid, ...profile, isFirebaseUser: true }, ...filtered];
    });

    return profile;
  };

  const updateInterpreterStatus = async (status) => {
    const uid = firebaseUser?.uid || user?.userId;
    if (uid && firebaseUser) {
      await firestoreService.updateInterpreterStatus(uid, status);
    }
    setUser(prev => ({ ...prev, availableStatus: status }));
    setInterpreters(prev => prev.map(i => (i.id === uid || i.interpreterId === uid) ? { ...i, availableStatus: status } : i));
  };

  const value = {
    firebaseUser,
    user,
    settings,
    sessions,
    bookings,
    bookmarks,
    notifications,
    interpreters,
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
    initiateCall,
    acceptCall,
    declineCall,
    searchDatabase,
    toggleBookmark,
    setNotifications,
    refreshInterpreters,
    publishAsInterpreter,
    updateInterpreterStatus
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
