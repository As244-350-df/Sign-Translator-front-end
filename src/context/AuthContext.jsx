import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { INITIAL_USER } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(INITIAL_USER);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(true);

      if (currentUser) {
        try {
          const profile = await firestoreService.getUserProfile(currentUser.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            const fallbackProfile = {
              userId: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'SignLink User',
              email: currentUser.email || '',
              avatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
              role: 'user_deaf',
              primaryLanguage: 'ASL',
              secondaryLanguage: 'English',
              verified: currentUser.emailVerified || false,
              availableStatus: 'online',
              createdAt: new Date().toISOString()
            };
            await firestoreService.saveUserProfile(currentUser.uid, fallbackProfile);
            setUserProfile(fallbackProfile);
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
        }
      } else {
        setUserProfile(INITIAL_USER);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const user = await authService.signInWithGoogle();
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    try {
      const user = await authService.signInWithEmail(email, password);
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const registerWithEmail = async (email, password, profileData) => {
    setAuthError(null);
    try {
      const user = await authService.signUpWithEmail(email, password, profileData);
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    try {
      await authService.sendPasswordReset(email);
      return true;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await authService.signOutUser();
      setFirebaseUser(null);
      setUserProfile(INITIAL_USER);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    if (firebaseUser) {
      await firestoreService.saveUserProfile(firebaseUser.uid, updated);
    }
    return updated;
  };

  const clearAuthError = () => setAuthError(null);

  const value = {
    firebaseUser,
    user: userProfile,
    userProfile,
    isAuthenticated: Boolean(firebaseUser),
    loading,
    isLoadingAuth: loading,
    authError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
    logoutUser: logout,
    updateUserProfile,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
