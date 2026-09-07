import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import RequireAuth from "./components/RequireAuth";
import RequireAdminAuth from "./components/RequireAdminAuth";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";

// Route-level code splitting: most people who load this app are Marketing
// Officers filling out one submission form, not admins — they shouldn't
// have to download the entire admin panel bundle first. Splitting each
// page into its own chunk (and the employee app separately from the admin
// panel) means a phone on a slow connection only fetches the JS it's
// actually going to use for the screen it lands on.
const Submission = lazy(() => import("./pages/Submission"));
const Stats = lazy(() => import("./pages/Stats"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminEmployees = lazy(() => import("./pages/admin/AdminEmployees"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminTeamLeaders = lazy(() => import("./pages/admin/AdminTeamLeaders"));
const AdminAccount = lazy(() => import("./pages/admin/AdminAccount"));

function RouteFallback() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </AdminAuthProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
