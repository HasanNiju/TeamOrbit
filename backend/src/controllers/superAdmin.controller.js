const store = require("../data/store");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { serializeEmployeeListItem, serializeSubmission, serializeUser } = require("../utils/serialize");
const { isValidBdMobile, isNonEmptyString } = require("../utils/validation");
const { buildSubmissionsWorkbook, buildExportFilename } = require("../services/exportService");
const { getDhakaDateKey, getDhakaWeekStartKey, getDhakaMonthKey } = require("../utils/dhakaTime");

function today() { return getDhakaDateKey(new Date()); }
function weekStart() { return getDhakaWeekStartKey(new Date()); }
function monthStart() { return `${getDhakaMonthKey(new Date())}-01`; }

// --- Dashboard ---------------------------------------------------------------

const getDashboard = asyncHandler(async (req, res) => {
  const employees = await store.listAllUsers({ role: store.ROLES.MARKETING_OFFICER });
  const teamLeaders = await store.listAllUsers({ role: store.ROLES.ADMIN });
  const todayRows = await store.queryAllSubmissions({ dateFrom: today(), dateTo: today() });
  const weekRows = await store.queryAllSubmissions({ dateFrom: weekStart() });
  const monthRows = await store.queryAllSubmissions({ dateFrom: monthStart() });

  return ok(res, {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === "active").length,
    totalTeamLeaders: teamLeaders.length,
    todaySubmissions: todayRows.length,
    weekSubmissions: weekRows.length,
    monthSubmissions: monthRows.length,
  });
});

// --- Submissions (all) ---------------------------------------------------------------

function parseListQuery(req) {
  const { search = "", page = 1, limit = 20, sort = "newest", dateFrom = null, dateTo = null, employeeId = null, teamLeaderId = null } = req.query;
  return { search, page, limit, sort, dateFrom, dateTo, employeeId, teamLeaderId };
}

const listAllSubmissions = asyncHandler(async (req, res) => {
  const { search, page, limit, sort, dateFrom, dateTo, employeeId, teamLeaderId } = parseListQuery(req);
  let employeeUserId = null;
  if (employeeId) {
    const employee = (await store.findUserByEmployeeId(employeeId)) || (await store.findUserById(employeeId));
    if (employee) employeeUserId = employee.id;
  }

  const { rows, pagination } = await store.querySubmissions({
    employeeUserId,
    teamLeaderId,
    search,
    sort,
    dateFrom,
    dateTo,
    page,
    limit,
  });
  return ok(res, { submissions: await Promise.all(rows.map(serializeSubmission)), pagination });
});

const exportAllSubmissions = asyncHandler(async (req, res) => {
  const { search, sort, dateFrom, dateTo, employeeId, teamLeaderId } = parseListQuery(req);
  let employeeUserId = null;
  if (employeeId) {
    const employee = (await store.findUserByEmployeeId(employeeId)) || (await store.findUserById(employeeId));
    if (employee) employeeUserId = employee.id;
  }
  const rows = await store.queryAllSubmissions({
    employeeUserId,
    teamLeaderId,
    search,
    sort,
    dateFrom,
    dateTo,
  });
  const buffer = await buildSubmissionsWorkbook(rows);
  const filename = buildExportFilename({ employeeId: employeeUserId ? employeeId : null });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));

  await store.addAuditLog({ actor: req.user, action: "Super Admin exported reports", metadata: { filename, count: rows.length } });
});

// --- Users (Employees, Team Leaders, Admins) ---------------------------------------------------------------

const listUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const users = await store.listAllUsers({ role: role || null });
  return ok(res, { users: await Promise.all(users.map(serializeEmployeeListItem)) });
});

