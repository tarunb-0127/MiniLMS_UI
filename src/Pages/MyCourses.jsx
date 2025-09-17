import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import axios from "axios";
import {
  BookOpen,
  Pencil,
  AlertTriangle,
  Clock,
  Shield,
  Save,
  X,
  Layers,
} from "lucide-react";
import Navbar from "../Components/Navbar";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [username, setUsername] = useState("Trainer");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    duration: "",
    visibility: "Public",
  });

  const navigate = useNavigate();
  const rawToken = localStorage.getItem("token");
  const token = rawToken?.trim();

  // 1) Validate token & fetch courses (with debug logs)
  useEffect(() => {
    console.log("rawToken from localStorage:", rawToken);
    console.log("trimmed token:", token);

    if (!token) {
      console.warn("No token found – redirecting to login");
      navigate("/login", {
        state: { alert: "Please login as Trainer." },
      });
      return;
    }

    let decoded;
    try {
      decoded = jwtDecode(token);
      console.log("Decoded JWT payload:", decoded);
      setUsername(decoded.username || "Trainer");
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      localStorage.clear();
      navigate("/trainer-login", {
        state: { alert: "Session invalid; please login again." },
      });
      return;
    }

    fetchCourses(decoded.UserId || decoded.userId || decoded.sub);
  }, [navigate, rawToken, token]);

  // 2) Fetch all, then filter by this trainer
  const fetchCourses = async (trainerId) => {
    try {
      console.log("Fetching courses with header Authorization: Bearer", token);
      const res = await axios.get("http://localhost:5254/api/Course/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("All courses from API:", res.data);

      const mine = res.data.filter(
        (c) => c.trainer?.id?.toString() === trainerId?.toString()
      );
      console.log("Filtered my courses:", mine);
      setCourses(mine);
    } catch (err) {
      console.error("Error loading courses:", err);
      setMessage("Failed to load courses.");
    }
  };

  // 3) Start editing a course
  const handleEdit = (course) => {
    setEditingId(course.id);
    setFormData({
      name: course.name || "",
      type: course.type || "",
      duration: course.duration || "",
      visibility: course.visibility || "Public",
    });
    setMessage("");
  };

  // 4) Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", type: "", duration: "", visibility: "Public" });
    setMessage("");
  };

  // 5) Submit update via PUT /api/Course/{id}
  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log("Updating course ID:", editingId, "with payload:", formData);

    try {
      const res = await axios.put(
        `http://localhost:5254/api/Course/${editingId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Update response:", res.data);

      setMessage(`Course "${res.data.name}" updated.`);
      handleCancel();

      // Refresh the list
      const decoded = jwtDecode(token);
      fetchCourses(decoded.UserId || decoded.userId || decoded.sub);
    } catch (err) {
      console.error("Update failed:", err);
      setMessage(err.response?.data?.message || err.message || "Update failed.");
    }
  };

  // inside MyCourses.jsx

const handleTakedown = async (courseId) => {
  const reason = prompt("Reason for takedown request:");
  if (!reason) return;

  // 1) Build & log the payload
  const payload = { courseId, reason };
  console.log("🏷 Payload object:   ", payload);
  console.log("🔗 Payload JSON:     ", JSON.stringify(payload));

  // 2) Prepare fetch options & log them
  const requestOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
  console.log("🚀 Fetch options:    ", requestOptions);

  try {
    // 3) Send request
    const response = await fetch(
      "http://localhost:5254/api/Course/request-takedown",
      requestOptions
    );

    // 4) Log status & headers
    console.log(`📶 Response: ${response.status} ${response.statusText}`);
    console.log("📑 Headers:", Array.from(response.headers.entries()));

    // 5) Read the body exactly once as text
    const raw = await response.text();
    console.log("📬 Raw response body:", raw);

    // 6) Try to parse JSON, fallback to raw text
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
    console.log("🔍 Parsed response:", data);

    // 7) Update UI
    const userMessage = data.message || response.statusText;
    setMessage(userMessage);
  } catch (err) {
    console.error("❌ Network error:", err);
    setMessage("Network error sending takedown request.");
  }
};


  return (
    <>
    <Navbar/>
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h2 className="mb-0 d-flex align-items-center">
          <BookOpen className="me-2" />
          My Courses
        </h2>
        <span className="text-muted">Welcome, {username}!</span>
      </div>

      {message && <div className="alert alert-info text-center">{message}</div>}

      {courses.length === 0 ? (
        <p className="text-muted">You haven’t created any courses yet.</p>
      ) : (
        <div className="row g-4">
          {courses.map((course) => (
            <div key={course.id} className="col-sm-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  {editingId === course.id ? (
                    // -- Edit Form --
                    <form onSubmit={handleUpdate}>
                      <div className="mb-2">
                        <input
                          name="name"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Course Name"
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <input
                          name="type"
                          className="form-control"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          placeholder="Course Type"
                        />
                      </div>
                      <div className="mb-2">
                        <input
                          name="duration"
                          type="number"
                          className="form-control"
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration: e.target.value,
                            })
                          }
                          placeholder="Duration (hrs)"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <select
                          name="visibility"
                          className="form-select"
                          value={formData.visibility}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              visibility: e.target.value,
                            })
                          }
                        >
                          <option value="Public">Public</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                      </div>
                      <div className="d-flex justify-content-between">
                        <button type="submit" className="btn btn-success btn-sm">
                          <Save size={16} className="me-1" />
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={handleCancel}
                        >
                          <X size={16} className="me-1" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // -- Display Card --
                    <>
                      <h5 className="card-title d-flex align-items-center">
                        <Shield className="me-2 text-primary" />
                        {course.name}
                      </h5>
                      <p className="card-text text-muted">
                        <Clock className="me-1" />
                        {course.duration} hrs • {course.type || "N/A"}
                        <br />
                        <span className="badge bg-secondary mt-2">
                          {course.visibility}
                        </span>
                      </p>
                      <div className="d-flex justify-content-between mt-3">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(course)}
                        >
                          <Pencil size={16} className="me-1" />
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleTakedown(course.id)}
                        >
                          <AlertTriangle size={16} className="me-1" />
                          Request Takedown
                        </button>
                      </div>
                    <Link
  to={`/trainer/courses/${course.id}/modules`}
  className="btn btn-sm btn-outline-secondary mt-2 w-100"
>
  <Layers size={16} className="me-1" />
  View Modules
</Link>
<Link
  to={`/trainer/courses/${course.id}/feedbacks`}
  className="btn btn-sm btn-outline-info mt-2 w-100"
>
  <BookOpen size={16} className="me-1" />
  View Feedbacks
</Link>

                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
