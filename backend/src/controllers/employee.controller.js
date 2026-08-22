const store = require("../data/store");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { serializeUser, serializeSubmission } = require("../utils/serialize");
const { validateSubmissionInput } = require("../utils/validation");
const { isWithinSubmissionWindow, WINDOW_OPEN_MINUTE, WINDOW_CLOSE_MINUTE } = require("../utils/dhakaTime");

// Only these fields are employee-editable (PRD §15). Employee ID, role,
// totals, rank, Team Leader and Manager are system-controlled.
const EDITABLE_FIELDS = { name: "name", mobile: "mobile", address: "address", zone: "zone" };

const getMe = asyncHandler(async (req, res) => {
  const { rank, outOf } = await store.getRankFor(req.user.id);
  const totalSubmissions = await store.getEmployeeTotal(req.user.id);
  return ok(res, { user: await serializeUser(req.user), rank, rankOutOf: outOf, totalSubmissions });
});

const updateMe = asyncHandler(async (req, res) => {
  const patch = {};
  for (const [bodyKey, storeKey] of Object.entries(EDITABLE_FIELDS)) {
    if (bodyKey in (req.body || {})) patch[storeKey] = req.body[bodyKey];
  }
  const updated = await store.updateUser(req.user.id, patch);
  return ok(res, { user: await serializeUser(updated) });
});

const uploadPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(fail(400, "MISSING_FILE", "No photo uploaded."));
  // No durable filesystem in a serverless function — store the photo as a
  // base64 data URI directly on the user row instead of writing to disk.
  const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const updated = await store.updateUser(req.user.id, { profile_photo_url: dataUri });
  return ok(res, { user: await serializeUser(updated) });
});

const getMyStats = asyncHandler(async (req, res) => {
  const stats = await store.getEmployeeStats(req.user.id);
  const { rank, outOf } = await store.getRankFor(req.user.id);
  return ok(res, { ...stats, rank, rankOutOf: outOf });
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { rows, pagination } = await store.querySubmissions({
    scope: { employeeUserId: req.user.id },
    page,
    limit,
    sort: "newest",
  });
  return ok(res, { submissions: await Promise.all(rows.map(serializeSubmission)), pagination });
});

const createSubmission = asyncHandler(async (req, res, next) => {
  // Server-side time check is authoritative — the client's clock/timezone is
  // never trusted (PRD §44).
  if (!isWithinSubmissionWindow(new Date())) {
    return next(
      fail(
        403,
        "SUBMISSION_CLOSED",
        `Reports can only be submitted between 8:00 AM and 8:00 PM Bangladesh time.`
      )
    );
  }

  const errors = validateSubmissionInput(req.body || {});
  if (errors.length > 0) {
    return next(fail(422, "VALIDATION_ERROR", errors.map((e) => e.message).join(" ")));
  }

  const employeeUser = {
    ...req.user,
    // Allow the officer to correct their displayed name/designation on the
    // form itself without permanently changing their profile — the record
    // snapshots whatever was actually submitted.
    name: req.body.name || req.user.name_en || req.user.name,
    designation: req.body.designation || req.user.designation,
  };

  const record = await store.createSubmission({
    employeeUser: { ...employeeUser, id: req.user.id, employee_id: req.user.employee_id },
    address: req.body.address,
    mobile: req.body.mobile,
    opinion: req.body.opinion,
  });

  return ok(res, { submission: await serializeSubmission(record) }, 201);
});

/** Small helper the frontend can poll to render the "closed" / "opens at 8am" banners. */
const getSubmissionWindowStatus = asyncHandler(async (req, res) => {
  const open = isWithinSubmissionWindow(new Date());
  return ok(res, { open, windowStartMinute: WINDOW_OPEN_MINUTE, windowEndMinute: WINDOW_CLOSE_MINUTE });
});

module.exports = {
  getMe,
  updateMe,
  uploadPhoto,
  getMyStats,
  getMySubmissions,
  createSubmission,
  getSubmissionWindowStatus,
};
