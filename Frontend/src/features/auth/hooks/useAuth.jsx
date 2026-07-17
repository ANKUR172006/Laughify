import { login, register } from "../service/auth.api";
import { useAuthContext } from "../authContext";
import { useState } from "react";

export const useAuth = () => {
  const { user, loading, setUser, logout } = useAuthContext();
  const [authLoading, setAuthLoading] = useState(false);

  async function handleRegister({ username, email, password }) {
    setAuthLoading(true);
    try {
      const data = await register({ username, email, password });
      if (data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      // If error has response (from axios), use that message, otherwise use err.message
      const errorMessage = err.response?.data?.message || err.message || "Registration failed";
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin({ identifier, password }) {
    setAuthLoading(true);
    try {
      const data = await login({ identifier, password });
      if (data.success) {
        setUser(data.user);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Login failed";
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  }

  return {
    user,
    loading: loading || authLoading,
    handleRegister,
    handleLogin,
    handleLogout: logout,
  };
};
