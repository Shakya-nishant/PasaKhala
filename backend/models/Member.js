const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Member title is required"],
      trim: true,
    },
    image: {
      type: String, // base64 data URL or file path
      default: "",
    },
    column: {
      type: Number,
      required: [true, "Column number is required"],
      min: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
