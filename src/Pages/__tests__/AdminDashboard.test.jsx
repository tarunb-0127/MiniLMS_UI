import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import { BrowserRouter } from "react-router-dom";

// Mock global fetch
global.fetch = jest.fn((url) => {
  if (url.includes("/api/course/all")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: "React Basics" }]),
    });
  }
  if (url.includes("/api/Notifications")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }
  return Promise.reject(new Error("Unknown API call"));
});

beforeEach(() => {
  localStorage.setItem("token", "mocked-token"); // ✅ simulate login
});

test("renders stats and charts when data loads successfully", async () => {
  render(
    <BrowserRouter>
      <AdminDashboard />
    </BrowserRouter>
  );

  // Wait for the element to appear
  expect(await screen.findByText(/Total Courses/i)).toBeInTheDocument();
  expect(await screen.findByText(/React Basics/i)).toBeInTheDocument();
});
