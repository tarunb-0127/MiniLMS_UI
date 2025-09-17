import React, { useEffect, useState } from "react";
import axios from "axios";
import { Send, Trash2, UserX, UserCheck, Edit } from "lucide-react";
import Navbar from "../Components/Navbar";

export default function ManageUsers() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Learner");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [editingUserId, setEditingUserId] = useState(null); // ✅ Track user being edited

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5254/api/Users");
      const usersWithCorrectProps = response.data.map((u) => ({
        ...u,
        is_active: u.isActive,
        username: u.username || "",
      }));
      setUsers(usersWithCorrectProps);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateForm = () => {
    let newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!role) {
      newErrors.role = "Role is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTempPassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      formData.append("role", role);

      if (editingUserId) {
        // ✅ Update existing user
        await axios.put(`http://localhost:5254/api/Users/${editingUserId}`, formData);
        setMessage("✅ User updated successfully!");
      } else {
        // ✅ Add new user
        const tempPassword = generateTempPassword();
        formData.append("password", tempPassword);
        await axios.post("http://localhost:5254/api/auth/register", formData);
        setMessage("✅ User added successfully!");
      }

      // Reset form
      setUsername("");
      setEmail("");
      setRole("Learner");
      setErrors({});
      setEditingUserId(null);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "❌ Error saving user.");
    }
  };

  const handleEditUser = (user) => {
    setUsername(user.username);
    setEmail(user.email);
    setRole(user.role);
    setEditingUserId(user.id);
    setMessage("");
    setErrors({});
  };

  const handleSendInvite = async (userId) => {
    try {
      await axios.post(
        "http://localhost:5254/api/auth/password-reset/request",
        new URLSearchParams({ userId })
      );
      setMessage("📩 Invite/setup link sent successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "❌ Error sending invite.");
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const response = await axios.patch(`http://localhost:5254/api/Users/${id}/toggle`);
      setMessage(response.data.message);
      fetchUsers();
    } catch {
      setMessage("❌ Error updating user status.");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:5254/api/Users/${id}`);
      setMessage("🗑️ User deleted successfully.");
      fetchUsers();
    } catch {
      setMessage("❌ Error deleting user.");
    }
  };

  return (
    <>
    <Navbar/>
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Manage Users</h2>

              {/* Add/Edit User Form */}
              <form onSubmit={handleAddOrUpdateUser} className="row g-2 g-md-3 mb-4">
                <div className="col-12 col-md-4">
                  <input
                    type="text"
                    className={`form-control ${errors.username ? "is-invalid" : ""}`}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                </div>

                <div className="col-12 col-md-4">
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Enter user email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="col-12 col-md-2">
                  <select
                    className={`form-select ${errors.role ? "is-invalid" : ""}`}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Learner">Learner</option>
                    <option value="Trainer">Trainer</option>
                  </select>
                  {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                </div>

                <div className="col-12 col-md-2 d-grid">
                  <button type="submit" className="btn btn-primary">
                    {editingUserId ? "Update User" : "Add User"}
                  </button>
                </div>
              </form>

              {message && <div className="alert alert-info text-center">{message}</div>}

              {/* Users Table */}
              <div className="table-responsive">
                <table className="table table-striped table-bordered align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>
                            <span
                              className={`badge ${u.is_active ? "bg-success" : "bg-secondary"}`}
                            >
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm btn-primary rounded-2"
                                onClick={() => handleSendInvite(u.id)}
                                title="Send Invite"
                              >
                                <Send size={16} />
                              </button>
                              <button
                                className={`btn btn-sm rounded-2 ${u.is_active ? "btn-warning" : "btn-success"}`}
                                onClick={() => toggleUserStatus(u.id)}
                                title={u.is_active ? "Deactivate" : "Activate"}
                              >
                                {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                              </button>
                              <button
                                className="btn btn-sm btn-danger rounded-2"
                                onClick={() => deleteUser(u.id)}
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                className="btn btn-sm btn-info rounded-2"
                                onClick={() => handleEditUser(u)}
                                title="Edit User"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
