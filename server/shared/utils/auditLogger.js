/**
 * Centralized Security Audit Logger
 *
 * Logs security-related events for monitoring and compliance.
 * All logs are written to console (can be redirected to log files via process managers).
 *
 * SECURITY: This logger does NOT log passwords, tokens, or other sensitive data.
 */

/**
 * Normalize IP strings (IPv4-mapped IPv6, loopback aliases).
 * @param {string|undefined|null} ip
 * @returns {string|null}
 */
const normalizeIp = (ip) => {
  if (!ip || typeof ip !== "string") return null;
  let value = ip.trim();
  if (!value) return null;
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (value === "::1") value = "127.0.0.1";
  return value;
};

/**
 * Get client IP address from request.
 * With `trust proxy` enabled, prefer Express `req.ip` (safe X-Forwarded-For handling).
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getClientIP = (req) => {
  const forwarded = req.headers?.["x-forwarded-for"];
  const forwardedClient =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]?.trim()
      : Array.isArray(forwarded)
        ? String(forwarded[0] || "").split(",")[0]?.trim()
        : null;

  const candidates = [
    req.ip,
    req.headers?.["x-real-ip"],
    forwardedClient,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized) return normalized;
  }

  return "unknown";
};

/**
 * Format timestamp in ISO 8601 format
 * @returns {string} ISO timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Log security event
 * @param {Object} params - Log parameters
 * @param {string} params.eventType - Type of event (e.g., "USER_LOGIN", "PASSWORD_CHANGE")
 * @param {string} params.status - Status: "success" or "fail"
 * @param {string} [params.userID] - User ID (if applicable)
 * @param {string} [params.adminID] - Admin ID (if applicable)
 * @param {string} [params.ipAddress] - IP address (will be extracted from req if not provided)
 * @param {Object} [params.req] - Express request object (for IP extraction)
 * @param {string} [params.details] - Additional details (non-sensitive)
 * @param {Error} [params.error] - Error object (if applicable)
 */
const logSecurityEvent = ({
  eventType,
  status,
  userID = null,
  adminID = null,
  ipAddress = null,
  req = null,
  details = null,
  error = null,
}) => {
  // Extract IP address
  let clientIP = ipAddress;
  if (!clientIP && req) {
    clientIP = getClientIP(req);
  }
  if (!clientIP) {
    clientIP = "unknown";
  }

  // Build log entry
  const logEntry = {
    timestamp: getTimestamp(),
    eventType,
    status,
    userID: userID || null,
    adminID: adminID || null,
    ipAddress: clientIP,
    details: details || null,
    error: error ? error.message : null,
  };

  // Format log message
  const logMessage = `[SECURITY_AUDIT] ${logEntry.timestamp} | ${logEntry.eventType} | ${logEntry.status.toUpperCase()} | UserID: ${logEntry.userID || "N/A"} | AdminID: ${logEntry.adminID || "N/A"} | IP: ${logEntry.ipAddress}${logEntry.details ? ` | Details: ${JSON.stringify(logEntry.details)}` : ""}${logEntry.error ? ` | Error: ${logEntry.error}` : ""}`;

  // Log to console (can be redirected to file via process manager)
  console.log(logMessage);

  // Return log entry for potential database storage in the future
  return logEntry;
};

/**
 * Event type constants
 */
const EVENT_TYPES = {
  // Authentication events
  USER_LOGIN_SUCCESS: "USER_LOGIN_SUCCESS",
  USER_LOGIN_FAILURE: "USER_LOGIN_FAILURE",
  ADMIN_LOGIN_SUCCESS: "ADMIN_LOGIN_SUCCESS",
  ADMIN_LOGIN_FAILURE: "ADMIN_LOGIN_FAILURE",

  // Password events
  USER_PASSWORD_CHANGE: "USER_PASSWORD_CHANGE",
  ADMIN_PASSWORD_CHANGE: "ADMIN_PASSWORD_CHANGE",
  ADMIN_TXN_PASSWORD_CHANGE: "ADMIN_TXN_PASSWORD_CHANGE",

  // Session events
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_REMOVED: "SESSION_REMOVED",
  SESSION_REMOVED_ALL: "SESSION_REMOVED_ALL",
};

module.exports = {
  logSecurityEvent,
  EVENT_TYPES,
  getClientIP,
};
