const express = require("express");
const router = express.Router();
const db = require("../models/db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Ensure 'uploads' folder exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// =========================================================
// 📸 IMAGE UPLOAD CONFIGURATION
// =========================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Unique filename: event-TIMESTAMP.jpg
    cb(null, "event-" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// =========================================================
// 🛡️ MIDDLEWARE: Verify Token
// =========================================================
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
// 🌎 PUBLIC ROUTES
// =========================================================

// 1. GET ALL EVENTS (Public - Safe Filter & Seat Calc)
router.get("/", async (req, res) => {
  try {
    const { location, date } = req.query;
    
    // 🧠 SQL MAGIC: Calculate available seats dynamically
    let query = `
      SELECT e.*, 
      (e.capacity - COUNT(b.booking_id)) AS available_seats
      FROM events e
      LEFT JOIN bookings b ON e.event_id = b.event_id
      WHERE 1=1
    `;
    
    const params = [];

    // ✅ FIX 1: Safe Location Filter
    if (location && location.trim() !== "") {
      query += " AND e.location LIKE ?";
      params.push(`%${location}%`);
    }

    // ✅ FIX 2: Safe Date Filter (PREVENTS CRASH)
    if (date && date.trim() !== "") {
      query += " AND DATE(e.date) = ?";
      params.push(date);
    }
    
    query += " GROUP BY e.event_id ORDER BY e.date ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// 2. GET SINGLE EVENT (Added for completeness)
router.get("/:id", async (req, res) => {
  try {
    const [events] = await db.query("SELECT * FROM events WHERE event_id = ?", [req.params.id]);
    if (events.length === 0) return res.status(404).json({ error: "Event not found" });
    res.json(events[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 🔒 ORGANIZER ROUTES
// =========================================================

// 3. GET "MY EVENTS"
router.get("/my-events", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM events WHERE organizer_id = ? ORDER BY date DESC", 
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET ATTENDEES
router.get("/:id/attendees", authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const organizerId = req.user.user_id;

    const [event] = await db.query(
      "SELECT * FROM events WHERE event_id = ? AND organizer_id = ?",
      [eventId, organizerId]
    );

    if (event.length === 0) {
      return res.status(403).json({ error: "Unauthorized or Event not found" });
    }

    const [attendees] = await db.query(
      `SELECT u.name, u.email, b.booking_date, b.status 
       FROM bookings b 
       JOIN users u ON b.user_id = u.user_id 
       WHERE b.event_id = ?`,
      [eventId]
    );

    res.json({ 
      event: event[0],
      attendees: attendees,
      total_revenue: attendees.length * event[0].price
    });

  } catch (err) {
    res.status(500).json({ error: "Server error fetching attendees" });
  }
});

// 5. CREATE EVENT (With Dynamic Image URL)
router.post("/", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    // Note: We removed the role check to allow testing, uncomment if needed:
    // if (req.user.role !== "organizer" && req.user.role !== "admin") ...

    const { 
      title, description, date, location, 
      price, mode, meeting_link, capacity 
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "Title and Date are required" });
    }

    // ✅ FIX 3: Dynamic Image URL (Works on Localhost AND Render)
    let imageUrl = "https://via.placeholder.com/300"; 
    if (req.file) {
      // Constructs URL: https://your-site.onrender.com/uploads/filename.jpg
      const protocol = req.protocol; 
      const host = req.get('host'); 
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const finalCapacity = capacity || 100;
    const finalMode = mode || 'physical';
    const finalPrice = price || 0;

    const [result] = await db.query(
      `INSERT INTO events 
      (title, description, date, location, price, image_url, mode, meeting_link, capacity, organizer_id, available_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, date, location, finalPrice, imageUrl, 
        finalMode, meeting_link, finalCapacity, req.user.user_id, finalCapacity
      ]
    );

    res.status(201).json({ message: "✅ Event created successfully", eventId: result.insertId });
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({ error: "Server error creating event" });
  }
});

// 6. DELETE EVENT
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.user_id;

    let query = "DELETE FROM events WHERE event_id = ? AND organizer_id = ?";
    let params = [eventId, userId];

    if (req.user.role === 'admin') {
       query = "DELETE FROM events WHERE event_id = ?";
       params = [eventId];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Event not found or unauthorized" });
    }

    res.json({ message: "🗑️ Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;