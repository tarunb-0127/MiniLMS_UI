// src/pages/LearnerHome.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import Navbar from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import { BookOpen, CheckCircle, PlayCircle } from "lucide-react";

export default function LearnerHome() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [learner, setLearner] = useState({ username: "", email: "", id: null });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notifications: 0,
  });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Decode the JWT to read user info
        const decoded = jwtDecode(token);
        setLearner({
          username: decoded.username || "",
          email: decoded.email || "",
          id: decoded.userId || decoded.sub || "",
        });

        // Fetch enrolled courses
        const { data: courses } = await axios.get(
          "http://localhost:5254/api/Enrollment/my-courses",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Compute metrics from the `status` field
        const completedCount = courses.filter(c => c.status === "Completed").length;
        const inProgressCount = courses.filter(c => c.status !== "Completed").length;

        setStats({
          total: courses.length,
          completed: completedCount,
          inProgress: inProgressCount,
          notifications: 0, // placeholder until we fetch notifications
        });

        // Show up to 3 of the most recent enrollments
        const sorted = [...courses].sort(
          (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)
        );
        setRecent(sorted.slice(0, 3));

        // Fetch notifications count
        const { data: notifs } = await axios.get(
          "http://localhost:5254/api/notifications",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(prev => ({ ...prev, notifications: notifs.length }));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching learner data:", error);
        localStorage.removeItem("token");
        navigate("/login", { state: { alert: "Session expired. Please log in again." } });
      }
    };

    fetchData();
  }, [token, navigate]);

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
          <div>
            <h3>Welcome, {learner.username}!</h3>
            <p className="text-muted mb-0">
              Email: <strong>{learner.email}</strong>
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Dashboard Cards */}
        <div className="row g-3 mb-5">
          <DashboardCard icon={<BookOpen size={32} />} label="Total Courses" value={stats.total} />
          <DashboardCard
            icon={<CheckCircle size={32} className="text-success" />}
            label="Completed"
            value={stats.completed}
          />
          <DashboardCard
            icon={<PlayCircle size={32} className="text-warning" />}
            label="In Progress"
            value={stats.inProgress}
          />
        </div>

        {/* Recent Courses */}
        <div className="mb-5">
          <h5 className="mb-3">Recent Enrollments</h5>
          <div className="row g-3">
            {recent.length > 0 ? (
              recent.map(course => <CourseCard key={course.id} course={course} />)
            ) : (
              <p>No recent courses found.</p>
            )}
          </div>
        </div>

        {/* Browse More */}
        <div className="mb-5 text-center">
          <Link to="/browse" className="btn btn-primary btn-lg">
            Browse More Courses
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Dashboard Card ─────────────────────────────────────────────────

function DashboardCard({ icon, label, value }) {
  return (
    <div className="col-sm-6 col-lg-4">
      <div className="card text-center shadow-sm p-3 h-100">
        <div className="mb-2">{icon}</div>
        <h6 className="card-title">{label}</h6>
        <h4 className="fw-bold">{value}</h4>
      </div>
    </div>
  );
}

// ─── Course Card ────────────────────────────────────────────────────

function CourseCard({ course }) {
  const enrolledDate = new Date(course.enrolledAt).toLocaleDateString();

  return (
    <div className="col-md-4">
      <div className="card shadow-sm p-3 h-100 position-relative">
        {course.status === "Completed" && (
          <span
            className="badge bg-success position-absolute"
            style={{ top: "10px", right: "10px" }}
          >
            Completed
          </span>
        )}
        <h6>{course.name}</h6>
        <p className="mb-0">Trainer: {course.trainer?.username || "N/A"}</p>
        <p className="mb-0">Duration: {course.duration} hrs</p>
        <p className="mb-0">Status: {course.status}</p>
        <p className="mb-0 text-muted">Enrolled on {enrolledDate}</p>
        <Link
          to={`/learner/course/${course.id}`}
          className="btn btn-sm btn-outline-primary mt-2 w-100"
        >
          View Course
        </Link>
      </div>
    </div>
  );
}
