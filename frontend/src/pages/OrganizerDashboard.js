import React, { useState, useEffect } from "react";
// ✅ IMPORT API UTILITY
import api from "../api/axiosConfig";

function OrganizerDashboard() {
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // To show attendees
  const [attendees, setAttendees] = useState([]);
  const [stats, setStats] = useState({ revenue: 0 });

  // Toggle State
  const [showEvents, setShowEvents] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    title: "", 
    description: "", 
    date: "", 
    location: "", 
    price: "", 
    mode: "physical", 
    meeting_link: "",
    capacity: "100"
  });
  
  const [file, setFile] = useState(null);
  
  // Note: We don't need 'authConfig' anymore because api.js handles the token!

  useEffect(() => { fetchMyEvents(); }, []);

  // 1. Fetch Events (Fixed & Updated)
  const fetchMyEvents = async () => {
    try {
      // ✅ USE API: Correct GET request
      const res = await api.get("/events/my-events");
      setMyEvents(res.data);
    } catch (err) { 
      console.error("Error fetching events:", err); 
    }
  };

  // 2. Fetch Attendees
  const handleViewAttendees = async (eventId) => {
    try {
      // ✅ USE API
      const res = await api.get(`/events/${eventId}/attendees`);
      setSelectedEvent(res.data.event);
      setAttendees(res.data.attendees);
      setStats({ revenue: res.data.total_revenue });
      
      // Ensure the details section is visible
      window.scrollTo(0, document.body.scrollHeight);
    } catch (err) {
      alert("Error loading attendees");
    }
  };

  // 3. Create Event
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("date", formData.date);
    data.append("location", formData.location);
    data.append("price", formData.price);
    data.append("mode", formData.mode);
    data.append("meeting_link", formData.meeting_link);
    data.append("capacity", formData.capacity);
    
    if (file) {
      data.append("image", file);
    }

    try {
      // ✅ USE API: Post data
      await api.post("/events", data);
      
      alert("✅ Event Created Successfully!");
      setFormData({ 
        title: "", description: "", date: "", location: "", 
        price: "", mode: "physical", meeting_link: "", capacity: "100" 
      });
      setFile(null);
      fetchMyEvents(); 
      setShowEvents(true); 
    } catch (err) { 
      alert(err.response?.data?.error || "Error creating event"); 
    }
  };

  // 4. Delete Event
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      // ✅ USE API: Delete
      await api.delete(`/events/${id}`);
      fetchMyEvents();
      if (selectedEvent?.event_id === id) setSelectedEvent(null); 
    } catch (err) { alert("Failed to delete"); }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">👋 Organizer Dashboard</h2>
      
      {/* --- CREATE EVENT FORM --- */}
      <div className="card p-4 mb-5 shadow-sm border-0">
        <h4 className="mb-3">✨ Host a New Event</h4>
        <form onSubmit={handleCreate}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Event Title</label>
              <input className="form-control" type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Date</label>
              <input className="form-control" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Event Mode</label>
              <select className="form-select" value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})}>
                <option value="physical">📍 Physical Location</option>
                <option value="online">🌐 Online / Virtual</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">{formData.mode === 'physical' ? "Location" : "Meeting Link"}</label>
              <input className="form-control" type="text" 
                value={formData.mode === 'physical' ? formData.location : formData.meeting_link}
                onChange={(e) => {
                   if(formData.mode === 'physical') setFormData({...formData, location: e.target.value});
                   else setFormData({...formData, meeting_link: e.target.value});
                }} required />
            </div>

            <div className="col-md-4">
              <label className="form-label">Price (₹)</label>
              <input className="form-control" type="number" placeholder="0 for Free" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            
            <div className="col-md-4">
              <label className="form-label">Total Seats</label>
              <input 
                className="form-control" 
                type="number" 
                placeholder="e.g. 50" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Event Poster</label>
              <input 
                className="form-control" 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])} 
              />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3 w-100 fw-bold">Create Event</button>
        </form>
      </div>

      <hr className="my-5" />

      {/* --- 🔘 TOGGLE BUTTON SECTION --- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">📊 Your Events & Performance</h4>
        <button 
          className={`btn ${showEvents ? 'btn-outline-secondary' : 'btn-primary'} btn-sm fw-bold`}
          onClick={() => setShowEvents(!showEvents)}
        >
          {showEvents ? "🙈 Hide Events" : "👁️ Show Events"}
        </button>
      </div>

      {/* --- COLLAPSIBLE EVENT LIST --- */}
      {showEvents && (
        <div className="table-responsive">
          <table className="table table-hover align-middle shadow-sm bg-white rounded">
            <thead className="table-dark">
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myEvents.map((ev) => (
                <tr key={ev.event_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={ev.image_url} alt="thumb" style={{width: "40px", height: "40px", objectFit: "cover", marginRight: "10px", borderRadius: "4px"}} />
                      <div>
                          <div className="fw-bold">{ev.title}</div>
                          <small className="text-muted">{ev.mode === 'online' ? '🌐 Online' : `📍 ${ev.location}`}</small>
                      </div>
                    </div>
                  </td>
                  <td>{new Date(ev.date).toLocaleDateString()}</td>
                  <td>{ev.capacity} Max</td>
                  <td>{Number(ev.price) > 0 ? `₹${ev.price}` : "Free"}</td>
                  <td>
                    <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleViewAttendees(ev.event_id)}>
                      👥 Attendees
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(ev.event_id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ATTENDEE DETAILS --- */}
      {selectedEvent && (
        <div className="mt-5 p-4 border rounded bg-light shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>📋 Registrations for: <span className="text-primary">{selectedEvent.title}</span></h4>
            <button className="btn btn-close" onClick={() => setSelectedEvent(null)}></button>
          </div>

          <div className="row mb-4 text-center">
            <div className="col-md-4">
              <div className="card border-primary mb-2">
                <div className="card-body">
                  <h5>Seats Booked</h5>
                  <h3 className="text-primary">{attendees.length} / {selectedEvent.capacity}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-success mb-2">
                <div className="card-body">
                  <h5>Total Revenue</h5>
                  <h3 className="text-success">₹{stats.revenue}</h3>
                </div>
              </div>
            </div>
             <div className="col-md-4">
              <div className="card border-info mb-2">
                <div className="card-body">
                  <h5>Occupancy</h5>
                  <h3 className="text-info">
                    {selectedEvent.capacity > 0 
                      ? Math.round((attendees.length / selectedEvent.capacity) * 100) 
                      : 0}%
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {attendees.length === 0 ? (
            <p className="text-center text-muted">No registrations yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered bg-white">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Booking Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((user, idx) => (
                    <tr key={idx}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.booking_date).toLocaleDateString()}</td>
                      <td><span className="badge bg-success">{user.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;