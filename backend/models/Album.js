const mongoose = require("mongoose");

// A single image — can belong to an album or be standalone ("Memories")
const imageSchema = new mongoose.Schema(
  {
    url:     { type: String, required: true },   // base64 data-URL or hosted URL
    caption: { type: String, default: "" },
    order:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// An album is a named collection of images
const albumSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    coverIndex:  { type: Number, default: 0 },   // index of cover image
    images:      [imageSchema],
    order:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Standalone images (no album) — "Memories" section
const memorySchema = new mongoose.Schema(
  {
    url:     { type: String, required: true },
    caption: { type: String, default: "" },
    order:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Album  = mongoose.model("Album",  albumSchema);
const Memory = mongoose.model("Memory", memorySchema);

module.exports = { Album, Memory };
