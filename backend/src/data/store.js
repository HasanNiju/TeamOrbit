// ---------------------------------------------------------------------------
// DUMMY DATA LAYER (in-memory)
//
// This module is the ONLY place that touches "raw" data. Every table below
// mirrors the schema recommended in the PRD (§38-40) so that swapping this
// out for real PostgreSQL/Supabase later is a matter of rewriting the
// functions in this file with SQL queries — nothing above this layer
// (controllers/services/routes) needs to change.
//
// Data resets whenever the process restarts. That's expected for a dummy
// data phase; Phase 2 replaces this file with a real database client.
// ---------------------------------------------------------------------------

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getDhakaDateKey, getDhakaWeekStartKey, getDhakaMonthKey } = require("../utils/dhakaTime");

const ROLES = {
  MARKETING_OFFICER: "MARKETING_OFFICER",
  ADMIN: "ADMIN", // Team Leader
  SUPER_ADMIN: "SUPER_ADMIN", // Manager
};

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

/** @type {Array<object>} */
const users = [];
/** @type {Array<object>} */
const submissions = [];
/** @type {Array<object>} */
const auditLogs = [];

// --- User helpers -----------------------------------------------------------

function findUserByEmployeeId(employeeId) {
  const needle = String(employeeId || "").trim().toLowerCase();
  return users.find((u) => u.employee_id.toLowerCase() === needle) || null;
}

function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

function createUser({
  employeeId,
  name,
  nameEn,
  password,
  role,
  designation = null,
  mobile = null,
  address = null,
  zone = null,
  profilePhotoUrl = null,
  teamLeaderId = null,
  managerId = null,
  language = "bn",
  status = "active",
}) {
  const now = new Date().toISOString();
  const user = {
    id: genId("usr"),
    employee_id: employeeId,
    name,
    name_en: nameEn || name,
    password_hash: bcrypt.hashSync(password, 10),
    role,
    designation,
    mobile,
    address,
    zone,
    profile_photo_url: profilePhotoUrl,
    team_leader_id: teamLeaderId,
    manager_id: managerId,
    language,
    status, // "active" | "inactive"
    created_at: now,
    updated_at: now,
  };
  users.push(user);
  return user;
}

function updateUser(id, patch) {
  const user = findUserById(id);
  if (!user) return null;
  Object.assign(user, patch, { updated_at: new Date().toISOString() });
  return user;
}

function listEmployees({ teamLeaderId = null } = {}) {
  return users.filter((u) => {
    if (u.role !== ROLES.MARKETING_OFFICER) return false;
    if (teamLeaderId && u.team_leader_id !== teamLeaderId) return false;
    return true;
  });
}

/** All Team Leader IDs reporting to a given Manager (Super Admin). */
function listTeamLeaderIdsForManager(managerId) {
  return users
    .filter((u) => u.role === ROLES.ADMIN && u.manager_id === managerId)
    .map((u) => u.id);
}

// --- Submission helpers ------------------------------------------------------

