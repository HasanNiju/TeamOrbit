// PRD §46 — consistent { success, data } / { success, message, code } envelope.

function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, data });
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function fail(status, code, message) {
  return new ApiError(status, code, message);
}

module.exports = { ok, fail, ApiError };
