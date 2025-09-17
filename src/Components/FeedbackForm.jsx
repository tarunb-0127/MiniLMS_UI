// FeedbackForm.jsx
import React, { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";

export default function FeedbackForm({ courseId, learnerId, authHeaders, onFeedbackSubmit }) {
  const [feedbackMsg, setFeedbackMsg]         = useState("");
  const [feedbackRating, setFeedbackRating]   = useState(0);
  const [sending, setSending]                 = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [fieldErrors, setFieldErrors]         = useState({
    message: "",
    rating: "",
  });
  const [touched, setTouched] = useState({
    message: false,
    rating: false,
  });

  const validate = () => {
    const errors = {};
    if (!feedbackMsg.trim()) {
      errors.message = "Comments are required.";
    } else if (feedbackMsg.length < 10) {
      errors.message = "Comments must be at least 10 characters.";
    }

    if (feedbackRating < 1 || feedbackRating > 5) {
      errors.rating = "Please select a rating.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSuccess("");
    setTouched({ message: true, rating: true });

    if (!validate()) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("LearnerId", learnerId);
      formData.append("CourseId", courseId);
      formData.append("Message", feedbackMsg);
      formData.append("Rating", feedbackRating);

      const res = await axios.post(
        "http://localhost:5254/api/Feedbacks",
        formData,
        { headers: { ...authHeaders, "Content-Type": "multipart/form-data" } }
      );

      onFeedbackSubmit(res.data);
      setFeedbackMsg("");
      setFeedbackRating(0);
      setTouched({ message: false, rating: false });
      setFieldErrors({ message: "", rating: "" });
      setFeedbackSuccess("Feedback submitted successfully!");
    } catch (err) {
      console.error(err);
      setFeedbackSuccess("Failed to submit feedback.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card shadow-sm p-3 mb-3">
      <h5>Leave Your Feedback</h5>

      {feedbackSuccess && (
        <div className="alert alert-info">{feedbackSuccess}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Comments */}
        <div className="mb-3">
          <label className="form-label">Comments</label>
          <textarea
            className={`form-control ${
              touched.message && fieldErrors.message ? "is-invalid" : ""
            }`}
            rows={3}
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            onBlur={() => handleBlur("message")}
          />
          {touched.message && fieldErrors.message && (
            <div className="invalid-feedback">{fieldErrors.message}</div>
          )}
        </div>

        {/* Rating */}
        <div className="mb-3">
          <label className="form-label">Rating</label>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={24}
                style={{ cursor: "pointer" }}
                color={n <= feedbackRating ? "#ffc107" : "#adb5bd"}
                onClick={() => {
                  setFeedbackRating(n);
                  if (touched.rating) {
                    setFieldErrors((f) => {
                      const updated = { ...f };
                      delete updated.rating;
                      return updated;
                    });
                  }
                }}
                onBlur={() => handleBlur("rating")}
              />
            ))}
          </div>
          {touched.rating && fieldErrors.rating && (
            <div className="text-danger mt-1">{fieldErrors.rating}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={sending}
        >
          {sending ? "Sending…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
