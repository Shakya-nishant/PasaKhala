const express = require("express");
const router  = express.Router();
const { getAbout, createAbout, updateAbout, deleteAbout } = require("../controllers/aboutController");
const { protect } = require("../middleware/authMiddleware");

router.get("/",      getAbout);
router.post("/",     protect, createAbout);
router.put("/:id",   protect, updateAbout);
router.delete("/:id",protect, deleteAbout);

module.exports = router;
