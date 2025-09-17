// src/components/CourseHeader.jsx
import React from "react";
import { BookOpen, User, Clock, FileText, ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CourseHeader({ course, enrolled, onUnenroll, onEnroll }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h3 className="fw-bold"><BookOpen className="me-2" size={22} />{course.name}</h3>
      <div>
        {enrolled ? (
          <button className="btn btn-danger btn-sm me-2" onClick={onUnenroll}>
            <Trash2 size={16} className="me-1" /> Unenroll
          </button>
        ) : (
          <button className="btn btn-primary btn-sm me-2" onClick={onEnroll}>
            Enroll in Course
          </button>
        )}
        <Link to="/learner/home" className="btn btn-outline-secondary btn-sm">
          <ArrowLeft className="me-1" size={14} /> Back
        </Link>
      </div>
    </div>
  );
}
