const store = require("../data/store");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { serializeEmployeeListItem, serializeSubmission, serializeUser } = require("../utils/serialize");
const { validateSubmissionInput, isValidBdMobile, isNonEmptyString } = require("../utils/validation");
const { buildSubmissionsWorkbook, buildExportFilename } = require("../services/exportService");

// --- Dashboard ---------------------------------------------------------------

const getDashboard = asyncHandler(async (req, res) => {
  const employees = store.listEmployees({ teamLeaderId: req.user.id });
  const todayRows = store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: today(), dateTo: today() });
  const weekRows = store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: weekStart() });
  const monthRows = store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: monthStart() });

  return ok(res, {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === "active").length,
    todaySubmissions: todayRows.length,
    weekSubmissions: weekRows.length,
    monthSubmissions: monthRows.length,
  });
});

const { getDhakaDateKey, getDhakaWeekStartKey, getDhakaMonthKey } = require("../utils/dhakaTime");
function today() { return getDhakaDateKey(new Date()); }
function weekStart() { return getDhakaWeekStartKey(new Date()); }
function monthStart() { return `${getDhakaMonthKey(new Date())}-01`; }

// --- Submissions ---------------------------------------------------------------

function parseListQuery(req) {
  const { search = "", page = 1, limit = 20, sort = "newest", dateFrom = null, dateTo = null, employeeId = null } = req.query;
  return { search, page, limit, sort, dateFrom, dateTo, employeeId };
}

const listSubmissions = asyncHandler(async (req, res) => {
  const { search, page, limit, sort, dateFrom, dateTo, employeeId } = parseListQuery(req);

  let employeeUserId = null;
  if (employeeId) {
    const employee = store.findUserByEmployeeId(employeeId) || store.findUserById(employeeId);
    if (employee && employee.team_leader_id === req.user.id) employeeUserId = employee.id;
  }

  const { rows, pagination } = store.querySubmissions({
    scope: { teamLeaderIds: [req.user.id] },
    employeeUserId,
    search,
    sort,
    dateFrom,
    dateTo,
    page,
    limit,
  });

  return ok(res, { submissions: rows.map(serializeSubmission), pagination });
});

const getSubmissionDetail = asyncHandler(async (req, res, next) => {
  const submission = store.submissions.find((s) => s.id === req.params.id);
  if (!submission) return next(fail(404, "NOT_FOUND", "Submission not found."));
  const employee = store.findUserById(submission.employee_user_id);
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(403, "FORBIDDEN", "You do not have access to this submission."));
  }
  return ok(res, { submission: serializeSubmission(submission) });
});

// --- Employees ---------------------------------------------------------------

const listEmployeesHandler = asyncHandler(async (req, res) => {
  const employees = store.listEmployees({ teamLeaderId: req.user.id });
  return ok(res, { employees: employees.map(serializeEmployeeListItem) });
});

const getEmployeeDetail = asyncHandler(async (req, res, next) => {
  const employee = store.findUserById(req.params.id) || store.findUserByEmployeeId(req.params.id);
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(404, "NOT_FOUND", "Employee not found."));
  }
  const stats = store.getEmployeeStats(employee.id);
  const { rank, outOf } = store.getRankFor(employee.id);
  return ok(res, { employee: serializeUser(employee), stats, rank, rankOutOf: outOf });
});

const getEmployeeSubmissions = asyncHandler(async (req, res, next) => {
  const employee = store.findUserById(req.params.id) || store.findUserByEmployeeId(req.params.id);
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(404, "NOT_FOUND", "Employee not found."));
  }
  const { page = 1, limit = 20, sort = "newest" } = req.query;
  const { rows, pagination } = store.querySubmissions({ scope: { employeeUserId: employee.id }, page, limit, sort });
  return ok(res, { submissions: rows.map(serializeSubmission), pagination });
});

const createEmployee = asyncHandler(async (req, res, next) => {
  const { employeeId, name, mobile, zone, address, password, designation = "Marketing Officer" } = req.body || {};

  const problems = [];
  if (!isNonEmptyString(employeeId)) problems.push("Employee ID is required.");
  if (!isNonEmptyString(name)) problems.push("Name is required.");
  if (mobile && !isValidBdMobile(mobile)) problems.push("Enter a valid Bangladeshi mobile number.");
  if (!isNonEmptyString(password) || password.length < 6) problems.push("A password of at least 6 characters is required.");
  if (problems.length) return next(fail(422, "VALIDATION_ERROR", problems.join(" ")));

  if (store.findUserByEmployeeId(employeeId)) {
    return next(fail(409, "DUPLICATE_EMPLOYEE_ID", "This Employee ID is already in use."));
  }

  // Admins can only create Marketing Officers under themselves (PRD §33).
  const employee = store.createUser({
    employeeId,
    name,
    nameEn: name,
    password,
    role: store.ROLES.MARKETING_OFFICER,
    designation,
    mobile,
    zone,
    address,
    teamLeaderId: req.user.id,
    managerId: req.user.manager_id,
    language: "bn",
    status: "active",
  });

  store.addAuditLog({
    actor: req.user,
    action: "Admin created employee",
    target: { id: employee.id, label: employee.employee_id },
  });

  return ok(res, { employee: serializeUser(employee) }, 201);
});

// --- Export ---------------------------------------------------------------

const exportSubmissions = asyncHandler(async (req, res) => {
  const { search, sort, dateFrom, dateTo, employeeId } = parseListQuery(req);
  let employeeUserId = null;
  if (employeeId) {
    const employee = store.findUserByEmployeeId(employeeId) || store.findUserById(employeeId);
    if (employee && employee.team_leader_id === req.user.id) employeeUserId = employee.id;
  }
  const rows = store.queryAllSubmissions({
    scope: { teamLeaderIds: [req.user.id] },
    employeeUserId,
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

  store.addAuditLog({ actor: req.user, action: "Admin exported reports", metadata: { filename, count: rows.length } });
});

module.exports = {
  getDashboard,
  listSubmissions,
  getSubmissionDetail,
  listEmployees: listEmployeesHandler,
  getEmployeeDetail,
  getEmployeeSubmissions,
  createEmployee,
  exportSubmissions,
};
