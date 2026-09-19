const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createCarouselItem,
  getCarouselItems,
  updateCarouselItem,
  deleteCarouselItem,
  getCarouselGroups,
  createCarouselGroup,
  updateCarouselGroup,
  deleteCarouselGroup,
} = require("./carouselSectionController");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");

const upload = createImageUpload();

router.get(
  "/groups",
  [AdminAuth, checkPermission("carousel-sections", "list")],
  getCarouselGroups,
);

router.post(
  "/groups",
  [AdminAuth, checkPermission("carousel-sections", "create")],
  createCarouselGroup,
);

router.put(
  "/groups/:id",
  [
    AdminAuth,
    checkPermission("carousel-sections", "edit"),
    verifyTransactionPassword,
  ],
  updateCarouselGroup,
);

router.delete(
  "/groups/:id",
  [
    AdminAuth,
    checkPermission("carousel-sections", "delete"),
    verifyTransactionPassword,
  ],
  deleteCarouselGroup,
);

router.post(
  "/",
  [AdminAuth, checkPermission("carousel-sections", "create")],
  upload.single("image"),
  validateUploadedImageMagic,
  createCarouselItem,
);

router.get(
  "/",
  [AdminAuth, checkPermission("carousel-sections", "list")],
  getCarouselItems,
);

router.put(
  "/:id",
  [AdminAuth, checkPermission("carousel-sections", "edit")],
  upload.single("image"),
  validateUploadedImageMagic,
  verifyTransactionPassword,
  updateCarouselItem,
);

router.delete(
  "/:id",
  [
    AdminAuth,
    checkPermission("carousel-sections", "delete"),
    verifyTransactionPassword,
  ],
  deleteCarouselItem,
);

module.exports = router;