const createUser = asyncHandler(async (req, res, next) => {
  const { employeeId, name, mobile, zone, address, password, role, designation, teamLeaderId, managerId } = req.body || {};

  const problems = [];
  if (!isNonEmptyString(employeeId)) problems.push("Employee ID is required.");
  if (!isNonEmptyString(name)) problems.push("Name is required.");
  if (mobile && !isValidBdMobile(mobile)) problems.push("Enter a valid Bangladeshi mobile number.");
  if (!isNonEmptyString(password) || password.length < 6) problems.push("A password of at least 6 characters is required.");
  if (!["MARKETING_OFFICER", "ADMIN"].includes(role)) {
    problems.push("Role must be MARKETING_OFFICER or ADMIN.");
  }
  if (problems.length) return next(fail(422, "VALIDATION_ERROR", problems.join(" ")));

  if (await store.findUserByEmployeeId(employeeId)) {
    return next(fail(409, "DUPLICATE_EMPLOYEE_ID", "This Employee ID is already in use."));
  }

  let resolvedTeamLeaderId = null;
  let resolvedManagerId = req.user.id;
  if (role === "MARKETING_OFFICER") {
    if (teamLeaderId) {
      const tl = await store.findUserById(teamLeaderId);
      if (!tl || tl.role !== store.ROLES.ADMIN) return next(fail(422, "INVALID_TEAM_LEADER", "Selected Team Leader is invalid."));
      resolvedTeamLeaderId = tl.id;
      resolvedManagerId = tl.manager_id;
    }
  } else if (role === "ADMIN") {
    resolvedManagerId = managerId || req.user.id;
  }

  const user = await store.createUser({
    employeeId,
    name,
    nameEn: name,
    password,
    role,
    designation: designation || (role === "ADMIN" ? "Team Leader" : "Marketing Officer"),
    mobile,
    zone,
    address,
    teamLeaderId: resolvedTeamLeaderId,
    managerId: resolvedManagerId,
    language: role === "MARKETING_OFFICER" ? "bn" : "en",
    status: "active",
  });

  await store.addAuditLog({
    actor: req.user,
    action: role === "ADMIN" ? "Super Admin created Admin" : "Super Admin created employee",
    target: { id: user.id, label: user.employee_id },
  });

  return ok(res, { user: await serializeUser(user) }, 201);
});

const updateUserHandler = asyncHandler(async (req, res, next) => {
  const target = await store.findUserById(req.params.id);
  if (!target) return next(fail(404, "NOT_FOUND", "User not found."));

  const patch = {};
  const allowed = ["name", "mobile", "address", "zone", "status", "designation"];
  for (const key of allowed) if (key in (req.body || {})) patch[key] = req.body[key];
  if (patch.name) patch.name_en = req.body.name;

  const before = { status: target.status };
  const updated = await store.updateUser(target.id, patch);

  if (patch.status && patch.status !== before.status) {
    await store.addAuditLog({
      actor: req.user,
      action: "Super Admin changed user status",
      target: { id: target.id, label: target.employee_id },
      metadata: { from: before.status, to: patch.status },
    });
  }

  return ok(res, { user: await serializeUser(updated) });
});

const updateAssignments = asyncHandler(async (req, res, next) => {
  const { userId, teamLeaderId, managerId } = req.body || {};
  const target = await store.findUserById(userId);
  if (!target) return next(fail(404, "NOT_FOUND", "User not found."));

  const patch = {};
  if (target.role === store.ROLES.MARKETING_OFFICER && teamLeaderId) {
    const tl = await store.findUserById(teamLeaderId);
    if (!tl || tl.role !== store.ROLES.ADMIN) return next(fail(422, "INVALID_TEAM_LEADER", "Selected Team Leader is invalid."));
    patch.team_leader_id = tl.id;
    patch.manager_id = tl.manager_id;
  }
  if (target.role === store.ROLES.ADMIN && managerId) {
    const mgr = await store.findUserById(managerId);
    if (!mgr || mgr.role !== store.ROLES.SUPER_ADMIN) return next(fail(422, "INVALID_MANAGER", "Selected Manager is invalid."));
    patch.manager_id = mgr.id;
  }

  const updated = await store.updateUser(target.id, patch);
  await store.addAuditLog({
    actor: req.user,
    action: "Super Admin changed employee assignment",
    target: { id: target.id, label: target.employee_id },
    metadata: patch,
  });

  return ok(res, { user: await serializeUser(updated) });
});

const listTeamLeaders = asyncHandler(async (req, res) => {
  const teamLeaders = await store.listAllUsers({ role: store.ROLES.ADMIN });
  const withCounts = await Promise.all(
    teamLeaders.map(async (tl) => ({
      id: tl.id,
      employeeId: tl.employee_id,
      name: tl.name_en,
      zone: tl.zone,
      status: tl.status,
      managerId: tl.manager_id,
      employeeCount: (await store.listEmployees({ teamLeaderId: tl.id })).length,
    }))
  );
  return ok(res, { teamLeaders: withCounts });
});

module.exports = {
  getDashboard,
  listAllSubmissions,
  exportAllSubmissions,
  listUsers,
  createUser,
  updateUser: updateUserHandler,
  updateAssignments,
  listTeamLeaders,
};
