// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, UserCheck, UserPlus, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("Trainer");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // If already logged in, redirect to appropriate home
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (token && (storedRole === "Trainer" || storedRole === "Learner")) {
      navigate(storedRole === "Trainer" ? "/trainer/home" : "/learner/home");
    }
  }, [navigate]);

  // Intercept 401s and force logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Build FormData as your backend expects
      const form = new FormData();
      form.append("email", email);
      form.append("password", password);
      form.append("role", role);

      const res = await axios.post(
        "http://localhost:5254/api/auth/login/user",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { token } = res.data;
      // Persist token + role
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      // Auto-inject into all future Axios calls
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Redirect
      navigate(role === "Trainer" ? "/trainer/home" : "/learner/home");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
      <div className="card shadow-sm p-4" style={{ maxWidth: 400, width: "100%" }}>
        <div className="text-center mb-4">
          <User size={48} className="text-primary" />
          <h2 className="mt-2">Welcome Back</h2>
          <p className="text-muted">Please login to continue</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-control"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Role Selector */}
          <div className="mb-4">
            <label className="form-label d-block">Role</label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${role === "Trainer" ? "btn-outline-primary active" : "btn-outline-secondary"}`}
                onClick={() => setRole("Trainer")}
              >
                <UserCheck size={16} className="me-1" /> Trainer
              </button>
              <button
                type="button"
                className={`btn ${role === "Learner" ? "btn-outline-primary active" : "btn-outline-secondary"}`}
                onClick={() => setRole("Learner")}
              >
                <UserPlus size={16} className="me-1" /> Learner
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
            Login
          </button>
        </form>

        <p className="mt-3 text-center">
          Don’t have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
