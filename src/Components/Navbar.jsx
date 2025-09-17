// src/Components/Navbar.jsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NAV_CONFIG = {
  Admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/courses", label: "Manage Courses" },
    { to: "/admin/takedowns", label: "Takedown Requests" },
    { to: "/admin/users", label: "Manage Users" },
  ],
  Trainer: [
    { to: "/trainer/home", label: "Home" },
    { to: "/trainer/dashboard", label: "Dashboard" },
    { to: "/trainer/my-courses", label: "My Courses" },
    { to: "/trainer/create-course", label: "Create Course" },
  ],
  Learner: [
    { to: "/learner/dashboard", label: "Dashboard" },
    { to: "/courses", label: "Browse Courses" },
    { to: "/learner/my-courses", label: "My Enrollments" },
    { to: "/learner/profile", label: "Profile" },
    { to: "/learner/home", label: "Home" },
  ],
};

export default function Navbar() {
  const navigate = useNavigate();

  // Read role from localStorage (set after login)
  const role = localStorage.getItem("role") || "Learner";
  const items = NAV_CONFIG[role] || [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        {/* Brand points to dashboard/home based on role */}
        <Link
          className="navbar-brand"
          to={
            role === "Admin"
              ? "/admin-home"
              : role === "Trainer"
              ? "/trainer/home"
              : "/learner/home"
          }
        >
          MiniLMS
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {items.map(({ to, label }) => (
              <li className="nav-item" key={to}>
                <Link className="nav-link" to={to}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center">
            {localStorage.getItem("email") && (
              <span className="me-3 text-muted">
                {localStorage.getItem("email")}
              </span>
            )}
            {localStorage.getItem("token") && (
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
