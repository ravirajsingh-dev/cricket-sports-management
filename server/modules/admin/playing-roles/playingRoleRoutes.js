const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createPlayingRole,
  getPlayingRoles,
  updatePlayingRole,
  deletePlayingRole,
} = require("./playingRoleController");

router.post(
  "/",
  [AdminAuth, checkPermission("playing-roles", "create")],
  createPlayingRole,
);

router.get(
  "/",
  [AdminAuth, checkPermission("playing-roles", "list")],
  getPlayingRoles,
);

router.put(
  "/:id",
  [
    AdminAuth,
    checkPermission("playing-roles", "edit"),
    verifyTransactionPassword,
  ],
  updatePlayingRole,
);

router.delete(
  "/:id",
  [
    AdminAuth,
    checkPermission("playing-roles", "delete"),
    verifyTransactionPassword,
  ],
  deletePlayingRole,
);

module.exports = router;
