import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import RequireAuth from "./components/RequireAuth";
import RequireAdminAuth from "./components/RequireAdminAuth";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Submission from "./pages/Submission";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeamLeaders from "./pages/admin/AdminTeamLeaders";
import AdminAccount from "./pages/admin/AdminAccount";

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  if (isAdminAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  if (isAuthenticated) return <Navigate to="/app/submission" replace />;
  return <Login />;
}

function CatchAllRedirect() {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  if (isAdminAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  if (isAuthenticated) return <Navigate to="/app/submission" replace />;
  return <Navigate to="/login" replace />;
}

function RequireRole({ roles, children }) {
  const { role } = useAdminAuth();
  if (!roles.includes(role)) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function AdminIndexRedirect() {
  return <Navigate to="dashboard" replace />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="submission" element={<Submission />} />
              <Route path="stats" element={<Stats />} />
              <Route path="profile" element={<Profile />} />
              <Route index element={<Navigate to="submission" replace />} />
            </Route>

            <Route
              path="/admin"
              element={
                <RequireAdminAuth>
                  <AdminLayout />
                </RequireAdminAuth>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route
                path="employees"
                element={
                  <RequireRole roles={["ADMIN"]}>
                    <AdminEmployees />
                  </RequireRole>
                }
              />
              <Route
                path="users"
                element={
                  <RequireRole roles={["SUPER_ADMIN"]}>
                    <AdminUsers />
                  </RequireRole>
                }
              />
              <Route
                path="team-leaders"
                element={
                  <RequireRole roles={["SUPER_ADMIN"]}>
                    <AdminTeamLeaders />
                  </RequireRole>
                }
              />
              <Route path="account" element={<AdminAccount />} />
              <Route index element={<AdminIndexRedirect />} />
            </Route>

            <Route path="*" element={<CatchAllRedirect />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
