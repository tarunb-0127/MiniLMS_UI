// src/pages/ManageModules.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  ArrowLeft,
  PlusCircle,
  Trash2,
  Edit,
} from "lucide-react";

export default function ManageModules() {
  const { courseId } = useParams();
  const token = localStorage.getItem("token");

  const [courseName, setCourseName] = useState("");
  const [modules, setModules]       = useState([]);
  const [loading, setLoading]       = useState(true);

  const [form, setForm] = useState({
    title:   "",
    content: "",
    file:    null,
  });

  const [errors, setErrors]   = useState({});
  const [editId, setEditId]   = useState(null);

  // fetch course name
  useEffect(() => {
    axios
      .get(`http://localhost:5254/api/Course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setCourseName(res.data.name))
      .catch(() => setCourseName(`Course ${courseId}`));
  }, [courseId, token]);

  // fetch modules
  useEffect(() => {
    loadModules();
  }, [courseId]);

  function loadModules() {
    setLoading(true);
    axios
      .get(`http://localhost:5254/api/Module/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setModules(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  // handle field change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // validate inputs
  function validateForm() {
    const errs = {};

    // title: required, max length 100
    if (!form.title.trim()) {
      errs.title = "Title is required.";
    } else if (form.title.length > 100) {
      errs.title = "Title must be under 100 characters.";
    }

    // content: required, min length 10
    if (!form.content.trim()) {
      errs.content = "Content is required.";
    } else if (form.content.length < 10) {
      errs.content = "Content must be at least 10 characters.";
    }

    // file: optional, but if provided must be PDF/video under 50MB
    if (form.file) {
      const { type, size } = form.file;
      const allowed = [
        "application/pdf",
        "video/mp4",
        "video/webm",
        "video/ogg"
      ];
      if (!allowed.includes(type)) {
        errs.file = "File must be PDF or MP4/WebM/OGG video.";
      } else if (size > 50 * 1024 * 1024) {
        errs.file = "File size must be under 50MB.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // submit add/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fd = new FormData();
    fd.append("Title",   form.title);
    fd.append("Content", form.content);
    if (form.file) fd.append("File", form.file);
    if (!editId) fd.append("CourseId", courseId);

    try {
      if (editId) {
        await axios.put(
          `http://localhost:5254/api/Module/${editId}`,
          fd,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        await axios.post(
          `http://localhost:5254/api/Module/create`,
          fd,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      setForm({ title: "", content: "", file: null });
      setEditId(null);
      loadModules();
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Failed to save module. Please try again." });
    }
  };

  // prepare edit
  const handleEdit = (m) => {
    setEditId(m.id);
    setForm({
      title:   m.name,
      content: m.description || "",
      file:    null,
    });
    setErrors({});
  };

  // delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      await axios.delete(`http://localhost:5254/api/Module/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadModules();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <BookOpen size={24} className="me-2" />
          Manage Modules for {courseName}
        </h2>
        <Link to="/trainer/my-courses" className="btn btn-outline-secondary">
          <ArrowLeft size={16} className="me-1" />
          Back to Courses
        </Link>
      </div>

      {/* Form */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            {editId ? "Edit Module" : "Add New Module"}
          </h5>
          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                name="title"
                type="text"
                className={`form-control ${errors.title ? "is-invalid" : ""}`}
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && (
                <div className="invalid-feedback">{errors.title}</div>
              )}
            </div>

            {/* Content */}
            <div className="mb-3">
              <label className="form-label">Content</label>
              <textarea
                name="content"
                rows={4}
                className={`form-control ${errors.content ? "is-invalid" : ""}`}
                value={form.content}
                onChange={handleChange}
              />
              {errors.content && (
                <div className="invalid-feedback">{errors.content}</div>
              )}
            </div>

            {/* File */}
            <div className="mb-3">
              <label className="form-label">Upload File (optional)</label>
              <input
                name="file"
                type="file"
                className={`form-control ${errors.file ? "is-invalid" : ""}`}
                onChange={handleChange}
              />
              {errors.file && (
                <div className="invalid-feedback">{errors.file}</div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary">
              <PlusCircle size={16} className="me-1" />
              {editId ? "Update Module" : "Add Module"}
            </button>
            {errors.submit && (
              <div className="text-danger mt-2">{errors.submit}</div>
            )}
            {editId && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setEditId(null);
                  setForm({ title: "", content: "", file: null });
                  setErrors({});
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Module List */}
      {loading ? (
        <p>Loading modules...</p>
      ) : modules.length === 0 ? (
        <div className="alert alert-info">
          No modules found for this course.
        </div>
      ) : (
        <div className="row">
          {modules.map((m) => (
            <div key={m.id} className="col-md-4 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{m.name}</h5>
                  <p className="card-text text-muted">
                    {m.description || "No description provided."}
                  </p>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEdit(m)}
                    >
                      <Edit size={14} className="me-1" />
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 size={14} className="me-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
