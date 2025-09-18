// src/pages/LearnerHome.jsx

import React, { useEffect, useState } from "react";
import { useNavigate, Link }          from "react-router-dom";
import axios                           from "axios";
import {jwtDecode}                       from "jwt-decode";
import Navbar    from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import { BookOpen, CheckCircle, PlayCircle } from "lucide-react";


export default function LearnerHome() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  const [learner, setLearner] = useState({ username: "", email: "", id: null });
  const [stats,   setStats]   = useState({ total:0, completed:0, inProgress:0, notifications:0 });
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // 1) Decode token to get learner info
        const payload = jwtDecode(token);
        const learnerId = payload.userId || payload.sub;
        setLearner({
          id:       learnerId,
          username: payload.username || "",
          email:    payload.email    || ""
        });

        // 2) Fetch this learner's enrollments
        const { data: enrollments } = await axios.get(
          "http://localhost:5254/api/Enrollment/my-courses",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // enrollments: [{ id, name, duration, Status, EnrolledAt, EnrollmentId }...]

        // 3) Fetch all courses (with nested trainer) from CourseController
        const { data: allCourses } = await axios.get(
          "http://localhost:5254/api/course/all",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // allCourses: [{ id, name, duration, trainer:{...}, ... }...]

        // 4) Merge trainer info into each enrollment object
        const enriched = enrollments.map(e => {
          const courseInfo = allCourses.find(c => c.id === e.id);
          return {
            ...e,
            trainer: courseInfo?.trainer || { username: "N/A" }
          };
        });

        // 5) Compute dashboard metrics
        const completedCount  = enriched.filter(c => c.status === "Completed").length;
        const inProgressCount = enriched.length - completedCount;
        setStats({
          total:      enriched.length,
          completed:  completedCount,
          inProgress: inProgressCount,
          notifications: 0
        });

        // 6) Get the 3 most recent enrollments
        const sorted = [...enriched].sort(
          (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)
        );
        setRecent(sorted.slice(0, 3));

        // 7) Fetch notification count
        const { data: notifs } = await axios.get(
          "http://localhost:5254/api/notifications",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStats(s => ({ ...s, notifications: notifs.length }));

        setLoading(false);
      }
      catch (err) {
        console.error("Error fetching learner data:", err);
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
            <h3>Welcome{learner.username}!</h3>
            <p className="text-muted mb-0">
              Email: <strong>{learner.email}</strong>
            </p>
          </div>
        
        </div>

        {/* Dashboard Cards */}
        <div className="row g-3 mb-5">
          <DashboardCard icon={<BookOpen size={32}/>}    label="Total Courses" value={stats.total} />
          <DashboardCard icon={<CheckCircle size={32} className="text-success"/>}
                         label="Completed"        value={stats.completed} />
          <DashboardCard icon={<PlayCircle size={32} className="text-warning"/>}
                         label="In Progress"     value={stats.inProgress} />
        </div>

        {/* Recent Enrollments */}
        <div className="mb-5">
          <h5 className="mb-3">Recent Enrollments</h5>
          <div className="row g-3">
            {recent.length > 0 ? recent.map(course => (
              <div key={course.id} className="col-md-4">
                <div
                  className="card shadow-sm p-3 h-100 position-relative d-flex flex-column justify-content-between"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/learner/course/${course.id}`)}
                >
                  {course.status === "Completed" && (
                    <span
                      className="badge bg-success position-absolute"
                      style={{ top:10, right:10 }}
                    >
                      Completed
                    </span>
                  )}

                  <div>
                    <h6>{course.name}</h6>
                    <p className="mb-0">
                      Trainer: {course.trainer.username}
                    </p>
                    <p className="mb-0">
                      Duration: {course.duration} hrs
                    </p>
                    <p className="mb-0 text-muted">
                      Enrolled on {new Date(course.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary w-100 mt-2"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/learner/course/${course.id}`);
                    }}
                  >
                    View Course
                  </button>
                </div>
              </div>
            )) : (
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

// ─── DashboardCard ─────────────────────────────────────────────────
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
