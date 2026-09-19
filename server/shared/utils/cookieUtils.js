const { NODE_ENV } = require("../../config/config");

// Get secure cookie options
// In development (e.g. localhost over HTTP), secure must be false or cookies are not sent by the browser
const getCookieOptions = () => {
  const isProduction = NODE_ENV === "production";
  return {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production; false in dev so cookies work on http://localhost
    // Lax allows auth cookies on top-level return navigations.
    sameSite: "lax",
  };
};

const assertAuthCookiePrefix = (prefix) => {
  if (prefix !== "user_" && prefix !== "admin_") {
    throw new Error('Auth cookie prefix must be "user_" or "admin_"');
  }
};

/**
 * Set access token as an HttpOnly cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT access token
 * @param {string} prefix - Required prefix: "user_" or "admin_"
 */
const setAuthTokenCookie = (res, token, prefix) => {
  assertAuthCookiePrefix(prefix);
  res.cookie(`${prefix}token`, token, getCookieOptions());
};

/**
 * Set refresh token as an HttpOnly cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT refresh token
 * @param {string} prefix - Required prefix: "user_" or "admin_"
 */
const setAuthRefreshTokenCookie = (res, token, prefix) => {
  assertAuthCookiePrefix(prefix);
  res.cookie(`${prefix}refreshToken`, token, getCookieOptions());
};

/**
 * Set sessionID cookie
 * @param {Object} res - Express response object
 * @param {string} sessionID - Session ID
 * @param {string} prefix - Required prefix: "user_" or "admin_"
 */
const setSessionIDCookie = (res, sessionID, prefix) => {
  assertAuthCookiePrefix(prefix);
  res.cookie(`${prefix}sessionID`, sessionID, getCookieOptions());
};

/**
 * Set all auth cookies from a session or token bundle.
 * @param {string} prefix - Required: "user_" or "admin_"
 */
const setSessionAuthCookies = (
  res,
  { accessToken, refreshToken, sessionID },
  prefix,
) => {
  assertAuthCookiePrefix(prefix);
  setAuthTokenCookie(res, accessToken, prefix);
  setAuthRefreshTokenCookie(res, refreshToken, prefix);
  setSessionIDCookie(res, sessionID, prefix);
};

/**
 * Clear authentication cookies (access token, refresh token, and sessionID)
 * @param {Object} res - Express response object
 * @param {string} prefix - Required: "user_" or "admin_"
 */
const clearAuthCookies = (res, prefix) => {
  if (prefix !== "user_" && prefix !== "admin_") {
    throw new Error('Auth cookie prefix must be "user_" or "admin_"');
  }
  res.clearCookie(`${prefix}token`, getCookieOptions());
  res.clearCookie(`${prefix}refreshToken`, getCookieOptions());
  res.clearCookie(`${prefix}sessionID`, getCookieOptions());
};

const clearUserAuthCookies = (res) => {
  clearAuthCookies(res, "user_");
};

const clearAdminAuthCookies = (res) => {
  clearAuthCookies(res, "admin_");
};

module.exports = {
  setAuthTokenCookie,
  setAuthRefreshTokenCookie,
  setSessionIDCookie,
  setSessionAuthCookies,
  clearUserAuthCookies,
  clearAdminAuthCookies,
};
