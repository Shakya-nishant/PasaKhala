const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPublicClasses,
  getPublicClass,
  applyToClass,
  adminGetClasses,
  adminCreateClass,
  adminUpdateClass,
  adminDeleteClass,
  adminGetApplications,
  adminRemoveApplication,
  adminDownloadApplications,
} = require("../controllers/classController");

// ── IMPORTANT: static/admin routes must come before /:id wildcards ──────────

// ── Admin routes (protected) ─────────────────────────────────────────────────
router.get("/admin/all", protect, adminGetClasses);
router.post("/admin/create", protect, adminCreateClass);
router.get("/admin/:id/applications/download", protect, adminDownloadApplications);
router.get("/admin/:id/applications", protect, adminGetApplications);
router.delete("/admin/:id/applications/:appId", protect, adminRemoveApplication);
router.put("/admin/:id", protect, adminUpdateClass);
router.delete("/admin/:id", protect, adminDeleteClass);

// ── Public routes ─────────────────────────────────────────────────────────────
router.get("/", getPublicClasses);
router.post("/:id/apply", applyToClass);
router.get("/:id", getPublicClass);   // keep last — wildcard catches everything

module.exports = router;
