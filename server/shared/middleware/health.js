const mongoose = require("mongoose");
const response = require("../../config/response");

let shuttingDown = false;

const setShuttingDown = (value) => {
  shuttingDown = Boolean(value);
};

/**
 * Liveness — process is up (does not require DB).
 */
const healthHandler = (req, res) => {
  return response.successResponse(
    res,
    { uptime: process.uptime() },
    "ok",
    200,
  );
};

/**
 * Readiness — accepting traffic (DB connected, not draining).
 */
const readyHandler = (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady || shuttingDown) {
    return response.errorResponse(
      res,
      {
        msg: shuttingDown
          ? "Server is shutting down"
          : "Database not ready",
      },
      "not ready",
      503,
    );
  }
  return response.successResponse(
    res,
    { db: "connected" },
    "ready",
    200,
  );
};

module.exports = {
  healthHandler,
  readyHandler,
  setShuttingDown,
};
