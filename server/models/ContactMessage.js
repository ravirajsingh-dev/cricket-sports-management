const mongoose = require("mongoose");

const ContactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ isRead: 1, createdAt: -1 });

const ContactMessage = mongoose.model("contact_messages", ContactMessageSchema);

module.exports = ContactMessage;
