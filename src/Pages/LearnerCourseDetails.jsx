// src/pages/LearnerCourseDetails.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BookOpen, User, Clock, FileText, ArrowLeft, Lock, Star, Trash2 } from "lucide-react";
import Navbar from "../Components/Navbar";
 
// Decode JWT to get learnerId
function getLearnerIdFromToken(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    return parseInt(payload.UserId || payload.userId || payload.sub, 10) || null;
  } catch {
    return null;
  }
}
 
// Debounce helper
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
 
export default function LearnerCourseDetails() {
  const { id } = useParams(); // courseId
  const navigate = useNavigate();
  const videoRef = useRef(null);
 
  const token = localStorage.getItem("token") || "";
  const learnerId = getLearnerIdFromToken(token);
  const authHeaders = { Authorization: `Bearer ${token}`, LearnerId: learnerId };
 
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  const [loading, setLoading] = useState(true);
 
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [hasFeedback, setHasFeedback] = useState(false);
  const [allFeedbacks, setAllFeedbacks] = useState([]);

  // 1) Validation state
const [errors, setErrors]   = useState({ message: "", rating: "" });
const [touched, setTouched] = useState({ message: false, rating: false });

// 2) Validator helpers
const validateMessage = msg => {
  if (!msg.trim())              return "Comments are required.";
  if (msg.trim().length < 10)   return "Comments must be at least 10 characters.";
  return "";
};

const validateRating = r => {
  if (!r || r < 1 || r > 5)     return "Please select a rating 1–5.";
  return "";
};

// 3) Combined validation
const validateFeedback = () => {
  const messageErr = validateMessage(feedbackMsg);
  const ratingErr  = validateRating(feedbackRating);
  setErrors({ message: messageErr, rating: ratingErr });
  return !messageErr && !ratingErr;
};

 
  // Construct file URL
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `http://localhost:5254/uploads/${filePath}`;
  };
 
  // Calculate course progress from modules
  const calculateCourseProgress = (modulesList) => {
    if (!modulesList || modulesList.length === 0) return 0;
    const total = modulesList.reduce((sum, m) => sum + (m.progressPercentage || 0), 0);
    return Math.floor(total / modulesList.length);
  };
 
  // Fetch course progress from backend
  const fetchCourseProgress = async () => {
    try {
      console.log("Fetching course progress from backend...");
      const { data } = await axios.get(`http://localhost:5254/api/Progress/course/${id}`, {
        headers: { LearnerId: learnerId },
      });
      console.log("Course progress from backend:", data);
      setCourseProgress(data.progress ?? calculateCourseProgress(modules));
    } catch (err) {
      console.error("Error fetching course progress:", err);
      setCourseProgress(calculateCourseProgress(modules));
    }
  };
 
  // Load all course data
  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Fetching modules and progress from backend...");
      const courseRes = await axios.get(`http://localhost:5254/api/course/${id}`, { headers: authHeaders });
      setCourse(courseRes.data);
 
      const enrollRes = await axios.get(`http://localhost:5254/api/enrollment/my-courses`, { headers: authHeaders });
      const enrolledCourse = enrollRes.data.find((c) => c.id === +id);
      setEnrolled(!!enrolledCourse);
 
      if (!enrolledCourse) {
        setModules([]);
        setSelectedModule(null);
        setCourseProgress(0);
        setAllFeedbacks([]);
        setHasFeedback(false);
        setLoading(false);
        return;
      }
 
      const [modulesRes, progressRes, feedbackRes] = await Promise.all([
        axios.get(`http://localhost:5254/api/Module/course/${id}`, { headers: authHeaders }),
        axios.get(`http://localhost:5254/api/Progress/modules/${id}`, { headers: authHeaders }),
        axios.get(`http://localhost:5254/api/Feedbacks/course/${id}`, { headers: authHeaders }),
      ]);
 
      console.log("Modules from backend:", modulesRes.data);
      console.log("Progress from backend:", progressRes.data);
      console.log("Feedbacks from backend:", feedbackRes.data);
 
      const rawModules = modulesRes.data;
      const progressList = progressRes.data;
 
      const mergedModules = rawModules.map((m) => {
        const p = progressList.find((x) => x.moduleId === m.id) || {};
        return {
          ...m,
          progressPercentage: p.progressPercentage ?? 0,
          isCompleted: p.isCompleted ?? false,
        };
      });
 
      setModules(mergedModules);
      if (mergedModules.length) setSelectedModule(mergedModules[0]);
 
      setAllFeedbacks(feedbackRes.data);
      setHasFeedback(feedbackRes.data.some((f) => f.learnerId === learnerId));
 
      setCourseProgress(calculateCourseProgress(mergedModules));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    if (!token || learnerId == null) {
      navigate("/learner-login", { state: { alert: "Please log in." } });
      return;
    }
    loadData();
  }, [id, token, learnerId, navigate]);
 
  // Debounced module progress update
  const updatePartial = useCallback(
    debounce(async (moduleId, percent) => {
      console.log(`Sending partial progress update: Module ${moduleId}, ${percent}%`);
      try {
        const payload = {
          LearnerId: learnerId,
          ModuleId: moduleId,
          CourseId: +id,
          ProgressPercentage: percent,
          IsCompleted: percent >= 99,
        };
        const { data } = await axios.post("http://localhost:5254/api/Progress/update", payload, { headers: authHeaders });
        console.log("Update API response:", data);
        await fetchCourseProgress();
      } catch (err) {
        console.error("Partial update error:", err);
      }
    }, 1000),
    [learnerId, id, modules]
  );
 
  // Video pause handler
  const handleVideoPause = () => {
    const vid = videoRef.current;
    if (!vid || !selectedModule) return;
    const pct = Math.floor((vid.currentTime / vid.duration) * 100);
    console.log(`Video paused. Module ${selectedModule.id} progress: ${pct}%`);
    if (pct > (selectedModule.progressPercentage || 0)) {
      const updatedModules = modules.map((m) =>
        m.id === selectedModule.id ? { ...m, progressPercentage: pct } : m
      );
      setModules(updatedModules);
      setCourseProgress(calculateCourseProgress(updatedModules));
      updatePartial(selectedModule.id, pct);
    }
  };
 
  // Video ended handler
  const handleVideoEnd = async () => {
    if (!selectedModule) return;
    console.log(`Video ended. Completing module ${selectedModule.id}`);
    try {
      const payload = {
        LearnerId: learnerId,
        ModuleId: selectedModule.id,
        CourseId: +id,
        ProgressPercentage: 100,
        IsCompleted: true,
      };
      const { data } = await axios.post("http://localhost:5254/api/Progress/complete", payload, { headers: authHeaders });
      console.log("Complete API response:", data);
 
      const updatedModules = modules.map((m) =>
        m.id === selectedModule.id ? { ...m, progressPercentage: 100, isCompleted: true } : m
      );
      setModules(updatedModules);
      setCourseProgress(calculateCourseProgress(updatedModules));
    } catch (err) {
      console.error("Complete error:", err);
    }
  };
 
  // Feedback submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSendingFeedback(true);
    try {
      const form = new FormData();
      form.append("LearnerId", learnerId.toString());
      form.append("CourseId", id);
      form.append("Message", feedbackMsg);
      form.append("Rating", feedbackRating.toString());
 
      const { data } = await axios.post("http://localhost:5254/api/Feedbacks", form, { headers: authHeaders });
      console.log("Feedback submitted:", data);
      setFeedbackSuccess("Thank you for your feedback!");
      setHasFeedback(true);
      setAllFeedbacks((prev) => [...prev, data]);
    } catch {
      alert("Feedback submission failed");
    } finally {
      setSendingFeedback(false);
    }
  };
 
  if (loading) return <div className="container mt-5">Loading…</div>;
  if (!course) return <div className="container mt-5">Course not found.</div>;
 
  const isLast = selectedModule && modules.length > 0 && selectedModule.id === modules[modules.length - 1].id;
 
  return (
  <>
    <Navbar />
    <div className="container mt-4">
      <div className="row">
        {/* LEFT COLUMN: course card (top) + scrollable modules below */}
        <div className="col-md-4">
          {/* Course Card (top left) */}
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title d-flex align-items-center mb-2">
                <BookOpen className="me-2" size={18} /> {course.name}
              </h5>

              <p className="mb-1 small">
                <User className="me-1" size={13} /> Trainer:{" "}
                <strong>{course.trainer?.username}</strong>
              </p>
              <p className="mb-1 small">
                <Clock className="me-1" size={13} /> Duration:{" "}
                <strong>{course.duration} hrs</strong>
              </p>
              <p className="mb-1 small">
                <FileText className="me-1" size={13} /> Type:{" "}
                <strong>{course.type}</strong>
              </p>

              <p className="text-muted small mb-2">{course.description}</p>

              {/* COURSE PROGRESS (visible in the course card) */}
              {enrolled && (
                <div className="mt-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Overall progress</small>
                    <small className="fw-bold">{courseProgress.toFixed(0)}%</small>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${courseProgress}%` }}
                      aria-valuenow={courseProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>
              )}

              {/* Enroll / Unenroll */}
              <div className="mt-3 d-flex justify-content-end">
                {!enrolled ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      await axios.post(
                        `http://localhost:5254/api/Enrollment/enroll/${id}`,
                        {},
                        { headers: authHeaders }
                      );
                      loadData();
                    }}
                  >
                    Enroll
                  </button>
                ) : (
                  <>
                    <span className="badge bg-success me-2 align-self-center">Enrolled</span>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={async () => {
                        const enrollRes = await axios.get(
                          `http://localhost:5254/api/Enrollment/my-courses`,
                          { headers: authHeaders }
                        );
                        const enrolledRecord = enrollRes.data.find((c) => c.id === +id);
                        if (!enrolledRecord) return;
                        if (!window.confirm("Unenroll?")) return;
                        await axios.delete(
                          `http://localhost:5254/api/Enrollment/${enrolledRecord.enrollmentId}`,
                          { headers: authHeaders }
                        );
                        loadData();
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Modules list (scrollable, directly below course card) */}
          {enrolled ? (
            <div
              className="list-group shadow-sm"
              style={{ maxHeight: "58vh", overflowY: "auto" }}
            >
              {modules.map((m) => (
                <button
                  key={m.id}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    selectedModule?.id === m.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedModule(m)}
                >
                  <span className="small">{m.name}</span>
                  <small className="text-muted ms-2">{m.progressPercentage}%</small>
                </button>
              ))}

              {/* Feedback item sits below the last module */}
              <button
                className={`list-group-item list-group-item-action d-flex align-items-center ${
                  selectedModule === "feedback" ? "active" : ""
                }`}
                onClick={() => setSelectedModule("feedback")}
              >
                <Star className="me-2 text-warning" size={16} />
                <span className="small">Leave Feedback</span>
              </button>
            </div>
          ) : (
            <div className="alert alert-info small d-flex align-items-center">
              <Lock className="me-2" size={14} /> Enroll to view modules.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: module viewer (or feedback when feedback item clicked) */}
        <div className="col-md-8">
          {/* Top mini header in right column showing selected item and overall % */}
          <div className="d-flex justify-content-between align-items-center mb-2">
           
            <small className="text-muted">Overall: {courseProgress.toFixed(0)}%</small>
          </div>

          {/* Module viewer */}
          {selectedModule && selectedModule !== "feedback" && (
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <h5 className="card-title">{selectedModule.name}</h5>

                {/\.(mp4|webm|ogg)$/i.test(selectedModule.filePath) ? (
                  <video
                    ref={videoRef}
                    src={getFileUrl(selectedModule.filePath)}
                    controls
                    className="w-100 rounded mb-3"
                    style={{ maxHeight: 480 }}
                    onPause={handleVideoPause}
                    onEnded={handleVideoEnd}
                  />
                ) : (
                  <a
                    href={getFileUrl(selectedModule.filePath)}
                    download
                    className="btn btn-outline-secondary btn-sm mb-3"
                  >
                    Download File
                  </a>
                )}

                <p className="text-muted">{selectedModule.description || "No description provided."}</p>
              </div>
            </div>
          )}

          {/* Feedback form overrides module content when sidebar item clicked */}
          {selectedModule === "feedback" && (
            <div className="card shadow-sm p-3 mb-3">
              <h5 className="mb-3">Leave Your Feedback</h5>

              {feedbackSuccess && <div className="alert alert-success">{feedbackSuccess}</div>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTouched({ message: true, rating: true });
                  if (!validateFeedback()) return;
                  handleFeedbackSubmit(e);
                }}
                noValidate
              >
                <div className="mb-3">
                  <label className="form-label small">Your comments</label>
                  <textarea
                    className={`form-control ${touched.message && errors.message ? "is-invalid" : ""}`}
                    rows={4}
                    value={feedbackMsg}
                    onChange={(e) => {
                      setFeedbackMsg(e.target.value);
                      if (touched.message) {
                        setErrors((errs) => ({ ...errs, message: validateMessage(e.target.value) }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((t) => ({ ...t, message: true }));
                      setErrors((errs) => ({ ...errs, message: validateMessage(feedbackMsg) }));
                    }}
                  />
                  {touched.message && errors.message && (
                    <div className="invalid-feedback">{errors.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small d-block">Rating</label>
                  <div>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={22}
                        className="me-1"
                        style={{ cursor: "pointer" }}
                        color={n <= feedbackRating ? "#ffc107" : "#adb5bd"}
                        onClick={() => {
                          setFeedbackRating(n);
                          if (touched.rating) {
                            setErrors((errs) => ({ ...errs, rating: validateRating(n) }));
                          }
                        }}
                      />
                    ))}
                  </div>
                  {touched.rating && errors.rating && (
                    <div className="text-danger mt-1 small">{errors.rating}</div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" disabled={sendingFeedback}>
                  {sendingFeedback ? "Sending…" : "Submit Feedback"}
                </button>
              </form>
            </div>
          )}

          {/* If feedback already exists */}
          {hasFeedback && selectedModule !== "feedback" && (
            <div className="alert alert-info">You have already submitted feedback for this course. Thank you!</div>
          )}

          {/* All feedbacks (shown when not on feedback form) */}
          {allFeedbacks.length > 0 && selectedModule !== "feedback" && (
            <div className="card shadow-sm p-3">
              <h6 className="mb-2">All Feedbacks</h6>
              {allFeedbacks.map((f) => (
                <div key={f.id} className="border-bottom mb-2 pb-2">
                  <span className="text-warning d-block mb-1">
                    {"★".repeat(f.rating)}
                    {"☆".repeat(5 - f.rating)}
                  </span>
                  <p className="mb-0 small">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);

}
 
 