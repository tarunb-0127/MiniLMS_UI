// src/pages/BrowseCourses.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import Navbar from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import { Search, Trash2 } from "lucide-react";

export default function BrowseCourses() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [browseCourses, setBrowseCourses]         = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [enrollmentsMap, setEnrollmentsMap]       = useState({});
  const [loading, setLoading]                     = useState(true);
  const [search, setSearch]                       = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const decoded   = jwtDecode(token);
        const learnerId = decoded.userId || decoded.sub;

        // 1) fetch all public courses
        const coursesRes = await axios.get(
          "http://localhost:5254/api/Course/all",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBrowseCourses(coursesRes.data);

        // 2) fetch enrolled courses
        const enrollRes = await axios.get(
          "http://localhost:5254/api/Enrollment/my-courses",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const enrolledCourses = enrollRes.data || [];
        const ids = enrolledCourses.map((c) => c.id);
        setEnrolledCourseIds(ids);

        // 3) build map courseId → enrollmentId
        const map = {};
        enrolledCourses.forEach((c) => {
          map[c.id] = c.enrollmentId || c.id;
        });
        setEnrollmentsMap(map);

        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };

    fetchCourses();
  }, [token, navigate]);

  const handleUnenroll = async (courseId, e) => {
    // prevent card onClick
    e.stopPropagation();
    if (!window.confirm("Unenroll from this course?")) return;

    try {
      const enrollmentId = enrollmentsMap[courseId];
      await axios.delete(
        `http://localhost:5254/api/Enrollment/${enrollmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrolledCourseIds((prev) => prev.filter((id) => id !== courseId));
      setEnrollmentsMap((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
      alert("Successfully unenrolled.");
    } catch (err) {
      console.error(err);
      alert("Failed to unenroll.");
    }
  };

  const filteredCourses = browseCourses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="container mt-5">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Browse Courses</h3>
          <LogoutButton />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="row g-3">
          {filteredCourses.length ? (
            filteredCourses.map((c) => {
              const enrolled = enrolledCourseIds.includes(c.id);
              return (
                <div key={c.id} className="col-md-3">
                  <div
                    className="card shadow-sm p-3 h-100 position-relative d-flex flex-column justify-content-between"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/learner/course/${c.id}`)}
                  >
                    {enrolled && (
                      <span
                        className="badge bg-success position-absolute"
                        style={{ top: "10px", right: "10px" }}
                      >
                        Enrolled
                      </span>
                    )}

                    <div>
                      <h6>{c.name}</h6>
                      <p className="mb-0">Trainer: {c.trainer?.username}</p>
                      <p className="mb-0">Duration: {c.duration} hrs</p>
                    </div>

                    <div className="mt-2">
                      {enrolled ? (
                        <button
                          className="btn btn-sm btn-danger w-100"
                          onClick={(e) => handleUnenroll(c.id, e)}
                        >
                          <Trash2 size={16} className="me-1" />
                          Unenroll
                        </button>
                      ) : (
                        <Link
                          to={`/learner/course/${c.id}`}
                          className="btn btn-sm btn-outline-primary w-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No courses found.</p>
          )}
        </div>
      </div>
    </>
  );
}
