const Class = require("../models/Class");

// ── PUBLIC ─────────────────────────────────────────────────────────────────

// GET /api/classes  — only classes whose startDate hasn't passed
const getPublicClasses = async (req, res) => {
  try {
    const now = new Date();
    const classes = await Class.find({ startDate: { $gt: now } }).lean({ virtuals: true });
    // Strip application details but expose count and seatsAvailable
    const result = classes.map(({ applications, ...cls }) => ({
      ...cls,
      applicationsCount: applications ? applications.length : 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// GET /api/classes/:id  — single class (no applications)
const getPublicClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .select("-applications")
      .lean({ virtuals: true });
    if (!cls) return res.status(404).json({ message: "Class not found." });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/classes/:id/apply
const applyToClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found." });

    const now = new Date();

    if (now > new Date(cls.formDeadline))
      return res.status(400).json({ message: "Application deadline has passed." });

    if (cls.applications.length >= cls.totalSeats)
      return res.status(400).json({ message: "No seats available." });

    const { name, address, contact, email, age, parentPermission } = req.body;
    if (!name || !address || !contact || !email || !age)
      return res.status(400).json({ message: "All fields are required." });

    if (age < 18 && !parentPermission)
      return res
        .status(400)
        .json({ message: "Parent permission required for applicants under 18." });

    // Prevent duplicate email per class
    const duplicate = cls.applications.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );
    if (duplicate)
      return res
        .status(409)
        .json({ message: "You have already applied for this class." });

    cls.applications.push({ name, address, contact, email, age, parentPermission });
    await cls.save();

    res.status(201).json({ message: "Application submitted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// ── ADMIN ──────────────────────────────────────────────────────────────────

// GET /api/admin/classes
const adminGetClasses = async (req, res) => {
  try {
    const classes = await Class.find().lean({ virtuals: true });
    // Add applicationsCount and strip full application data for the list view
    const result = classes.map(({ applications, ...cls }) => ({
      ...cls,
      applicationsCount: applications ? applications.length : 0,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// POST /api/admin/classes
const adminCreateClass = async (req, res) => {
  try {
    const { title, description, startDate, formDeadline, totalSeats } = req.body;
    if (!title || !description || !startDate || !formDeadline || !totalSeats)
      return res.status(400).json({ message: "All fields are required." });

    const cls = await Class.create({
      title,
      description,
      startDate,
      formDeadline,
      totalSeats,
      createdBy: req.admin._id,
    });

    res.status(201).json({ message: "Class created successfully.", class: cls });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// PUT /api/admin/classes/:id
const adminUpdateClass = async (req, res) => {
  try {
    const { title, description, startDate, formDeadline, totalSeats } = req.body;
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { title, description, startDate, formDeadline, totalSeats },
      { new: true, runValidators: true }
    );
    if (!cls) return res.status(404).json({ message: "Class not found." });
    res.json({ message: "Class updated.", class: cls });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/admin/classes/:id
const adminDeleteClass = async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found." });
    res.json({ message: "Class deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// GET /api/admin/classes/:id/applications
const adminGetApplications = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found." });
    res.json({ title: cls.title, applications: cls.applications });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// DELETE /api/admin/classes/:classId/applications/:appId
const adminRemoveApplication = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found." });

    const appIndex = cls.applications.findIndex(
      (a) => a._id.toString() === req.params.appId
    );
    if (appIndex === -1)
      return res.status(404).json({ message: "Application not found." });

    cls.applications.splice(appIndex, 1);
    await cls.save();

    res.json({ message: "Application removed." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// GET /api/admin/classes/:id/applications/download  — ODF (CSV-like plain text)
// We generate a proper ODT (Open Document Text) XML format
const adminDownloadApplications = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Class not found." });

    // Generate CSV content (universally openable in LibreOffice/Excel)
    const rows = [
      ["#", "Name", "Email", "Contact", "Address", "Age", "Parent Permission", "Applied At"],
      ...cls.applications.map((a, i) => [
        i + 1,
        a.name,
        a.email,
        a.contact,
        a.address,
        a.age,
        a.age < 18 ? (a.parentPermission ? "Yes" : "No") : "N/A",
        new Date(a.createdAt).toLocaleString(),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const filename = `${cls.title.replace(/[^a-z0-9]/gi, "_")}_applications.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = {
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
};
