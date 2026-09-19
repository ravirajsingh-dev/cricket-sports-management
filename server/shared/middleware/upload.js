const path = require("path");
const multer = require("multer");
const {
  MAX_IMAGE_SIZE_BYTES,
} = require("../constants/imageUpload");
const response = require("../../config/response");

const IMAGE_SIGNATURES = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  {
    mime: "image/webp",
    // RIFF....WEBP
    test: (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50,
  },
];

/**
 * Detect image MIME from magic bytes (ignores client-reported mimetype).
 * @param {Buffer} buffer
 * @returns {string|null}
 */
const sniffImageMime = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 3) return null;

  for (const sig of IMAGE_SIGNATURES) {
    if (typeof sig.test === "function") {
      if (sig.test(buffer)) return sig.mime;
      continue;
    }
    if (sig.bytes.every((byte, i) => buffer[i] === byte)) {
      return sig.mime;
    }
  }
  return null;
};

const imageFileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp/;
  const extname = allowedExt.test(
    path.extname(file.originalname || "").toLowerCase(),
  );
  const mimetype = allowedExt.test(String(file.mimetype || "").toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only jpg, jpeg, png, and webp images are allowed!"));
};

/**
 * Shared multer instance for image uploads (memory storage).
 */
const createImageUpload = (options = {}) => {
  const fileSize = options.fileSize || MAX_IMAGE_SIZE_BYTES;
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize },
    fileFilter: imageFileFilter,
  });
};

/**
 * Post-multer middleware: reject files whose magic bytes are not a real image.
 * Use after upload.single / upload.array / upload.fields.
 */
const validateUploadedImageMagic = (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((group) => {
      if (Array.isArray(group)) files.push(...group);
    });
  }

  for (const file of files) {
    const detected = sniffImageMime(file.buffer);
    if (!detected) {
      return response.errorResponse(
        res,
        { msg: "Invalid or spoofed image file." },
        "Invalid image content",
        400,
      );
    }
    file.detectedMime = detected;
    file.mimetype = detected;
  }

  return next();
};

module.exports = {
  createImageUpload,
  validateUploadedImageMagic,
};
