const express = require("express");
const router = express.Router();
const { adminSignup, adminLogin } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/admin-signup", adminSignup);
router.post("/admin-login", adminLogin);

// Protected — verify token (used by frontend to check if still logged in)
router.get("/verify", protect, (req, res) => {
  res.json({
    valid: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      contact: req.admin.contact,
      role: req.admin.role,
    },
  });
});

module.exports = router;