import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./features/auth/authContext";
import { GameProvider } from "./features/game/context/GameContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);