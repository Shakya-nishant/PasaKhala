const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    notice: {
      type: String,
      required: [true, "Notice text is required"],
      trim: true,
    },
    // Date the notice was posted — defaults to now
    postedDate: {
      type: Date,
      default: Date.now,
    },
    // Date + time when the notice auto-expires and gets deleted
    expiresAt: {
      type: Date,
      required: [true, "Expiry date and time is required"],
    },
  },
  { timestamps: true }
);

// MongoDB TTL index — MongoDB will automatically delete the document
// when the current time passes the expiresAt field value.
noticeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notice", noticeSchema);
