import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminLogin from "../AdminLogin";

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// mock fetch
global.fetch = jest.fn();

// mock localStorage
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("AdminLogin Component", () => {
  test("renders email and password inputs in step 1", () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Admin Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send OTP/i })).toBeDisabled();
  });

  test("shows validation errors when fields are empty", async () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/Admin Email/i);
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
    });
  });

  test("enables button when email and password are valid", () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Admin Email/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Admin Password/i), {
      target: { value: "123456" },
    });

    expect(screen.getByRole("button", { name: /Send OTP/i })).toBeEnabled();
  });

  test("goes to step 2 after successful login", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "OTP sent" }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Admin Email/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Admin Password/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter 6-digit OTP/i)).toBeInTheDocument();
    });
  });

  test("verifies OTP and navigates on success", async () => {
    // first call = login
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "OTP sent" }),
    });

    // second call = OTP
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "fake-token" }),
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    // step 1
    fireEvent.change(screen.getByPlaceholderText(/Admin Email/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Admin Password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter 6-digit OTP/i)).toBeInTheDocument();
    });

    // step 2
    fireEvent.change(screen.getByPlaceholderText(/Enter 6-digit OTP/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin-home");
      expect(localStorage.getItem("token")).toBe("fake-token");
    });
  });
});
