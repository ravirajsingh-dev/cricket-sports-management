const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  getTeamGroups,
  createTeamGroup,
  updateTeamGroup,
  deleteTeamGroup,
  getTeamSettings,
  updateTeamSettings,
} = require("./teamController");
const {
  createImageUpload,
  validateUploadedImageMagic,
} = require("../../../shared/middleware/upload");

const upload = createImageUpload();

router.get(
  "/settings",
  [AdminAuth, checkPermission("teams", "list")],
  getTeamSettings,
);

router.put(
  "/settings",
  [AdminAuth, checkPermission("teams", "edit"), verifyTransactionPassword],
  updateTeamSettings,
);

router.get(
  "/groups",
  [AdminAuth, checkPermission("teams", "list")],
  getTeamGroups,
);

router.post(
  "/groups",
  [AdminAuth, checkPermission("teams", "create")],
  createTeamGroup,
);

router.put(
  "/groups/:id",
  [AdminAuth, checkPermission("teams", "edit"), verifyTransactionPassword],
  updateTeamGroup,
);

router.delete(
  "/groups/:id",
  [AdminAuth, checkPermission("teams", "delete"), verifyTransactionPassword],
  deleteTeamGroup,
);

router.post(
  "/",
  [AdminAuth, checkPermission("teams", "create")],
  upload.single("image"),
  validateUploadedImageMagic,
  createTeam,
);

router.get("/", [AdminAuth, checkPermission("teams", "list")], getTeams);

router.put(
  "/:id",
  [AdminAuth, checkPermission("teams", "edit"), verifyTransactionPassword],
  upload.single("image"),
  validateUploadedImageMagic,
  updateTeam,
);

router.delete(
  "/:id",
  [AdminAuth, checkPermission("teams", "delete"), verifyTransactionPassword],
  deleteTeam,
);

module.exports = router;
