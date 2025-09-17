import React from "react";
import { useNavigate } from "react-router-dom";
 
const LogoutButton = () => {
  const navigate = useNavigate();
 
  const handleLogout = () => {
    // Clear stored session data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
 
    // Redirect to login page
    navigate("/login");
  };
 
  return (
    <button
      className="btn btn-danger"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};
 
export default LogoutButton;
 