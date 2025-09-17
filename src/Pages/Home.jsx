import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HomePage = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:5254/api/Home')
      .then((response) => {
        setMessage(response.data.message);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load welcome message');
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="/">Mini LMS</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link active" href="/">Home</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/login">Login</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/register">Register</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container text-center mt-5">
        {loading && (
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <h1 className="display-5 fw-bold text-dark">{message}</h1>
            <p className="lead mt-3 text-muted">
              Mini Learning Management System is your all-in-one platform for delivering, managing, and tracking educational content.
              Whether you're a trainer creating courses, a learner exploring new skills, or an admin overseeing the system—
              Mini LMS makes it simple, efficient, and scalable.
            </p>
            <hr className="my-4" />
            <div className="row justify-content-center">
              <div className="col-md-8">
                <p className="text-secondary">
                  Ready to begin? Choose your path below to log in or create a new account.
                </p>
                <div className="d-flex justify-content-center gap-4 mt-4">
                  <a className="btn btn-success btn-lg px-4" href="/login" role="button">
                    Login
                  </a>
                  <a className="btn btn-warning btn-lg px-4" href="/register" role="button">
                    Register
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default HomePage;
