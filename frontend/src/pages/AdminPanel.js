import React, { useEffect, useState } from "react";
// ✅ IMPORT API UTILITY (Adjust path if needed, e.g., '../util/api')
import api from "../api/axiosConfig"; 

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("users"); // 'users' or 'events'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ✅ USE API: No hardcoded URL, token is auto-attached
      // 1. Fetch Users
      const userRes = await api.get("/users/admin/users");
      setUsers(userRes.data.users);

      // 2. Fetch All Events
      const eventRes = await api.get("/events");
      setEvents(eventRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.user_id !== id)); // Remove from UI
      alert("✅ User deleted");
    } catch(err) { 
      alert("Failed to delete user"); 
    }
  };

  const handleDeleteEvent = async (id) => {
    if(!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter(e => e.event_id !== id)); // Remove from UI
      alert("✅ Event deleted");
    } catch(err) { 
      alert("Failed to delete event"); 
    }
  };

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2">Loading Admin Dashboard...</p>
    </div>
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold">👑 Admin Dashboard</h2>

      {/* --- STATS CARDS --- */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-primary mb-3 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <p className="card-text fs-3 fw-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success mb-3 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Total Events</h5>
              <p className="card-text fs-3 fw-bold">{events.length}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-warning mb-3 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title text-dark">Pending Reports</h5>
              <p className="card-text fs-3 fw-bold text-dark">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button 
            className={`nav-link ${tab === 'users' ? 'active' : ''}`} 
            onClick={() => setTab('users')}
          >
            Manage Users
          </button>
        </li>
        <li className="nav-item ms-2">
          <button 
            className={`nav-link ${tab === 'events' ? 'active' : ''}`} 
            onClick={() => setTab('events')}
          >
            Manage Events
          </button>
        </li>
      </ul>

      {/* --- USERS TABLE --- */}
      {tab === 'users' && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td className="ps-3">{u.user_id}</td>
                      <td className="fw-bold">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'organizer' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteUser(u.user_id)}>
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- EVENTS TABLE --- */}
      {tab === 'events' && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">ID</th>
                    <th>Event Title</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.event_id}>
                      <td className="ps-3">{ev.event_id}</td>
                      <td className="fw-bold">{ev.title}</td>
                      <td>{new Date(ev.date).toLocaleDateString()}</td>
                      <td>{ev.location}</td>
                      <td>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteEvent(ev.event_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}