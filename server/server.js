const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { APP_API_PORT } = require("./config/config");
const logger = require("./shared/utils/logger");

// Loaders
const { loadCors } = require("./bootstrap/loaders/corsLoader");
const { loadHelmet } = require("./bootstrap/loaders/helmetLoader");
const { loadRateLimiters } = require("./bootstrap/loaders/rateLimiterLoader");
const { loadMiddleware } = require("./bootstrap/loaders/middlewareLoader");
const { loadRoutes } = require("./bootstrap/loaders/routesLoader");
const { loadErrorHandlers } = require("./bootstrap/loaders/errorHandlersLoader");
const { loadDatabase } = require("./bootstrap/loaders/dbLoader");
const { loadEmailService } = require("./bootstrap/loaders/emailServiceLoader");
const {
  healthHandler,
  readyHandler,
  setShuttingDown,
} = require("./shared/middleware/health");

// Initialize Express application
const app = express();
const server = http.createServer(app);

/**
 * Initialize server
 * Loads all components in the correct order (matching original server.js order)
 */
const initializeServer = async () => {
  try {
    // Trust first proxy (Caddy / DO LB) so rate limits and IPs are correct
    app.set("trust proxy", 1);

    // 1. Load CORS middleware (must be first to handle preflight requests)
    loadCors(app);

    // 2. Load cookie parser (needed early for session handling)
    const cookieParser = require("cookie-parser");
    app.use(cookieParser());

    // 3. Load Helmet security headers
    loadHelmet(app);

    // Probe routes before rate limiters (orchestrator-friendly)
    app.get("/health", healthHandler);
    app.get("/ready", readyHandler);
    app.get("/api/health", healthHandler);
    app.get("/api/ready", readyHandler);

    // 4. Load remaining middleware (body parser, morgan, sanitization, session expiry)
    loadMiddleware(app);

    // 5. Load rate limiters (applied to specific route groups)
    loadRateLimiters(app);

    // 6. Initialize database connection
    await loadDatabase();

    // 7. Verify email service connection (non-blocking)
    await loadEmailService();

    // 8. Load application routes
    loadRoutes(app);

    // 9. Load error handlers (must be last)
    loadErrorHandlers(app);

    // Start server
    const port = APP_API_PORT || 5000;
    server.listen(port, "0.0.0.0", () => {
      logger.info("Server listening", { port });
    });
  } catch (error) {
    logger.error("Server initialization failed", {
      err: error?.message || String(error),
    });
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info("Graceful shutdown started", { signal });
  setShuttingDown(true);

  const forceTimer = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
  forceTimer.unref?.();

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      logger.info("HTTP server and DB closed");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { err: err?.message });
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Initialize and start the server
initializeServer();

module.exports = { app, server };
