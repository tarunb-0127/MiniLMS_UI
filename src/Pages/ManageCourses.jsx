// src/pages/ManageCourses.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BookOpen,
  Clock,
  Eye,
  Shield,
  AlertCircle,
  Inbox,
  Layers,
} from "lucide-react";
import Navbar from "../Components/Navbar";

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [takedownRequests, setTakedownRequests] = useState([]);
  const [modulesCountMap, setModulesCountMap] = useState({});
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

    async function loadData() {
      try {
        // 1) fetch all courses
        const coursesRes = await axios.get(
          "http://localhost:5254/api/Course/all",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCourses(coursesRes.data);

        // 2) fetch module counts for each course
        const countMap = {};
        await Promise.all(
          coursesRes.data.map(async (c) => {
            const modsRes = await axios.get(
              `http://localhost:5254/api/Module/course/${c.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            countMap[c.id] = modsRes.data.length;
          })
        );
        setModulesCountMap(countMap);
      } catch (err) {
        console.error("Failed to load courses or modules:", err);
        navigate("/admin-login", {
          state: { alert: "Session expired. Please login again." },
        });
        return;
      }

      try {
        // 3) fetch notifications
        const notifsRes = await axios.get(
          "http://localhost:5254/api/Notifications",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const allNotifs = notifsRes.data;
        const takedowns = allNotifs.filter(
          (n) => n.type === "TakedownRequested"
        );
        setTakedownRequests(takedowns);
      } catch {
        setMessage("Failed to load takedown requests.");
      }
    }

    loadData();
  }, [navigate, token]);

  const totalCourses = courses.length;
  const totalTakedowns = takedownRequests.length;

  // approve a takedown: delete course + remove notification
  const handleApprove = async (courseId, notificationId) => {
    try {
      await axios.delete(
        `http://localhost:5254/api/Course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.delete(
        `http://localhost:5254/api/Notifications/${notificationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setTakedownRequests((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      // also remove from modulesCountMap
      setModulesCountMap((prev) => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
    } catch (err) {
      console.error("Approval failed:", err);
      setMessage("Approval failed. Try again.");
    }
  };

  return (
    <>
      <Navbar />
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
              const modCount = modulesCountMap[course.id] ?? 0;
              return (
                <div
                  key={course.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div
                    style={{ cursor: "pointer", flex: 1 }}
                    onClick={() => navigate(`/admin/course/${course.id}`)}
                  >
                    <h6 className="mb-1 d-flex align-items-center">
                      <Shield className="me-2 text-primary" />
                      {course.name}
                    </h6>
                    <small className="text-muted">
                      <Clock className="me-1" />
                      {course.duration} hrs • {course.type} •{" "}
                      <span className="badge bg-secondary">
                        {course.visibility}
                      </span>{" "}
                      • <Layers className="me-1"/> Modules: {modCount}
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
