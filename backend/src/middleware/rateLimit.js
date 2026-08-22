const rateLimit = require("express-rate-limit");

// Login is the highest-value target for brute forcing — keep it tight.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" },
});

// General API traffic — generous, but stops runaway scripts/bots.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
});

module.exports = { loginLimiter, apiLimiter };
