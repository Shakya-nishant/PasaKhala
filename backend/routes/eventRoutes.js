const express = require("express");
const router  = express.Router();
const {
  getEvents,
  adminGetEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");

// Static admin route BEFORE /:id
router.get("/admin/all", protect, adminGetEvents);

// Public
router.get("/", getEvents);

// Admin-protected
router.post("/",      protect, createEvent);
router.put("/:id",    protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

module.exports = router;
