import { useLanguage } from "../i18n/LanguageContext";

export default function AppHeader() {
  const { t } = useLanguage();
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">TO</span>
        <span className="app-header__title">{t("appName")}</span>
      </div>
    </header>
  );
}
