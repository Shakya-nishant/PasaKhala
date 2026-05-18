const mongoose = require("mongoose");

// Singleton settings document — only one document ever exists
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    totalColumns: { type: Number, default: 3, min: 1, max: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
