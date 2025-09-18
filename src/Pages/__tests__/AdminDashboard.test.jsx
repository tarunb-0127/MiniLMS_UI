import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../AdminDashboard";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { MemoryRouter } from "react-router-dom";

// 🔹 Mock dependencies
jest.mock("axios");
jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(),
}));
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Fake token
const token = "mocked.jwt.token";

beforeEach(() => {
  localStorage.setItem("token", token);
  jwtDecode.mockReturnValue({ sub: "admin123" });
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe("AdminDashboard (Passing Cases)", () => {
  test("renders loading spinner initially", () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("redirects to login if no token", () => {
    localStorage.removeItem("token");
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith("/admin-login", {
      state: { alert: "Please log in to view dashboard" },
    });
  });

  test("shows error message on API failure", async () => {
    axios.get.mockRejectedValueOnce({}); // Simulate failure
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(
        screen.getByText("Failed to load dashboard data.")
      ).toBeInTheDocument()
    );
  });
});
