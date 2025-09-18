// src/pages/CourseFeedback.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Star } from "lucide-react";
import Navbar from "../Components/Navbar";

export default function CourseFeedback() {
  const { id } = useParams(); // course ID
  const token = localStorage.getItem("token") || "";

  // all feedback items
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError]         = useState("");

  // form state
  const [formMessage, setFormMessage] = useState("");
  const [formRating, setFormRating]   = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState("");

  // fetch feedbacks on mount or when course id changes
  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await axios.get(
          `http://localhost:5254/api/Feedbacks/course/${id}`
        );
        setFeedbacks(res.data);
      } catch (err) {
        console.error("Error loading feedbacks:", err);
        setError("Failed to load feedbacks.");
      }
    }
    if (id) load();
  }, [id]);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formRating) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5254/api/Feedbacks",
        {
          CourseId: parseInt(id, 10),
          Message: formMessage,
          Rating: formRating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // append new feedback
      setFeedbacks((prev) => [...prev, res.data]);
      setSuccess("Feedback submitted successfully!");
      setFormMessage("");
      setFormRating(0);

      // clear success after 3s
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Navbar/>
    <div className="container mt-4">
      <h3>Course Feedbacks</h3>

      {/* Error */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Success */}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <p>No feedbacks yet.</p>
      ) : (
        <div className="card p-3">
          <h5>All Feedbacks</h5>
          {feedbacks.map((f) => (
            <div key={f.id} className="border-bottom mb-2 pb-2">
              <span className="text-warning">
                {"★".repeat(f.rating)}
                {"☆".repeat(5 - f.rating)}
              </span>
              <p className="mb-1">{f.message}</p>
              <small className="text-muted">Learner ID: {f.learnerId}</small>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
