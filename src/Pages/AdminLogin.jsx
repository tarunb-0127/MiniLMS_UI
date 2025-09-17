// src/Pages/AdminLogin.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    otp: "",
  });

  const navigate = useNavigate();

  // Clear OTP and errors when returning to step 1
  useEffect(() => {
    if (step === 1) {
      setOtp("");
      setFieldErrors((f) => ({ ...f, otp: "" }));
    }
  }, [step]);

  const validateLogin = () => {
    const errs = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) errs.email = "Email is required.";
    else if (!emailRe.test(email)) errs.email = "Enter a valid email address.";

    if (!password) errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";

    setFieldErrors((f) => ({ ...f, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateOtp = () => {
    const errs = {};
    if (!otp.trim()) errs.otp = "OTP is required.";
    else if (!/^\d{6}$/.test(otp)) errs.otp = "OTP must be 6 digits.";
    setFieldErrors((f) => ({ ...f, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateLogin()) return;

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await fetch("http://localhost:5254/api/auth/login/admin", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "OTP sent to your email");
        setStep(2);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch {
      setMessage("Something went wrong.");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateOtp()) return;

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("otp", otp);

      const res = await fetch("http://localhost:5254/api/auth/admin/verify-otp", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        // Save token, email and role for Navbar
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "Admin");
        localStorage.setItem("email", email);

        setMessage(data.message || "OTP verified");
        navigate("/admin-home");
      } else {
        setMessage(data.message || "OTP verification failed.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setMessage("Logged out successfully.");
    setStep(1);
    setEmail("");
    setPassword("");
    navigate("/admin-login");
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Admin Login</h2>

        <form onSubmit={step === 1 ? handleLoginSubmit : handleOtpSubmit} noValidate>
          {step === 1 && (
            <>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Admin Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((f) => ({ ...f, email: "" }));
                  }}
                  required
                />
                {fieldErrors.email && <small className="text-danger">{fieldErrors.email}</small>}
              </div>

              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Admin Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((f) => ({ ...f, password: "" }));
                  }}
                  required
                />
                {fieldErrors.password && <small className="text-danger">{fieldErrors.password}</small>}
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setFieldErrors((f) => ({ ...f, otp: "" }));
                  }}
                  required
                />
                {fieldErrors.otp && <small className="text-danger">{fieldErrors.otp}</small>}
              </div>

              <button type="submit" className="btn btn-success w-100">
                Verify OTP
              </button>
            </>
          )}
        </form>

        {message && <div className="alert alert-info mt-3 text-center p-2">{message}</div>}

        {localStorage.getItem("token") && (
          <button className="btn btn-outline-danger mt-3 w-100" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
