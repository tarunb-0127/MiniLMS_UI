import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Navbar from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import {
  BookOpen,
  AlertTriangle,
  Bell,
  Calendar,
  PlusCircle,
  List,
  Quote,
} from "lucide-react";

function TrainerHome() {
  const [username, setUsername] = useState("Trainer");
  const [email, setEmail] = useState("");
  const [trainerId, setTrainerId] = useState(null);
  const [stats, setStats] = useState({
    courses: 0,
    pendingTakedowns: 0,
    notifications: 0,
    upcomingSessions: 0,
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login", {
        state: { alert: "Please login as Trainer to access the dashboard" },
      });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setTrainerId(decoded.UserId || decoded.userId || decoded.sub);
      setUsername(decoded.username || "Trainer");
      setEmail(decoded.email || "");
    } catch {
      localStorage.clear();
      navigate("/login", {
        state: { alert: "Session invalid. Please login again." },
      });
      return;
    }

    fetch("http://localhost:5254/api/course/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        const mine = data.filter(
          (c) => c.trainer?.id?.toString() === trainerId?.toString()
        );
        setStats((prev) => ({ ...prev, courses: mine.length }));
      })
      .catch(() => {
        localStorage.clear();
        navigate("/trainer-login", {
          state: { alert: "Session expired. Please login again." },
        });
      });

    // TODO: Add fetches for takedowns, notifications, sessions
  }, [navigate, token, trainerId]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          <div>
            <h3>
              Welcome!
            </h3>
          </div>
        </div>

        <div className="alert alert-secondary d-flex align-items-center mb-4">
          <Quote className="me-2" />
          <span>
            “A good teacher can inspire hope, ignite the imagination, and instill a love of learning.”
          </span>
        </div>

        <div className="row g-3 mb-5">
          <DashboardCard
            icon={<BookOpen size={32} className="text-primary" />}
            label="My Courses"
            value={stats.courses}
          />
          <DashboardCard
            icon={<AlertTriangle size={32} className="text-warning" />}
            label="Pending Takedowns"
            value={stats.pendingTakedowns}
          />
          <DashboardCard
            icon={<Bell size={32} className="text-info" />}
            label="Notifications"
            value={stats.notifications}
          />
          <DashboardCard
            icon={<Calendar size={32} className="text-success" />}
            label="Upcoming Sessions"
            value={stats.upcomingSessions}
          />
        </div>

        <div className="row mb-5">
          <div className="col-md-6">
            <h5 className="mb-3">Quick Actions</h5>
            <div className="list-group">
              <Link
                to="/trainer/create-course"
                className="list-group-item list-group-item-action d-flex align-items-center"
              >
                <PlusCircle className="me-2" /> Create New Course
              </Link>
              <Link
                to="/trainer/my-courses"
                className="list-group-item list-group-item-action d-flex align-items-center"
              >
                <List className="me-2" /> View My Courses
              </Link>
              <Link
                to="/trainer/takedown-requests"
                className="list-group-item list-group-item-action d-flex align-items-center"
              >
                <AlertTriangle className="me-2" /> My Takedown Requests
              </Link>
              <Link
                to="/trainer/notifications"
                className="list-group-item list-group-item-action d-flex align-items-center"
              >
                <Bell className="me-2" /> View Notifications
              </Link>
            </div>
          </div>

          
        </div>
      </div>
    </>
  );
}

function DashboardCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className="card text-center shadow-sm p-3 h-100">
        <div className="mb-2">{icon}</div>
        <h6 className="card-title">{label}</h6>
        <h4 className="fw-bold">{value}</h4>
      </div>
    </div>
  );
}

export default TrainerHome;