function createSubmission({ employeeUser, address, mobile, opinion }) {
  const now = new Date();
  const record = {
    id: genId("sub"),
    employee_user_id: employeeUser.id,
    employee_id: employeeUser.employee_id,
    name_snapshot: employeeUser.name,
    designation_snapshot: employeeUser.designation,
    address,
    mobile,
    opinion,
    submission_date: getDhakaDateKey(now),
    submitted_at: now.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  submissions.push(record);
  return record;
}

function getEmployeeTotal(employeeUserId) {
  let count = 0;
  for (const s of submissions) if (s.employee_user_id === employeeUserId) count += 1;
  return count;
}

function getEmployeeStats(employeeUserId) {
  const now = new Date();
  const todayKey = getDhakaDateKey(now);
  const weekStartKey = getDhakaWeekStartKey(now);
  const monthKey = getDhakaMonthKey(now);

  let today = 0;
  let week = 0;
  let month = 0;
  let total = 0;

  for (const s of submissions) {
    if (s.employee_user_id !== employeeUserId) continue;
    total += 1;
    if (s.submission_date === todayKey) today += 1;
    if (s.submission_date >= weekStartKey) week += 1;
    if (s.submission_date.slice(0, 7) === monthKey) month += 1;
  }

  return { today, week, month, total };
}

/** RANK() OVER (ORDER BY total_submissions DESC) among active Marketing Officers. */
function getRanks() {
  const active = users.filter((u) => u.role === ROLES.MARKETING_OFFICER && u.status === "active");
  const totals = active
    .map((u) => ({ id: u.id, total: getEmployeeTotal(u.id) }))
    .sort((a, b) => b.total - a.total);

  const ranks = new Map();
  let rank = 1;
  let prevTotal = null;
  totals.forEach((entry, index) => {
    if (prevTotal !== null && entry.total < prevTotal) rank = index + 1;
    prevTotal = entry.total;
    ranks.set(entry.id, rank);
  });

  return { ranks, outOf: totals.length };
}

function getRankFor(employeeUserId) {
  const { ranks, outOf } = getRanks();
  return { rank: ranks.get(employeeUserId) ?? outOf, outOf };
}

/**
 * Filter/search/sort submissions (no pagination applied).
 * scope: null (all, Super Admin) | { teamLeaderIds: string[] } (Admin's team) | { employeeUserId } (self)
 */
function filterSubmissions({
  scope = null,
  search = "",
  employeeUserId = null,
  teamLeaderId = null,
  dateFrom = null,
  dateTo = null,
  sort = "newest",
} = {}) {
  let rows = submissions;

  if (scope && scope.employeeUserId) {
    rows = rows.filter((s) => s.employee_user_id === scope.employeeUserId);
  } else if (scope && scope.teamLeaderIds) {
    const allowedEmployeeIds = new Set(
      users
        .filter((u) => scope.teamLeaderIds.includes(u.team_leader_id))
        .map((u) => u.id)
    );
    rows = rows.filter((s) => allowedEmployeeIds.has(s.employee_user_id));
  }

  if (employeeUserId) rows = rows.filter((s) => s.employee_user_id === employeeUserId);

  if (teamLeaderId) {
    const allowedEmployeeIds = new Set(
      users.filter((u) => u.team_leader_id === teamLeaderId).map((u) => u.id)
    );
    rows = rows.filter((s) => allowedEmployeeIds.has(s.employee_user_id));
  }

  if (dateFrom) rows = rows.filter((s) => s.submission_date >= dateFrom);
  if (dateTo) rows = rows.filter((s) => s.submission_date <= dateTo);

  if (search) {
    const needle = search.trim().toLowerCase();
    rows = rows.filter((s) => {
      const employee = findUserById(s.employee_user_id);
      return (
        s.employee_id.toLowerCase().includes(needle) ||
        s.name_snapshot.toLowerCase().includes(needle) ||
        (s.mobile || "").toLowerCase().includes(needle) ||
        (s.designation_snapshot || "").toLowerCase().includes(needle) ||
        (employee?.name_en || "").toLowerCase().includes(needle)
      );
    });
  }

  return [...rows].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.submitted_at) - new Date(b.submitted_at);
      case "name_asc":
        return a.name_snapshot.localeCompare(b.name_snapshot);
      case "name_desc":
        return b.name_snapshot.localeCompare(a.name_snapshot);
      case "newest":
      default:
        return new Date(b.submitted_at) - new Date(a.submitted_at);
    }
  });
}

/** Paginated version of filterSubmissions — for list endpoints (page size capped at 100). */
function querySubmissions(options = {}) {
  const rows = filterSubmissions(options);
  const total = rows.length;
  const safeLimit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const safePage = Math.max(Number(options.page) || 1, 1);
  const start = (safePage - 1) * safeLimit;
  const pageRows = rows.slice(start, start + safeLimit);

  return {
    rows: pageRows,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(Math.ceil(total / safeLimit), 1) },
  };
}

/** Unpaginated version — for dashboard counts and Excel export, where every matching row is needed. */
function queryAllSubmissions(options = {}) {
  return filterSubmissions(options);
}

function addAuditLog({ actor, action, target = null, metadata = {} }) {
  auditLogs.push({
    id: genId("log"),
    actor_id: actor.id,
    actor_name: actor.name_en || actor.name,
    actor_role: actor.role,
    action,
    target,
    metadata,
    created_at: new Date().toISOString(),
  });
}

module.exports = {
  ROLES,
  genId,
  users,
  submissions,
  auditLogs,
  findUserByEmployeeId,
  findUserById,
  createUser,
  updateUser,
  listEmployees,
  listTeamLeaderIdsForManager,
  createSubmission,
  getEmployeeTotal,
  getEmployeeStats,
  getRanks,
  getRankFor,
  querySubmissions,
  queryAllSubmissions,
  addAuditLog,
};
