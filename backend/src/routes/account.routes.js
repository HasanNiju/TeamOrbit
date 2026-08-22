const express = require("express");
const controller = require("../controllers/account.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

router.get("/", controller.getAccount);
router.patch("/", controller.updateAccount);
router.post("/change-password", controller.changePassword);

module.exports = router;
