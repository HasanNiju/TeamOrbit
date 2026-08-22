// ---------------------------------------------------------------------------
// Fetch wrapper for the TeamOrbit backend. The admin panel is served by the
// same Express server it talks to, so relative "/api/..." paths always work
// whether this is opened at localhost or a deployed link.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "teamorbit.admin.token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(payload?.message || "Something went wrong.", payload?.code || "UNKNOWN", res.status);
  }
  return payload?.data ?? null;
}

async function download(path, filenameFallback) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(payload?.message || "Export failed.", payload?.code || "EXPORT_FAILED", res.status);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : filenameFallback;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function qs(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") usp.set(k, v);
  }
  const str = usp.toString();
  return str ? `?${str}` : "";
}

export const api = {
  // Auth
  login: (employeeId, password) => request("/auth/login", { method: "POST", body: { employeeId, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // Admin (Team Leader)
  adminDashboard: () => request("/admin/dashboard"),
  adminSubmissions: (params) => request(`/admin/submissions${qs(params)}`),
  adminSubmission: (id) => request(`/admin/submissions/${id}`),
  adminEmployees: () => request("/admin/employees"),
  adminCreateEmployee: (body) => request("/admin/employees", { method: "POST", body }),
  adminExport: (params, filename) => download(`/admin/export${qs(params)}`, filename),

  // Super Admin
  superDashboard: () => request("/super-admin/dashboard"),
  superSubmissions: (params) => request(`/super-admin/submissions${qs(params)}`),
  superUsers: (role) => request(`/super-admin/users${qs({ role })}`),
  superCreateUser: (body) => request("/super-admin/users", { method: "POST", body }),
  superUpdateUser: (id, body) => request(`/super-admin/users/${id}`, { method: "PATCH", body }),
  superAssign: (body) => request("/super-admin/assignments", { method: "PATCH", body }),
  superTeamLeaders: () => request("/super-admin/team-leaders"),
  superExport: (params, filename) => download(`/super-admin/export${qs(params)}`, filename),

  // Account (Admin / Super Admin self-service)
  getAccount: () => request("/account"),
  updateAccount: (body) => request("/account", { method: "PATCH", body }),
  changePassword: (body) => request("/account/change-password", { method: "POST", body }),
};

export { ApiError };
