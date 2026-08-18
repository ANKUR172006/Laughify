/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { getMe, logout as logoutApi } from './service/auth.api';

const AuthContext = createContext(null);
const GUEST_USER = { _id: "guest", username: "Guest", highestLevel: 1, isGuest: true };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (localStorage.getItem("laughify_guest") === "1") {
        setUser(GUEST_USER);
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await logoutApi();
      localStorage.removeItem("laughify_guest");
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      localStorage.removeItem("laughify_guest");
      setUser(null); // Even if API fails, clear local state
    }
  };

  const loginAsGuest = () => {
    localStorage.setItem("laughify_guest", "1");
    setUser(GUEST_USER);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
