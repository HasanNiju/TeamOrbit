// ---------------------------------------------------------------------------
// DATA LAYER — Supabase (Postgres)
//
// This module is the ONLY place that touches the database. Every function
// here is async and talks to Supabase via the service-role client. Nothing
// above this layer (controllers/services/routes) should ever query
// Supabase directly — that keeps the rest of the app storage-agnostic.
// ---------------------------------------------------------------------------

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const supabase = require("./supabaseClient");
const { getDhakaDateKey, getDhakaWeekStartKey, getDhakaMonthKey } = require("../utils/dhakaTime");

const ROLES = {
  MARKETING_OFFICER: "MARKETING_OFFICER",
  ADMIN: "ADMIN", // Team Leader
  SUPER_ADMIN: "SUPER_ADMIN", // Manager
};

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

function throwIfError(error, context) {
  if (error) {
    const err = new Error(`[supabase:${context}] ${error.message}`);
    err.cause = error;
    throw err;
  }
}

// --- User helpers -----------------------------------------------------------

async function findUserByEmployeeId(employeeId) {
  if (!employeeId) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("employee_id", String(employeeId).trim())
    .maybeSingle();
  throwIfError(error, "findUserByEmployeeId");
  return data || null;
}

async function findUserById(id) {
  if (!id) return null;
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "findUserById");
  return data || null;
}

