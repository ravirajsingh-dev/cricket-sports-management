/**
 * Brute-force protection — Mongo-backed counters (multi-instance safe).
 */

const LoginAttempt = require("../../models/LoginAttempt");

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is blocked due to brute-force protection
 * @param {string} identifier - User identifier (memberId / admin_id)
 */
const checkBruteForceProtection = async (identifier) => {
  if (!identifier) {
    return {
      isBlocked: false,
      blockedUntil: null,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  const attemptData = await LoginAttempt.findOne({ identifier }).lean();

  if (!attemptData) {
    return {
      isBlocked: false,
      blockedUntil: null,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  const now = new Date();

  if (attemptData.blockedUntil && attemptData.blockedUntil > now) {
    const remainingMs = attemptData.blockedUntil.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      isBlocked: true,
      blockedUntil: attemptData.blockedUntil,
      remainingAttempts: 0,
      remainingMinutes,
    };
  }

  if (attemptData.blockedUntil && attemptData.blockedUntil <= now) {
    await LoginAttempt.deleteOne({ identifier });
    return {
      isBlocked: false,
      blockedUntil: null,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }

  return {
    isBlocked: false,
    blockedUntil: null,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - (attemptData.attempts || 0)),
  };
};

/**
 * Record a failed login attempt
 * @param {string} identifier
 */
const recordFailedAttempt = async (identifier) => {
  if (!identifier) return;

  const now = new Date();
  const existing = await LoginAttempt.findOne({ identifier });

  if (!existing) {
    const blockedUntil =
      1 >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_DURATION_MS) : null;
    await LoginAttempt.create({
      identifier,
      attempts: 1,
      blockedUntil,
    });
    return;
  }

  // Clear expired block and restart counting
  if (existing.blockedUntil && existing.blockedUntil <= now) {
    existing.attempts = 1;
    existing.blockedUntil = null;
    await existing.save();
    return;
  }

  existing.attempts += 1;
  if (existing.attempts >= MAX_ATTEMPTS) {
    existing.blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
  }
  await existing.save();
};

/**
 * Reset failed attempts for a successful login
 * @param {string} identifier
 */
const resetAttempts = async (identifier) => {
  if (!identifier) return;
  await LoginAttempt.deleteOne({ identifier });
};

module.exports = {
  checkBruteForceProtection,
  recordFailedAttempt,
  resetAttempts,
};
