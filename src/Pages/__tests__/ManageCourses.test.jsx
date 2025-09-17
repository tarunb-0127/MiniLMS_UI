import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManageCourses from "../ManageCourses";

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// mock Navbar
jest.mock("../../Components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// mock fetch globally
global.fetch = jest.fn();

describe("ManageCourses Component (success cases)", () => {
  test("redirects to login if no token", () => {
    render(
      <MemoryRouter>
        <ManageCourses />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/admin-login", {
      state: { alert: "Please login to view course activity" },
    });
  });

  test("renders courses and takedown requests correctly", async () => {
    localStorage.setItem("token", "fake-token");

    // first fetch: courses
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: "React Basics", duration: 10, type: "Tech", visibility: "Public" },
          ]),
      })
    );

    // second fetch: notifications
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 101, type: "TakedownRequested", courseId: 1 },
          ]),
      })
    );

    render(
      <MemoryRouter>
        <ManageCourses />
      </MemoryRouter>
    );

    // wait for course to appear
    await waitFor(() => {
      expect(screen.getByText("React Basics")).toBeInTheDocument();
    });

    // total counts
    expect(screen.getByText("Total Courses")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByText("Takedown Requests")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // course details
    expect(screen.getByText(/10 hrs/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech/i)).toBeInTheDocument();
    expect(screen.getByText(/Public/i)).toBeInTheDocument();

    // approve button should appear
    expect(screen.getByText("Approve")).toBeInTheDocument();
  });

  test("clicking Approve removes course and request", async () => {
    localStorage.setItem("token", "fake-token");

    // courses
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([{ id: 1, name: "React Basics", duration: 10, type: "Tech", visibility: "Public" }]),
      })
    );

    // notifications
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 101, type: "TakedownRequested", courseId: 1 }]),
      })
    );

    // approve course delete
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    // delete notification
    fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );

    render(
      <MemoryRouter>
        <ManageCourses />
      </MemoryRouter>
    );

    // wait for approve button
    const approveBtn = await screen.findByText("Approve");
    fireEvent.click(approveBtn);

    // course removed after approve
    await waitFor(() => {
      expect(screen.queryByText("React Basics")).not.toBeInTheDocument();
    });
  });
});
