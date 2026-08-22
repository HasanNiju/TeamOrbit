import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "../../styles/admin.css";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "grid", roles: ["ADMIN", "SUPER_ADMIN"] },
  { to: "/admin/submissions", label: "Submissions", icon: "list", roles: ["ADMIN", "SUPER_ADMIN"] },
  { to: "/admin/employees", label: "Employees", icon: "people", roles: ["ADMIN"] },
  { to: "/admin/users", label: "Marketing Officers", icon: "people", roles: ["SUPER_ADMIN"] },
  { to: "/admin/team-leaders", label: "Team Leaders", icon: "star", roles: ["SUPER_ADMIN"] },
  { to: "/admin/account", label: "Account", icon: "user", roles: ["ADMIN", "SUPER_ADMIN"] },
];

function Icon({ name }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout() {
  const { session, role, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const roleLabel = role === "SUPER_ADMIN" ? "Manager" : "Team Leader";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true, state: { mode: "admin" } });
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <button
          type="button"
          className="admin-topbar__menu-btn"
          aria-label="Toggle navigation menu"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="admin-topbar__brand">
          <div className="admin-topbar__mark">TO</div>
          <span className="admin-topbar__title">TeamOrbit Admin</span>
        </div>
        <div className="admin-topbar__account">
          <span className="admin-topbar__name">{session?.name}</span>
          <span className="admin-topbar__role-pill">{roleLabel}</span>
        </div>
      </header>

      <div className="admin-body">
        {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

        <nav className={`admin-sidebar ${drawerOpen ? "admin-sidebar--open" : ""}`}>
          <div className="admin-sidebar__group-label">Menu</div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
