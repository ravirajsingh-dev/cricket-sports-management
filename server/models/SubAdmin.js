const mongoose = require("mongoose");

const SubAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 50,
      required: false,
      index: true,
    },

    admin_id: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 15,
      minlength: 8,
      required: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    txn_password: {
      type: String,
      minlength: 8,
    },

    status: {
      type: Number,
      default: 1, // 1 = Active, 2 = Inactive
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      enum: ["admin", "sub_admin", "staff", "manager"],
      default: "sub_admin",
      required: true,
    },

    last_login: {
      type: Date,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    uuid: {
      type: String,
      unique: true,
      maxlength: 64,
    },

    // Dynamic permissions object - no fixed schema
    // Supports: { "module": true/false } or { "module": { "action": true/false } }
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
SubAdminSchema.index({ admin_id: 1, status: 1 });
SubAdminSchema.index({ email: 1, status: 1 });

const SubAdmin = mongoose.model("sub_admins", SubAdminSchema);

module.exports = SubAdmin;
