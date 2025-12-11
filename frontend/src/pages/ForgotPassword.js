import React, { useState } from "react";
// ✅ IMPORT API UTILITY
import api from "../api/axiosConfig";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Sending email...");
    try {
      // ✅ USE API: Removed "http://localhost:5001" and "axios"
      await api.post("/users/forgot-password", { email });
      setMsg("✅ Check your inbox! A reset link has been sent.");
    } catch (err) {
      setMsg("❌ Error: " + (err.response?.data?.error || "Failed to send"));
    }
  };

  return (
    <div className="container mt-5 text-center" style={{ maxWidth: "400px" }}>
      <h2 className="fw-bold mb-3">🔑 Forgot Password?</h2>
      <p className="text-muted mb-4">Enter your email to receive a reset link.</p>
      
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0">
        <div className="mb-3 text-start">
          <label className="form-label fw-bold">Email Address</label>
          <input 
            type="email" 
            className="form-control" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <button type="submit" className="btn btn-primary w-100 fw-bold">Send Reset Link</button>
      </form>
      
      {msg && (
        <div className={`alert mt-3 ${msg.includes("Error") ? "alert-danger" : "alert-success"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}