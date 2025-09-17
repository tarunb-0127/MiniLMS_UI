import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [openModule, setOpenModule] = useState(null); // currently expanded module

  useEffect(() => {
    // Fetch course info
    axios
      .get(`http://localhost:5254/api/Courses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setCourse(res.data));

    // Check enrollment and fetch modules
    axios
      .get("http://localhost:5254/api/Enrollments/my-enrollments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const isEnrolled = res.data.some((e) => e.courseId === parseInt(id));
        setEnrolled(isEnrolled);

        if (isEnrolled) {
          axios
            .get(`http://localhost:5254/api/Module/course/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
            .then((res) => setModules(res.data));
        }
      });
  }, [id]);

  if (!course) return <p>Loading course...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: "800px" }}>
      <div className="card shadow-sm rounded-3">
        <div className="card-body">
          <h3>{course.name}</h3>
          <p>Type: {course.type}</p>
          <p>Duration: {course.duration} hrs</p>
          <p>Trainer ID: {course.trainerId}</p>

          {!enrolled ? (
            <div className="alert alert-warning mt-3">
              You are not enrolled in this course. Please enroll to access
              modules.
            </div>
          ) : (
            <>
              <h5 className="mt-4">Modules</h5>
              {modules.length === 0 ? (
                <p>No modules added yet.</p>
              ) : (
                <div className="accordion" id="modulesAccordion">
                  {modules.map((m) => (
                    <div className="accordion-item" key={m.id}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${
                            openModule === m.id ? "" : "collapsed"
                          }`}
                          type="button"
                          onClick={() =>
                            setOpenModule(openModule === m.id ? null : m.id)
                          }
                        >
                          {m.name} – {m.difficulty || "N/A"}
                        </button>
                      </h2>
                      <div
                        className={`accordion-collapse collapse ${
                          openModule === m.id ? "show" : ""
                        }`}
                      >
                        <div className="accordion-body">
                          <p>{m.description || "No description available."}</p>
                          {m.filePath && (
                            <a
                              href={`http://localhost:5254${m.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              Download File
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
