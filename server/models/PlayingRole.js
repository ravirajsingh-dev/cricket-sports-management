const mongoose = require("mongoose");

const PlayingRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

PlayingRoleSchema.index({ isActive: 1, name: 1 });
PlayingRoleSchema.index({ createdAt: -1 });

const PlayingRole = mongoose.model("playing_roles", PlayingRoleSchema);

module.exports = PlayingRole;
