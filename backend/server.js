const path = require("path");
const express = require("express");
const cors = require("cors"); // ✅ Declared ONLY here
const bodyParser = require("body-parser");
require("dotenv").config();
const db = require("./models/db");

const app = express();

// ✅ CORS Configuration (Fixed)
const cors = require("cors"); // Ensure this is imported

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // ✅ Allow Localhost + ANY Vercel App
    if (origin.includes("localhost") || origin.includes(".vercel.app")) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// ✅ SERVE STATIC IMAGES
// This allows the frontend to access images at http://localhost:5001/uploads/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅ Test DB connection (Promise-based)
(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Connected to MySQL database (Promise version)");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🎯 Event Management Backend is running...");
});

// ✅ Health check / DB test route (Promise-based)
app.get("/test-db", async (req, res) => {
  try {
    const [results] = await db.query("SELECT 1 + 1 AS result");
    res.send("✅ DB is working! 1 + 1 = " + results[0].result);
  } catch (err) {
    console.error("❌ DB test query failed:", err.message);
    res.status(500).send("Database test failed: " + err.message);
  }
});

// ✅ API routes
app.use("/api/users", require("./routes/users"));
app.use("/api/events", require("./routes/events"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));