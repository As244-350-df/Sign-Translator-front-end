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

      // If user is an interpreter, auto-sync their public marketplace profile
      if (payload.role === 'interpreter') {
        await firestoreService.saveInterpreterProfile(userId, {
          name: payload.name,
          title: profileData.title || 'Certified ASL Interpreter',
          avatar: payload.avatar,
          ratePerHour: Number(profileData.hourlyRate || 65),
          ratePerMinute: Number(profileData.ratePerMinute || 1.10),
          languages: profileData.languages || [payload.primaryLanguage || 'ASL', payload.secondaryLanguage || 'English'],
          spokenLanguages: profileData.spokenLanguages || [payload.secondaryLanguage || 'English'],
          specialties: profileData.specialties || ['Medical', 'Legal', 'Educational'],
          availableStatus: payload.availableStatus || 'online',
          bio: payload.bio || 'Certified sign language interpreter registered on SignLink.',
          certifications: profileData.certifications || ['RID Certified', 'State Licensed'],
          availableSlots: profileData.availableSlots || ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
          rating: Number(profileData.rating || 5.0),
          reviewsCount: Number(profileData.reviewsCount || 1),
          verified: true
        }).catch(err => console.warn('Interpreter public sync notice:', err.message));
      }

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
        date: sessionData.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        duration: sessionData.duration || `${sessionData.durationMinutes || 15}m 00s`,
        durationMinutes: sessionData.durationMinutes || 15,
        startedAt: sessionData.startedAt || new Date().toISOString(),
        endedAt: sessionData.endedAt || new Date().toISOString(),
        summary: sessionData.summary || '',
        fullTranscript: Array.isArray(sessionData.fullTranscript)
          ? sessionData.fullTranscript
          : Array.isArray(sessionData.transcript)
          ? sessionData.transcript
          : [],
        keyTerms: Array.isArray(sessionData.keyTerms) ? sessionData.keyTerms : [],
        notes: sessionData.notes || '',
        rating: typeof sessionData.rating === 'number' ? sessionData.rating : 5,
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

      // If interpreterId is present, also notify and record under interpreter's bookings
      if (bookingData.interpreterId) {
        // Copy to interpreter's bookings
        await setDoc(doc(db, 'users', bookingData.interpreterId, 'bookings', bookingId), {
          ...payload,
          clientUserId: userId,
          clientName: bookingData.clientName || 'SignLink Client'
        }).catch(() => {});

        // Send in-app notification to interpreter
        await firestoreService.sendNotification(bookingData.interpreterId, {
          title: 'New Client Appointment Booked',
          message: `${bookingData.clientName || 'A client'} booked an appointment for ${payload.date} at ${payload.time}.`,
          type: 'booking_new'
        }).catch(() => {});

        // Initialize Firestore session document for this appointment
        const sessionId = bookingId;
        await setDoc(doc(db, 'sessions', sessionId), {
          sessionId,
          type: 'scheduled_booking',
          userId,
          interpreterId: bookingData.interpreterId,
          interpreterName: bookingData.interpreterName || 'Interpreter',
          interpreterAvatar: bookingData.interpreterAvatar || '',
          language: bookingData.language || 'ASL',
          status: 'matched',
          title: `Scheduled Session with ${bookingData.interpreterName || 'Interpreter'}`,
          durationMinutes: bookingData.durationMinutes || 45,
          totalCost: bookingData.totalCost || 50,
          startedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }

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
  },

  async sendNotification(userId, notification) {
    const notifId = `notif-${Date.now()}`;
    const docPath = `users/${userId}/notifications/${notifId}`;
    try {
      const payload = {
        id: notifId,
        notificationId: notifId,
        title: notification.title || 'Session Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        read: false,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userId, 'notifications', notifId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
      return null;
    }
  },

  // ----------------------------------------------------
  // Certified Interpreters Marketplace Directory
  // ----------------------------------------------------
  async getInterpreters(filters = {}) {
    const colPath = 'interpreters';
    try {
      const snap = await getDocs(collection(db, colPath));
      let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Also discover any registered Firebase users who have role == 'interpreter'
      try {
        const userQuery = query(collection(db, 'users'), where('role', '==', 'interpreter'), limit(30));
        const userSnap = await getDocs(userQuery);
        const userInterpreters = userSnap.docs.map(d => {
          const u = d.data();
          return {
            id: u.userId || d.id,
            interpreterId: u.userId || d.id,
            name: u.name,
            title: u.title || 'Certified ASL Interpreter',
            avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            rating: u.rating || 5.0,
            reviewsCount: u.reviewsCount || 1,
            verified: u.verified ?? true,
            ratePerHour: u.hourlyRate || u.ratePerHour || 65,
            ratePerMinute: u.ratePerMinute || 1.10,
            languages: u.languages || [u.primaryLanguage || 'ASL', u.secondaryLanguage || 'English'],
            spokenLanguages: u.spokenLanguages || [u.secondaryLanguage || 'English'],
            specialties: u.specialties || ['Medical & Healthcare', 'General Consultation'],
            availableStatus: u.availableStatus || 'online',
            bio: u.bio || 'Certified sign language interpreter registered on SignLink.',
            certifications: u.certifications || ['RID Certified', 'NIC Master'],
            availableSlots: u.availableSlots || ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
            experienceYears: u.experienceYears || 5,
            completedSessions: u.completedSessions || 12,
            isFirebaseUser: true
          };
        });

        // Merge and deduplicate by ID
        const existingIds = new Set(results.map(r => r.id || r.interpreterId));
        userInterpreters.forEach(ui => {
          if (!existingIds.has(ui.id)) {
            results.push(ui);
            existingIds.add(ui.id);
          }
        });
      } catch (userErr) {
        console.warn('Could not query users collection for interpreters:', userErr.message);
      }

      // Filter by language
      if (filters.language && filters.language !== 'ALL') {
        results = results.filter(i => 
          Array.isArray(i.languages) && i.languages.includes(filters.language)
        );
      }

      // Filter by specialty
      if (filters.specialty && filters.specialty !== 'all') {
        const spec = filters.specialty.toLowerCase();
        results = results.filter(i => 
          Array.isArray(i.specialties) && i.specialties.some(s => s.toLowerCase().includes(spec))
        );
      }

      // Filter by online status
      if (filters.status && filters.status !== 'all') {
        results = results.filter(i => i.availableStatus === filters.status);
      }

      // Filter by text search
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        results = results.filter(i => 
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.bio && i.bio.toLowerCase().includes(q)) ||
          (Array.isArray(i.specialties) && i.specialties.some(s => s.toLowerCase().includes(q)))
        );
      }

      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return [];
    }
  },

  subscribeInterpreters(onUpdate) {
    const colPath = 'interpreters';
    try {
      return onSnapshot(collection(db, colPath), (snapshot) => {
        const interpreters = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(interpreters);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, colPath);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  },

  async getInterpreterById(interpreterId) {
    try {
      const snap = await getDoc(doc(db, 'interpreters', interpreterId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      // Check in users collection
      const userSnap = await getDoc(doc(db, 'users', interpreterId));
      if (userSnap.exists()) {
        const u = userSnap.data();
        return {
          id: interpreterId,
          interpreterId,
          name: u.name,
          title: u.title || 'Certified ASL Interpreter',
          avatar: u.avatar,
          rating: u.rating || 5.0,
          reviewsCount: u.reviewsCount || 1,
          verified: u.verified ?? true,
          ratePerHour: u.hourlyRate || u.ratePerHour || 65,
          ratePerMinute: u.ratePerMinute || 1.10,
          languages: u.languages || [u.primaryLanguage || 'ASL', u.secondaryLanguage || 'English'],
          spokenLanguages: u.spokenLanguages || [u.secondaryLanguage || 'English'],
          specialties: u.specialties || ['Medical & Healthcare', 'General Consultation'],
          availableStatus: u.availableStatus || 'online',
          bio: u.bio || 'Certified sign language interpreter registered on SignLink.',
          certifications: u.certifications || ['RID Certified'],
          availableSlots: u.availableSlots || ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
          experienceYears: u.experienceYears || 5,
          completedSessions: u.completedSessions || 12,
          isFirebaseUser: true
        };
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `interpreters/${interpreterId}`);
      return null;
    }
  },

  async saveInterpreterProfile(interpreterId, data) {
    const docPath = `interpreters/${interpreterId}`;
    try {
      const payload = {
        interpreterId,
        name: data.name || 'Certified Interpreter',
        title: data.title || 'Certified ASL Interpreter',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        coverImage: data.coverImage || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
        rating: Number(data.rating || 4.95),
        reviewsCount: Number(data.reviewsCount || 1),
        verified: Boolean(data.verified ?? true),
        ratePerHour: Number(data.ratePerHour || 65),
        ratePerMinute: Number(data.ratePerMinute || 1.10),
        languages: Array.isArray(data.languages) ? data.languages : ['ASL', 'English'],
        spokenLanguages: Array.isArray(data.spokenLanguages) ? data.spokenLanguages : ['English'],
        specialties: Array.isArray(data.specialties) ? data.specialties : ['Medical', 'Legal', 'Educational'],
        availableStatus: ['online', 'busy', 'offline'].includes(data.availableStatus) ? data.availableStatus : 'online',
        bio: data.bio || 'Certified sign language interpreter ready for real-time video calls.',
        certifications: Array.isArray(data.certifications) ? data.certifications : ['RID Certified'],
        availableSlots: Array.isArray(data.availableSlots) ? data.availableSlots : ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'],
        totalHours: Number(data.totalHours || 80),
        experienceYears: Number(data.experienceYears || 5),
        completedSessions: Number(data.completedSessions || 24),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'interpreters', interpreterId), payload, { merge: true });
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return null;
    }
  },

  async updateInterpreterStatus(interpreterId, status) {
    const docPath = `interpreters/${interpreterId}`;
    try {
      if (!['online', 'busy', 'offline'].includes(status)) {
        throw new Error('Invalid status value');
      }
      await updateDoc(doc(db, 'interpreters', interpreterId), {
        availableStatus: status,
        updatedAt: new Date().toISOString()
      });
      // Also update users collection if exists
      await updateDoc(doc(db, 'users', interpreterId), {
        availableStatus: status,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
      return false;
    }
  },

  // ----------------------------------------------------
  // Live Session Transcript Sync
  // ----------------------------------------------------
  async addSessionTranscript(sessionId, entry) {
    const entryId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const docPath = `sessions/${sessionId}/transcript/${entryId}`;
    try {
      const payload = {
        id: entryId,
        speaker: entry.speaker || 'Signer',
        text: String(entry.text || '').slice(0, 2000),
        confidence: entry.confidence || 0.95,
        timestamp: entry.timestamp || new Date().toISOString()
      };
      await setDoc(doc(db, 'sessions', sessionId, 'transcript', entryId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
      return null;
    }
  },

  // ----------------------------------------------------
  // Real-Time Incoming Calls & Dispatch
  // ----------------------------------------------------
  async initiateCall({
    clientUserId,
    clientName = 'Client',
    clientAvatar = '',
    interpreterId,
    interpreterName = 'Certified Interpreter',
    language = 'ASL',
    urgency = 'urgent',
    meetingRoomId = null,
    notes = ''
  }) {
    const sessionId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const docPath = `sessions/${sessionId}`;
    try {
      const payload = {
        id: sessionId,
        sessionId,
        type: 'interpreter_call',
        userId: clientUserId || auth.currentUser?.uid || 'client-user',
        clientName,
        clientAvatar,
        interpreterId,
        interpreterName,
        language,
        urgency,
        status: 'pending', // 'pending' = ringing on interpreter's dashboard
        meetingRoomId: meetingRoomId || `room-${sessionId}`,
        title: `Live Call: ${clientName} (${language})`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        duration: "In Progress",
        summary: `Real-time sign language interpretation call with ${interpreterName}.`,
        fullTranscript: [],
        keyTerms: ["Live Call", language],
        notes,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'sessions', sessionId), payload);

      // In-app alert notification directly to the interpreter's profile
      if (interpreterId) {
        await firestoreService.sendNotification(interpreterId, {
          title: '⚡ Incoming Live Video Call',
          message: `${clientName} is calling for real-time ${language} interpretation.`,
          type: 'incoming_call',
          sessionId,
          clientName,
          language
        }).catch(() => {});
      }

      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
      return null;
    }
  },

  subscribeIncomingCalls(interpreterId, onCallsUpdate) {
    const colPath = 'sessions';
    try {
      if (!interpreterId) return () => {};
      
      // Query sessions where interpreterId matches and status is 'pending'
      const q = query(
        collection(db, colPath),
        where('interpreterId', '==', interpreterId),
        where('status', '==', 'pending'),
        limit(5)
      );

      return onSnapshot(q, (snapshot) => {
        const pendingCalls = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onCallsUpdate(pendingCalls);
      }, (err) => {
        console.warn('Incoming calls subscription notice:', err?.message);
        // Fallback: general query for any active pending calls
        try {
          const fallbackQ = query(
            collection(db, colPath),
            where('status', '==', 'pending'),
            limit(10)
          );
          return onSnapshot(fallbackQ, (snap) => {
            const calls = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(c => !c.interpreterId || c.interpreterId === interpreterId);
            onCallsUpdate(calls);
          });
        } catch (fbErr) {
          console.warn('Fallback incoming call query notice:', fbErr?.message);
        }
      });
    } catch (err) {
      console.warn('Error creating incoming calls listener:', err);
      return () => {};
    }
  },

  async acceptCall(sessionId, interpreterData = {}) {
    const docPath = `sessions/${sessionId}`;
    try {
      const updates = {
        status: 'in_progress',
        acceptedAt: new Date().toISOString(),
        ...(interpreterData?.name ? { interpreterName: interpreterData.name } : {}),
        ...(interpreterData?.avatar ? { interpreterAvatar: interpreterData.avatar } : {})
      };
      await updateDoc(doc(db, 'sessions', sessionId), updates);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
      return false;
    }
  },

  async declineCall(sessionId, reason = 'declined') {
    const docPath = `sessions/${sessionId}`;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'declined',
        declineReason: reason,
        endedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
      return false;
    }
  },

  subscribeCallStatus(sessionId, onStatusChange) {
    if (!sessionId) return () => {};
    const docPath = `sessions/${sessionId}`;
    try {
      return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
        if (snap.exists()) {
          onStatusChange({ id: snap.id, ...snap.data() });
        }
      }, (err) => {
        console.warn('Call status subscription notice:', err?.message);
      });
    } catch (err) {
      return () => {};
    }
  },

  // ----------------------------------------------------
  // Real-Time Interpreter Bookings Subscription
  // ----------------------------------------------------
  subscribeInterpreterBookings(interpreterId, onUpdate) {
    if (!interpreterId) return () => {};
    const colPath = `users/${interpreterId}/bookings`;
    try {
      const q = query(
        collection(db, 'users', interpreterId, 'bookings'),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(bookings);
      }, (err) => {
        console.warn('Interpreter bookings listener notice:', err?.message);
      });
    } catch (err) {
      console.warn('Error subscribing to interpreter bookings:', err);
      return () => {};
    }
  },

  // ----------------------------------------------------
  // Real-Time Direct Database Search (Interpreters & Users)
  // ----------------------------------------------------
  async searchDatabase(searchTerm = '', options = {}) {
    const term = (searchTerm || '').toLowerCase().trim();
    const results = {
      interpreters: [],
      users: [],
      totalCount: 0,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Query 'interpreters' collection directly from Firestore
      const interpSnap = await getDocs(collection(db, 'interpreters'));
      let interpList = interpSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        recordType: 'interpreter'
      }));

      // 2. Query 'users' collection directly from Firestore
      const usersSnap = await getDocs(collection(db, 'users'));
      let userList = usersSnap.docs.map(d => ({
        id: d.id,
        userId: d.id,
        ...d.data(),
        recordType: d.data().role === 'interpreter' ? 'interpreter' : 'user'
      }));

      // Merge interpreters found in users collection into interpreter list if not duplicate
      const interpIds = new Set(interpList.map(i => i.id || i.interpreterId));
      userList.forEach(u => {
        if (u.role === 'interpreter') {
          const id = u.userId || u.id;
          if (!interpIds.has(id)) {
            interpList.push({
              id,
              interpreterId: id,
              name: u.name,
              title: u.title || 'Certified ASL Interpreter',
              avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              rating: u.rating || 5.0,
              reviewsCount: u.reviewsCount || 1,
              verified: u.verified ?? true,
              ratePerHour: u.hourlyRate || u.ratePerHour || 65,
              ratePerMinute: u.ratePerMinute || 1.10,
              languages: u.languages || [u.primaryLanguage || 'ASL'],
              spokenLanguages: u.spokenLanguages || [u.secondaryLanguage || 'English'],
              specialties: u.specialties || ['Medical & Healthcare', 'Corporate'],
              availableStatus: u.availableStatus || 'online',
              bio: u.bio || 'Certified sign language interpreter.',
              recordType: 'interpreter',
              isFirebaseUser: true
            });
            interpIds.add(id);
          }
        }
      });

      // Filter interpreters
      let filteredInterpreters = interpList;
      if (options.language && options.language !== 'ALL') {
        filteredInterpreters = filteredInterpreters.filter(i =>
          Array.isArray(i.languages) && i.languages.includes(options.language)
        );
      }
      if (options.specialty && options.specialty !== 'ALL') {
        const spec = options.specialty.toLowerCase();
        filteredInterpreters = filteredInterpreters.filter(i =>
          Array.isArray(i.specialties) && i.specialties.some(s => s.toLowerCase().includes(spec))
        );
      }
      if (options.onlineOnly) {
        filteredInterpreters = filteredInterpreters.filter(i => i.availableStatus === 'online');
      }

      if (term) {
        filteredInterpreters = filteredInterpreters.filter(i => {
          const matchName = i.name && i.name.toLowerCase().includes(term);
          const matchTitle = i.title && i.title.toLowerCase().includes(term);
          const matchBio = i.bio && i.bio.toLowerCase().includes(term);
          const matchSpecialty = Array.isArray(i.specialties) && i.specialties.some(s => s.toLowerCase().includes(term));
          const matchLang = Array.isArray(i.languages) && i.languages.some(l => l.toLowerCase().includes(term));
          return matchName || matchTitle || matchBio || matchSpecialty || matchLang;
        });

        // Also filter regular users if searching users
        results.users = userList.filter(u => {
          const matchName = u.name && u.name.toLowerCase().includes(term);
          const matchRole = u.role && u.role.toLowerCase().includes(term);
          const matchLang = u.primaryLanguage && u.primaryLanguage.toLowerCase().includes(term);
          const matchEmail = u.email && u.email.toLowerCase().includes(term);
          return matchName || matchRole || matchLang || matchEmail;
        });
      } else {
        results.users = userList;
      }

      results.interpreters = filteredInterpreters;
      results.totalCount = results.interpreters.length + results.users.length;
      return results;
    } catch (err) {
      console.warn('Direct database search notice:', err?.message);
      return results;
    }
  }
};
