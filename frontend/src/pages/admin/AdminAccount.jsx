import { useEffect, useState } from "react";
import * as adminApi from "../../api/adminApi";
import Field from "../../components/Field";
import Button from "../../components/Button";
import Toast from "../../components/Toast";

export default function AdminAccount() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    adminApi
      .getAccount()
      .then((d) => setUser(d.user))
      .catch((err) => setError(err.message));
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(null);
    if (!currentPassword || !newPassword) {
      setPwError("Both fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setToast("Password changed.");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Account</h1>
          <p className="admin-page-header__subtitle">Your profile and login security.</p>
        </div>
      </div>

      {error && <div className="banner banner--error" style={{ marginBottom: 16 }}>{error}</div>}

      {user && (
        <div className="admin-card">
          <div className="admin-card__header">
            <h2 className="admin-card__title">Profile</h2>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Name</span>
            <span className="admin-detail-row__value">{user.nameEn}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Employee ID</span>
            <span className="admin-detail-row__value">{user.employeeId}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Role</span>
            <span className="admin-detail-row__value">{user.role === "SUPER_ADMIN" ? "Manager" : "Team Leader"}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Designation</span>
            <span className="admin-detail-row__value">{user.designation || "—"}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Mobile</span>
            <span className="admin-detail-row__value">{user.mobile || "—"}</span>
          </div>
          <div className="admin-detail-row">
            <span className="admin-detail-row__label">Zone</span>
            <span className="admin-detail-row__value">{user.zone || "—"}</span>
          </div>
          {user.manager && (
            <div className="admin-detail-row">
              <span className="admin-detail-row__label">Manager</span>
              <span className="admin-detail-row__value">{user.manager}</span>
            </div>
          )}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card__header">
          <h2 className="admin-card__title">Change password</h2>
        </div>
        <form onSubmit={handleChangePassword}>
          <Field id="cur-pw" label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Current password" />
          <Field id="new-pw" label="New password" type="password" value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" />
          {pwError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{pwError}</div>}
          <Button type="submit" loading={saving}>
            {saving ? "Saving…" : "Change password"}
          </Button>
        </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
