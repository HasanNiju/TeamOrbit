const express = require("express");
const controller = require("../controllers/employee.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadPhotoMiddleware } = require("../middleware/upload");

const router = express.Router();

// Every route here is scoped to Marketing Officers acting on their own data.
router.use(requireAuth, requireRole("MARKETING_OFFICER"));

router.get("/me", controller.getMe);
router.patch("/me", controller.updateMe);
router.post("/me/photo", uploadPhotoMiddleware, controller.uploadPhoto);
router.get("/me/stats", controller.getMyStats);
router.get("/me/submissions", controller.getMySubmissions);
router.get("/submissions/window", controller.getSubmissionWindowStatus);
router.post("/submissions", controller.createSubmission);

module.exports = router;
