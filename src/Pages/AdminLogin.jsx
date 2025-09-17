// src/pages/AdminLogin.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  // step 1 = enter email/password; step 2 = enter OTP
  const [step, setStep] = useState(1);

  // form values
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [otp,      setOtp]      = useState("");

  // track which fields have been touched
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    otp: false,
  });

  // global message (info or error)
  const [message,     setMessage]     = useState("");
  const [submitError, setSubmitError] = useState("");

  // regex for email & otp
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const otpRe   = /^\d{6}$/;

  // validate step1 fields
  const loginErrors = useMemo(() => {
    const errs = {};
    if (!email.trim())         errs.email    = "Email is required.";
    else if (!emailRe.test(email)) errs.email = "Enter a valid email address.";
    if (!password)               errs.password = "Password is required.";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    return errs;
  }, [email, password]);

  // validate step2 field
  const otpErrors = useMemo(() => {
    const errs = {};
    if (!otp.trim())         errs.otp = "OTP is required.";
    else if (!otpRe.test(otp)) errs.otp = "OTP must be exactly 6 digits.";
    return errs;
  }, [otp]);

  // flags for form validity
  const isLoginValid = Object.keys(loginErrors).length === 0;
  const isOtpValid   = Object.keys(otpErrors).length   === 0;

  // reset OTP & errors when going back to step1
  useEffect(() => {
    if (step === 1) {
      setOtp("");
      setTouched(t => ({ ...t, otp: false }));
      setMessage("");
      setSubmitError("");
    }
  }, [step]);

  // handle blur to mark touched
  const handleBlur = (field) => () => {
    setTouched(t => ({ ...t, [field]: true }));
  };

  // submit step 1: email/password
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setTouched(t => ({ ...t, email: true, password: true }));

    if (!isLoginValid) return;

    try {
      const formData = new FormData();
      formData.append("email",    email);
      formData.append("password", password);

      const res = await fetch("http://localhost:5254/api/Auth/login/admin", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "OTP sent to your email");
        setStep(2);
      } else {
        setSubmitError(data.message || "Login failed");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    }
  };

  // submit step 2: OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setTouched(t => ({ ...t, otp: true }));

    if (!isOtpValid) return;

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("otp",   otp);

      const res = await fetch("http://localhost:5254/api/auth/admin/verify-otp", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role",  "Admin");
        localStorage.setItem("email", email);
        navigate("/admin-home");
      } else {
        setSubmitError(data.message || "OTP verification failed.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    }
  };

  // logout button
  const handleLogout = () => {
    localStorage.clear();
    setStep(1);
    setEmail("");
    setPassword("");
    setOtp("");
    setMessage("");
    setSubmitError("");
    navigate("/admin-login");
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm p-4 w-100" style={{ maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Admin Login</h2>

        <form onSubmit={step === 1 ? handleLoginSubmit : handleOtpSubmit} noValidate>
          {step === 1 && (
            <>
              {/* Email */}
              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${touched.email && loginErrors.email ? "is-invalid" : ""}`}
                  placeholder="Admin Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={handleBlur("email")}
                  required
                />
                {touched.email && loginErrors.email && (
                  <div className="invalid-feedback">{loginErrors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="mb-3">
                <input
                  type="password"
                  className={`form-control ${touched.password && loginErrors.password ? "is-invalid" : ""}`}
                  placeholder="Admin Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={handleBlur("password")}
                  required
                />
                {touched.password && loginErrors.password && (
                  <div className="invalid-feedback">{loginErrors.password}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={!isLoginValid}
              >
                Send OTP
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* OTP */}
              <div className="mb-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`form-control ${touched.otp && otpErrors.otp ? "is-invalid" : ""}`}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleBlur("otp")}
                  required
                />
                {touched.otp && otpErrors.otp && (
                  <div className="invalid-feedback">{otpErrors.otp}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={!isOtpValid}
              >
                Verify OTP
              </button>
            </>
          )}
        </form>

          {/* global messages */}
{(message || submitError) && (
  <div
    className={`
      alert 
      mt-3 
      text-center 
      p-2 
      ${submitError ? "alert-danger" : "alert-info"}
    `}
  >
    {submitError || message}
  </div>
)}

        {/* Logout if already logged in */}
        {localStorage.getItem("token") && (
          <button
            className="btn btn-outline-danger mt-3 w-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
