import { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";
import AuthContext from "./authContextValue";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) {
      return;
    }
    const controller = new AbortController();
    api.get("/auth/profile")
      .then((data) => {
        if (!controller.signal.aborted) setUser(data.user);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          if (err.status === 401 || err.status === 403) {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const refreshUser = useCallback(() => {
    return api.get("/auth/profile").then((data) => {
      setUser(data.user);
      return data.user;
    });
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  }, []);

  function login(newToken, userData) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    api.get("/auth/profile")
      .then((data) => setUser(data.user))
      .catch(() => { });
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
