const mongoose = require("mongoose");

/**
 * Persistent brute-force / lockout counters (survives restarts & multi-instance).
 */
const loginAttemptSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Auto-remove stale unlocked records after 24h of inactivity
loginAttemptSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
);

const LoginAttempt = mongoose.model("login_attempts", loginAttemptSchema);

module.exports = LoginAttempt;
