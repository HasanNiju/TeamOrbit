const express = require("express");
const controller = require("../controllers/superAdmin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/dashboard", controller.getDashboard);
router.get("/submissions", controller.listAllSubmissions);
router.get("/export", controller.exportAllSubmissions);

router.get("/users", controller.listUsers);
router.post("/users", controller.createUser);
router.patch("/users/:id", controller.updateUser);
router.delete("/users/:id", controller.deleteUser);

router.post("/admins", (req, res, next) => {
  req.body.role = "ADMIN";
  next();
}, controller.createUser);

router.post("/super-admins", (req, res, next) => {
  req.body.role = "SUPER_ADMIN";
  next();
}, controller.createUser);

router.get("/team-leaders", controller.listTeamLeaders);
router.patch("/assignments", controller.updateAssignments);

module.exports = router;
