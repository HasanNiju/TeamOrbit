const { ApiError } = require("../utils/apiResponse");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message, code: err.code });
  }

  // Multer / body-parser style errors carry a `status` or `statusCode`.
  const status = err.status || err.statusCode || 500;
  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message || "Request could not be processed.",
      code: err.code || "BAD_REQUEST",
    });
  }

  console.error("[unhandled error]", err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our side. Please try again.",
    code: "INTERNAL_ERROR",
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "Route not found.", code: "NOT_FOUND" });
}

module.exports = { errorHandler, notFoundHandler };
