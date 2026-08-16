// ---------------------------------------------------------------------------
// MOCK API LAYER
//
// This module stands in for the real backend (Node/Express + PostgreSQL per
// the PRD). Every exported function returns a Promise shaped the way the
// real REST endpoints should, including a simulated network delay and the
// same server-side submission-window enforcement the real backend must do.
//
// TO SWAP IN THE REAL BACKEND:
//   Replace the bodies of these functions with `fetch("/api/...")` calls
//   that hit the real routes (see PRD §54), keeping the same function
//   signatures and return shapes so no page component needs to change.
// ---------------------------------------------------------------------------

import { isWithinSubmissionWindow, getDhakaDateKey } from "../utils/dhakaTime";

const DELAY_MS = 500;
const SUBMISSIONS_KEY = "ers.mock.submissions";
const EMPLOYEES_KEY = "ers.mock.employees";
const SESSION_KEY = "ers.mock.session";

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private browsing etc.) — app still works in-memory for this tab */
  }
}

// --- Seed data --------------------------------------------------------------

const SEED_EMPLOYEES = [
  {
    id: "EMP-001",
    password: "demo123",
    name: "রহিম আহমেদ",
    nameEn: "Rahim Ahmed",
    designation: "Marketing Officer",
    zone: "Dhaka North",
    mobile: "01711111111",
    address: "House 12, Road 5, Mirpur, Dhaka",
    photo: null,
    teamLeader: "Kamal Hossain",
    manager: "Nasrin Sultana",
    active: true,
  },
  { id: "EMP-002", name: "Employee Two", active: true, seedTotal: 318 },
  { id: "EMP-003", name: "Employee Three", active: true, seedTotal: 291 },
  { id: "EMP-004", name: "Employee Four", active: true, seedTotal: 145 },
  { id: "EMP-005", name: "Employee Five", active: true, seedTotal: 60 },
];

function seedIfEmpty() {
  if (!localStorage.getItem(EMPLOYEES_KEY)) {
    writeJSON(EMPLOYEES_KEY, SEED_EMPLOYEES);
  }
  if (!localStorage.getItem(SUBMISSIONS_KEY)) {
    // Give EMP-001 some historical submissions spread over the last ~40 days
    // so Stats/Rank have something real to compute against.
    const now = Date.now();
    const seeded = [];
    let count = 0;
    for (let daysAgo = 39; daysAgo >= 1 && count < 40; daysAgo -= 1) {
      if (daysAgo % 3 === 0) continue; // skip some days, like real usage
      const reportsThatDay = 1 + (daysAgo % 4);
      for (let i = 0; i < reportsThatDay && count < 40; i += 1) {
        seeded.push({
          id: `seed-${daysAgo}-${i}`,
          employeeId: "EMP-001",
          submittedAt: now - daysAgo * 24 * 60 * 60 * 1000 - i * 3600 * 1000,
        });
        count += 1;
      }
    }
    writeJSON(SUBMISSIONS_KEY, seeded);
  }
}

seedIfEmpty();

function getEmployees() {
  return readJSON(EMPLOYEES_KEY, SEED_EMPLOYEES);
}

function getSubmissions() {
  return readJSON(SUBMISSIONS_KEY, []);
}

function getEmployeeTotal(employeeId) {
  const seedEntry = SEED_EMPLOYEES.find((e) => e.id === employeeId);
  const own = getSubmissions().filter((s) => s.employeeId === employeeId).length;
  return own + (employeeId === "EMP-001" ? 0 : seedEntry?.seedTotal || 0);
}

function computeRank(employeeId) {
  const totals = getEmployees()
    .filter((e) => e.active)
    .map((e) => ({ id: e.id, total: getEmployeeTotal(e.id) }))
    .sort((a, b) => b.total - a.total);

  let rank = 1;
  let prevTotal = null;
  const ranked = totals.map((entry, index) => {
    if (prevTotal !== null && entry.total < prevTotal) rank = index + 1;
    prevTotal = entry.total;
    return { ...entry, rank };
  });

  const mine = ranked.find((r) => r.id === employeeId);
  return { rank: mine?.rank ?? ranked.length, outOf: ranked.length };
}

// --- Auth --------------------------------------------------------------

export async function login(employeeId, password) {
  await delay();
  const employees = getEmployees();
  const employee = employees.find((e) => e.id.toLowerCase() === String(employeeId).trim().toLowerCase());

  if (!employee || employee.password !== password) {
    const err = new Error("invalid_credentials");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }
  if (!employee.active) {
    const err = new Error("inactive_account");
    err.code = "INACTIVE_ACCOUNT";
    throw err;
  }

  const session = { employeeId: employee.id, token: `mock-token-${employee.id}-${Date.now()}` };
  writeJSON(SESSION_KEY, session);
  return session;
}

export function getSession() {
  return readJSON(SESSION_KEY, null);
}

export async function logout() {
  await delay(150);
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// --- Profile --------------------------------------------------------------

export async function getProfile(employeeId) {
  await delay();
  const employee = getEmployees().find((e) => e.id === employeeId);
  if (!employee) throw new Error("not_found");
  const { rank, outOf } = computeRank(employeeId);
  return {
    id: employee.id,
    name: employee.name,
    designation: employee.designation,
    zone: employee.zone,
    mobile: employee.mobile,
    address: employee.address,
    photo: employee.photo,
    teamLeader: employee.teamLeader,
    manager: employee.manager,
    totalSubmissions: getEmployeeTotal(employee.id),
    rank,
    rankOutOf: outOf,
  };
}

// Only name, mobile, address, photo (and zone, if business rules permit) are
// editable — matches PRD §15. Employee ID, role, totals, rank, team leader
// and manager are system-controlled and never accepted here.
const EDITABLE_FIELDS = ["name", "mobile", "address", "photo", "zone"];

export async function updateProfile(employeeId, partial) {
  await delay();
  const employees = getEmployees();
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) throw new Error("not_found");

  const patch = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in partial) patch[key] = partial[key];
  }

  employees[index] = { ...employees[index], ...patch };
  writeJSON(EMPLOYEES_KEY, employees);
  return getProfile(employeeId);
}

// --- Submissions --------------------------------------------------------------

export async function submitReport(employeeId, payload) {
  await delay(700);

  // Authoritative server-side time check — the browser's clock is never
  // trusted for this decision; the real backend must re-run the equivalent
  // of isWithinSubmissionWindow() against its own server clock.
  if (!isWithinSubmissionWindow(new Date())) {
    const err = new Error("submission_closed");
    err.code = "SUBMISSION_CLOSED";
    throw err;
  }

  const submissions = getSubmissions();
  const record = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    employeeId,
    submittedAt: Date.now(),
    ...payload,
  };
  submissions.push(record);
  writeJSON(SUBMISSIONS_KEY, submissions);
  return record;
}

export async function getStats(employeeId) {
  await delay();
  const all = getSubmissions().filter((s) => s.employeeId === employeeId);
  const todayKey = getDhakaDateKey(new Date());

  const startOfWeek = (() => {
    const d = new Date();
    const day = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const startOfMonth = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  let today = 0;
  let week = 0;
  let month = 0;

  for (const submission of all) {
    const key = getDhakaDateKey(new Date(submission.submittedAt));
    if (key === todayKey) today += 1;
    if (submission.submittedAt >= startOfWeek) week += 1;
    if (submission.submittedAt >= startOfMonth) month += 1;
  }

  const { rank, outOf } = computeRank(employeeId);

  return {
    today,
    week,
    month,
    total: getEmployeeTotal(employeeId),
    rank,
    rankOutOf: outOf,
  };
}
