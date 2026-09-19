const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserDetailsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    height: {
      type: Number,
      required: false,
      min: 0,
      max: 300,
    },
    weight: {
      type: Number,
      required: false,
      min: 0,
      max: 500,
    },
  },
  {
    timestamps: true,
  },
);

const UserDetails = mongoose.model("user_details", UserDetailsSchema);
module.exports = UserDetails;
