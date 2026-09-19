const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createSliderBanner,
  getSliderBanners,
  updateSliderBanner,
  deleteSliderBanner,
  getHeroSettings,
  updateHeroSettings,
} = require("./sliderController");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");

const upload = createImageUpload();

router.get(
  "/hero-settings",
  [AdminAuth, checkPermission("slider", "list")],
  getHeroSettings,
);

router.put(
  "/hero-settings",
  [AdminAuth, checkPermission("slider", "edit"), verifyTransactionPassword],
  updateHeroSettings,
);

router.post(
  "/",
  [AdminAuth, checkPermission("slider", "create")],
  upload.single("image"),
  validateUploadedImageMagic,
  createSliderBanner,
);

router.get("/", [AdminAuth, checkPermission("slider", "list")], getSliderBanners);

router.put(
  "/:id",
  [AdminAuth, checkPermission("slider", "edit"), verifyTransactionPassword],
  upload.single("image"),
  validateUploadedImageMagic,
  updateSliderBanner,
);

router.delete(
  "/:id",
  [AdminAuth, checkPermission("slider", "delete"), verifyTransactionPassword],
  deleteSliderBanner,
);

module.exports = router;
