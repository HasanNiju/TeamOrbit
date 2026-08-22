import { useEffect, useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import * as adminApi from "../../api/adminApi";

export default function AdminDashboard() {
  const { role } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Dashboard</h1>
          <p className="admin-page-header__subtitle">
            {isSuperAdmin ? "Organization-wide activity at a glance." : "Your team's activity at a glance."}
          </p>
        </div>
      </div>

      {error && <div className="banner banner--error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : (
        <div className="admin-stat-grid">
          <StatCard label="Active Employees" value={data?.activeEmployees ?? 0} />
          <StatCard label="Total Employees" value={data?.totalEmployees ?? 0} />
          {isSuperAdmin && <StatCard label="Team Leaders" value={data?.totalTeamLeaders ?? 0} />}
          <StatCard label="Today's Reports" value={data?.todaySubmissions ?? 0} accent />
          <StatCard label="This Week" value={data?.weekSubmissions ?? 0} />
          <StatCard label="This Month" value={data?.monthSubmissions ?? 0} />
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card__header">
          <h2 className="admin-card__title">Quick tips</h2>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.8 }}>
          <li>Use the Submissions page to search, filter by date, and export reports to Excel.</li>
          {isSuperAdmin ? (
            <li>Create new Team Leaders from the Team Leaders page, and reassign employees from the Marketing Officers page.</li>
          ) : (
            <li>Add new Marketing Officers to your team from the Employees page.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__label">{label}</div>
      <div className={`admin-stat-card__value ${accent ? "admin-stat-card__value--accent" : ""}`}>{value}</div>
    </div>
  );
}
