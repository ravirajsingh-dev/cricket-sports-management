const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  getContactMessages,
  getContactMessageById,
  deleteContactMessage,
} = require("./contactMessageController");

router.get(
  "/",
  [AdminAuth, checkPermission("contact-messages", "list")],
  getContactMessages,
);

router.get(
  "/:id",
  [AdminAuth, checkPermission("contact-messages", "list")],
  getContactMessageById,
);

router.delete(
  "/:id",
  [
    AdminAuth,
    checkPermission("contact-messages", "delete"),
    verifyTransactionPassword,
  ],
  deleteContactMessage,
);

module.exports = router;
