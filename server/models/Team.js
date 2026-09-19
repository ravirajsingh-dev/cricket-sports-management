const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: true,
    },
    logoKey: {
      type: String,
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "team_groups",
      required: true,
      index: true,
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

TeamSchema.index({ group: 1, order: 1, createdAt: -1 });

const Team = mongoose.model("teams", TeamSchema);

module.exports = Team;
