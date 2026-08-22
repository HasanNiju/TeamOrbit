const bcrypt = require("bcryptjs");
const store = require("../data/store");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { serializeUser } = require("../utils/serialize");
const { verifyPassword } = require("../services/authService");

const getAccount = asyncHandler(async (req, res) => {
  return ok(res, { user: await serializeUser(req.user) });
});

const updateAccount = asyncHandler(async (req, res) => {
  const patch = {};
  for (const key of ["mobile", "zone", "address"]) {
    if (key in (req.body || {})) patch[key] = req.body[key];
  }
  if (req.body?.name) {
    patch.name = req.body.name;
    patch.name_en = req.body.name;
  }
  const updated = await store.updateUser(req.user.id, patch);
  return ok(res, { user: await serializeUser(updated) });
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return next(fail(400, "MISSING_FIELDS", "Current and new password are required."));
  if (String(newPassword).length < 6) return next(fail(422, "WEAK_PASSWORD", "New password must be at least 6 characters."));
  if (!verifyPassword(currentPassword, req.user.password_hash)) {
    return next(fail(401, "INVALID_CREDENTIALS", "Current password is incorrect."));
  }
  await store.updateUser(req.user.id, { password_hash: bcrypt.hashSync(newPassword, 10) });
  await store.addAuditLog({ actor: req.user, action: "User changed their own password", target: { id: req.user.id, label: req.user.employee_id } });
  return ok(res, { changed: true });
});

module.exports = { getAccount, updateAccount, changePassword };
