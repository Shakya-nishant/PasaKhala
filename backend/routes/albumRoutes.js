const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addImagesToAlbum,
  removeImageFromAlbum,
  getMemories,
  addMemories,
  deleteMemory,
} = require("../controllers/albumController");

// ── IMPORTANT: static routes before wildcards ──────────────────

// Memories (standalone images)
router.get("/memories",        getMemories);
router.post("/memories",       protect, addMemories);
router.delete("/memories/:id", protect, deleteMemory);

// Albums
router.get("/",                          getAlbums);
router.post("/",                         protect, createAlbum);
router.put("/:id",                       protect, updateAlbum);
router.delete("/:id",                    protect, deleteAlbum);
router.post("/:id/images",               protect, addImagesToAlbum);
router.delete("/:id/images/:imgId",      protect, removeImageFromAlbum);

module.exports = router;
