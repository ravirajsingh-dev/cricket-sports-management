const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createGalleryImagesBulk,
  getGalleryImages,
  deleteGalleryImage,
  deleteGalleryImagesBulk,
  getGallerySettings,
  updateGallerySettings,
} = require("./galleryController");
const { MAX_GALLERY_BULK_UPLOAD } = require("../../../shared/constants/imageUpload");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");

const upload = createImageUpload();

router.get(
  "/settings",
  [AdminAuth, checkPermission("gallery", "list")],
  getGallerySettings,
);

router.put(
  "/settings",
  [AdminAuth, checkPermission("gallery", "edit"), verifyTransactionPassword],
  updateGallerySettings,
);

router.post(
  "/bulk",
  [AdminAuth, checkPermission("gallery", "create")],
  upload.array("images", MAX_GALLERY_BULK_UPLOAD),
  validateUploadedImageMagic,
  createGalleryImagesBulk,
);

router.delete(
  "/bulk",
  [AdminAuth, checkPermission("gallery", "delete"), verifyTransactionPassword],
  deleteGalleryImagesBulk,
);

router.get("/", [AdminAuth, checkPermission("gallery", "list")], getGalleryImages);

router.delete(
  "/:id",
  [AdminAuth, checkPermission("gallery", "delete"), verifyTransactionPassword],
  deleteGalleryImage,
);

module.exports = router;
