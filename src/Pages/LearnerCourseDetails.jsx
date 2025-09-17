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
        axios.get(`http://localhost:5254/api/module/course/${id}`, { headers: authHeaders }),
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
    <Navbar/>
    <div className="container mt-4">
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold"><BookOpen className="me-2" size={22} />{course.name}</h3>
        <div>
          {enrolled && (
            <button
              className="btn btn-danger btn-sm me-2"
              onClick={async () => {
                const enrollRes = await axios.get(`http://localhost:5254/api/enrollment/my-courses`, { headers: authHeaders });
                const enrolledRecord = enrollRes.data.find((c) => c.id === +id);
                if (!enrolledRecord) return;
                if (!window.confirm("Unenroll?")) return;
                await axios.delete(`http://localhost:5254/api/Enrollment/${enrolledRecord.enrollmentId}`, { headers: authHeaders });
                loadData();
              }}
            >
              <Trash2 size={16} className="me-1" /> Unenroll
            </button>
          )}
          <Link to="/learner/home" className="btn btn-outline-secondary btn-sm"><ArrowLeft className="me-1" size={14} /> Back</Link>
        </div>
      </div>
 
      {/* Course Info */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <p className="mb-1"><User className="me-1" size={14} /> Trainer: {course.trainer?.username}</p>
          <p className="mb-1"><Clock className="me-1" size={14} /> Duration: {course.duration} hrs</p>
          <p className="mb-2"><FileText className="me-1" size={14} /> Type: {course.type}</p>
          <p className="text-muted">{course.description}</p>
          {!enrolled ? (
            <button className="btn btn-primary btn-sm" onClick={async () => { await axios.post(`http://localhost:5254/api/enrollment/enroll/${id}`, {}, { headers: authHeaders }); loadData(); }}>Enroll in Course</button>
          ) : (
            <span className="badge bg-success">Enrolled</span>
          )}
        </div>
      </div>
 
      {/* Modules & Content */}
      {!enrolled ? (
        <div className="alert alert-info d-flex align-items-center"><Lock className="me-2" size={16} /> Enroll to view modules.</div>
      ) : modules.length === 0 ? (
        <div className="alert alert-warning">No modules available yet.</div>
      ) : (
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-3">
            <ul className="list-group">
              {modules.map((m) => (
                <li key={m.id} className={`list-group-item ${selectedModule?.id === m.id ? "active" : ""}`}
                    style={{ cursor: "pointer" }} onClick={() => setSelectedModule(m)}>
                  {m.name} ({m.progressPercentage}%)
                </li>
              ))}
            </ul>
          </div>
 
          {/* Content */}
          <div className="col-md-9">
            {selectedModule && (
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="card-title">{selectedModule.name}</h5>
                  {/\.(mp4|webm|ogg)$/i.test(selectedModule.filePath) ? (
                    <video
                      ref={videoRef}
                      src={getFileUrl(selectedModule.filePath)}
                      controls
                      className="w-100 mb-2"
                      style={{ maxHeight: 400 }}
                      onPause={handleVideoPause}
                      onEnded={handleVideoEnd}
                    />
                  ) : (
                    <a href={getFileUrl(selectedModule.filePath)} download className="btn btn-sm btn-outline-secondary mb-2">Download File</a>
                  )}
                  <p className="mt-2 text-muted">{selectedModule.description || "No description provided."}</p>
                </div>
              </div>
            )}
 
            {/* Course Progress */}
            <div className="mb-3">
              <label>Course Progress: {courseProgress.toFixed(0)}%</label>
              <div className="progress">
                <div className="progress-bar" role="progressbar" style={{ width: `${courseProgress}%` }} aria-valuenow={courseProgress} aria-valuemin="0" aria-valuemax="100" />
              </div>
            </div>
 
            {/* Feedback Form */}
            {isLast && !hasFeedback && (
              <div className="card shadow-sm p-3 mb-3">
                <h5>Leave Your Feedback</h5>
                {feedbackSuccess && <div className="alert alert-success">{feedbackSuccess}</div>}
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Your comments</label>
                    <textarea className="form-control" rows={3} value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <div>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={24} className="me-1" style={{ cursor: "pointer" }} color={n <= feedbackRating ? "#ffc107" : "#adb5bd"} onClick={() => setFeedbackRating(n)} />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={sendingFeedback}>{sendingFeedback ? "Sending…" : "Submit Feedback"}</button>
                </form>
              </div>
            )}
 
            {hasFeedback && <div className="alert alert-info mb-3">You have already submitted feedback for this course. Thank you!</div>}
 
            {allFeedbacks.length > 0 && (
              <div className="card shadow-sm p-3">
                <h5>All Feedbacks</h5>
                {allFeedbacks.map((f) => (
                  <div key={f.id} className="border-bottom mb-2 pb-2">
                    <span className="text-warning">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                    <p className="mb-0">{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
 
 