import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FirebaseProvider } from "./context/FirebaseContext.jsx";
import "./index.css";

// Intercept and prevent benign Vite HMR websocket connection errors from bubbling up
// as unhandled rejections in sandboxed container environments where HMR is disabled.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = (typeof reason === "string" ? reason : reason?.message || String(reason)) || "";
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("closed without opened") ||
      msg.includes("failed to connect to websocket")
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("closed without opened")
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <FirebaseProvider>
          <App />
        </FirebaseProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
