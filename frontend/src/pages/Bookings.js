import React, { useEffect, useState } from "react";
// ✅ IMPORT API UTILITY (Adjust path if needed, e.g., '../util/api')
import api from "../api/axiosConfig";
import { QRCodeCanvas } from "qrcode.react";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user's bookings
  const fetchBookings = async () => {
    try {
      // ✅ USE API: Token is auto-attached by the interceptor
      // No need for "http://localhost..." or manual headers
      const response = await api.get("/bookings");

      if (Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        console.warn("Unexpected response format:", response.data);
        setBookings([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Failed to load bookings:", err);
      // Handle 401 (Unauthorized) specifically if needed
      if (err.response && err.response.status === 401) {
         setError("Please log in to view your bookings.");
      } else {
         setError("Could not fetch bookings. Please try again later.");
      }
      setLoading(false);
    }
  };

  // Handle deleting a booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;

    try {
      // ✅ USE API: Simple clean call
      const res = await api.delete(`/bookings/${bookingId}`);

      alert(res.data.message || "Booking deleted");
      fetchBookings(); // Refresh list
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert(err.response?.data?.error || "Failed to delete booking");
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-2">Loading your tickets...</p>
    </div>
  );

  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold">📅 My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-5">
          <p className="lead">No bookings yet.</p>
          <a href="/events" className="btn btn-primary">Browse Events 👇</a>
        </div>
      ) : (
        bookings
          .filter((b) => b && b.booking_id)
          .map((b) => (
            <div
              key={b.booking_id}
              className="card mb-3 shadow-sm border-0"
              style={{
                display: "flex",
                flexDirection: "row", // Horizontal layout for ticket look
                overflow: "hidden"
              }}
            >
              <div className="card-body d-flex justify-content-between align-items-center w-100 p-4">
                
                {/* LEFT SIDE: Ticket Info */}
                <div style={{ flex: 1 }}>
                  <h3 className="card-title fw-bold text-primary mb-2">{b.event_name}</h3>
                  <p className="mb-1">
                    <strong>Date:</strong>{" "}
                    {b.booking_date
                      ? new Date(b.booking_date).toLocaleDateString()
                      : "Unknown"}
                  </p>
                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`badge ${b.status === "confirmed" ? "bg-success" : "bg-danger"}`}
                      style={{ fontSize: "0.9em" }}
                    >
                      {b.status ? b.status.toUpperCase() : "N/A"}
                    </span>
                  </div>
                  <p className="text-muted small">Ticket ID: #{b.booking_id}</p>

                  <button
                    onClick={() => handleDeleteBooking(b.booking_id)}
                    className="btn btn-outline-danger btn-sm mt-2"
                  >
                    ❌ Cancel Booking
                  </button>
                </div>

                {/* RIGHT SIDE: QR Code (Only if Confirmed) */}
                {b.status === "confirmed" && (
                  <div 
                    className="d-none d-md-block text-center ms-4 ps-4" 
                    style={{ borderLeft: "2px dashed #dee2e6" }}
                  >
                    <QRCodeCanvas 
                      value={JSON.stringify({ 
                        ticket_id: b.booking_id, 
                        event: b.event_name, 
                        user: "Valid Attendee" 
                      })} 
                      size={100} 
                    />
                    <p className="small text-muted mt-2 mb-0">Scan for Entry</p>
                  </div>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default Bookings;