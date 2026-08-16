import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../api/mockApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => api.getSession());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!session?.employeeId) return;
    setProfileLoading(true);
    try {
      const data = await api.getProfile(session.employeeId);
      setProfile(data);
    } finally {
      setProfileLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) refreshProfile();
    else setProfile(null);
  }, [session, refreshProfile]);

  const login = useCallback(async (employeeId, password) => {
    const result = await api.login(employeeId, password);
    setSession(result);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      profile,
      profileLoading,
      login,
      logout,
      refreshProfile,
    }),
    [session, profile, profileLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
