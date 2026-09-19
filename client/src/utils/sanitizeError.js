/**
 * Client-side error sanitization for user-facing alerts.
 * Allows short, intentional API messages through; blocks stacks / internals.
 */

const BLOCK_PATTERNS = [
  /\bat\s+\S+\s+\(/i,
  /MongoError|MongoServerError/i,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i,
  /ValidationError:|Cast to ObjectId/i,
  /stack:?\s/i,
  /node_modules/i,
  /\/home\/|\/var\/|\/usr\//i,
];

/**
 * @param {string} [message]
 * @param {string} [fallback]
 * @returns {string}
 */
const sanitizeGenericError = (
  message,
  fallback = "An error occurred. Please try again.",
) => {
  if (!message || typeof message !== "string") {
    return fallback;
  }

  const trimmed = message.trim();
  if (!trimmed) return fallback;

  const lowerMessage = trimmed.toLowerCase();

  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  if (lowerMessage.includes("timeout")) {
    return "Request timed out. Please try again.";
  }
  if (lowerMessage.includes("session") && lowerMessage.includes("expired")) {
    return "Session expired. Please sign in again.";
  }

  if (trimmed.length > 280) {
    return fallback;
  }

  if (BLOCK_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return fallback;
  }

  return trimmed;
};

/**
 * Prefer API message / msg fields, then sanitize for toast display.
 * @param {unknown} errOrPayload
 * @param {string} [fallback]
 * @returns {string}
 */
export const sanitizeApiAlert = (
  errOrPayload,
  fallback = "An error occurred. Please try again.",
) => {
  if (!errOrPayload) return fallback;

  if (typeof errOrPayload === "string") {
    return sanitizeGenericError(errOrPayload, fallback);
  }

  const data = errOrPayload.response?.data || errOrPayload;
  const raw =
    data?.message ||
    data?.msg ||
    (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
    errOrPayload.message ||
    errOrPayload.statusText;

  return sanitizeGenericError(raw, fallback);
};
