// src/pages/TrainerLearners.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function TrainerLearners() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLearners() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const { sub: trainerId } = jwtDecode(token);

        const res = await axios.get(
          `http://localhost:5254/api/Analytics/trainer/${trainerId}/learners`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setLearners(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLearners();
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
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

  if (learners.length === 0) {
    return (
      <div className="container py-5">
        <div className="alert alert-info text-center">No learners found.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Back button */}
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back to Dashboard
      </button>

      <h3 className="mb-4">Learners & Enrollments</h3>

      <div className="row">
        {learners.map((learner) => (
          <div className="col-md-6 mb-4" key={learner.learnerId}>
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{learner.learnerName}</h5>
                <h6 className="card-subtitle mb-3 text-muted">{learner.learnerEmail}</h6>

                {learner.courses.length === 0 ? (
                  <p>No courses enrolled</p>
                ) : (
                  <ul className="list-unstyled mb-0">
                    {learner.courses.map((c, idx) => {
                      const pct = Math.round(c.progress ?? 0);
                      return (
                        <li key={idx} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <strong>{c.courseName}</strong>
                            <span>{pct}%</span>
                          </div>
                          <div className="progress" style={{ height: "12px" }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: `${pct}%` }}
                              aria-valuenow={pct}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
