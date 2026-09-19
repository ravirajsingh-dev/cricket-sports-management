const mongoose = require("mongoose");

const CarouselGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    direction: {
      type: String,
      enum: ["ltr", "rtl"],
      default: "ltr",
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

CarouselGroupSchema.index({ order: 1, createdAt: -1 });
CarouselGroupSchema.index({ name: 1 }, { unique: true });

const CarouselGroup = mongoose.model("carousel_groups", CarouselGroupSchema);

module.exports = CarouselGroup;
