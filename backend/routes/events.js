const express = require("express");
const router = express.Router();
const db = require("../models/db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure 'uploads' folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "event-" + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// =========================================================
// ✅ 1. SPECIFIC ROUTES FIRST (CRITICAL FOR FIXING 404)
// =========================================================

// GET "MY EVENTS" (Organizer Dashboard)
router.get("/my-events", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM events WHERE organizer_id = ? ORDER BY date DESC", 
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching my events:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ATTENDEES
router.get("/:id/attendees", authenticateToken, async (req, res) => {
  try {
    const [event] = await db.query("SELECT * FROM events WHERE event_id = ?", [req.params.id]);
    if (event.length === 0) return res.status(404).json({ error: "Event not found" });

    const [attendees] = await db.query(
      `SELECT u.name, u.email, b.booking_date, b.status 
       FROM bookings b 
       JOIN users u ON b.user_id = u.user_id 
       WHERE b.event_id = ?`,
      [req.params.id]
    );

    res.json({ event: event[0], attendees: attendees, total_revenue: attendees.length * event[0].price });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE EVENT
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    const { title, description, date, location, price, capacity, mode, meeting_link } = req.body;
    
    let imageUrl = "https://via.placeholder.com/300";
    if (req.file) {
      // ✅ FIX: Use the fixed, public domain from the environment variable (Render URL)
      const backendUrl = process.env.BACKEND_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`;
      imageUrl = `${backendUrl}/uploads/${req.file.filename}`;
    }

    const finalCapacity = capacity || 100;
    const [result] = await db.query(
      `INSERT INTO events (title, description, date, location, price, image_url, mode, meeting_link, capacity, organizer_id, available_seats)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, date, location, price || 0, imageUrl, mode || 'physical', meeting_link, finalCapacity, req.user.user_id, finalCapacity]
    );

    res.status(201).json({ message: "Event created", eventId: result.insertId });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// =========================================================
// ✅ 2. GENERIC ROUTES LAST
// =========================================================

// GET ALL EVENTS (Public)
router.get("/", async (req, res) => {
  try {
    const { location, date } = req.query;
    let query = `
      SELECT e.*, (e.capacity - COUNT(b.booking_id)) AS available_seats
      FROM events e
      LEFT JOIN bookings b ON e.event_id = b.event_id
      WHERE 1=1
    `;
    const params = [];

    if (location && location.trim() !== "") {
      query += " AND e.location LIKE ?";
      params.push(`%${location}%`);
    }
    if (date && date.trim() !== "") {
      query += " AND DATE(e.date) = ?";
      params.push(date);
    }
    
    query += " GROUP BY e.event_id ORDER BY e.date ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET SINGLE EVENT (Must be last because it captures IDs)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM events WHERE event_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Event not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE EVENT
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    let query = "DELETE FROM events WHERE event_id = ? AND organizer_id = ?";
    let params = [req.params.id, req.user.user_id];
    
    if (req.user.role === 'admin') {
      query = "DELETE FROM events WHERE event_id = ?";
      params = [req.params.id];
    }
    await db.query(query, params);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;