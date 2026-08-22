const express = require("express");
const controller = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Team Leaders only — Super Admins use the broader /api/super-admin/* routes.
router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", controller.getDashboard);
router.get("/submissions", controller.listSubmissions);
router.get("/submissions/:id", controller.getSubmissionDetail);
router.get("/employees", controller.listEmployees);
router.post("/employees", controller.createEmployee);
router.get("/employees/:id", controller.getEmployeeDetail);
router.get("/employees/:id/submissions", controller.getEmployeeSubmissions);
router.get("/export", controller.exportSubmissions);

module.exports = router;
