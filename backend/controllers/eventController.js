const Event = require("../models/Event");

/* ─────────────────────────────────────────────────────────────
   PUBLIC — only future/ongoing events, soonest first
───────────────────────────────────────────────────────────── */
const getEvents = async (req, res) => {
  try {
    const now    = new Date();
    const events = await Event.find({ eventDate: { $gt: now } })
      .sort({ eventDate: 1 });   // soonest date on top
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   ADMIN — all events (including past), soonest first
───────────────────────────────────────────────────────────── */
const adminGetEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   CREATE
───────────────────────────────────────────────────────────── */
const createEvent = async (req, res) => {
  const { title, description, location, eventDate, image } = req.body;

  if (!title || !description || !location || !eventDate) {
    return res.status(400).json({ message: "Title, description, location and date are required." });
  }

  const date = new Date(eventDate);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ message: "Invalid event date." });
  }

  try {
    const event = await Event.create({
      title:       title.trim(),
      description: description.trim(),
      location:    location.trim(),
      eventDate:   date,
      image:       image || "",
    });
    res.status(201).json({ message: "Event created.", event });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   UPDATE
───────────────────────────────────────────────────────────── */
const updateEvent = async (req, res) => {
  const { title, description, location, eventDate, image } = req.body;

  const update = {};
  if (title)       update.title       = title.trim();
  if (description) update.description = description.trim();
  if (location)    update.location    = location.trim();
  if (image !== undefined) update.image = image;
  if (eventDate) {
    const date = new Date(eventDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid event date." });
    }
    update.eventDate = date;
  }

  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event updated.", event });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE
───────────────────────────────────────────────────────────── */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

module.exports = { getEvents, adminGetEvents, createEvent, updateEvent, deleteEvent };
