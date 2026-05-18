const mongoose = require("mongoose");

// Each "About Us" block is a separate document so admin can
// add multiple sections, reorder, edit, or delete individually.
const aboutSchema = new mongoose.Schema(
  {
    title:   { type: String, default: "" },          // optional section heading
    content: { type: String, required: true },        // HTML from Quill editor
    order:   { type: Number, default: 0 },            // display order
  },
  { timestamps: true }
);

module.exports = mongoose.model("AboutUs", aboutSchema);
