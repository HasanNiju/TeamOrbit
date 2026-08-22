const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (PRD §49)

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "uploads"),
  filename: (req, file, cb) => {
    const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype] || "";
    cb(null, `${req.user?.id || "anon"}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

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
