const mongoose = require("mongoose");
const { Schema } = mongoose;

const NAME_MAX_LENGTH = 50;
const SHORT_DESC_MAX_LENGTH = 80;

const CarouselItemSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: NAME_MAX_LENGTH,
    },
    shortDesc: {
      type: String,
      trim: true,
      default: "",
      maxlength: SHORT_DESC_MAX_LENGTH,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imageKey: {
      type: String,
      default: "",
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "carousel_groups",
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

CarouselItemSchema.index({ group: 1, order: 1, createdAt: -1 });

const CarouselItem = mongoose.model("carousel_items", CarouselItemSchema);

CarouselItem.NAME_MAX_LENGTH = NAME_MAX_LENGTH;
CarouselItem.SHORT_DESC_MAX_LENGTH = SHORT_DESC_MAX_LENGTH;

module.exports = CarouselItem;
