const Member = require("../models/Member");
const Settings = require("../models/Settings");

// ── Helper: get or create settings ────────────────────────────
const getSettings = async () => {
  let settings = await Settings.findOne({ key: "global" });
  if (!settings) {
    settings = await Settings.create({ key: "global", totalColumns: 3 });
  }
  return settings;
};

// ── GET all members + settings ─────────────────────────────────
// GET /api/members
const getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ column: 1, order: 1 });
    const settings = await getSettings();
    res.json({ members, totalColumns: settings.totalColumns });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const MAX_PER_ROW = 4; // maximum members allowed in a single row

// ── CREATE member ──────────────────────────────────────────────
// POST /api/members
const createMember = async (req, res) => {
  const { name, title, image, column, order } = req.body;
  if (!name || !title || !column) {
    return res.status(400).json({ message: "Name, title, and column are required." });
  }
  try {
    const settings = await getSettings();
    if (column < 1 || column > settings.totalColumns) {
      return res.status(400).json({
        message: `Row must be between 1 and ${settings.totalColumns}.`,
      });
    }

    // Enforce max 4 members per row
    const countInRow = await Member.countDocuments({ column });
    if (countInRow >= MAX_PER_ROW) {
      return res.status(400).json({
        message: `Row ${column} is full. A row can have at most ${MAX_PER_ROW} members.`,
      });
    }

    const member = await Member.create({ name, title, image: image || "", column, order: order || 0 });
    res.status(201).json({ message: "Member created.", member });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// ── UPDATE member ──────────────────────────────────────────────
// PUT /api/members/:id
const updateMember = async (req, res) => {
  const { name, title, image, column, order } = req.body;
  try {
    const settings = await getSettings();
    if (column && (column < 1 || column > settings.totalColumns)) {
      return res.status(400).json({
        message: `Row must be between 1 and ${settings.totalColumns}.`,
      });
    }

    // If moving to a different row, check the target row isn't full
    if (column) {
      const existing = await Member.findById(req.params.id);
      if (existing && existing.column !== column) {
        const countInRow = await Member.countDocuments({ column });
        if (countInRow >= MAX_PER_ROW) {
          return res.status(400).json({
            message: `Row ${column} is full. A row can have at most ${MAX_PER_ROW} members.`,
          });
        }
      }
    }

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      { name, title, image, column, order },
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found." });
    res.json({ message: "Member updated.", member });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// ── DELETE member ──────────────────────────────────────────────
// DELETE /api/members/:id
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found." });
    res.json({ message: "Member deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// ── GET / UPDATE settings (totalColumns) ──────────────────────
// GET /api/members/settings
const getColumnsSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ totalColumns: settings.totalColumns });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/members/settings
const updateColumnsSettings = async (req, res) => {
  const { totalColumns } = req.body;
  if (!totalColumns || totalColumns < 1 || totalColumns > 10) {
    return res.status(400).json({ message: "totalColumns must be between 1 and 10." });
  }
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: "global" },
      { totalColumns },
      { new: true, upsert: true }
    );
    res.json({ message: "Settings updated.", totalColumns: settings.totalColumns });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getColumnsSettings,
  updateColumnsSettings,
};
