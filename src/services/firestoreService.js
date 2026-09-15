import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  serverTimestamp
} from '../lib/firebase';

export const firestoreService = {
  // ----------------------------------------------------
  // User Profile
  // ----------------------------------------------------
  async getUserProfile(userId) {
    const docPath = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return null;
    }
  },

  subscribeUserProfile(userId, onUpdate, onError) {
    const docPath = `users/${userId}`;
    try {
      return onSnapshot(doc(db, 'users', userId), (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data());
        } else {
          onUpdate(null);
        }
      }, (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.GET, docPath);
      });
    } catch (err) {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, docPath);
      return () => {};
    }
  },

  async saveUserProfile(userId, profileData) {
    const docPath = `users/${userId}`;
    try {
      const payload = {
        userId,
        name: profileData.name || 'Anonymous Signer',
        role: profileData.role || 'user_deaf',
        avatar: profileData.avatar || '',
        email: profileData.email || auth.currentUser?.email || '',
        primaryLanguage: profileData.primaryLanguage || 'ASL',
        secondaryLanguage: profileData.secondaryLanguage || 'English',
        bio: profileData.bio || '',
        verified: Boolean(profileData.verified),
        availableStatus: profileData.availableStatus || 'online',
        updatedAt: new Date().toISOString()
      };
      if (profileData.hourlyRate !== undefined) payload.hourlyRate = Number(profileData.hourlyRate);
      if (profileData.rating !== undefined) payload.rating = Number(profileData.rating);
      if (profileData.totalHours !== undefined) payload.totalHours = Number(profileData.totalHours);
      if (profileData.certifications) payload.certifications = profileData.certifications;
      if (profileData.preferences) payload.preferences = profileData.preferences;

      await setDoc(doc(db, 'users', userId), payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return null;
    }
  },

  // ----------------------------------------------------
  // User Private Settings
  // ----------------------------------------------------
  async getUserSettings(userId) {
    const docPath = `users/${userId}/private/settings`;
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'private', 'settings'));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return null;
    }
  },

  async saveUserSettings(userId, settingsData) {
    const docPath = `users/${userId}/private/settings`;
    try {
      const payload = {
        email: settingsData.email || auth.currentUser?.email || 'user@example.com',
        autoSpeakTranslation: Boolean(settingsData.autoSpeakTranslation),
        highContrastCaptions: Boolean(settingsData.highContrastCaptions),
        fontSize: settingsData.fontSize || 'normal',
        hapticFeedback: Boolean(settingsData.hapticFeedback),
        soundEffects: Boolean(settingsData.soundEffects),
        cameraFacing: settingsData.cameraFacing || 'user',
        darkTheme: Boolean(settingsData.darkTheme),
        detectionSensitivity: settingsData.detectionSensitivity || 'balanced',
        speechVoiceRate: Number(settingsData.speechVoiceRate || 1),
        speechVoicePitch: Number(settingsData.speechVoicePitch || 1),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId, 'private', 'settings'), payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return null;
    }
  },

  // ----------------------------------------------------
  // Live Sessions & History
  // ----------------------------------------------------
  subscribeSessions(userId, onUpdate) {
    const colPath = 'sessions';
    try {
      const q = query(
        collection(db, colPath),
        where('userId', '==', userId),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(sessions);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, colPath);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  },

  async saveSession(sessionData) {
    const colPath = 'sessions';
    const sessionId = sessionData.sessionId || `sess-${Date.now()}`;
    const docPath = `sessions/${sessionId}`;
    try {
      const currentUid = auth.currentUser?.uid || sessionData.userId;
      const payload = {
        sessionId,
        type: sessionData.type || 'ai_translation',
        userId: currentUid,
        language: sessionData.language || 'ASL',
        status: sessionData.status || 'completed',
        title: sessionData.title || 'Live Translation Session',
        durationMinutes: sessionData.durationMinutes || 5,
        startedAt: sessionData.startedAt || new Date().toISOString(),
        endedAt: sessionData.endedAt || new Date().toISOString(),
        summary: sessionData.summary || '',
        keyTerms: Array.isArray(sessionData.keyTerms) ? sessionData.keyTerms : [],
        notes: sessionData.notes || '',
        createdAt: new Date().toISOString()
      };

      if (sessionData.interpreterId) {
        payload.interpreterId = sessionData.interpreterId;
        payload.interpreterName = sessionData.interpreterName || 'Interpreter';
      }

      await setDoc(doc(db, 'sessions', sessionId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return null;
    }
  },

  // ----------------------------------------------------
  // Bookings Subcollection (users/{userId}/bookings)
  // ----------------------------------------------------
  subscribeBookings(userId, onUpdate) {
    const colPath = `users/${userId}/bookings`;
    try {
      const q = query(collection(db, 'users', userId, 'bookings'), limit(30));
      return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(bookings);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, colPath);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  },

  async createBooking(userId, bookingData) {
    const bookingId = `bk-${Date.now()}`;
    const docPath = `users/${userId}/bookings/${bookingId}`;
    try {
      const payload = {
        id: bookingId,
        bookingId,
        userId,
        interpreterId: bookingData.interpreterId,
        interpreterName: bookingData.interpreterName,
        interpreterAvatar: bookingData.interpreterAvatar || '',
        language: bookingData.language || 'ASL',
        date: bookingData.date || 'Tomorrow',
        time: bookingData.time || '10:00 AM',
        durationMinutes: bookingData.durationMinutes || 45,
        totalCost: bookingData.totalCost || 50,
        status: 'upcoming',
        notes: bookingData.notes || '',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId, 'bookings', bookingId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
      return null;
    }
  },

  async cancelBooking(userId, bookingId) {
    const docPath = `users/${userId}/bookings/${bookingId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'bookings', bookingId), {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
      return false;
    }
  },

  // ----------------------------------------------------
  // Bookmarks Subcollection (users/{userId}/bookmarks)
  // ----------------------------------------------------
  subscribeBookmarks(userId, onUpdate) {
    const colPath = `users/${userId}/bookmarks`;
    try {
      const q = query(collection(db, 'users', userId, 'bookmarks'), limit(100));
      return onSnapshot(q, (snapshot) => {
        const bookmarks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(bookmarks);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, colPath);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  },

  async saveBookmark(userId, signItem) {
    const signId = signItem.id || signItem.signId || `sign-${Date.now()}`;
    const docPath = `users/${userId}/bookmarks/${signId}`;
    try {
      const payload = {
        id: signId,
        signId,
        name: signItem.name,
        category: signItem.category || 'common',
        language: signItem.language || 'ASL',
        description: signItem.description || '',
        handshape: signItem.handshape || '',
        savedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId, 'bookmarks', signId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
      return null;
    }
  },

  async removeBookmark(userId, signId) {
    const docPath = `users/${userId}/bookmarks/${signId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'bookmarks', signId));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
      return false;
    }
  },

  // ----------------------------------------------------
  // In-App Notifications
  // ----------------------------------------------------
  subscribeNotifications(userId, onUpdate) {
    const colPath = `users/${userId}/notifications`;
    try {
      const q = query(collection(db, 'users', userId, 'notifications'), limit(20));
      return onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(notifs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, colPath);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  }
};
