/**
 * Rate Limiter Configuration Module
 *
 * Defines rate limiting configurations for different route groups to prevent
 * abuse and brute force attacks. Each route group has appropriate limits based
 * on its security requirements.
 *
 * Rate limiters:
 * - Auth routes: 25 requests per 15 minutes (prevents brute force)
 * - Registration: 5 requests per 15 minutes (stricter anti-abuse)
 * - Admin routes: 50 requests per 15 minutes (moderate restriction)
 * - General API routes: 100 requests per 15 minutes (standard usage)
 */

const rateLimit = require("express-rate-limit");
const { MongoRateLimitStore } = require("../shared/utils/mongoRateLimitStore");

/**
 * Authentication rate limiter
 * Prevents brute force attacks on login endpoints
 * Limit: 25 requests per 15 minutes
 */
const createAuthLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Limit each IP to 25 requests per windowMs
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoRateLimitStore("auth"),
    passOnStoreError: true,
  });
};

/**
 * Registration rate limiter
 * Stricter limit to prevent mass account creation / abuse
 * Limit: 5 requests per 15 minutes
 */
const createRegisterLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registration attempts per windowMs
    message: "Too many registration attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoRateLimitStore("register"),
    passOnStoreError: true,
  });
};

/**
 * Admin routes rate limiter
 * Moderate restriction for admin operations
 * Limit: 50 requests per 15 minutes
 */
const createAdminLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoRateLimitStore("admin"),
    passOnStoreError: true,
  });
};

/**
 * General API routes rate limiter
 * Standard restriction for regular API usage
 * Limit: 100 requests per 15 minutes
 */
const createGeneralApiLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    store: new MongoRateLimitStore("api"),
    passOnStoreError: true,
  });
};

/**
 * Conditional auth rate limiter middleware
 * Applies stricter registerLimiter to registration; authLimiter elsewhere
 * @param {Function} authLimiter - The auth rate limiter instance
 * @param {Function} registerLimiter - The registration rate limiter instance
 * @returns {Function} Middleware function
 */
const createAuthRateLimitMiddleware = (authLimiter, registerLimiter) => {
  return (req, res, next) => {
    // Check both req.path and req.originalUrl to ensure we catch the registration route
    const path = req.path || req.originalUrl || "";
    if (path.includes("/users/register")) {
      return registerLimiter(req, res, next);
    }
    // Apply rate limiting to all other /api/auth routes (login endpoints)
    return authLimiter(req, res, next);
  };
};

module.exports = {
  createAuthLimiter,
  createRegisterLimiter,
  createAdminLimiter,
  createGeneralApiLimiter,
  createAuthRateLimitMiddleware,
};
