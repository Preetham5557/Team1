const mysql = require("mysql2");
require("dotenv").config(); // Load .env variables

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, // 👈 CRITICAL: Uses the special Aiven port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // 👈 CRITICAL: Allows connection to Aiven's secure cloud
  }
});

// Convert pool to promise-based (allows using await)
const promisePool = pool.promise();

// Test the connection immediately on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL database");
    connection.release();
  }
});

module.exports = promisePool;