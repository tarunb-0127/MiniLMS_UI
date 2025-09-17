// FeedbackForm.jsx
import React, { useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";

export default function FeedbackForm({ courseId, learnerId, authHeaders, onFeedbackSubmit }) {
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackRating) return alert("Please select a rating.");

    setSending(true);
    setFeedbackSuccess("");

    try {
      const formData = new FormData();
      formData.append("LearnerId", learnerId);
      formData.append("CourseId", courseId);
      formData.append("Message", feedbackMsg);
      formData.append("Rating", feedbackRating);

      const res = await axios.post(
        "http://localhost:5254/api/Feedbacks", // correct URL
        formData,
        { headers: { ...authHeaders, "Content-Type": "multipart/form-data" } }
      );

      onFeedbackSubmit(res.data); // update parent state
      setFeedbackMsg("");
      setFeedbackRating(0);
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
      {feedbackSuccess && <div className="alert alert-info">{feedbackSuccess}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Comments</label>
          <textarea
            className="form-control"
            rows={3}
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Rating</label>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={24}
                style={{ cursor: "pointer" }}
                color={n <= feedbackRating ? "#ffc107" : "#adb5bd"}
                onClick={() => setFeedbackRating(n)}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Sending…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
