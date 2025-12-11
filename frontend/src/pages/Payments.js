/// /src/pages/Payments.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
// Assuming this is axiosConfig.js or similar
import axios from "../api/axiosConfig"; 
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ✅ Load publishable key from .env (Use a dummy key if the real one isn't loading)
// This must be checked against Vercel Environment Variables
const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;


function CheckoutForm({ selectedBookingId, amountInput, onResult }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const amountCents = useMemo(() => {
    const n = Number(amountInput);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
  }, [amountInput]);

  // 💳 Handle Stripe payment flow
  const handlePay = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!stripe || !elements) {
      setMsg("Stripe is not ready yet.");
      return;
    }
    
    // ⚠️ CRITICAL VALIDATION
    if (!selectedBookingId) {
      setMsg("Error: Missing Booking ID. Please go back to Events.");
      return;
    }
    if (!amountCents) {
      setMsg("Error: Amount is zero or invalid.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      // 1️⃣ Create PaymentIntent (amount is in cents)
      const { data } = await axios.post(
        "/payments/create-intent",
        { amount: amountCents, currency: "usd", booking_id: selectedBookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clientSecret = data?.clientSecret;
      if (!clientSecret) throw new Error("No client secret returned from server.");

      // 2️⃣ Confirm payment on client
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // 3️⃣ If payment succeeded, confirm in Database
      if (result.paymentIntent?.status === "succeeded") {
        await axios.post(
          "/payments/confirm",
          {
            booking_id: selectedBookingId,
            amount: (amountCents / 100).toFixed(2), // Send fixed amount to DB
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMsg("✅ Payment succeeded!");
        onResult?.({ ok: true });
        card?.clear();
      }
    } catch (err) {
      console.error("Payment error:", err);
      const apiMsg = err?.response?.data?.message || err?.message || "Unexpected error while paying";
      setMsg(`Payment failed: ${apiMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} style={{ maxWidth: 420, marginTop: 16 }}>
      <div style={{border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12, background: "#fff",}}>
        <CardElement options={{ hidePostalCode: false }} />
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting || !selectedBookingId}
        className="btn btn-primary w-100 fw-bold"
        style={{padding: "10px 16px", background: "#635bff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",}}
      >
        {submitting ? "Processing..." : `Pay $${Number(amountInput || 0).toFixed(2)}`}
      </button>

      {msg && <p style={{ marginTop: 10, color: msg.startsWith("✅") ? "green" : "crimson" }}>{msg}</p>}
    </form>
  );
}

export default function Payments() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  // 1. Try to get data from navigation state
  const incomingBookingId = location.state?.bookingId;
  const incomingPrice = location.state?.price;

  // 2. Set state based on incoming data
  const [selectedBookingId, setSelectedBookingId] = useState(incomingBookingId || "");
  const [amount, setAmount] = useState(incomingPrice || "19.99");
  const [statusMsg, setStatusMsg] = useState("");

  // 3. CRITICAL KEY CHECK
  if (!stripePromise) {
    return (
      <div className="container mt-5" style={{ maxWidth: "500px" }}>
        <div className="alert alert-danger text-center">
          <h4>❌ Stripe Key Error</h4>
          <p>The **Stripe Publishable Key** is missing from Vercel's environment variables. Contact the admin.</p>
        </div>
      </div>
    );
  }

  // NOTE: If you wanted to load pending bookings here, you would need to adjust the logic.
  // Currently, we rely purely on the incoming navigation state.

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="mb-4 fw-bold text-center">💳 Secure Checkout</h2>

      {/* ✅ DISPLAY THE AUTO-SELECTED BOOKING */}
      {selectedBookingId ? (
         <div className="alert alert-info text-center">
            <h5>Booking ID: #{selectedBookingId}</h5>
            <p className="mb-0">Amount Due: <strong>${Number(amount).toFixed(2)}</strong></p>
            <p className="small text-muted mb-0">Confirm payment below.</p>
         </div>
      ) : (
         <div className="alert alert-warning">
            ⚠️ No booking selected. Please book an event first.
         </div>
      )}

      {/* STRIPE FORM */}
      <div className="mt-4">
        <Elements stripe={stripePromise}>
          <CheckoutForm
            selectedBookingId={selectedBookingId}
            amountInput={amount}
            onResult={(r) => {
              if (r?.ok) {
                setStatusMsg("✅ Payment successful! Redirecting to tickets...");
                setTimeout(() => navigate("/bookings"), 2000);
              }
            }}
          />
        </Elements>
      </div>

      {statusMsg && <div className={`alert mt-3 ${statusMsg.includes("success") ? "alert-success" : "alert-danger"}`}>{statusMsg}</div>}
    </div>
  );
}