// src/pages/AdminHome.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link }           from "react-router-dom";
import axios                            from "axios";
import Navbar       from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import {
  Users,
  BookOpen,
  AlertCircle,
  LogOut
} from "lucide-react";

export default function AdminHome() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  // greeting & message
  const [user, setUser]     = useState({ name: "" });
  const [message, setMessage] = useState("");

  // live stats
  const [stats, setStats] = useState({
    users:       0,
    courses:     0,
    takedowns:   0,
  });

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }

    // 1) load welcome message + admin name
    fetch("http://localhost:5254/api/admin/home", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          navigate("/admin-login");
          return;
        }
        const { message, user } = await res.json();
        setMessage(message);
        setUser({ name: user.username || user.email || "Admin" });
      })
      .catch(console.error);

    // 2) fetch counts in parallel
    Promise.all([
      axios.get("http://localhost:5254/api/Users", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("http://localhost:5254/api/course/all", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("http://localhost:5254/api/Notifications", { headers: { Authorization: `Bearer ${token}` } }),
    ])
    .then(([uRes, cRes, nRes]) => {
      const allUsers    = uRes.data || [];
      const allCourses  = cRes.data || [];
      const allNotifs   = nRes.data || [];
      const takedowns   = allNotifs.filter(n => n.type === "TakedownRequested");
      setStats({
        users:     allUsers.length,
        courses:   allCourses.length,
        takedowns: takedowns.length,
      });
    })
    .catch(err => console.error("Stats load error:", err));
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin-login");
  };

  return (
    <>
      <Navbar />

      <div className="container mt-5">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold">Welcome</h2>
            <p className="text-muted">{message}</p>
          </div>
         
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-5">
          <StatCard
            icon={<Users size={28} className="text-primary" />}
            label="Total Users"
            value={stats.users}
            link="/admin/users"
            color="primary"
          />
          <StatCard
            icon={<BookOpen size={28} className="text-success" />}
            label="Total Courses"
            value={stats.courses}
            link="/admin/courses"
            color="success"
          />
          <StatCard
            icon={<AlertCircle size={28} className="text-danger" />}
            label="Takedown Requests"
            value={stats.takedowns}
            link="/admin/takedowns"
            color="danger"
          />
          <StatCard
            icon={<Users size={28} className="text-secondary" />}
            label="User Management"
            value="Go"
            link="/admin/users"
            color="secondary"
          />
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <Link to="/admin/users" className="btn btn-outline-primary me-3">
            Manage Users
          </Link>
          <Link to="/admin/courses" className="btn btn-outline-success me-3">
            Manage Courses
          </Link>
          <Link to="/admin/takedowns" className="btn btn-outline-danger">
            View Takedowns
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── StatCard Component ─────────────────────────────────────
function StatCard({ icon, label, value, link, color }) {
  return (
    <div className="col-sm-6 col-md-3">
      <div
        className={`card border-start border-4 border-${color} shadow-sm h-100 position-relative`}
      >
        <div className="card-body">
          <div className="d-flex align-items-center mb-2">
            {icon}
            <h6 className="ms-2 mb-0">{label}</h6>
          </div>
          <h3 className={`fw-bold text-${color}`}>
            {value}
          </h3>
          <Link
            to={link}
            className="stretched-link"
          />
        </div>
      </div>
    </div>
  );
}
