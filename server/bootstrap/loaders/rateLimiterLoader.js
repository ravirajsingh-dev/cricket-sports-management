/**
 * Rate Limiter Loader Module
 * 
 * Loads and applies rate limiting middleware to specific route groups.
 * Rate limiter configurations are loaded from config/rateLimiterConfig.js.
 * 
 * Rate limiters are applied in order of specificity:
 * 1. Auth routes (most restrictive) — registration uses a stricter sub-limiter
 * 2. Admin routes (moderate restriction)
 * 3. General API routes (standard restriction)
 */

const {
  createAuthLimiter,
  createRegisterLimiter,
  createAdminLimiter,
  createGeneralApiLimiter,
  createAuthRateLimitMiddleware,
} = require("../../config/rateLimiterConfig");

/**
 * Load rate limiting middleware
 * @param {Express} app - Express application instance
 */
const loadRateLimiters = (app) => {
  // TEMP: rate limiting disabled — re-enable before production / later
  console.log("⚠️ Rate limiting middleware DISABLED (temporary)");
  return;

  // Create rate limiter instances
  const authLimiter = createAuthLimiter();
  const registerLimiter = createRegisterLimiter();
  const adminLimiter = createAdminLimiter();
  const generalApiLimiter = createGeneralApiLimiter();

  // Conditional auth rate limiter: registerLimiter for registration, authLimiter otherwise
  const authRateLimitMiddleware = createAuthRateLimitMiddleware(
    authLimiter,
    registerLimiter
  );

  // Apply rate limiters to specific route groups
  // Note: Order matters - more specific paths should be registered first
  // Authentication routes (25 requests per 15 minutes for login)
  // Registration: /api/auth/users/register — 5 requests per 15 minutes
  // This covers: /api/auth (user login), /api/auth/admin (admin login)
  app.use("/api/auth", authRateLimitMiddleware);

  // Admin routes (moderate restriction - 50 requests per 15 minutes)
  // This covers all /api/admin/* routes except /api/auth/admin (which is handled above)
  app.use("/api/admin", adminLimiter);

  // General API routes (standard restriction - 100 requests per 15 minutes)
  app.use("/api/users", generalApiLimiter);
  app.use("/api/common", generalApiLimiter);

  console.log("✅ Rate limiting middleware loaded");
};

module.exports = {
  loadRateLimiters,
};
