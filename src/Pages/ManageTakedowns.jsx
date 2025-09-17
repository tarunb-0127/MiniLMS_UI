import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "../Components/Navbar";

export default function TakedownManagement() {
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:5254/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin-login", { state: { alert: "Please log in." } });
      return;
    }

    const fetchData = async () => {
      try {
        const [coursesRes, notifsRes] = await Promise.all([
          api.get("/Course/all"),
          api.get("/Notifications"),
        ]);

        const allCourses = coursesRes.data || [];
        setCourses(allCourses);

        const takedowns = (notifsRes.data || [])
          .filter((n) => n.type === "TakedownRequested")
          .map((n) => {
            const course = allCourses.find((c) => c.name === n.message.match(/takedown of '(.+?)'/)?.[1]);
            return {
              ...n,
              courseId: course?.id,
              courseName: course?.name ?? "Unknown",
            };
          });

        setRequests(takedowns);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load courses or takedown requests.");
      }
    };

    fetchData();
  }, [navigate, token]);

  const handleApprove = async (courseId, notifId) => {
    if (!courseId) return alert("Cannot approve: course ID missing.");

    try {
      await api.delete(`/Course/${courseId}`);
      // Optionally remove notification locally
      setRequests((prev) => prev.filter((r) => r.id !== notifId));
      setMessage("Course deleted and takedown approved.");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Approval failed.");
    }
  };

  const handleReject = (notifId) => {
    // Just remove from UI since no API available
    setRequests((prev) => prev.filter((r) => r.id !== notifId));
    setMessage("Takedown request rejected.");
  };

  return (
    <>
    <Navbar/>
    <div className="container mt-4">
      <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} className="me-1" />
        Back
      </button>

      <h3 className="mb-4">Manage Course Takedown Requests</h3>

      {message && <div className="alert alert-info text-center">{message}</div>}

      {!requests.length ? (
        <p className="text-muted">No pending takedown requests.</p>
      ) : (
        <div className="list-group">
          {requests.map((req) => (
            <div key={req.id} className="list-group-item d-flex justify-content-between align-items-start">
              <div style={{ flex: 1 }}>
                <p className="mb-1">
                  <strong>Course:</strong> {req.courseName || "Unknown"}{" "}
                  {!req.courseId && <span className="badge bg-warning">Missing ID</span>}
                </p>
                {req.reason && <p className="mb-1"><strong>Reason:</strong> {req.reason}</p>}
                <small className="text-muted">
                  <Clock size={14} className="me-1" />
                  {new Date(req.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="btn-group">
                <button
                  className="btn btn-sm btn-success"
                  disabled={!req.courseId}
                  onClick={() => handleApprove(req.courseId, req.id)}
                >
                  <CheckCircle2 size={16} className="me-1" />
                  Approve
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleReject(req.id)}
                >
                  <XCircle size={16} className="me-1" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
