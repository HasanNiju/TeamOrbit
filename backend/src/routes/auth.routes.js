const express = require("express");
const { login, logout, me, forgotPassword } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.post("/forgot-password", loginLimiter, forgotPassword);

module.exports = router;
