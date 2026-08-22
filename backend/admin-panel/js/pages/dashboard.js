import { api } from "../api.js";
import { el, toast } from "../ui.js";

export async function renderDashboard(root, user) {
  root.innerHTML = `<div class="center-loading"><div class="spinner dark"></div></div>`;

  try {
    const data = user.role === "SUPER_ADMIN" ? await api.superDashboard() : await api.adminDashboard();

    const cards = [
      { label: "Total Employees", value: data.totalEmployees, accent: false },
      ...(user.role === "SUPER_ADMIN" ? [{ label: "Total Team Leaders", value: data.totalTeamLeaders, accent: false }] : []),
      { label: "Today's Reports", value: data.todaySubmissions, accent: true },
      { label: "This Week", value: data.weekSubmissions, accent: false },
      { label: "This Month", value: data.monthSubmissions, accent: false },
    ];

    root.innerHTML = "";
    const page = el(`
      <div>
        <div class="page-header">
          <div>
            <h1>Welcome back, ${escapeName(user.nameEn)}</h1>
            <p>${user.role === "SUPER_ADMIN" ? "Organization-wide overview" : "Overview for your assigned employees"}</p>
          </div>
        </div>
        <div class="metrics-grid">
          ${cards
            .map(
              (c) => `
            <div class="card metric-card">
              <div class="metric-card__label">${c.label}</div>
              <div class="metric-card__value ${c.accent ? "accent" : ""}">${c.value}</div>
            </div>`
            )
            .join("")}
        </div>
        <div class="card" style="padding:18px 20px;">
          <div style="font-weight:600;margin-bottom:6px;">Quick links</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
            <a href="#/submissions" class="btn btn-secondary btn-sm">View submissions</a>
            <a href="#/employees" class="btn btn-secondary btn-sm">Manage employees</a>
            <a href="#/exports" class="btn btn-secondary btn-sm">Export reports</a>
          </div>
        </div>
      </div>
    `);
    root.appendChild(page);
  } catch (err) {
    toast(err.message, "error");
    root.innerHTML = `<div class="empty-state">Could not load the dashboard.</div>`;
  }
}

function escapeName(name) {
  return (name || "").split(" ")[0] || name;
}
