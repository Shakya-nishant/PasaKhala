const express = require("express");
const router  = express.Router();
const {
  getNotices,
  adminGetNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require("../controllers/noticeController");
const { protect } = require("../middleware/authMiddleware");

// ── Static admin routes BEFORE /:id ──────────────────────────
router.get("/admin/all", protect, adminGetNotices);

// ── Public ───────────────────────────────────────────────────
router.get("/", getNotices);

// ── Admin-protected ───────────────────────────────────────────
router.post("/",      protect, createNotice);
router.put("/:id",    protect, updateNotice);
router.delete("/:id", protect, deleteNotice);

module.exports = router;
