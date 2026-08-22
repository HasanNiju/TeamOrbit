const { findUserByEmployeeId } = require("../data/store");
const { signToken, verifyPassword } = require("../services/authService");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { serializeUser } = require("../utils/serialize");
const store = require("../data/store");

const isProd = process.env.NODE_ENV === "production";

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 12 * 60 * 60 * 1000,
  });
}

const login = asyncHandler(async (req, res, next) => {
  const { employeeId, password } = req.body || {};
  if (!employeeId || !password) {
    return next(fail(400, "MISSING_FIELDS", "Employee ID and password are required."));
  }

  const user = await findUserByEmployeeId(employeeId);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return next(fail(401, "INVALID_CREDENTIALS", "Employee ID or password is incorrect."));
  }
  if (user.status !== "active") {
    return next(fail(403, "INACTIVE_ACCOUNT", "This account has been deactivated. Contact your Team Leader."));
  }

  const token = signToken(user);
  setAuthCookie(res, token);
  return ok(res, { token, user: await serializeUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  return ok(res, { loggedOut: true });
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { user: await serializeUser(req.user) });
});

// Dummy-data phase: acknowledges the request without sending real email/SMS.
// Wire up to a real provider once the database + email/SMS service exist.
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.body || {};
  if (!employeeId) return next(fail(400, "MISSING_FIELDS", "Employee ID is required."));
  const user = await findUserByEmployeeId(employeeId);
  // Always return success shape regardless of whether the account exists,
  // so this endpoint can't be used to enumerate valid Employee IDs.
  return ok(res, {
    message: user
      ? "If this account exists, password reset instructions have been sent."
      : "If this account exists, password reset instructions have been sent.",
  });
});

module.exports = { login, logout, me, forgotPassword };
