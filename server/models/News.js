const mongoose = require("mongoose");
const { Schema } = mongoose;

const NewsImageSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    imageKey: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const NewsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [NewsImageSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 1,
      min: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "admins",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

NewsSchema.index({ displayOrder: 1, createdAt: -1 });

module.exports = mongoose.model("news", NewsSchema);
