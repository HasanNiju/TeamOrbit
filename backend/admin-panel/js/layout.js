import { initials, el } from "./ui.js";

const ADMIN_NAV = [
  { hash: "#/dashboard", label: "Dashboard", icon: "&#9632;" },
  { hash: "#/submissions", label: "Submissions", icon: "&#9776;" },
  { hash: "#/employees", label: "Employees", icon: "&#128101;" },
  { hash: "#/exports", label: "Exports", icon: "&#8681;" },
  { hash: "#/account", label: "Account", icon: "&#9881;" },
];

const SUPER_ADMIN_NAV = [
  { hash: "#/dashboard", label: "Dashboard", icon: "&#9632;" },
  { hash: "#/submissions", label: "Submissions", icon: "&#9776;" },
  { hash: "#/employees", label: "Employees", icon: "&#128101;" },
  { hash: "#/team-leaders", label: "Team Leaders", icon: "&#128100;" },
  { hash: "#/admins", label: "Admins", icon: "&#128272;" },
  { hash: "#/exports", label: "Exports", icon: "&#8681;" },
  { hash: "#/account", label: "Account", icon: "&#9881;" },
];

export function navForRole(role) {
  return role === "SUPER_ADMIN" ? SUPER_ADMIN_NAV : ADMIN_NAV;
}

export function pageTitle(hash) {
  const all = [...ADMIN_NAV, ...SUPER_ADMIN_NAV];
  return all.find((n) => n.hash === hash)?.label || "Dashboard";
}

export function renderShell(user, onLogout) {
  const nav = navForRole(user.role);
  const roleLabel = user.role === "SUPER_ADMIN" ? "Super Admin" : "Team Leader";

  const shell = el(`
    <div class="shell">
      <div class="backdrop" id="backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__brand-mark">TO</div>
          <div>
            <div class="sidebar__brand-text">TeamOrbit</div>
            <div class="sidebar__brand-sub">${roleLabel} Panel</div>
          </div>
        </div>
        <nav class="sidebar__nav" id="sidebar-nav">
          ${nav
            .map(
              (item) => `<button class="nav-item" data-hash="${item.hash}"><span class="nav-item__icon">${item.icon}</span>${item.label}</button>`
            )
            .join("")}
        </nav>
        <div class="sidebar__footer">
          <button class="btn btn-secondary" id="logout-btn" style="width:100%">Log out</button>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="menu-toggle" id="menu-toggle">&#9776;</button>
            <div class="topbar__title" id="page-title">Dashboard</div>
          </div>
          <div class="topbar__right">
            <div class="text-muted" style="font-size:13px;">${user.nameEn}</div>
            <div class="avatar">${initials(user.nameEn)}</div>
          </div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>
  `);

  shell.querySelectorAll("[data-hash]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.hash = btn.dataset.hash;
      shell.querySelector("#sidebar").classList.remove("open");
      shell.querySelector("#backdrop").classList.remove("show");
    });
  });

  shell.querySelector("#logout-btn").addEventListener("click", onLogout);

  const menuToggle = shell.querySelector("#menu-toggle");
  const sidebar = shell.querySelector("#sidebar");
  const backdrop = shell.querySelector("#backdrop");
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show");
  });
  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
  });

  return shell;
}

export function setActiveNav(shell, hash) {
  shell.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.hash === hash);
  });
  const title = shell.querySelector("#page-title");
  if (title) title.textContent = pageTitle(hash);
}
