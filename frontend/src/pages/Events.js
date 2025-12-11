import React, { useEffect, useState } from "react";
// 1. IMPORT YOUR NEW API UTILITY (No more direct axios)
import api from "../api/axios"; 
import { useNavigate } from "react-router-dom";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ location: "", date: "" });
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Fetch Events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // ✅ USE API UTILITY: Auto-detects Local vs Live URL
      const res = await api.get("/events", {
        params: filters 
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Error fetching events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []); 

  const handleBook = async (eventId, price) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please Login first!");
    
    try {
      // ✅ USE API UTILITY: Auto-attaches Token (via interceptor)
      await api.post("/bookings", { event_id: eventId });
      
      if (Number(price) > 0) {
        alert("🎉 Booking Reserved! Redirecting to Payment...");
        navigate("/payments"); 
      } else {
        alert("🎉 Free Event Booked Successfully!");
        navigate("/bookings"); 
      }
    } catch (err) { 
      alert(err.response?.data?.error || "Booking Failed"); 
    }
  };

  return (
    <div className="container mt-4">
      {/* FILTER BAR */}
      <div className="card p-3 mb-4 bg-light shadow-sm border-0">
        <div className="row g-2">
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Search City..." 
              value={filters.location} onChange={(e)=>setFilters({...filters, location: e.target.value})} />
          </div>
          <div className="col-md-4">
            <input type="date" className="form-control" 
              value={filters.date} onChange={(e)=>setFilters({...filters, date: e.target.value})} />
          </div>
          <div className="col-md-4">
            <button className="btn btn-primary w-100 fw-bold" onClick={fetchEvents}>Apply Filters</button>
          </div>
        </div>
      </div>

      <h2 className="mb-4 fw-bold text-primary">🎪 Upcoming Events</h2>
      
      {loading ? <p>Loading...</p> : (
        <div className="row">
          {events.map((ev) => {
            // Logic for Sold Out
            const isSoldOut = ev.available_seats <= 0;
            
            return (
              <div className="col-md-4 mb-4" key={ev.event_id}>
                <div className="card h-100 shadow-sm border-0">
                  
                  {/* Image Badge for Seats */}
                  <div style={{ position: "relative" }}>
                    <img src={ev.image_url || "https://via.placeholder.com/300"} className="card-img-top" 
                        style={{height: "200px", objectFit: "cover"}} alt="Event" />
                    
                    {/* 🎟️ SEAT BADGE */}
                    <span 
                      className={`badge position-absolute top-0 end-0 m-2 ${isSoldOut ? 'bg-danger' : 'bg-info text-dark'}`}
                      style={{ fontSize: "0.9rem" }}
                    >
                      {isSoldOut ? "SOLD OUT" : `${ev.available_seats} Seats Left`}
                    </span>
                  </div>

                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="card-title fw-bold mb-0">{ev.title}</h5>
                      <span className={`badge ${Number(ev.price) > 0 ? "bg-success" : "bg-warning text-dark"}`}>
                        {Number(ev.price) > 0 ? `₹${ev.price}` : "Free"}
                      </span>
                    </div>

                    <p className="small text-muted mb-2">
                      📍 {ev.location} <br/> 
                      📅 {new Date(ev.date).toLocaleDateString()}
                    </p>
                    
                    <p className="card-text text-secondary small flex-grow-1">
                      {ev.description.substring(0, 100)}...
                    </p>

                    {/* 🛑 DISABLE BUTTON IF SOLD OUT */}
                    <button 
                      className={`btn w-100 fw-bold mt-3 ${isSoldOut ? 'btn-secondary' : 'btn-outline-primary'}`}
                      onClick={() => handleBook(ev.event_id, ev.price)}
                      disabled={isSoldOut}
                    >
                      {isSoldOut ? "🚫 Sold Out" : (Number(ev.price) > 0 ? "Book Ticket" : "Register Free")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;