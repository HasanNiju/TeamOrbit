import { renderDashboard } from "./pages/dashboard.js";
import { renderSubmissions } from "./pages/submissions.js";
import { renderEmployees } from "./pages/employees.js";
import { renderTeamLeaders } from "./pages/teamLeaders.js";
import { renderExports } from "./pages/exports.js";
import { renderAccount } from "./pages/account.js";
import { setActiveNav } from "./layout.js";

const ROUTES = {
  "#/dashboard": { render: renderDashboard, roles: ["ADMIN", "SUPER_ADMIN"] },
  "#/submissions": { render: renderSubmissions, roles: ["ADMIN", "SUPER_ADMIN"] },
  "#/employees": { render: renderEmployees, roles: ["ADMIN", "SUPER_ADMIN"] },
  "#/team-leaders": { render: renderTeamLeaders, roles: ["SUPER_ADMIN"] },
  "#/admins": { render: renderTeamLeaders, roles: ["SUPER_ADMIN"] },
  "#/exports": { render: renderExports, roles: ["ADMIN", "SUPER_ADMIN"] },
  "#/account": { render: renderAccount, roles: ["ADMIN", "SUPER_ADMIN"] },
};

export function startRouter(shell, user) {
  const content = shell.querySelector("#content");

  async function handle() {
    let hash = window.location.hash;
    if (!hash || !ROUTES[hash]) hash = "#/dashboard";

    const route = ROUTES[hash];
    if (!route.roles.includes(user.role)) {
      window.location.hash = "#/dashboard";
      return;
    }

    setActiveNav(shell, hash);
    await route.render(content, user);
  }

  window.addEventListener("hashchange", handle);
  handle();
}
