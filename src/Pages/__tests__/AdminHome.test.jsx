import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminHome from "../AdminHome";

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// mock Navbar
jest.mock("../../Components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);

// mock fetch
global.fetch = jest.fn();

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("AdminHome Component", () => {
  test("redirects to login if no token is present", () => {
    render(
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/admin-login");
  });

  test("fetches and displays welcome message and user info when token exists", async () => {
    localStorage.setItem("token", "fake-token");

    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        message: "Welcome Admin",
        user: "Admin User",
      }),
    });

    render(
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome Admin")).toBeInTheDocument();
    });
  });

  test("renders dashboard cards and links", async () => {
    localStorage.setItem("token", "fake-token");

    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        message: "Dashboard Ready",
        user: "Admin",
      }),
    });

    render(
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Manage Users/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage Courses/i)).toBeInTheDocument();
      expect(screen.getByText(/Manage Trainers/i)).toBeInTheDocument();

      expect(screen.getByRole("link", { name: "Go" })).toBeInTheDocument();
    });
  });

  test("logout clears token and navigates to login", async () => {
    localStorage.setItem("token", "fake-token");

    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        message: "Welcome Back",
        user: "Admin",
      }),
    });

    render(
      <MemoryRouter>
        <AdminHome />
      </MemoryRouter>
    );

    const logoutButton = await screen.findByRole("button", { name: /Logout/i });
    fireEvent.click(logoutButton);

    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/admin-login");
  });
});
