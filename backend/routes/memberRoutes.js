const express = require("express");
const router = express.Router();
const {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getColumnsSettings,
  updateColumnsSettings,
} = require("../controllers/memberController");
const { protect } = require("../middleware/authMiddleware");

// ── IMPORTANT: static routes must come before /:id ──────────────
// If /settings is placed after /:id, Express treats "settings" as an id param

// Public
router.get("/settings", getColumnsSettings);
router.get("/", getMembers);

// Admin-protected
router.post("/", protect, createMember);
router.put("/settings", protect, updateColumnsSettings);
router.put("/:id", protect, updateMember);
router.delete("/:id", protect, deleteMember);

module.exports = router;
