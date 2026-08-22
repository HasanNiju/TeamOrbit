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
router.use("/", employeeRoutes); // /api/me, /api/submissions, ...
router.use("/admin", adminRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/account", accountRoutes);

module.exports = router;
