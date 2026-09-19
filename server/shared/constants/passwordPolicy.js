/**
 * Single password / transaction-password policy for Admin + User APIs.
 * Keep FE copy in sync with `message` and `pattern`.
 */

const PASSWORD_POLICY = Object.freeze({
  minLength: 8,
  maxLength: 22,
  /** Allowed charset; length bounds enforced separately via min/max. */
  pattern: /^[a-zA-Z0-9@#$%^&+=!*-_.]{8,22}$/,
  /** String form for express-validator `.matches()`. */
  patternSource: "^[a-zA-Z0-9@#$%^&+=!*-_.]{8,22}$",
  message: "Password must be 8 to 22 characters long.",
});

/**
 * Reject HTML/script tags in password fields.
 * @param {string} value
 * @returns {boolean}
 */
const passwordHasNoHtml = (value) => !/<[^>]*>/g.test(String(value ?? ""));

module.exports = {
  PASSWORD_POLICY,
  passwordHasNoHtml,
  // Backward-compatible aliases used by existing route validators
  validation_msg: PASSWORD_POLICY.message,
  validation_pattern: PASSWORD_POLICY.patternSource,
};
