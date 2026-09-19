const response = require("../../../config/response");
const { getDashboardStats } = require("./dashboardService");
const logger = require("../../../shared/utils/logger");

/**
 * GET /api/admin/dashboard/stats
 */
const getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();
    return response.successResponse(res, stats, "Dashboard stats");
  } catch (err) {
    logger.error("Dashboard stats failed", { err: err.message });
    return response.errorResponse(res, {}, "An error occurred", 500);
  }
};

module.exports = {
  getStats,
};