async function createUser({
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
  const row = {
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
  const { data, error } = await supabase.from("users").insert(row).select().single();
  throwIfError(error, "createUser");
  return data;
}

async function updateUser(id, patch) {
  const { data, error } = await supabase
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();
  throwIfError(error, "updateUser");
  return data || null;
}

/** Every user, optionally filtered by role. Replaces old direct `store.users` array access. */
async function listAllUsers({ role = null } = {}) {
  let q = supabase.from("users").select("*");
  if (role) q = q.eq("role", role);
  const { data, error } = await q;
  throwIfError(error, "listAllUsers");
  return data || [];
}

async function listEmployees({ teamLeaderId = null } = {}) {
  let q = supabase.from("users").select("*").eq("role", ROLES.MARKETING_OFFICER);
  if (teamLeaderId) q = q.eq("team_leader_id", teamLeaderId);
  const { data, error } = await q;
  throwIfError(error, "listEmployees");
  return data || [];
}

/** All Team Leader IDs reporting to a given Manager (Super Admin). */
async function listTeamLeaderIdsForManager(managerId) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("role", ROLES.ADMIN)
    .eq("manager_id", managerId);
  throwIfError(error, "listTeamLeaderIdsForManager");
  return (data || []).map((u) => u.id);
}

// --- Submission helpers ------------------------------------------------------

async function createSubmission({ employeeUser, address, mobile, opinion }) {
  const now = new Date();
  const row = {
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
  const { data, error } = await supabase.from("submissions").insert(row).select().single();
  throwIfError(error, "createSubmission");
  return data;
}

/** Bulk insert — used by the seed script so it doesn't issue hundreds of round trips. */
async function bulkCreateSubmissions(rows) {
  if (!rows.length) return;
  const { error } = await supabase.from("submissions").insert(rows);
  throwIfError(error, "bulkCreateSubmissions");
}

async function findSubmissionById(id) {
  const { data, error } = await supabase.from("submissions").select("*").eq("id", id).maybeSingle();
  throwIfError(error, "findSubmissionById");
  return data || null;
}

async function getEmployeeTotal(employeeUserId) {
  const { count, error } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("employee_user_id", employeeUserId);
  throwIfError(error, "getEmployeeTotal");
  return count || 0;
}

async function getEmployeeStats(employeeUserId) {
  const now = new Date();
  const todayKey = getDhakaDateKey(now);
  const weekStartKey = getDhakaWeekStartKey(now);
  const monthKey = getDhakaMonthKey(now);

  const { data, error } = await supabase
    .from("submissions")
    .select("submission_date")
    .eq("employee_user_id", employeeUserId);
  throwIfError(error, "getEmployeeStats");

  let today = 0;
  let week = 0;
  let month = 0;
  let total = 0;

  for (const s of data || []) {
    total += 1;
    if (s.submission_date === todayKey) today += 1;
    if (s.submission_date >= weekStartKey) week += 1;
    if (s.submission_date.slice(0, 7) === monthKey) month += 1;
  }

  return { today, week, month, total };
}

/** RANK() OVER (ORDER BY total_submissions DESC) among active Marketing Officers. */
async function getRanks() {
  const active = (await listEmployees()).filter((u) => u.status === "active");

  // `submission_counts()` is a SQL function (see supabase_schema.sql) that
  // returns { employee_user_id, total } grouped server-side — much cheaper
  // than pulling every submission row over the wire.
  const { data: countRows, error } = await supabase.rpc("submission_counts");
  throwIfError(error, "getRanks:submission_counts");
  const countMap = new Map((countRows || []).map((r) => [r.employee_user_id, Number(r.total)]));

  const totals = active
    .map((u) => ({ id: u.id, total: countMap.get(u.id) || 0 }))
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

async function getRankFor(employeeUserId) {
  const { ranks, outOf } = await getRanks();
  return { rank: ranks.get(employeeUserId) ?? outOf, outOf };
}

/**
 * Filter/search/sort submissions (no pagination applied).
 * scope: null (all, Super Admin) | { employeeUserId } (self) | { teamLeaderIds: string[] } (Admin's team)
 */
async function filterSubmissions({
  scope = null,
  search = "",
  employeeUserId = null,
  teamLeaderId = null,
  dateFrom = null,
  dateTo = null,
  sort = "newest",
} = {}) {
  // Resolve which employee_user_ids are in scope, if any restriction applies.
  let allowedEmployeeIds = null; // null = no restriction (Super Admin, unscoped)

  if (scope && scope.employeeUserId) {
    allowedEmployeeIds = new Set([scope.employeeUserId]);
  } else if (scope && scope.teamLeaderIds) {
    const { data, error } = await supabase.from("users").select("id").in("team_leader_id", scope.teamLeaderIds);
    throwIfError(error, "filterSubmissions:scope");
    allowedEmployeeIds = new Set((data || []).map((u) => u.id));
  }

  if (employeeUserId) {
    allowedEmployeeIds = allowedEmployeeIds
      ? new Set([...allowedEmployeeIds].filter((id) => id === employeeUserId))
      : new Set([employeeUserId]);
  }

  if (teamLeaderId) {
    const { data, error } = await supabase.from("users").select("id").eq("team_leader_id", teamLeaderId);
    throwIfError(error, "filterSubmissions:teamLeaderId");
    const ids = new Set((data || []).map((u) => u.id));
    allowedEmployeeIds = allowedEmployeeIds ? new Set([...allowedEmployeeIds].filter((id) => ids.has(id))) : ids;
  }

  if (allowedEmployeeIds && allowedEmployeeIds.size === 0) return [];

  let q = supabase.from("submissions").select("*").range(0, 4999);
  if (allowedEmployeeIds) q = q.in("employee_user_id", [...allowedEmployeeIds]);
  if (dateFrom) q = q.gte("submission_date", dateFrom);
  if (dateTo) q = q.lte("submission_date", dateTo);

  const { data, error } = await q;
  throwIfError(error, "filterSubmissions");
  let rows = data || [];

  if (search) {
    const needle = search.trim().toLowerCase();
    const employeeIds = [...new Set(rows.map((r) => r.employee_user_id))];
    let nameMap = new Map();
    if (employeeIds.length) {
      const { data: emps, error: e2 } = await supabase.from("users").select("id,name_en").in("id", employeeIds);
      throwIfError(e2, "filterSubmissions:search");
      nameMap = new Map((emps || []).map((u) => [u.id, u.name_en]));
    }
    rows = rows.filter((s) => {
      const nameEn = nameMap.get(s.employee_user_id) || "";
      return (
        s.employee_id.toLowerCase().includes(needle) ||
        s.name_snapshot.toLowerCase().includes(needle) ||
        (s.mobile || "").toLowerCase().includes(needle) ||
        (s.designation_snapshot || "").toLowerCase().includes(needle) ||
        nameEn.toLowerCase().includes(needle)
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
async function querySubmissions(options = {}) {
  const rows = await filterSubmissions(options);
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
async function queryAllSubmissions(options = {}) {
  return filterSubmissions(options);
}

async function addAuditLog({ actor, action, target = null, metadata = {} }) {
  const row = {
    id: genId("log"),
    actor_id: actor.id,
    actor_name: actor.name_en || actor.name,
    actor_role: actor.role,
    action,
    target,
    metadata,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("audit_logs").insert(row);
  throwIfError(error, "addAuditLog");
}

module.exports = {
  ROLES,
  genId,
  findUserByEmployeeId,
  findUserById,
  createUser,
  updateUser,
  listAllUsers,
  listEmployees,
  listTeamLeaderIdsForManager,
  createSubmission,
  bulkCreateSubmissions,
  findSubmissionById,
  getEmployeeTotal,
  getEmployeeStats,
  getRanks,
  getRankFor,
  querySubmissions,
  queryAllSubmissions,
  addAuditLog,
};
