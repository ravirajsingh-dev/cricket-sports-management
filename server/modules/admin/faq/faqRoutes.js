const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
  getFaqSettings,
  updateFaqSettings,
} = require("./faqController");

router.get(
  "/settings",
  [AdminAuth, checkPermission("faq", "list")],
  getFaqSettings,
);

router.put(
  "/settings",
  [AdminAuth, checkPermission("faq", "edit"), verifyTransactionPassword],
  updateFaqSettings,
);

router.post("/", [AdminAuth, checkPermission("faq", "create")], createFaq);

router.get("/", [AdminAuth, checkPermission("faq", "list")], getFaqs);

router.put(
  "/:id",
  [AdminAuth, checkPermission("faq", "edit"), verifyTransactionPassword],
  updateFaq,
);

router.delete(
  "/:id",
  [AdminAuth, checkPermission("faq", "delete"), verifyTransactionPassword],
  deleteFaq,
);

module.exports = router;
