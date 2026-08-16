import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { formatNumber } from "../utils/banglaNumerals";
import { isValidBangladeshMobile } from "../utils/validation";
import * as api from "../api/mockApi";
import Field from "../components/Field";
import Button from "../components/Button";
import Toast from "../components/Toast";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB, per PRD §49
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Profile() {
  const { t, language, setLanguage } = useLanguage();
  const { profile, profileLoading, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [photoError, setPhotoError] = useState(null);

  useEffect(() => {
    if (profile && !editing) {
      setDraft({ name: profile.name, mobile: profile.mobile, address: profile.address, photo: profile.photo });
    }
  }, [profile, editing]);

  function startEditing() {
    setDraft({ name: profile.name, mobile: profile.mobile, address: profile.address, photo: profile.photo });
    setErrors({});
    setPhotoError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setErrors({});
    setPhotoError(null);
  }

  function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("profile.photoTypeError");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("profile.photoSizeError");
      return;
    }
    setPhotoError(null);

    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, photo: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const nextErrors = {};
    if (!draft.name?.trim()) nextErrors.name = "submission.errors.name";
    if (!isValidBangladeshMobile(draft.mobile)) nextErrors.mobile = "submission.errors.mobile";
    if (!draft.address?.trim()) nextErrors.address = "submission.errors.address";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile(profile.id, draft);
      await refreshProfile();
      setEditing(false);
      setToast({ message: t("profile.saved"), variant: "success" });
    } catch {
      setToast({ message: t("submission.errors.generic"), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (profileLoading || !profile || !draft) {
    return (
      <div className="page">
        <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t("profile.title")}</h1>

      <div className="profile-header">
        <div className="profile-avatar">
          {draft.photo ? <img src={draft.photo} alt="" /> : (profile.name || "").slice(0, 1)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{profile.name}</div>
          <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{profile.id}</div>
          {editing && (
            <>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ width: "auto", padding: "6px 0", fontSize: 13, justifyContent: "flex-start" }}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("profile.changePhoto")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePhotoPick}
              />
              {photoError && (
                <div className="field__error" role="alert">
                  {t(photoError)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <div className="card">
          <div className="info-row">
            <span className="info-row__label">{t("profile.designation")}</span>
            <span className="info-row__value">{profile.designation}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.zone")}</span>
            <span className="info-row__value">{profile.zone}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.mobile")}</span>
            <span className="info-row__value">{profile.mobile}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.address")}</span>
            <span className="info-row__value">{profile.address}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.totalSubmissions")}</span>
            <span className="info-row__value">{formatNumber(profile.totalSubmissions, language)}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.rank")}</span>
            <span className="info-row__value">#{formatNumber(profile.rank, language)}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.teamLeader")}</span>
            <span className="info-row__value">{profile.teamLeader}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">{t("profile.manager")}</span>
            <span className="info-row__value">{profile.manager}</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <Field
            id="profileName"
            label={t("profile.name")}
            value={draft.name}
            onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
            error={errors.name}
          />
          <Field
            id="profileMobile"
            label={t("profile.mobile")}
            value={draft.mobile}
            onChange={(v) => setDraft((d) => ({ ...d, mobile: v }))}
            error={errors.mobile}
            type="tel"
          />
          <Field
            id="profileAddress"
            label={t("profile.address")}
            value={draft.address}
            onChange={(v) => setDraft((d) => ({ ...d, address: v }))}
            error={errors.address}
            multiline
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {editing ? (
          <>
            <Button variant="secondary" onClick={cancelEditing} disabled={saving}>
              {t("profile.cancel")}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {t("profile.save")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={startEditing}>
            {t("profile.edit")}
          </Button>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="field__label" style={{ marginBottom: 10 }}>
          {t("profile.language")}
        </div>
        <div className="lang-toggle" role="group" aria-label={t("profile.language")}>
          <button
            type="button"
            className="lang-toggle__option"
            aria-pressed={language === "bn"}
            onClick={() => setLanguage("bn")}
          >
            {t("profile.bangla")}
          </button>
          <button
            type="button"
            className="lang-toggle__option"
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            {t("profile.english")}
          </button>
        </div>
      </div>

      <Button variant="ghost" onClick={handleLogout} style={{ marginTop: 16 }}>
        {t("profile.logout")}
      </Button>

      <Toast message={toast?.message} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}
