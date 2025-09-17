// src/pages/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode"; // fixed import
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  UserCheck,
  UserMinus,
  AlertCircle,
  Star,
} from "lucide-react";
import Navbar from "../Components/Navbar";
import LogoutButton from "../Components/LogoutButton";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

const COLORS = [
  "#0d6efd",
  "#6c757d",
  "#198754",
  "#dc3545",
  "#ffc107",
  "#0dcaf0",
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token") || "";
  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate("/admin-login", {
        state: { alert: "Please log in to view dashboard" },
      });
      return;
    }

    async function fetchDashboard() {
      setLoading(true);
      try {
        // Decode admin info
        const { sub: adminId } = jwtDecode(token);

        // Fetch stats
        const statsRes = await axios.get(
          "http://localhost:5254/api/auth/stats",
          { headers: authHeader }
        );
        setStats(statsRes.data);

        // Fetch all courses
        const coursesRes = await axios.get(
          "http://localhost:5254/api/Course/all",
          { headers: authHeader }
        );
        const rawCourses = coursesRes.data || [];

        // Enrich courses with feedback count and completion rate
        const enrichedCourses = await Promise.all(
          rawCourses.map(async (c) => {
            // Fetch feedbacks per course
            const feedbackRes = await axios.get(
              `http://localhost:5254/api/Feedbacks/course/${c.id}`,
              { headers: authHeader }
            );

            // Fetch enrollments per course
            const enrollmentsRes = await axios.get(
              `http://localhost:5254/api/Enrollment/course/${c.id}`,
              { headers: authHeader }
            );

            const totalEnrollments = Array.isArray(enrollmentsRes.data)
              ? enrollmentsRes.data.length
              : 0;
            const totalFeedbacks = Array.isArray(feedbackRes.data)
              ? feedbackRes.data.length
              : 0;

            const completionRate = totalEnrollments
              ? Math.round((totalFeedbacks / totalEnrollments) * 100)
              : 0;

            return {
              id: c.id,
              name: c.name,
              feedbackCount: totalFeedbacks,
              completionRate,
            };
          })
        );

        setCoursesData(enrichedCourses);
      } catch (err) {
        console.error(err);
        if ([401, 403].includes(err.response?.status)) {
          localStorage.removeItem("token");
          navigate("/admin-login", {
            state: { alert: "Session expired, please log in again" },
          });
        } else {
          setError("Failed to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [token, navigate]);

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
      <div className="container mt-5">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          No analytics data available.
        </div>
      </div>
    );
  }

  // Destructure stats
  const {
    totalCourses,
    totalUsers,
    activeUsers,
    totalTrainers,
    totalLearners,
    takedownRequests,
    totalFeedbacks,
  } = stats;

  // Pie data for roles
  const rolePieData = [
    { name: "Trainers", value: totalTrainers },
    { name: "Learners", value: totalLearners },
  ];

  // Summary bar chart data
  const summaryBarData = [
    { name: "Courses", value: totalCourses },
    { name: "Total Users", value: totalUsers },
    { name: "Active Users", value: activeUsers },
    { name: "Takedown Requests", value: takedownRequests },
    { name: "Feedbacks Submitted", value: totalFeedbacks },
  ];

  // Completion rate pie (overall)
  const totalCompletionRate =
    coursesData.length > 0
      ? Math.round(
          coursesData.reduce((sum, c) => sum + c.completionRate, 0) /
            coursesData.length
        )
      : 0;
  const feedbackPieData = [
    { name: "Completed", value: totalCompletionRate },
    { name: "Pending", value: 100 - totalCompletionRate },
  ];

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Admin Dashboard</h2>
          <LogoutButton />
        </div>

        {/* Stat Cards */}
        <div className="row gy-4 mb-5">
          <StatCard
            icon={<BookOpen size={32} className="text-primary" />}
            label="Total Courses"
            value={totalCourses}
          />
          <StatCard
            icon={<Users size={32} className="text-success" />}
            label="Total Users"
            value={totalUsers}
          />
          <StatCard
            icon={<UserCheck size={32} className="text-info" />}
            label="Active Users"
            value={activeUsers}
          />
          <StatCard
            icon={<UserCheck size={32} className="text-warning" />}
            label="Trainers"
            value={totalTrainers}
          />
          <StatCard
            icon={<UserMinus size={32} className="text-secondary" />}
            label="Learners"
            value={totalLearners}
          />
          <StatCard
            icon={<AlertCircle size={32} className="text-danger" />}
            label="Takedown Requests"
            value={takedownRequests}
          />
          <StatCard
            icon={<Star size={32} className="text-warning" />}
            label="Feedbacks Submitted"
            value={totalFeedbacks}
          />
        </div>

        {/* Charts */}
        <div className="row gy-4">
          {/* Role Distribution */}
          <div className="col-md-4">
            <ChartCard title="Role Distribution">
              <PieChart>
                <Pie
                  data={rolePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {rolePieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartCard>
          </div>

          {/* Summary Metrics */}
          <div className="col-md-8">
            <ChartCard title="Summary Metrics">
              <BarChart data={summaryBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {summaryBarData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>
          </div>

          {/* Feedback / Completion Rate */}
          <div className="col-md-6">
            <ChartCard title="Overall Completion Rate">
              <PieChart>
                <Pie
                  data={feedbackPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  label={({ percent }) => `${Math.round(percent * 100)}%`}
                >
                  {feedbackPieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx + 2]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `${val}%`} />
              </PieChart>
            </ChartCard>
          </div>

          {/* Completion Rate per Course */}
          <div className="col-md-6">
            <ChartCard title="Completion Rate per Course">
              <BarChart data={coursesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="completionRate"
                  name="Completion Rate"
                  radius={[4, 4, 0, 0]}
                >
                  {coursesData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartCard>
          </div>

          {/* Feedbacks per Course */}
          <div className="col-md-12">
            <ChartCard title="Feedbacks per Course">
              <BarChart data={coursesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  dataKey="feedbackCount"
                  name="Feedback Count"
                  fill={COLORS[5]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      </div>
    </>
  );
}

// StatCard component
function StatCard({ icon, label, value }) {
  return (
    <div className="col-md-4">
      <div className="card shadow-sm text-center p-3 h-100">
        <div className="mb-2">{icon}</div>
        <h5 className="card-title">{label}</h5>
        <h3 className="fw-bold">{value}</h3>
      </div>
    </div>
  );
}

// ChartCard component
function ChartCard({ title, children }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        <h6 className="card-title mb-3">{title}</h6>
        <ResponsiveContainer width="100%" height={250}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
