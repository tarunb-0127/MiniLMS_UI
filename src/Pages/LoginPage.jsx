// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, UserCheck, UserPlus, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // form state
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]       = useState("Trainer");

  // validation state
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors]   = useState({ email: "", password: "" });

  // server error/loading
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (token && (storedRole === "Trainer" || storedRole === "Learner")) {
      navigate(storedRole === "Trainer" ? "/trainer/home" : "/learner/home");
    }
  }, [navigate]);

  // 401 interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // validators
  const validateEmail = value => {
    if (!value.trim()) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) return "Enter a valid email address.";
    return "";
  };

  const validatePassword = value => {
    if (!value) return "Password is required.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  // handle field blur
  const handleBlur = field => () => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({
      ...e,
      [field]: field === "email"
        ? validateEmail(email)
        : validatePassword(password)
    }));
  };

  // handle field change
  const handleEmailChange = e => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors(e => ({ ...e, email: validateEmail(val) }));
    }
  };

  const handlePasswordChange = e => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors(e => ({ ...e, password: validatePassword(val) }));
    }
  };

  // form submit
  const handleSubmit = async e => {
    e.preventDefault();
    setServerError("");

    // mark touched and validate
    setTouched({ email: true, password: true });
    const emailErr    = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setLoading(true);
    try {
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
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate(role === "Trainer" ? "/trainer/home" : "/learner/home");
    } catch (err) {
      setServerError(err.response?.data?.message || "Login failed. Check credentials.");
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

        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white"><Mail size={16} /></span>
              <input
                type="email"
                className={`form-control ${touched.email && errors.email ? "is-invalid" : ""}`}
                placeholder="Email address"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur("email")}
              />
              {touched.email && errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text bg-white"><Lock size={16} /></span>
              <input
                type="password"
                className={`form-control ${touched.password && errors.password ? "is-invalid" : ""}`}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handleBlur("password")}
              />
              {touched.password && errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
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
      </div>
    </div>
  );
}
