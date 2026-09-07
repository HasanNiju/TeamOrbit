const express = require("express");
const { apiLimiter } = require("../middleware/rateLimit");

const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");
const adminRoutes = require("./admin.routes");
const superAdminRoutes = require("./superAdmin.routes");
const accountRoutes = require("./account.routes");

const router = express.Router();

router.use(apiLimiter);

// Registered before the sub-routers below: those mount unauthenticated
// middleware at their own root ("/"), which — since Express matches on
// prefix, not exact path — would otherwise swallow /health too.
router.get("/health", (req, res) => res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } }));

router.use("/auth", authRoutes);

// IMPORTANT: these must be registered BEFORE employeeRoutes below.
// employeeRoutes is mounted at "/" (it owns flat paths like /me and
// /submissions), and it gates EVERY request that reaches it with
// `router.use(requireAuth, requireRole("MARKETING_OFFICER"))`. Because that
// gate calls next(err) on failure, Express jumps straight to the error
// handler and never tries the next router — so if employeeRoutes were
// registered first, a Team Leader/Manager hitting /api/admin/*,
// /api/super-admin/*, or /api/account would get bounced with "You do not
// have permission to perform this action" before ever reaching those
// routers, no matter what role they actually have. Mounting the
// role-specific routers first lets each request match its own router
// (and its own role check) before it can fall through to employeeRoutes.
router.use("/admin", adminRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/account", accountRoutes);
router.use("/", employeeRoutes); // /api/me, /api/submissions, ...

module.exports = router;
