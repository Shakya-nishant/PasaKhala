const mongoose = require("mongoose");

// Each contact entry: a type (phone/email/etc), optional tag, and the value
const contactItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["phone", "email", "whatsapp", "facebook", "instagram", "address"],
      required: true,
    },
    tag:   { type: String, default: "" },   // optional label e.g. "Office", "HR"
    value: { type: String, required: true }, // number, link, address text
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Office location stored as a singleton settings doc
const contactSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "contact", unique: true },
    // lat/lng for the map pin
    lat: { type: Number, default: 26.8065 },   // default: Dharan, Nepal
    lng: { type: Number, default: 87.2846 },
    locationLabel: { type: String, default: "Our Office" },
  },
  { timestamps: true }
);

const ContactItem     = mongoose.model("ContactItem",     contactItemSchema);
const ContactSettings = mongoose.model("ContactSettings", contactSettingsSchema);

module.exports = { ContactItem, ContactSettings };
