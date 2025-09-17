// src/pages/CreateCourse.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import axios from "axios";

export default function CreateCourse() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token")?.trim();

  const [course, setCourse] = useState({
    name: "",
    type: "",
    duration: "",
    visibility: "Public",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // verify token & role on mount
  useEffect(() => {
    if (!token) {
      navigate("/trainer-login", { state: { alert: "Please login first." } });
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (!decoded.email || decoded.role !== "Trainer") {
        throw new Error("Unauthorized");
      }
    } catch {
      localStorage.clear();
      navigate("/trainer-login", {
        state: { alert: "Session invalid. Please login again." },
      });
    }
  }, [token, navigate]);

  // update field and clear that field's error
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse((c) => ({ ...c, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: "" }));
  };

  // validate inputs
  const validateForm = () => {
    const errs = {};
    if (!course.name.trim()) {
      errs.name = "Course name is required.";
    }
    if (!course.type.trim()) {
      errs.type = "Course type is required.";
    }
    if (!course.duration) {
      errs.duration = "Duration is required.";
    } else if (isNaN(course.duration) || Number(course.duration) <= 0) {
      errs.duration = "Duration must be a positive number.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5254/api/Course/create",
        course,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert(`Course "${res.data.name}" created successfully!`);
      navigate("/trainer/my-courses");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div
        className="card shadow-sm p-4 mx-auto"
        style={{ maxWidth: "600px" }}
      >
        <h3 className="mb-4 text-center text-primary">
          Create New Course
        </h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Course Name</label>
            <input
              type="text"
              name="name"
              className="form-control form-control-lg"
              value={course.name}
              onChange={handleChange}
            />
            {errors.name && (
              <small className="text-danger">{errors.name}</small>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Course Type</label>
            <input
              type="text"
              name="type"
              className="form-control form-control-lg"
              value={course.type}
              onChange={handleChange}
            />
            {errors.type && (
              <small className="text-danger">{errors.type}</small>
            )}
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Duration (hrs)</label>
              <input
                type="number"
                name="duration"
                className="form-control form-control-lg"
                value={course.duration}
                onChange={handleChange}
              />
              {errors.duration && (
                <small className="text-danger">{errors.duration}</small>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Visibility</label>
              <select
                name="visibility"
                className="form-select form-select-lg"
                value={course.visibility}
                onChange={handleChange}
              >
                <option value="Public">Public</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mt-3"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      </div>
    </div>
  );
}
