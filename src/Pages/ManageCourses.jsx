  // src/pages/ManageCourses.jsx
  import React, { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import {
    BookOpen,
    Clock,
    Eye,
    Shield,
    AlertCircle,
    Inbox,
  } from "lucide-react";
  import Navbar from "../Components/Navbar";

  export default function ManageCourses() {
    const [courses, setCourses] = useState([]);
    const [takedownRequests, setTakedownRequests] = useState([]);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
      if (!token) {
        navigate("/admin-login", {
          state: { alert: "Please login to view course activity" },
        });
        return;
      }

      // 1) fetch all courses
      fetch("http://localhost:5254/api/course/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Unauthorized");
          setCourses(await res.json());
        })
        .catch(() =>
          navigate("/admin-login", {
            state: { alert: "Session expired. Please login again." },
          })
        );

      fetch("http://localhost:5254/api/Notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load notifications");
        const allNotifs = await res.json();
        console.log(allNotifs)

        // filter by your notification Type
        const takedowns = allNotifs.filter(
          (n) => n.type === "TakedownRequested"
        );

        // log the count of takedown notifications
        console.log("Takedown notification count:", takedowns.length);

        setTakedownRequests(takedowns);
      })
      .catch(() => setMessage("Failed to load takedown requests."));
  }, [navigate, token]);

    const totalCourses = courses.length;
    const totalTakedowns = takedownRequests.length;



  console.log("totalTakedowns (from state):", totalTakedowns);

    // approve a takedown: delete course + remove notification
    const handleApprove = async (courseId, notificationId) => {
      try {
        await fetch(`http://localhost:5254/api/course/${courseId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetch(
          `http://localhost:5254/api/Notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        setTakedownRequests((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      } catch (err) {
        console.error("Approval failed:", err);
        setMessage("Approval failed. Try again.");
      }
    };

    return (
      <>
      <Navbar/>
      <div className="container mt-5">
        <h2 className="text-center mb-4">
          <BookOpen className="me-2" />
          Course Overview
        </h2>

        {message && (
          <div className="alert alert-warning text-center">{message}</div>
        )}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm p-3">
              <h5>
                <Inbox className="me-2 text-primary" />
                Total Courses
              </h5>
              <h3 className="fw-bold">{totalCourses}</h3>
            </div>
          </div>

          <div className="col-md-6">
          <div
            className="card shadow-sm p-3"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/takedowns")}
          >
            <h5>
              <AlertCircle className="me-2 text-danger" />
              Takedown Requests
            </h5>
            <h3 className="fw-bold text-danger">{totalTakedowns}</h3>
          </div>
        </div>
        </div>

        <h5 className="mb-3">
          <Eye className="me-2" />
          Course List
        </h5>

        {courses.length === 0 ? (
          <p className="text-muted">No courses available.</p>
        ) : (
          <div className="list-group">
            {courses.map((course) => {
              const req = takedownRequests.find(
                (n) => n.courseId === course.id
              );
              return (
                <div
                  key={course.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div
                    style={{ cursor: "pointer", flex: 1 }}
                    onClick={() => navigate(`/admin/course/${course.id}`)}
                  >
                    <h6 className="mb-1">
                      <Shield className="me-2 text-primary" />
                      {course.name}
                    </h6>
                    <small className="text-muted">
                      <Clock className="me-1" />
                      {course.duration} hrs • {course.type} •{" "}
                      <span className="badge bg-secondary">
                        {course.visibility}
                      </span>
                    </small>
                  </div>

                  {req && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        handleApprove(course.id, req.id)
                      }
                    >
                      Approve
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
    );
  }
