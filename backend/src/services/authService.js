const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, employeeId: user.employee_id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

module.exports = { signToken, verifyToken, verifyPassword };
