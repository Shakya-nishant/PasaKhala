const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ─── ADMIN SIGNUP ─────────────────────────────────────────────
// POST /api/auth/admin-signup

const adminSignup = async (req, res) => {
  const { name, email, contact, password, secretKey } = req.body;

  console.log("🔍 Signup Request Body:", { name, email, contact, secretKey: "****" });

  if (!name || !email || !contact || !password || !secretKey) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ message: "Invalid secret key." });
  }

  try {
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin with this email already exists." });
    }

    // Create admin
    const admin = await Admin.create({ name, email, contact, password });
    console.log("✅ Admin created successfully:", admin._id);

    const token = generateToken(admin._id, admin.role);

    res.status(201).json({
      message: "Admin account created successfully.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("❌ SIGNUP ERROR:", error.name, error.message);
    if (error.name === "ValidationError") {
      console.error("Validation Errors:", error.errors);
    }
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

// ─── ADMIN LOGIN ──────────────────────────────────────────────
// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  const { email, password, secretKey } = req.body;

  if (!email || !password || !secretKey) {
    return res.status(400).json({ message: "Email, password, and secret key are required." });
  }

  // Check secret key first
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ message: "Invalid secret key. Access denied." });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(admin._id, admin.role);

    res.json({
      message: "Login successful.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

module.exports = { adminSignup, adminLogin };