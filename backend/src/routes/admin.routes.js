const express = require("express");
const controller = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// Team Leaders use these routes normally. Super Admins are also allowed
// through here as a defensive superset — a Manager should never be hard
// blocked by the narrower Team-Leader scoping; they primarily use the
// broader /api/super-admin/* routes, but this avoids a 403 dead-end.
router.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

router.get("/dashboard", controller.getDashboard);
router.get("/submissions", controller.listSubmissions);
router.get("/submissions/:id", controller.getSubmissionDetail);
router.get("/employees", controller.listEmployees);
router.post("/employees", controller.createEmployee);
router.get("/employees/:id", controller.getEmployeeDetail);
router.get("/employees/:id/submissions", controller.getEmployeeSubmissions);
router.get("/export", controller.exportSubmissions);

module.exports = router;
