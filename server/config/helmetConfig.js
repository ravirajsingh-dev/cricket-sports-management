/**
 * Helmet Security Headers Configuration Module
 * 
 * Configures Helmet middleware to set various HTTP security headers that help
 * protect the application from common web vulnerabilities.
 * 
 * Security features:
 * - Frame guard: Prevents clickjacking attacks
 * - Content type sniffing protection: Prevents MIME type sniffing
 * - Referrer policy: Controls referrer information
 * - Content Security Policy: Restricts resource loading
 */

/**
 * Get Helmet configuration options
 * @returns {Object} Helmet configuration object
 */
const getHelmetOptions = () => {
  return {
    frameguard: {
      action: "deny",
    },
    noSniff: true,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    // Allow credentialed CORS from web/admin origins (api.* subdomain).
    // Default Helmet CORP "same-origin" blocks cross-origin reads even when CORS allows them.
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  };
};

module.exports = {
  getHelmetOptions,
};
