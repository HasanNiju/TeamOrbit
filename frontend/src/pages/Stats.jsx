import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { formatNumber } from "../utils/banglaNumerals";
import * as api from "../api/mockApi";

function StatCard({ label, value, unit, language }) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{formatNumber(value, language)}</div>
      <div className="stat-card__unit">{unit}</div>
    </div>
  );
}

export default function Stats() {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getStats(session.employeeId).then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session.employeeId]);

  return (
    <div className="page">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>{t("stats.title")}</h1>

      {loading || !stats ? (
        <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
      ) : (
        <>
          <div className="rank-badge" style={{ marginBottom: 16 }}>
            <div className="rank-badge__circle">#{formatNumber(stats.rank, language)}</div>
            <div>
              <div className="rank-badge__label">{t("stats.rankLabel")}</div>
              <div className="rank-badge__value">{t("stats.rankOutOf", { total: formatNumber(stats.rankOutOf, language) })}</div>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard label={t("stats.today")} value={stats.today} unit={t("stats.unit")} language={language} />
            <StatCard label={t("stats.week")} value={stats.week} unit={t("stats.unit")} language={language} />
            <StatCard label={t("stats.month")} value={stats.month} unit={t("stats.unit")} language={language} />
            <StatCard label={t("stats.total")} value={stats.total} unit={t("stats.unit")} language={language} />
          </div>
        </>
      )}
    </div>
  );
}
