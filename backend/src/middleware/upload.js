const multer = require("multer");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (PRD §49)

// Memory storage (not disk): serverless functions have no durable filesystem
// between invocations, so profile photos are converted to a base64 data URI
// in the controller and stored directly on the user row instead.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(Object.assign(new Error("Only JPEG, PNG or WebP images are allowed."), { status: 422, code: "INVALID_FILE_TYPE" }));
  }
  cb(null, true);
}

const uploadPhotoMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).single("photo");

module.exports = { uploadPhotoMiddleware };
