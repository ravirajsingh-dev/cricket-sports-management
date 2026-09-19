/**
 * Middleware Loader Module
 * 
 * Loads and applies general middleware to the Express application in the correct order.
 * This includes:
 * - Body parser (JSON and URL-encoded)
 * - Morgan logging
 * - Input sanitization
 * - Session expiry checking
 * 
 * Note: Cookie parser is loaded separately in server.js to maintain exact middleware order.
 * 
 * IMPORTANT: Middleware order matters for security and functionality.
 */

const bodyParser = require("body-parser");
const morganMiddleware = require("../../shared/middleware/morgan");
const { excludeRoutes } = require("../../shared/middleware/middlewareHelper");
const {
  sanitizeInput,
  checkDangerousPatterns,
} = require("../../shared/middleware/inputValidation");

/**
 * Load all general middleware (excluding cookie parser which is loaded separately)
 * @param {Express} app - Express application instance
 */
const loadMiddleware = (app) => {
  // SECURITY: Set body parser limits to 10MB to prevent DoS attacks via large payloads
  // File uploads use multer with separate limits (5MB for images), so they are not affected
  app.use(bodyParser.json({ extended: true, limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

  // Morgan logging middleware
  app.use(morganMiddleware);

  // Input sanitization middleware (applied before other middleware)
  app.use(sanitizeInput);
  // Legal pages carry long plain-text policy copy that trips false positives on SQL/XSS heuristics.
  app.use(
    excludeRoutes(checkDangerousPatterns, [
      "/api/admin/legal-pages",
    ]),
  );

  // Session expiry is validated inside UserAuth/AdminAuth (including refresh rotation).
  // Do not run checkSessionExpiry globally — it previously deactivated sessions mid-flight
  // and caused parallel requests to 401 → client auto-logout.

  console.log("✅ General middleware loaded");
};

module.exports = {
  loadMiddleware,
};
