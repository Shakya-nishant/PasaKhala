const express = require("express");
const router  = express.Router();
const {
  getContact,
  createContactItem,
  updateContactItem,
  deleteContactItem,
  updateLocation,
} = require("../controllers/contactController");
const { protect } = require("../middleware/authMiddleware");

// Public
router.get("/", getContact);

// Admin-protected — location must come before /:id
router.put("/settings/location", protect, updateLocation);

// Admin-protected — items
router.post("/",      protect, createContactItem);
router.put("/:id",    protect, updateContactItem);
router.delete("/:id", protect, deleteContactItem);

module.exports = router;
