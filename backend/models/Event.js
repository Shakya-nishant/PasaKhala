const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, "Title is required"],       trim: true },
    description: { type: String, required: [true, "Description is required"] },
    location:    { type: String, required: [true, "Location is required"],    trim: true },
    eventDate:   { type: Date,   required: [true, "Event date is required"]  },
    image:       { type: String, default: "" }, // base64 data URL
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes the document after eventDate passes
eventSchema.index({ eventDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Event", eventSchema);
