const Notice = require("../models/Notice");

/* ─────────────────────────────────────────────────────────────
   PUBLIC
───────────────────────────────────────────────────────────── */

// GET /api/notices
// Returns only non-expired notices, newest first
const getNotices = async (req, res) => {
  try {
    const now     = new Date();
    const notices = await Notice.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 }); // newest on top
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN
───────────────────────────────────────────────────────────── */

// GET /api/notices/admin/all  — all notices including expired ones
const adminGetNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/notices
const createNotice = async (req, res) => {
  const { notice, postedDate, expiresAt } = req.body;

  if (!notice || !expiresAt) {
    return res.status(400).json({ message: "Notice text and expiry date are required." });
  }

  const expiry = new Date(expiresAt);
  if (isNaN(expiry.getTime())) {
    return res.status(400).json({ message: "Invalid expiry date." });
  }
  if (expiry <= new Date()) {
    return res.status(400).json({ message: "Expiry date must be in the future." });
  }

  try {
    const doc = await Notice.create({
      notice: notice.trim(),
      postedDate: postedDate ? new Date(postedDate) : new Date(),
      expiresAt:  expiry,
    });
    res.status(201).json({ message: "Notice created.", notice: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/notices/:id
const updateNotice = async (req, res) => {
  const { notice, postedDate, expiresAt } = req.body;

  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date." });
    }
  }

  try {
    const update = {};
    if (notice)     update.notice     = notice.trim();
    if (postedDate) update.postedDate = new Date(postedDate);
    if (expiresAt)  update.expiresAt  = new Date(expiresAt);

    const doc = await Notice.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: "Notice not found." });
    res.json({ message: "Notice updated.", notice: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/notices/:id
const deleteNotice = async (req, res) => {
  try {
    const doc = await Notice.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Notice not found." });
    res.json({ message: "Notice deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = { getNotices, adminGetNotices, createNotice, updateNotice, deleteNotice };
