const { verifyToken } = require("../services/authService");
const { findUserById } = require("../data/store");
const { fail } = require("../utils/apiResponse");

/** Reads a Bearer token from Authorization header, falling back to the "token" cookie. */
function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length).trim();
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(fail(401, "UNAUTHENTICATED", "Login required."));

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(fail(401, "INVALID_TOKEN", "Session expired or invalid. Please log in again."));
  }

  const user = findUserById(payload.sub);
  if (!user) return next(fail(401, "INVALID_TOKEN", "Account not found."));
  if (user.status !== "active") return next(fail(403, "INACTIVE_ACCOUNT", "This account has been deactivated."));

  req.user = user;
  next();
}

/** Restricts a route to one or more roles, e.g. requireRole("ADMIN", "SUPER_ADMIN"). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(fail(401, "UNAUTHENTICATED", "Login required."));
    if (!roles.includes(req.user.role)) {
      return next(fail(403, "FORBIDDEN", "You do not have permission to perform this action."));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
