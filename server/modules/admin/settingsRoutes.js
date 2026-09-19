const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../shared/middleware/auth");
const { checkPermission } = require("../../shared/middleware/permissions");
const {
  getCommonSettings,
  updateCommonSettings,
} = require("./settings/adminSettingsController");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../shared/middleware/upload");

const upload = createImageUpload();

router.get(
  "/settings",
  [AdminAuth, checkPermission("application-settings")],
  getCommonSettings,
);

router.put(
  "/settings",
  [AdminAuth, checkPermission("application-settings")],
  upload.any(),
  validateUploadedImageMagic,
  updateCommonSettings,
);

module.exports = router;
