const { Album, Memory } = require("../models/Album");

/* ═══════════════════════════════════════════════════════════════
   ALBUMS
═══════════════════════════════════════════════════════════════ */

// GET /api/albums  — public, all albums with images
const getAlbums = async (req, res) => {
  try {
    const albums = await Album.find().sort({ order: 1, createdAt: -1 });
    res.json(albums);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/albums  — admin creates album
const createAlbum = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ message: "Album name is required." });
  try {
    const album = await Album.create({
      name: name.trim(),
      description: (description || "").trim(),
      order: await Album.countDocuments(),
    });
    res.status(201).json({ message: "Album created.", album });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/albums/:id  — admin updates album name/description
const updateAlbum = async (req, res) => {
  const { name, description } = req.body;
  try {
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), description: description?.trim() },
      { new: true, runValidators: true }
    );
    if (!album) return res.status(404).json({ message: "Album not found." });
    res.json({ message: "Album updated.", album });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/albums/:id  — admin deletes album + all its images
const deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });
    res.json({ message: "Album deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const MAX_ALBUM_IMAGES = 10;

// POST /api/albums/:id/images  — admin adds image(s) to album
const addImagesToAlbum = async (req, res) => {
  const { images } = req.body; // [{ url, caption }]
  if (!images || !images.length)
    return res.status(400).json({ message: "At least one image is required." });
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });

    const slots = MAX_ALBUM_IMAGES - album.images.length;
    if (slots <= 0)
      return res.status(400).json({
        message: `Album is full. Maximum ${MAX_ALBUM_IMAGES} images per album.`,
      });

    // Only accept as many images as there are free slots
    const toAdd = images.slice(0, slots);
    toAdd.forEach((img) => {
      album.images.push({ url: img.url, caption: img.caption || "" });
    });
    await album.save();

    const skipped = images.length - toAdd.length;
    res.json({
      message: skipped
        ? `${toAdd.length} image${toAdd.length !== 1 ? "s" : ""} added. ${skipped} skipped — album limit of ${MAX_ALBUM_IMAGES} reached.`
        : "Images added.",
      album,
      skipped,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/albums/:id/images/:imgId  — admin removes image from album
const removeImageFromAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: "Album not found." });

    const idx = album.images.findIndex(
      (img) => img._id.toString() === req.params.imgId
    );
    if (idx === -1) return res.status(404).json({ message: "Image not found." });

    album.images.splice(idx, 1);
    // Reset coverIndex if it's now out of range
    if (album.coverIndex >= album.images.length) album.coverIndex = 0;
    await album.save();
    res.json({ message: "Image removed.", album });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   MEMORIES  (standalone images — no album)
═══════════════════════════════════════════════════════════════ */

// GET /api/albums/memories  — public
const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ order: 1, createdAt: -1 });
    res.json(memories);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/albums/memories  — admin adds memory image(s)
const addMemories = async (req, res) => {
  const { images } = req.body; // [{ url, caption }]
  if (!images || !images.length)
    return res.status(400).json({ message: "At least one image is required." });
  try {
    const count = await Memory.countDocuments();
    const docs = images.map((img, i) => ({
      url: img.url,
      caption: img.caption || "",
      order: count + i,
    }));
    const created = await Memory.insertMany(docs);
    res.status(201).json({ message: "Memories added.", memories: created });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/albums/memories/:id  — admin removes a memory image
const deleteMemory = async (req, res) => {
  try {
    const mem = await Memory.findByIdAndDelete(req.params.id);
    if (!mem) return res.status(404).json({ message: "Memory not found." });
    res.json({ message: "Memory deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addImagesToAlbum,
  removeImageFromAlbum,
  getMemories,
  addMemories,
  deleteMemory,
};
