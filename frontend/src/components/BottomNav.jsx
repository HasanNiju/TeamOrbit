import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

function SubmitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20V10M12 20V4M20 20v-7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2.3" />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS = [
  { to: "/app/submission", key: "nav.submission", Icon: SubmitIcon },
  { to: "/app/stats", key: "nav.stats", Icon: StatsIcon },
  { to: "/app/profile", key: "nav.profile", Icon: ProfileIcon },
];

export default function BottomNav() {
  const { t } = useLanguage();
  return (
    <nav className="bottom-nav" aria-label={t("appName")}>
      {ITEMS.map(({ to, key, Icon }) => (
        // NavLink sets aria-current="page" on the active link automatically —
        // that's what the CSS active-state styling hooks into.
        <NavLink key={to} to={to} className="bottom-nav__item">
          <span className="bottom-nav__icon">
            <Icon />
          </span>
          <span>{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
