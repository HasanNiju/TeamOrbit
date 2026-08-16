import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../context/AuthContext";

function initialsFrom(name, fallbackId) {
  const source = (name || fallbackId || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AppHeader() {
  const { t } = useLanguage();
  const { session, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  }

  const displayName = profile?.name || session?.employeeId || "";
  const initials = initialsFrom(profile?.name, session?.employeeId);

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">TO</span>
        <span className="app-header__title">{t("appName")}</span>
      </div>

      <div className="app-header__account" ref={menuRef}>
        <button
          type="button"
          className="app-header__avatar"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={displayName || t("nav.profile")}
        >
          {profile?.photo ? (
            <img src={profile.photo} alt="" className="app-header__avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </button>

        {menuOpen && (
          <div className="app-header__menu" role="menu">
            {displayName && <div className="app-header__menu-name">{displayName}</div>}
            <button
              type="button"
              role="menuitem"
              className="app-header__menu-item"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? t("common.loading") : t("profile.logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
