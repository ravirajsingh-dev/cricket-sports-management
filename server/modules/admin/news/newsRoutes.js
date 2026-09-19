const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  getNewsSettings,
  updateNewsSettings,
} = require("./newsController");
const { MAX_NEWS_IMAGES } = require("../../../shared/constants/imageUpload");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");

const upload = createImageUpload();

router.post(
  "/",
  [AdminAuth, checkPermission("news", "create")],
  upload.array("images", MAX_NEWS_IMAGES),
  validateUploadedImageMagic,
  createNews,
);

router.get("/", [AdminAuth, checkPermission("news", "list")], getNews);

router.get(
  "/settings",
  [AdminAuth, checkPermission("news", "list")],
  getNewsSettings,
);

router.put(
  "/settings",
  [AdminAuth, checkPermission("news", "edit"), verifyTransactionPassword],
  updateNewsSettings,
);

router.get("/:id", [AdminAuth, checkPermission("news", "list")], getNewsById);

router.put(
  "/:id",
  [
    AdminAuth,
    checkPermission("news", "edit"),
    upload.array("images", MAX_NEWS_IMAGES),
    validateUploadedImageMagic,
    verifyTransactionPassword,
  ],
  updateNews,
);

router.delete(
  "/:id",
  [AdminAuth, checkPermission("news", "delete"), verifyTransactionPassword],
  deleteNews,
);

module.exports = router;
