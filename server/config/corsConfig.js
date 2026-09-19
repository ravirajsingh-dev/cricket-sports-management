/**
 * CORS Configuration Module
 *
 * Configures Cross-Origin Resource Sharing (CORS) middleware with strict
 * origin validation. In production, requests without an Origin header are
 * denied. In non-production, no-Origin is allowed (curl/Postman/dev).
 * Browser requests with Origin require explicit whitelisting via ALLOWED_ORIGINS.
 *
 * SECURITY: Only explicitly whitelisted domains can make browser-based requests.
 */

const { ALLOWED_ORIGINS, NODE_ENV } = require("./config");
const { evaluateCorsOrigin } = require("../shared/utils/corsOrigin");

/**
 * Get CORS configuration options
 * @returns {Object} CORS configuration object
 */
const getCorsOptions = () => {
  return {
    origin: function (origin, callback) {
      const result = evaluateCorsOrigin(origin, {
        allowedOriginsCsv: ALLOWED_ORIGINS,
        nodeEnv: NODE_ENV,
      });
      if (result.allow) {
        return callback(null, true);
      }
      // Reject without throwing — cors Error callbacks become unhandled 500s.
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "x-session-id",
    ],
    exposedHeaders: [],
  };
};

module.exports = {
  getCorsOptions,
};
