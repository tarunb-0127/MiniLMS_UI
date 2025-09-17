import React, { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, Star, User } from "lucide-react";
import Navbar from "../Components/Navbar";

export default function LearnerDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");
        // Decode username from token (same as TrainerDashboard)
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.email || payload.username || "Learner");

        // Get enrolled courses for learner
        const res = await axios.get(
          "http://localhost:5254/api/enrollment/my-courses",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCourses(res.data);
      } catch (err) {
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="mb-4">
          <h3>
            <User className="me-2" size={24} />
            Welcome, {username}
          </h3>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title"><BookOpen className="me-2" />My Courses</h5>
            {courses.length === 0 ? (
              <div className="alert alert-info">You are not enrolled in any courses yet.</div>
            ) : (
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Trainer</th>
                    <th>Progress</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.trainer?.username || "N/A"}</td>
                      <td>
                        <div className="progress" style={{ height: "20px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${course.progress ?? 0}%` }}
                            aria-valuenow={course.progress ?? 0}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {course.progress ? `${course.progress}%` : "0%"}
                          </div>
                        </div>
                      </td>
                      <td>
                        {course.rating ? (
                          <span className="text-warning">
                            {"★".repeat(course.rating)}{"☆".repeat(5 - course.rating)}
                          </span>
                        ) : (
                          <span className="text-muted">No rating</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}