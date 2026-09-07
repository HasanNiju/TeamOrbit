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
  // Five independent queries — fire them concurrently rather than awaiting
  // each in turn, so this endpoint takes as long as the slowest single
  // query instead of the sum of all five round trips.
  const [employees, teamLeaders, todayRows, weekRows, monthRows] = await Promise.all([
    store.listAllUsers({ role: store.ROLES.MARKETING_OFFICER }),
    store.listAllUsers({ role: store.ROLES.ADMIN }),
    store.queryAllSubmissions({ dateFrom: today(), dateTo: today() }),
    store.queryAllSubmissions({ dateFrom: weekStart() }),
    store.queryAllSubmissions({ dateFrom: monthStart() }),
  ]);

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
  if (!["MARKETING_OFFICER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    problems.push("Role must be MARKETING_OFFICER, ADMIN, or SUPER_ADMIN.");
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
  } else if (role === "SUPER_ADMIN") {
    // Super Admins don't report to a Team Leader or another Manager.
    resolvedManagerId = null;
  }

  const user = await store.createUser({
    employeeId,
    name,
    nameEn: name,
    password,
    role,
    designation: designation || (role === "ADMIN" ? "Team Leader" : role === "SUPER_ADMIN" ? "Super Admin" : "Marketing Officer"),
    mobile,
    zone,
    address,
    teamLeaderId: resolvedTeamLeaderId,
    managerId: resolvedManagerId,
    language: "en",
    status: "active",
  });

  await store.addAuditLog({
    actor: req.user,
    action: role === "SUPER_ADMIN" ? "Super Admin created another Super Admin" : role === "ADMIN" ? "Super Admin created Admin" : "Super Admin created employee",
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

  // Guard rails: never let a Super Admin lock themselves out, and never
  // let the last active Super Admin account be deactivated.
  if (target.role === store.ROLES.SUPER_ADMIN && patch.status === "inactive") {
    if (target.id === req.user.id) {
      return next(fail(422, "CANNOT_DEACTIVATE_SELF", "You can't deactivate your own account."));
    }
    const superAdmins = await store.listAllUsers({ role: store.ROLES.SUPER_ADMIN });
    const otherActive = superAdmins.filter((u) => u.id !== target.id && u.status === "active");
    if (otherActive.length === 0) {
      return next(fail(422, "LAST_SUPER_ADMIN", "At least one active Super Admin account must remain."));
    }
  }

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

const deleteUserHandler = asyncHandler(async (req, res, next) => {
  const target = await store.findUserById(req.params.id);
  if (!target) return next(fail(404, "NOT_FOUND", "User not found."));

  // Same guard rails as deactivation: never let a Super Admin delete
  // themselves, and never let the last Super Admin account be removed.
  if (target.id === req.user.id) {
    return next(fail(422, "CANNOT_DELETE_SELF", "You can't delete your own account."));
  }
  if (target.role === store.ROLES.SUPER_ADMIN) {
    const superAdmins = await store.listAllUsers({ role: store.ROLES.SUPER_ADMIN });
    const others = superAdmins.filter((u) => u.id !== target.id);
    if (others.length === 0) {
      return next(fail(422, "LAST_SUPER_ADMIN", "At least one other Super Admin account must remain."));
    }
  }

  await store.deleteUser(target.id);

  await store.addAuditLog({
    actor: req.user,
    action: "Super Admin deleted account",
    target: { id: target.id, label: target.employee_id },
    metadata: { role: target.role },
  });

  return ok(res, { deleted: true, id: target.id });
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
  const counts = await store.getEmployeeCountsByTeamLeader();
  const withCounts = teamLeaders.map((tl) => ({
    id: tl.id,
    employeeId: tl.employee_id,
    name: tl.name_en,
    zone: tl.zone,
    mobile: tl.mobile,
    address: tl.address,
    designation: tl.designation,
    status: tl.status,
    managerId: tl.manager_id,
    employeeCount: counts.get(tl.id) || 0,
  }));
  return ok(res, { teamLeaders: withCounts });
});

module.exports = {
  getDashboard,
  listAllSubmissions,
  exportAllSubmissions,
  listUsers,
  createUser,
  updateUser: updateUserHandler,
  deleteUser: deleteUserHandler,
  updateAssignments,
  listTeamLeaders,
};
