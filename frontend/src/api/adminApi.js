// ---------------------------------------------------------------------------
// ADMIN API LAYER
//
// Kept separate from api/realApi.js (the employee app's client) on purpose:
// different session key, different roles (ADMIN = Team Leader,
// SUPER_ADMIN = Manager), different endpoints. Both hit the same backend.
// ---------------------------------------------------------------------------

const SESSION_KEY = "ers.admin.session";

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

function apiError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const session = readSession();
  const headers = {};
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Failed to fetch");
  }

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw apiError(payload?.message || "Something went wrong.", payload?.code || "UNKNOWN");
  }
  return payload?.data ?? null;
}

function basePathFor(role) {
  return role === "SUPER_ADMIN" ? "/super-admin" : "/admin";
}

// --- Auth --------------------------------------------------------------

export async function loginAdmin(employeeId, password) {
  const { token, user } = await request("/auth/login", { method: "POST", body: { employeeId, password } });

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw apiError("This login is for Team Leaders and Managers only.", "INVALID_CREDENTIALS");
  }

  const session = { employeeId: user.employeeId, token, role: user.role, name: user.nameEn || user.name, id: user.id };
  writeSession(session);
  return session;
}

export function getAdminSession() {
  return readSession();
}

export async function logoutAdmin() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    /* best-effort */
  }
  writeSession(null);
}

// --- Dashboard --------------------------------------------------------------

export async function getDashboard() {
  const { role } = readSession() || {};
  return request(`${basePathFor(role)}/dashboard`);
}

// --- Submissions --------------------------------------------------------------

function toQueryString(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export async function getSubmissions(params = {}) {
  const { role } = readSession() || {};
  return request(`${basePathFor(role)}/submissions${toQueryString(params)}`);
}

export function getExportUrl(params = {}) {
  const { role } = readSession() || {};
  return `/api${basePathFor(role)}/export${toQueryString(params)}`;
}

// --- Employees (Team Leader scope) --------------------------------------------------------------

export async function getEmployees() {
  return request("/admin/employees");
}

export async function getEmployeeDetail(id) {
  return request(`/admin/employees/${encodeURIComponent(id)}`);
}

export async function getEmployeeSubmissions(id, params = {}) {
  return request(`/admin/employees/${encodeURIComponent(id)}/submissions${toQueryString(params)}`);
}

export async function createEmployee(payload) {
  return request("/admin/employees", { method: "POST", body: payload });
}

// --- Users (Super Admin scope: Marketing Officers + Team Leaders) --------------------------------------------------------------

export async function listUsers(role = null) {
  return request(`/super-admin/users${toQueryString({ role })}`);
}

export async function createUser(payload) {
  return request("/super-admin/users", { method: "POST", body: payload });
}

export async function updateUser(id, patch) {
  return request(`/super-admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
}

export async function deleteUser(id) {
  return request(`/super-admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateAssignments(payload) {
  return request("/super-admin/assignments", { method: "PATCH", body: payload });
}

export async function listTeamLeaders() {
  return request("/super-admin/team-leaders");
}

// --- Super Admins (Manager scope: only another Super Admin can create one) --------------------------------------------------------------

export async function listSuperAdmins() {
  return request(`/super-admin/users${toQueryString({ role: "SUPER_ADMIN" })}`);
}

export async function createSuperAdmin(payload) {
  return request("/super-admin/super-admins", { method: "POST", body: payload });
}

// --- Account (self) --------------------------------------------------------------

export async function getAccount() {
  return request("/account");
}

export async function updateAccount(patch) {
  return request("/account", { method: "PATCH", body: patch });
}

export async function uploadAccountPhoto(file) {
  const form = new FormData();
  form.append("photo", file);
  return request("/account/photo", { method: "POST", body: form, isForm: true });
}

export async function changePassword(currentPassword, newPassword) {
  return request("/account/change-password", { method: "POST", body: { currentPassword, newPassword } });
}
