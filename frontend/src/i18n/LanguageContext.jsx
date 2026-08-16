import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import bn from "./bn.json";
import en from "./en.json";

const DICTS = { bn, en };
const STORAGE_KEY = "ers.language";

const LanguageContext = createContext(null);

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "bn";
    } catch {
      return "bn";
    }
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.classList.toggle("lang-en", language === "en");
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* localStorage unavailable — language just won't persist across reloads */
    }
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === "bn" || lang === "en") setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = DICTS[language] || DICTS.bn;
      const value = getByPath(dict, key);
      if (value == null) {
        // Fall back to Bangla, then to the raw key, rather than crashing the UI.
        const fallback = getByPath(DICTS.bn, key);
        return fallback != null ? interpolate(fallback, vars) : key;
      }
      return interpolate(value, vars);
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
