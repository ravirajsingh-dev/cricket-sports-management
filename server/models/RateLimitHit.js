const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Shared rate-limit counters for multi-instance deployments.
 * Documents expire via TTL when resetTime passes.
 */
const RateLimitHitSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalHits: {
      type: Number,
      default: 0,
    },
    resetTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false },
);

// Expire documents as soon as resetTime is in the past
RateLimitHitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.RateLimitHit ||
  mongoose.model("RateLimitHit", RateLimitHitSchema);
