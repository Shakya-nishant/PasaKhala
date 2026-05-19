const AboutUs = require("../models/AboutUs");
const { sseEmit } = require("../routes/sseRoutes");

// GET /api/about  — public, sorted by order then createdAt
const getAbout = async (req, res) => {
  try {
    const sections = await AboutUs.find().sort({ order: 1, createdAt: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/about  — admin creates a section
const createAbout = async (req, res) => {
  const { title, content, order } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Content is required." });
  }
  try {
    const section = await AboutUs.create({
      title:   (title || "").trim(),
      content: content.trim(),
      order:   order ?? 0,
    });
    sseEmit("about");
    res.status(201).json({ message: "Section created.", section });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/about/:id
const updateAbout = async (req, res) => {
  const { title, content, order } = req.body;
  const update = {};
  if (title   !== undefined) update.title   = title.trim();
  if (content !== undefined) update.content = content.trim();
  if (order   !== undefined) update.order   = order;

  try {
    const section = await AboutUs.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ message: "Section not found." });
    sseEmit("about");
    res.json({ message: "Section updated.", section });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/about/:id
const deleteAbout = async (req, res) => {
  try {
    const section = await AboutUs.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: "Section not found." });
    sseEmit("about");
    res.json({ message: "Section deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = { getAbout, createAbout, updateAbout, deleteAbout };
