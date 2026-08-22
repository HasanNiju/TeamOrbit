import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import Field from "../components/Field";
import Button from "../components/Button";

export default function Login() {
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
      const redirectTo = location.state?.from || "/app/submission";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code === "INACTIVE_ACCOUNT") setError(t("login.errorInactive"));
      else setError(t("login.errorInvalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand__mark">TO</div>
        <h1 className="login-brand__title">{t("appName")}</h1>
        <p className="login-brand__subtitle">{t("login.subtitle")}</p>
      </div>

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
    </div>
  );
}
