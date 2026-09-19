const RateLimitHit = require("../../models/RateLimitHit");

/**
 * MongoDB-backed store for express-rate-limit (v8 Store interface).
 * Shared across Node processes / containers using the same database.
 */
class MongoRateLimitStore {
  /**
   * @param {string} prefix - Namespace so auth/admin/general counters do not collide
   */
  constructor(prefix = "rl") {
    this.prefix = prefix;
    this.windowMs = 15 * 60 * 1000;
    /** Keys are shared across instances */
    this.localKeys = false;
  }

  init(options) {
    if (options?.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  #fullKey(key) {
    return `${this.prefix}:${key}`;
  }

  async get(key) {
    const doc = await RateLimitHit.findOne({ key: this.#fullKey(key) }).lean();
    if (!doc) return undefined;
    if (doc.resetTime <= new Date()) return undefined;
    return { totalHits: doc.totalHits, resetTime: doc.resetTime };
  }

  async increment(key) {
    const fullKey = this.#fullKey(key);
    const now = new Date();

    const existing = await RateLimitHit.findOne({ key: fullKey });
    if (!existing || existing.resetTime <= now) {
      const resetTime = new Date(now.getTime() + this.windowMs);
      const doc = await RateLimitHit.findOneAndUpdate(
        { key: fullKey },
        { $set: { totalHits: 1, resetTime } },
        { upsert: true, returnDocument: "after" },
      );
      return { totalHits: doc.totalHits, resetTime: doc.resetTime };
    }

    const doc = await RateLimitHit.findOneAndUpdate(
      { key: fullKey, resetTime: { $gt: now } },
      { $inc: { totalHits: 1 } },
      { returnDocument: "after" },
    );

    if (!doc) {
      // Window rolled over between read and write — retry once
      return this.increment(key);
    }

    return { totalHits: doc.totalHits, resetTime: doc.resetTime };
  }

  async decrement(key) {
    const fullKey = this.#fullKey(key);
    const now = new Date();
    await RateLimitHit.findOneAndUpdate(
      { key: fullKey, resetTime: { $gt: now }, totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } },
    );
  }

  async resetKey(key) {
    await RateLimitHit.deleteOne({ key: this.#fullKey(key) });
  }
}

module.exports = { MongoRateLimitStore };
