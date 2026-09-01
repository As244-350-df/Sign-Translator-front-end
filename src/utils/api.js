import { MOCK_INTERPRETERS, MOCK_BOOKINGS, MOCK_SESSION_HISTORY, MOCK_NOTIFICATIONS, INITIAL_USER } from "../data/mockData";
const BASE_URL = "/api";
const api = {
  // Healthcheck
  async checkHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error("Healthcheck failed");
      return await res.json();
    } catch {
      return { status: "offline", geminiEnabled: false };
    }
  },
  // User Profile
  async getUserProfile() {
    try {
      const res = await fetch(`${BASE_URL}/user/profile`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return data.user;
    } catch {
      return INITIAL_USER;
    }
  },
  async updateUserProfile(updates) {
    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      return data.user;
    } catch {
      return { ...INITIAL_USER, ...updates };
    }
  },
  // Interpreters
  async getInterpreters(params) {
    try {
      const query = new URLSearchParams();
      if (params?.language && params.language !== "ALL") query.set("language", params.language);
      if (params?.specialty && params.specialty !== "all") query.set("specialty", params.specialty);
      if (params?.status && params.status !== "all") query.set("status", params.status);
      if (params?.search) query.set("search", params.search);
      if (params?.minRating) query.set("minRating", params.minRating.toString());
      const url = `${BASE_URL}/interpreters${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch interpreters");
      const data = await res.json();
      return data.interpreters || MOCK_INTERPRETERS;
    } catch {
      return MOCK_INTERPRETERS;
    }
  },
  async getInterpreterById(id) {
    try {
      const res = await fetch(`${BASE_URL}/interpreters/${id}`);
      if (!res.ok) throw new Error("Interpreter not found");
      const data = await res.json();
      return data.interpreter;
    } catch {
      return MOCK_INTERPRETERS.find((i) => i.id === id) || null;
    }
  },
  async matchOnDemand(language = "ASL", specialty) {
    try {
      const res = await fetch(`${BASE_URL}/interpreters/match-ondemand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, specialty })
      });
      if (!res.ok) throw new Error("Failed to match interpreter");
      const data = await res.json();
      return {
        matchedInterpreter: data.matchedInterpreter,
        roomToken: data.roomToken
      };
    } catch {
      return {
        matchedInterpreter: MOCK_INTERPRETERS[0],
        roomToken: `room_fallback_${Date.now()}`
      };
    }
  },
  async updateInterpreterStatus(id, status) {
    try {
      const res = await fetch(`${BASE_URL}/interpreters/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return await res.json();
    } catch {
      return { success: true };
    }
  },
  // Bookings
  async getBookings() {
    try {
      const res = await fetch(`${BASE_URL}/bookings`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      return data.bookings || MOCK_BOOKINGS;
    } catch {
      return MOCK_BOOKINGS;
    }
  },
  async createBooking(bookingData) {
    try {
      const res = await fetch(`${BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      if (!res.ok) throw new Error("Failed to create booking");
      const data = await res.json();
      return data.booking;
    } catch {
      const interp = MOCK_INTERPRETERS.find((i) => i.id === bookingData.interpreterId) || MOCK_INTERPRETERS[0];
      const fallbackBooking = {
        id: `bk-${Date.now()}`,
        interpreterId: interp.id,
        interpreterName: interp.name,
        interpreterAvatar: interp.avatar,
        language: bookingData.language || "ASL",
        date: bookingData.date || "Tomorrow",
        time: bookingData.time || "10:00 AM",
        durationMinutes: bookingData.durationMinutes || 45,
        totalCost: Number((interp.ratePerHour / 60 * (bookingData.durationMinutes || 45)).toFixed(2)),
        status: "upcoming",
        notes: bookingData.notes
      };
      return fallbackBooking;
    }
  },
  async updateBookingStatus(id, status) {
    try {
      const res = await fetch(`${BASE_URL}/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update booking status");
      const data = await res.json();
      return data.booking;
    } catch {
      return null;
    }
  },
  async cancelBooking(id) {
    try {
      const res = await fetch(`${BASE_URL}/bookings/${id}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return true;
    }
  },
  // Sessions & History
  async getSessions() {
    try {
      const res = await fetch(`${BASE_URL}/sessions`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      return data.sessions || MOCK_SESSION_HISTORY;
    } catch {
      return MOCK_SESSION_HISTORY;
    }
  },
  async saveSession(session) {
    try {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session)
      });
      if (!res.ok) throw new Error("Failed to save session");
      const data = await res.json();
      return data.session;
    } catch {
      const fallback = {
        id: `sess-${Date.now()}`,
        type: session.type || "interpreter_call",
        title: session.title || "Live Interpretation Session",
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        duration: session.duration || "15m 00s",
        language: session.language || "ASL",
        interpreterName: session.interpreterName,
        interpreterAvatar: session.interpreterAvatar,
        summary: session.summary || "Completed interpretation call.",
        fullTranscript: session.fullTranscript || [],
        keyTerms: session.keyTerms || ["Real-time", "Sign Language"],
        rating: session.rating || 5,
        notes: session.notes
      };
      return fallback;
    }
  },
  // AI Gemini Enhancements
  async summarizeSessionWithAI(transcript, sessionTitle, language = "ASL") {
    try {
      const res = await fetch(`${BASE_URL}/ai/summarize-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, sessionTitle, language })
      });
      if (!res.ok) throw new Error("AI summary failed");
      const data = await res.json();
      return {
        summary: data.summary,
        keyTerms: data.keyTerms || [],
        actionItems: data.actionItems || []
      };
    } catch {
      return {
        summary: `Successfully completed ${language} interpretation session with full live transcript preservation.`,
        keyTerms: ["Interpretation", "Medical/Technical Terms", "Action Plan"],
        actionItems: ["Review session transcript notes", "Follow up with physician or partner"]
      };
    }
  },
  async translateSignSequenceWithAI(glosses, signLanguage = "ASL") {
    try {
      const res = await fetch(`${BASE_URL}/ai/translate-sequence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ glosses, signLanguage })
      });
      if (!res.ok) throw new Error("Translation sequence failed");
      const data = await res.json();
      return {
        translation: data.translation,
        confidence: data.confidence || 0.95,
        grammaticalNotes: data.grammaticalNotes
      };
    } catch {
      return {
        translation: glosses.join(" ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) + ".",
        confidence: 0.9
      };
    }
  },
  // Notifications
  async getNotifications() {
    try {
      const res = await fetch(`${BASE_URL}/notifications`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      return data.notifications || MOCK_NOTIFICATIONS;
    } catch {
      return MOCK_NOTIFICATIONS;
    }
  },
  async markAllNotificationsRead() {
    try {
      const res = await fetch(`${BASE_URL}/notifications/read-all`, { method: "PATCH" });
      return res.ok;
    } catch {
      return true;
    }
  }
};
export {
  api
};
