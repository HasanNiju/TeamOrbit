const express = require("express");
const { apiLimiter } = require("../middleware/rateLimit");

const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");
const adminRoutes = require("./admin.routes");
const superAdminRoutes = require("./superAdmin.routes");
const accountRoutes = require("./account.routes");

const router = express.Router();

router.use(apiLimiter);

router.use("/auth", authRoutes);
router.use("/", employeeRoutes); // /api/me, /api/submissions, ...
router.use("/admin", adminRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/account", accountRoutes);

router.get("/health", (req, res) => res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } }));

module.exports = router;
