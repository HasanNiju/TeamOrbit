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
  // These four queries are independent — run them concurrently instead of
  // one after another so the dashboard loads in the time of the slowest
  // query, not the sum of all four.
  const [employees, todayRows, weekRows, monthRows] = await Promise.all([
    store.listEmployees({ teamLeaderId: req.user.id }),
    store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: today(), dateTo: today() }),
    store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: weekStart() }),
    store.queryAllSubmissions({ scope: { teamLeaderIds: [req.user.id] }, dateFrom: monthStart() }),
  ]);

  return ok(res, {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === "active").length,
    todaySubmissions: todayRows.length,
    weekSubmissions: weekRows.length,
    monthSubmissions: monthRows.length,
  });
});

// --- Submissions ---------------------------------------------------------------

function parseListQuery(req) {
  const { search = "", page = 1, limit = 20, sort = "newest", dateFrom = null, dateTo = null, employeeId = null } = req.query;
  return { search, page, limit, sort, dateFrom, dateTo, employeeId };
}

const listSubmissions = asyncHandler(async (req, res) => {
  const { search, page, limit, sort, dateFrom, dateTo, employeeId } = parseListQuery(req);

  let employeeUserId = null;
  if (employeeId) {
    const employee = (await store.findUserByEmployeeId(employeeId)) || (await store.findUserById(employeeId));
    if (employee && employee.team_leader_id === req.user.id) employeeUserId = employee.id;
  }

  const { rows, pagination } = await store.querySubmissions({
    scope: { teamLeaderIds: [req.user.id] },
    employeeUserId,
    search,
    sort,
    dateFrom,
    dateTo,
    page,
    limit,
  });

  return ok(res, { submissions: await Promise.all(rows.map(serializeSubmission)), pagination });
});

const getSubmissionDetail = asyncHandler(async (req, res, next) => {
  const submission = await store.findSubmissionById(req.params.id);
  if (!submission) return next(fail(404, "NOT_FOUND", "Submission not found."));
  const employee = await store.findUserById(submission.employee_user_id);
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(403, "FORBIDDEN", "You do not have access to this submission."));
  }
  return ok(res, { submission: await serializeSubmission(submission) });
});

// --- Employees ---------------------------------------------------------------

const listEmployeesHandler = asyncHandler(async (req, res) => {
  const employees = await store.listEmployees({ teamLeaderId: req.user.id });
  return ok(res, { employees: await Promise.all(employees.map(serializeEmployeeListItem)) });
});

const getEmployeeDetail = asyncHandler(async (req, res, next) => {
  const employee = (await store.findUserById(req.params.id)) || (await store.findUserByEmployeeId(req.params.id));
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(404, "NOT_FOUND", "Employee not found."));
  }
  const stats = await store.getEmployeeStats(employee.id);
  const { rank, outOf } = await store.getRankFor(employee.id);
  return ok(res, { employee: await serializeUser(employee), stats, rank, rankOutOf: outOf });
});

const getEmployeeSubmissions = asyncHandler(async (req, res, next) => {
  const employee = (await store.findUserById(req.params.id)) || (await store.findUserByEmployeeId(req.params.id));
  if (!employee || employee.team_leader_id !== req.user.id) {
    return next(fail(404, "NOT_FOUND", "Employee not found."));
  }
  const { page = 1, limit = 20, sort = "newest" } = req.query;
  const { rows, pagination } = await store.querySubmissions({ scope: { employeeUserId: employee.id }, page, limit, sort });
  return ok(res, { submissions: await Promise.all(rows.map(serializeSubmission)), pagination });
});

const createEmployee = asyncHandler(async (req, res, next) => {
  const { employeeId, name, mobile, zone, address, password, designation = "Marketing Officer" } = req.body || {};

  const problems = [];
  if (!isNonEmptyString(employeeId)) problems.push("Employee ID is required.");
  if (!isNonEmptyString(name)) problems.push("Name is required.");
  if (mobile && !isValidBdMobile(mobile)) problems.push("Enter a valid Bangladeshi mobile number.");
  if (!isNonEmptyString(password) || password.length < 6) problems.push("A password of at least 6 characters is required.");
  if (problems.length) return next(fail(422, "VALIDATION_ERROR", problems.join(" ")));

  if (await store.findUserByEmployeeId(employeeId)) {
    return next(fail(409, "DUPLICATE_EMPLOYEE_ID", "This Employee ID is already in use."));
  }

  // Admins can only create Marketing Officers under themselves (PRD §33).
  const employee = await store.createUser({
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
    language: "en",
    status: "active",
  });

  await store.addAuditLog({
    actor: req.user,
    action: "Admin created employee",
    target: { id: employee.id, label: employee.employee_id },
  });

  return ok(res, { employee: await serializeUser(employee) }, 201);
});

// --- Export ---------------------------------------------------------------

const exportSubmissions = asyncHandler(async (req, res) => {
  const { search, sort, dateFrom, dateTo, employeeId } = parseListQuery(req);
  let employeeUserId = null;
  if (employeeId) {
    const employee = (await store.findUserByEmployeeId(employeeId)) || (await store.findUserById(employeeId));
    if (employee && employee.team_leader_id === req.user.id) employeeUserId = employee.id;
  }
  const rows = await store.queryAllSubmissions({
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

  await store.addAuditLog({ actor: req.user, action: "Admin exported reports", metadata: { filename, count: rows.length } });
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
