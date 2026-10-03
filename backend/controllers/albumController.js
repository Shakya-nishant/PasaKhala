const { Album, Memory } = require("../models/Album");
const { sseEmit } = require("../routes/sseRoutes");

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
    sseEmit("albums");
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
    sseEmit("albums");
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
    sseEmit("albums");
    res.json({ message: "Album deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const MAX_ALBUM_IMAGES = 59;

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

    // De-duplicate: skip any image whose URL already exists in this album
    const existingUrls = new Set(album.images.map((img) => img.url));
    const unique = images.filter((img) => !existingUrls.has(img.url));
    const duplicates = images.length - unique.length;

    // Only accept as many images as there are free slots
    const toAdd = unique.slice(0, slots);
    toAdd.forEach((img) => {
      album.images.push({ url: img.url, caption: img.caption || "" });
    });
    await album.save();

    const skipped = unique.length - toAdd.length; // skipped due to slot limit
    sseEmit("albums");

    let message = "Images added.";
    if (duplicates && skipped)
      message = `${toAdd.length} image${toAdd.length !== 1 ? "s" : ""} added. ${duplicates} duplicate${duplicates !== 1 ? "s" : ""} skipped. ${skipped} skipped — album limit of ${MAX_ALBUM_IMAGES} reached.`;
    else if (duplicates)
      message = `${toAdd.length} image${toAdd.length !== 1 ? "s" : ""} added. ${duplicates} duplicate${duplicates !== 1 ? "s" : ""} skipped.`;
    else if (skipped)
      message = `${toAdd.length} image${toAdd.length !== 1 ? "s" : ""} added. ${skipped} skipped — album limit of ${MAX_ALBUM_IMAGES} reached.`;

    res.json({ message, album, skipped, duplicates });
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
    sseEmit("albums");
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
    // De-duplicate: skip images whose URL already exists in Memories
    const existing = await Memory.find({ url: { $in: images.map((i) => i.url) } }).select("url");
    const existingUrls = new Set(existing.map((m) => m.url));
    const unique = images.filter((img) => !existingUrls.has(img.url));
    const duplicates = images.length - unique.length;

    if (!unique.length)
      return res.status(400).json({ message: "All images already exist in Memories." });

    const count = await Memory.countDocuments();
    const docs = unique.map((img, i) => ({
      url: img.url,
      caption: img.caption || "",
      order: count + i,
    }));
    const created = await Memory.insertMany(docs);
    sseEmit("albums");

    const message = duplicates
      ? `${created.length} memory image${created.length !== 1 ? "s" : ""} added. ${duplicates} duplicate${duplicates !== 1 ? "s" : ""} skipped.`
      : "Memories added.";

    res.status(201).json({ message, memories: created, duplicates });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/albums/memories/:id  — admin removes a memory image
const deleteMemory = async (req, res) => {
  try {
    const mem = await Memory.findByIdAndDelete(req.params.id);
    if (!mem) return res.status(404).json({ message: "Memory not found." });
    sseEmit("albums");
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
