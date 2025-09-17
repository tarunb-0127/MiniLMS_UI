// src/components/CourseInfo.jsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Clock, FileText } from "lucide-react";

export default function CourseInfo({ course, courseProgress }) {
  const navigate = useNavigate();
  const [enrolled, setEnrolled] = useState(typeof courseProgress === "number");
  const [loading, setLoading]   = useState(false);

  const handleEnroll = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { alert: "Please login to enroll." } });
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `http://localhost:5254/api/Enroll/course/${course.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrolled(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to enroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <p className="mb-1">
          <User className="me-1" size={14} /> Trainer: {course.trainer?.username}
        </p>
        <p className="mb-1">
          <Clock className="me-1" size={14} /> Duration: {course.duration} hrs
        </p>
        <p className="mb-2">
          <FileText className="me-1" size={14} /> Type: {course.type}
        </p>
        <p className="text-muted">{course.description}</p>

        {/* Progress Bar */}
        {typeof courseProgress === "number" && (
          <div className="mt-3">
            <label>Course Progress: {courseProgress.toFixed(0)}%</label>
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${courseProgress}%` }}
                aria-valuenow={courseProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        )}

            {!enrolled ? (
            <button className="btn btn-primary btn-sm" onClick={async () => { await axios.post(`http://localhost:5254/api/enrollment/enroll/${id}`, {}, { headers: authHeaders }); loadData(); }}>Enroll in Course</button>
          ) : (
            <span className="badge bg-success">Enrolled</span>
          )}
      </div>
    </div>
  );
}
