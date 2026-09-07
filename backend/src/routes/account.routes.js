const express = require("express");
const controller = require("../controllers/account.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uploadPhotoMiddleware } = require("../middleware/upload");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

router.get("/", controller.getAccount);
router.patch("/", controller.updateAccount);
router.post("/photo", uploadPhotoMiddleware, controller.uploadPhoto);
router.post("/change-password", controller.changePassword);

module.exports = router;
