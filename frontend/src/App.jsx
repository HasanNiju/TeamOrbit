import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import RequireAuth from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Submission from "./pages/Submission";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/app/submission" replace />;
  return <Login />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
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

          <Route path="*" element={<Navigate to="/app/submission" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
