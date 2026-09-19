const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const verifyTransactionPassword = require("../../../shared/middleware/verifyTransactionPassword");
const {
  getHowItWorksSettings,
  updateHowItWorksSettings,
} = require("./howItWorksController");

// @route GET api/admin/how-it-works/settings
// @desc Get How Our Platform Works section settings
// @access Private (Admin)
router.get(
  "/settings",
  [AdminAuth, checkPermission("how-it-works", "list")],
  getHowItWorksSettings
);

// @route PUT api/admin/how-it-works/settings
// @desc Update How Our Platform Works section settings
// @access Private (Admin)
router.put(
  "/settings",
  [AdminAuth, checkPermission("how-it-works", "edit"), verifyTransactionPassword],
  updateHowItWorksSettings
);

module.exports = router;
