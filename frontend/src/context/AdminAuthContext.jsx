import { createContext, useContext, useMemo, useState, useCallback } from "react";
import * as adminApi from "../api/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(() => adminApi.getAdminSession());

  const login = useCallback(async (employeeId, password) => {
    const result = await adminApi.loginAdmin(employeeId, password);
    setSession(result);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logoutAdmin();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      role: session?.role || null,
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
