const mongoose = require("mongoose");

const TeamGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

TeamGroupSchema.index({ order: 1, createdAt: -1 });
TeamGroupSchema.index({ name: 1 }, { unique: true });

const TeamGroup = mongoose.model("team_groups", TeamGroupSchema);

module.exports = TeamGroup;
