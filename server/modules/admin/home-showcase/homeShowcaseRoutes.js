const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");
const {
  getHomeShowcase,
  updateHomeShowcase,
  createSelectorBadge,
  updateSelectorBadge,
  deleteSelectorBadge,
  updateSectionSettings,
  createSelectorPerson,
  updateSelectorPerson,
  deleteSelectorPerson,
  createImpactItem,
  updateImpactItem,
  deleteImpactItem,
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
} = require("./homeShowcaseController");

const upload = createImageUpload();

router.get(
  "/",
  [AdminAuth, checkPermission("home-showcase", "list")],
  getHomeShowcase,
);

router.put(
  "/",
  [
    AdminAuth,
    checkPermission("home-showcase", "edit"),
    upload.any(),
    validateUploadedImageMagic,
    verifyTransactionPassword,
  ],
  updateHomeShowcase,
);

router.post(
  "/badges",
  [AdminAuth, checkPermission("home-showcase", "edit")],
  createSelectorBadge,
);

router.put(
  "/badges/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  updateSelectorBadge,
);

router.delete(
  "/badges/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  deleteSelectorBadge,
);

router.post(
  "/people",
  [
    AdminAuth,
    checkPermission("home-showcase", "edit"),
    upload.any(),
    validateUploadedImageMagic,
  ],
  createSelectorPerson,
);

router.put(
  "/people/:id",
  [
    AdminAuth,
    checkPermission("home-showcase", "edit"),
    upload.any(),
    validateUploadedImageMagic,
    verifyTransactionPassword,
  ],
  updateSelectorPerson,
);

router.delete(
  "/people/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  deleteSelectorPerson,
);

router.post(
  "/impact/items",
  [AdminAuth, checkPermission("home-showcase", "edit")],
  createImpactItem,
);

router.put(
  "/impact/items/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  updateImpactItem,
);

router.delete(
  "/impact/items/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  deleteImpactItem,
);

router.post(
  "/testimonials/items",
  [AdminAuth, checkPermission("home-showcase", "edit")],
  createTestimonialItem,
);

router.put(
  "/testimonials/items/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  updateTestimonialItem,
);

router.delete(
  "/testimonials/items/:id",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  deleteTestimonialItem,
);

router.put(
  "/:section/settings",
  [AdminAuth, checkPermission("home-showcase", "edit"), verifyTransactionPassword],
  updateSectionSettings,
);

module.exports = router;
