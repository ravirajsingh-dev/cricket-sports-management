const express = require("express");
const router = express.Router();
const { AdminAuth } = require("../../../shared/middleware/auth");
const { checkPermission } = require("../../../shared/middleware/permissions");
const { getStats } = require("./dashboardController");

// @route GET api/admin/dashboard/stats
// @desc Counts for admin home dashboard
// @access Private
router.get(
  "/stats",
  [AdminAuth, checkPermission("dashboard", "list")],
  getStats,
);

module.exports = router;
