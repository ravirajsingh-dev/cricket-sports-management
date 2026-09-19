const mongoose = require("mongoose");

const { parseTokenExpiryTime } = require("../shared/utils/helper");
const { JWT_REFRESH_EXPIRATION } = require("../config/config");

const sessionSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    sessionID: {
      type: String,
      required: true,
    },
    // SHA-256 of the current refresh JWT (never store raw tokens)
    refreshTokenHash: {
      type: String,
      required: true,
    },
    // Previous refresh hash kept briefly for concurrent-request grace
    previousRefreshTokenHash: {
      type: String,
      required: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: () =>
        Date.now() + parseTokenExpiryTime(JWT_REFRESH_EXPIRATION || "1d"),
    },
    role: {
      type: Number, // 1 = User, 2 = Admin
      required: true,
      default: 1,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({ userID: 1, sessionID: 1, isActive: 1 });
sessionSchema.index({ userID: 1, isActive: 1, createdAt: 1 });
sessionSchema.index({ refreshTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.pre("save", async function () {
  if (
    this.isModified("refreshTokenHash") ||
    this.isModified("previousRefreshTokenHash")
  ) {
    this.refreshTokenExpiresAt = new Date(
      Date.now() + parseTokenExpiryTime(JWT_REFRESH_EXPIRATION || "1d"),
    );
  }
});

const Session = mongoose.model("sessions", sessionSchema);

module.exports = Session;
