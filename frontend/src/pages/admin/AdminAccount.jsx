import { useEffect, useRef, useState } from "react";
import * as adminApi from "../../api/adminApi";
import Field from "../../components/Field";
import Button from "../../components/Button";
import Toast from "../../components/Toast";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AdminAccount() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [formError, setFormError] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const [toast, setToast] = useState(null);

  function load() {
    adminApi
      .getAccount()
      .then((d) => setUser(d.user))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function startEditing() {
    setDraft({ name: user.nameEn || user.name, mobile: user.mobile || "", zone: user.zone || "", address: user.address || "" });
    setFormError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFormError(null);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setFormError(null);
    if (!draft.name?.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      const { user: updated } = await adminApi.updateAccount(draft);
      setUser(updated);
      setEditing(false);
      setToast("Profile updated.");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Only JPEG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be under 5MB.");
      return;
    }
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      const { user: updated } = await adminApi.uploadAccountPhoto(file);
      setUser(updated);
      setToast("Photo updated.");
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

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
    setSavingPw(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setToast("Password changed.");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setSavingPw(false);
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
            {!editing && (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={startEditing}>
                Edit
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div className="profile-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {user.photo ? <img src={user.photo} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : (user.nameEn || user.name || "?").slice(0, 1)}
            </div>
            <div>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? "Uploading…" : "Change photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePhotoPick}
              />
              {photoError && <div className="field__error" role="alert" style={{ marginTop: 6 }}>{photoError}</div>}
            </div>
          </div>

          {!editing ? (
            <>
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
              <div className="admin-detail-row">
                <span className="admin-detail-row__label">Address</span>
                <span className="admin-detail-row__value">{user.address || "—"}</span>
              </div>
              {user.manager && (
                <div className="admin-detail-row">
                  <span className="admin-detail-row__label">Manager</span>
                  <span className="admin-detail-row__value">{user.manager}</span>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <Field id="acc-name" label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Full name" />
              <Field id="acc-mobile" label="Mobile" value={draft.mobile} onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))} placeholder="017XXXXXXXX" />
              <Field id="acc-zone" label="Zone" value={draft.zone} onChange={(v) => setDraft((d) => ({ ...d, zone: v }))} placeholder="Dhaka North" />
              <Field id="acc-address" label="Address" value={draft.address} onChange={(v) => setDraft((d) => ({ ...d, address: v }))} placeholder="Address" multiline />
              {formError && <div className="banner banner--error" style={{ marginBottom: 14 }}>{formError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <Button type="button" variant="secondary" onClick={cancelEditing} disabled={savingProfile}>
                  Cancel
                </Button>
                <Button type="submit" loading={savingProfile}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
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
          <Button type="submit" loading={savingPw}>
            {savingPw ? "Saving…" : "Change password"}
          </Button>
        </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
