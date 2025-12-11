const express = require("express");
const router = express.Router();
const pool = require("../models/db");
// Note: Assumes you have the correct import for auth
const { verifyToken } = require("../controllers/middleware/auth"); 
require("dotenv").config(); 

// ✅ Initialize Stripe once using secret key from .env
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ------------------- ROUTES -------------------

// ✅ Create Stripe Payment Intent
router.post("/create-intent", verifyToken, async (req, res) => {
  try {
    const { amount, currency = "usd", booking_id } = req.body;
    const user_id = req.user?.user_id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount (in cents) required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(amount), 
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { user_id, booking_id },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("❌ Stripe create-intent error:", err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// ✅ Confirm payment and record it in database (CLEANED)
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    let { booking_id, amount, payment_method = "stripe" } = req.body;
    const user_id = req.user?.user_id;

    // 1. HARDENED VALIDATION (Prevents 400 Bad Request)
    if (!user_id) {
      return res.status(400).json({ message: "User ID missing from token." });
    }
    // Check if booking_id is provided AND not an empty string
    if (!booking_id || String(booking_id).trim().length === 0) {
      return res.status(400).json({ message: "Booking ID is required." });
    }
    // Check if amount is positive
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid positive amount required." });
    }

    // 2. Normalize payment_method
    const validMethods = ["credit_card", "debit_card", "upi", "cash", "stripe"];
    if (!validMethods.includes(payment_method)) {
      payment_method = "stripe";
    }

    // 3. Database Insertion (Record the transaction)
    const [result] = await pool.query(
      `INSERT INTO payments (booking_id, user_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'completed')`, // Status is completed here
      [booking_id, user_id, amount, payment_method]
    );

    // 4. Update the Booking Status from 'pending' to 'confirmed'
    await pool.query(
        "UPDATE bookings SET status = 'confirmed' WHERE booking_id = ?", 
        [booking_id]
    );


    res.json({
      message: "✅ Payment recorded successfully and booking confirmed",
      payment: {
        payment_id: result.insertId,
        booking_id,
        user_id,
        amount,
        payment_method,
        status: "completed",
      },
    });
  } catch (err) {
    console.error("❌ Error confirming payment:", err);
    res.status(500).json({ message: "Server error while recording payment" });
  }
});

// ✅ Get all payments (Admin only)
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    
    const [rows] = await pool.query(`
      SELECT 
        p.payment_id, p.booking_id, p.user_id, u.name AS user_name,
        p.amount, p.payment_method, p.status, p.created_at
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);
    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching payments" });
  }
});

// ✅ Get logged-in user's payments
router.get("/my", verifyToken, async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(400).json({ message: "User ID required" });

    const [rows] = await pool.query(
      `SELECT 
        p.payment_id, p.booking_id, p.amount, p.payment_method, 
        p.status, p.created_at
       FROM payments p
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    res.json({ payments: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching payments" });
  }
});

module.exports = router;