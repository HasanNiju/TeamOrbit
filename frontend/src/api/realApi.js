// ---------------------------------------------------------------------------
// REAL API LAYER
//
// Same exported function signatures/shapes as mockApi.js (see that file for
// the contract), but every call now hits the real backend instead of
// localStorage. Swapping api/client.js from mockApi to this file is the
// only change needed anywhere else in the app.
//
// Requests are made to relative "/api/..." paths:
//  - In production, the backend serves this built frontend itself, so the
//    API is same-origin.
//  - In local dev (Vite on :5173), vite.config.js proxies "/api" to the
//    backend on :4000, so relative paths work there too.
// ---------------------------------------------------------------------------

const SESSION_KEY = "ers.session";

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
    /* storage unavailable (private browsing etc.) — app still works in-memory for this tab */
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
    // Network failure (offline, backend unreachable) — Submission.jsx checks
    // err.message === "Failed to fetch" specifically, so preserve that text.
    throw new Error("Failed to fetch");
  }

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw apiError(payload?.message || "Something went wrong.", payload?.code || "UNKNOWN");
  }
  return payload?.data ?? null;
}

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function mapUserToProfile(user, extra = {}) {
  return {
    id: user.employeeId,
    name: user.nameEn || user.name,
    designation: user.designation,
    zone: user.zone,
    mobile: user.mobile,
    address: user.address,
    photo: user.photo,
    teamLeader: user.teamLeader,
    manager: user.manager,
    totalSubmissions: extra.totalSubmissions ?? 0,
    rank: extra.rank ?? null,
    rankOutOf: extra.rankOutOf ?? null,
  };
}

// --- Auth --------------------------------------------------------------

export async function login(employeeId, password) {
  const { token, user } = await request("/auth/login", { method: "POST", body: { employeeId, password } });

  if (user.role !== "MARKETING_OFFICER") {
    throw apiError("This login is for the employee app only.", "INVALID_CREDENTIALS");
  }

  const session = { employeeId: user.employeeId, token };
  writeSession(session);
  return session;
}

export function getSession() {
  return readSession();
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    /* best-effort — always clear the local session regardless */
  }
  writeSession(null);
}

// --- Profile --------------------------------------------------------------

export async function getProfile() {
  const { user, rank, rankOutOf, totalSubmissions } = await request("/me");
  return mapUserToProfile(user, { rank, rankOutOf, totalSubmissions });
}

// Only name, mobile, address, photo (and zone, if business rules permit) are
// editable — matches PRD §15. Employee ID, role, totals, rank, team leader
// and manager are system-controlled and never accepted here.
export async function updateProfile(employeeId, partial) {
  // A newly-picked photo arrives as a base64 data URL from the file input;
  // upload it separately through the multipart endpoint first.
  if (partial.photo && typeof partial.photo === "string" && partial.photo.startsWith("data:")) {
    const blob = dataUrlToBlob(partial.photo);
    const form = new FormData();
    form.append("photo", blob, "profile-photo.jpg");
    await request("/me/photo", { method: "POST", body: form, isForm: true });
  }

  const { name, mobile, address, zone } = partial;
  const fieldsToPatch = { name, mobile, address, zone };
  const cleaned = Object.fromEntries(Object.entries(fieldsToPatch).filter(([, v]) => v !== undefined));
  if (Object.keys(cleaned).length > 0) {
    await request("/me", { method: "PATCH", body: cleaned });
  }

  return getProfile();
}

// --- Submissions --------------------------------------------------------------

export async function submitReport(employeeId, payload) {
  try {
    const { submission } = await request("/submissions", {
      method: "POST",
      body: {
        name: payload.name,
        designation: payload.designation,
        address: payload.address,
        mobile: payload.mobile,
        opinion: payload.remarks,
      },
    });
    return submission;
  } catch (err) {
    // Backend already returns SUBMISSION_CLOSED with the server's own clock
    // check — just let it propagate with the same .code Submission.jsx expects.
    throw err;
  }
}

export async function getStats() {
  return request("/me/stats");
}
