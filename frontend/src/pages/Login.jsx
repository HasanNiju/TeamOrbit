import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import Field from "../components/Field";
import Button from "../components/Button";

function UserLoginForm() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim() || !password) {
      setError(t("login.errorRequired"));
      return;
    }

    setLoading(true);
    try {
      await login(employeeId.trim(), password);
      const redirectTo = location.state?.from && location.state?.mode !== "admin" ? location.state.from : "/app/submission";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code === "INACTIVE_ACCOUNT") setError(t("login.errorInactive"));
      else setError(t("login.errorInvalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field
        id="employeeId"
        label={t("login.employeeId")}
        value={employeeId}
        onChange={setEmployeeId}
        placeholder={t("login.employeeIdPlaceholder")}
        autoComplete="username"
      />
      <Field
        id="password"
        label={t("login.password")}
        value={password}
        onChange={setPassword}
        type="password"
        placeholder={t("login.passwordPlaceholder")}
        autoComplete="current-password"
      />

      {error && (
        <div className="banner banner--error" role="alert" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      <Button type="submit" loading={loading}>
        {loading ? t("login.loading") : t("login.submit")}
      </Button>
    </form>
  );
}

function AdminLoginForm() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!employeeId.trim() || !password) {
      setError("Employee ID and password are required.");
      return;
    }

    setLoading(true);
    try {
      await login(employeeId.trim(), password);
      const redirectTo = location.state?.from && location.state?.mode === "admin" ? location.state.from : "/admin/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code === "INACTIVE_ACCOUNT") setError("This account has been deactivated.");
      else setError("Employee ID or password is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Field
        id="adminEmployeeId"
        label="Employee ID"
        value={employeeId}
        onChange={setEmployeeId}
        placeholder="e.g. TL-001 or SA-001"
        autoComplete="username"
      />
      <Field
        id="adminPassword"
        label="Password"
        value={password}
        onChange={setPassword}
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
      />

      {error && (
        <div className="banner banner--error" role="alert" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      <Button type="submit" loading={loading}>
        {loading ? "Signing in..." : "Sign in to Dashboard"}
      </Button>
    </form>
  );
}

export default function Login() {
  const { t } = useLanguage();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode === "admin" ? "admin" : "user");

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand__mark">TO</div>
        <h1 className="login-brand__title">{t("appName")}</h1>
        <p className="login-brand__subtitle">
          {mode === "admin" ? "Team Leader & Manager Dashboard" : t("login.subtitle")}
        </p>
      </div>

      <div className="login-mode-toggle" role="tablist" aria-label="Login as">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "user"}
          className={`login-mode-toggle__btn ${mode === "user" ? "login-mode-toggle__btn--active" : ""}`}
          onClick={() => setMode("user")}
        >
          Login as User
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "admin"}
          className={`login-mode-toggle__btn ${mode === "admin" ? "login-mode-toggle__btn--active" : ""}`}
          onClick={() => setMode("admin")}
        >
          Login as Admin
        </button>
      </div>

      {mode === "user" ? <UserLoginForm /> : <AdminLoginForm />}
    </div>
  );
}
