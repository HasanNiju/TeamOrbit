// Small, dependency-free UI helpers shared across pages.

export function el(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function toast(message, type = "default") {
  const root = document.getElementById("toast-root");
  const node = el(`<div class="toast ${type === "error" ? "error" : type === "success" ? "success" : ""}">${escapeHtml(message)}</div>`);
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = "opacity 0.2s ease";
    node.style.opacity = "0";
    setTimeout(() => node.remove(), 200);
  }, 3200);
}

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Opens a modal (center) or drawer (right-side) overlay with the given inner
 * HTML. Returns { close, root } — `root` is the overlay element so callers
 * can attach listeners before/after insertion.
 */
export function openPanel({ kind = "modal", title, bodyHtml, footerHtml = "" }) {
  const overlay = el(`<div class="overlay ${kind === "modal" ? "center" : ""}"></div>`);
  const panel = el(`
    <div class="${kind === "modal" ? "modal" : "drawer"}">
      <div class="panel-header">
        <h2>${escapeHtml(title)}</h2>
        <button class="close-btn" data-close aria-label="Close">✕</button>
      </div>
      <div class="panel-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="panel-footer">${footerHtml}</div>` : ""}
    </div>
  `);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
  }
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  panel.querySelector("[data-close]").addEventListener("click", close);
  document.addEventListener("keydown", function escListener(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escListener);
    }
  });

  return { overlay, panel, close };
}

export function detailRow(label, value) {
  return `<div class="detail-row"><div class="k">${escapeHtml(label)}</div><div class="v">${escapeHtml(value ?? "—")}</div></div>`;
}

export function statusBadge(status) {
  return `<span class="badge ${status === "active" ? "badge-active" : "badge-inactive"}">${status === "active" ? "Active" : "Inactive"}</span>`;
}

export function roleBadge(role) {
  const label = { MARKETING_OFFICER: "Marketing Officer", ADMIN: "Team Leader", SUPER_ADMIN: "Super Admin" }[role] || role;
  return `<span class="badge badge-role">${escapeHtml(label)}</span>`;
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka" });
}

export function formatDate(dateKey) {
  if (!dateKey) return "—";
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function setButtonLoading(btn, loading, loadingLabel = "Working…") {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${loadingLabel}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}
