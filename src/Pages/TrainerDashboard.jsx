// src/pages/TrainerDashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import LogoutButton from "../Components/LogoutButton";
import Navbar from "../Components/Navbar";

const COLORS = [
  "#0d6efd",
  "#6c757d",
  "#198754",
  "#dc3545",
  "#ffc107",
  "#0dcaf0",
  "#f8f9fa",
  "#212529",
];

export default function TrainerDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [username, setUsername]   = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Not authenticated");

        const { sub: trainerId, username: uname, email } = jwtDecode(token);
        setUsername(email || uname || "Trainer");

        const res = await axios.get(
          `http://localhost:5254/api/Analytics/trainer/${trainerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [navigate]);

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

  if (!analytics) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning text-center">
          No analytics data available
        </div>
      </div>
    );
  }

  // Destructure response
  const { totalLearners, courses: rawCourses } = analytics;

  // Normalize courses array
  const courses = (rawCourses || []).map((c) => ({
    name:           c.name,
    learnerCount:   c.learnerCount ?? 0,
    avgRating:      c.avgRating ?? 0,
    completionRate: Math.round(c.avgProgress ?? 0),
  }));

  // Compute overall average rating (0–5 scale)
  const avgRating =
    (
      courses.reduce((sum, c) => sum + c.avgRating, 0) /
      (courses.length || 1)
    ).toFixed(1);

  // Prepare pie data for avgRating donut
  const ratingPieData = [
    { name: "Rating",    value: Number(avgRating) },
    { name: "Remaining", value: 5 - Number(avgRating) },
  ];

  return (
    <div className="container py-4">
      <Navbar />

      {/* Key Metrics */}
      <div className="row g-3 mb-4">
        {/* Total Learners Card */}
        <div className="col-md-6">
          <div
            className="card border-primary h-100"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/trainer-learners")}
          >
            <div className="card-body d-flex align-items-center">
              <User size={30} className="text-primary me-3" />
              <div>
                <h6 className="text-muted mb-1">Total Learners</h6>
                <h2 className="mb-0">{totalLearners}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Average Rating Donut Card */}
        <div className="col-md-6">
          <div className="card border-warning h-100">
            <div className="card-body text-center">
              <h6 className="text-muted mb-3">Average Rating (out of 5)</h6>
              <div style={{ width: 120, height: 120, margin: "0 auto" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratingPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                    >
                      {ratingPieData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `${val.toFixed(1)} / 5`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2">
                <h2 className="mb-0">{avgRating}</h2>
                <small>/5</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row gy-4">
        {/* Learners per Course */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Learners per Course</h6>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={courses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="learnerCount"
                    name="Learners"
                    radius={[4, 4, 0, 0]}
                  >
                    {courses.map((_, idx) => (
                      <Cell
                        key={`bar-cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rating by Course */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Rating by Course</h6>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={courses}
                    dataKey="avgRating"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {courses.map((_, idx) => (
                      <Cell
                        key={`pie-cell-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => val.toFixed(1)} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Completion Rate per Course as Line Chart */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title mb-3">Completion Rate per Course</h6>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={courses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" />
                  <Tooltip formatter={(val) => `${val}%`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    name="Completion Rate"
                    stroke={COLORS[2]}
                    strokeWidth={3}
                    dot={false}           // <-- removes point markers
                    activeDot={false}     // <-- no hover dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
