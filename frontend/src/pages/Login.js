import React, { useState } from "react";
import api from "../api/axiosConfig";
import { Link } from "react-router-dom"; // 👈 Import Link for the Forgot Password button

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Make sure this URL matches your backend port (5000 or 5001)
      const res = await api.post("/users/login", { email, password });

      // 1. Save Auth Details
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role); 
      localStorage.setItem("name", res.data.name);

      alert("✅ Login successful!");
      
      // --- SMART REDIRECT STARTS HERE ---
      if (res.data.role === 'admin') {
        window.location.href = "/admin";
      } else if (res.data.role === 'organizer') {
        // ✅ Send Organizers straight to their dashboard
        window.location.href = "/organizer-dashboard";
      } else {
        // Attendees go to Home
        window.location.href = "/home";
      }
      // --- SMART REDIRECT ENDS HERE ---
      
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "❌ Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* 🔑 FORGOT PASSWORD LINK */}
            <div className="text-end mt-1">
              <Link to="/forgot-password" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-2"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-3">
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;