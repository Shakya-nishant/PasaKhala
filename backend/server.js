const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes    = require("./routes/authRoutes");
const classRoutes   = require("./routes/classRoutes");
const memberRoutes  = require("./routes/memberRoutes");
const contactRoutes = require("./routes/contactRoutes");
const noticeRoutes  = require("./routes/noticeRoutes");
const eventRoutes   = require("./routes/eventRoutes");
const aboutRoutes   = require("./routes/aboutRoutes");
const albumRoutes   = require("./routes/albumRoutes");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// ── CORS — support multiple frontend origins (comma-separated) ──
// e.g. FRONTEND_URLS=http://localhost:3000,http://localhost:3001
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Increase body limit for base64 image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ── Routes ──────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/events",  eventRoutes);
app.use("/api/about",   aboutRoutes);
app.use("/api/albums",  albumRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "PasaKhala API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
});
