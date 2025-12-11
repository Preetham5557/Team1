import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// ✅ IMPORT YOUR API TOOL (Adjust path if needed, e.g. '../api/axios')
import api from "../api/axiosConfig"; 

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "attendee" // Default role
  });
  
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(""); // Clear previous errors

    try {
      // ✅ USE API: No hardcoded "http://localhost:5001" needed!
      await api.post("/users/register", formData);
      
      alert("🎉 Registration Successful! Please Login.");
      navigate("/login");
      
    } catch (err) {
      // Handle error gracefully
      const errorMsg = err.response?.data?.error || "Registration failed";
      setMsg(errorMsg);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <div className="card p-4 shadow-sm border-0">
        <h2 className="text-center text-primary fw-bold mb-4">🚀 Join Eventuraa</h2>
        
        {/* Error Message Alert */}
        {msg && <div className="alert alert-danger text-center">{msg}</div>}

        <form onSubmit={handleRegister}>
          {/* Name Input */}
          <div className="mb-3">
            <label className="form-label fw-bold">Full Name</label>
            <input 
              className="form-control" 
              type="text" 
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>
          
          {/* Email Input */}
          <div className="mb-3">
            <label className="form-label fw-bold">Email Address</label>
            <input 
              className="form-control" 
              type="email" 
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          {/* Password Input */}
          <div className="mb-3">
            <label className="form-label fw-bold">Password</label>
            <input 
              className="form-control" 
              type="password" 
              placeholder="******"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="form-label fw-bold">I want to...</label>
            <select 
              className="form-select" 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="attendee">🎫 Book Tickets (Attendee)</option>
              <option value="organizer">🎤 Host Events (Organizer)</option>
            </select>
          </div>

          <button className="btn btn-primary w-100 fw-bold shadow-sm py-2" type="submit">
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-decoration-none fw-bold">Login here</Link>
        </p>
      </div>
    </div>
  );
}