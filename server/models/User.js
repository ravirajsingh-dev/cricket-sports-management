const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    memberId: {
      type: String,
      unique: true,
      required: true,
      immutable: true,
      index: true,
      // Abbreviation (1–20 letters) + 10-digit phone
      minlength: 11,
      maxlength: 30,
    },
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      minlength: 10,
      maxlength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
    },
    status: {
      type: Number,
      default: 4, // 1 = Active, 2 = Inactive, 3 = Blocked, 4 = New
      enum: [1, 2, 3, 4],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    playingRole: {
      type: Schema.Types.ObjectId,
      ref: "playing_roles",
      default: null,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
      maxlength: 100,
    },
    countryId: {
      type: Number,
      default: 101,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    stateId: {
      type: Number,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    cityId: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    uuid: {
      type: String,
      maxlength: 64,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("users", UserSchema);
module.exports = User;
