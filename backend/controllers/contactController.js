const { ContactItem, ContactSettings } = require("../models/Contact");
const { sseEmit } = require("../routes/sseRoutes");

/* ── helper: get or create settings ── */
const getSettings = async () => {
  let s = await ContactSettings.findOne({ key: "contact" });
  if (!s) s = await ContactSettings.create({ key: "contact" });
  return s;
};

/* ─────────────────────────────────────────────────────────────
   PUBLIC
───────────────────────────────────────────────────────────── */

// GET /api/contact
const getContact = async (req, res) => {
  try {
    const items    = await ContactItem.find().sort({ order: 1, createdAt: 1 });
    const settings = await getSettings();
    res.json({ items, settings });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — contact items
───────────────────────────────────────────────────────────── */

// POST /api/contact
const createContactItem = async (req, res) => {
  const { type, tag, value, order } = req.body;
  if (!type || !value) {
    return res.status(400).json({ message: "Type and value are required." });
  }
  try {
    const item = await ContactItem.create({
      type,
      tag:   tag   || "",
      value: value.trim(),
      order: order || 0,
    });
    sseEmit("contact");
    res.status(201).json({ message: "Contact item created.", item });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/contact/:id
const updateContactItem = async (req, res) => {
  const { type, tag, value, order } = req.body;
  try {
    const item = await ContactItem.findByIdAndUpdate(
      req.params.id,
      { type, tag, value, order },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Contact item not found." });
    sseEmit("contact");
    res.json({ message: "Contact item updated.", item });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/contact/:id
const deleteContactItem = async (req, res) => {
  try {
    const item = await ContactItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Contact item not found." });
    sseEmit("contact");
    res.json({ message: "Contact item deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — location settings
───────────────────────────────────────────────────────────── */

// PUT /api/contact/settings/location
const updateLocation = async (req, res) => {
  const { lat, lng, locationLabel } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: "lat and lng are required." });
  }
  try {
    const settings = await ContactSettings.findOneAndUpdate(
      { key: "contact" },
      { lat: parseFloat(lat), lng: parseFloat(lng), locationLabel: locationLabel || "Our Office" },
      { new: true, upsert: true }
    );
    res.json({ message: "Location updated.", settings });
    sseEmit("contact");
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = {
  getContact,
  createContactItem,
  updateContactItem,
  deleteContactItem,
  updateLocation,
};
