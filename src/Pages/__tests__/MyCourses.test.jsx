// __tests__/MyCourses.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import MyCourses from "../MyCourses";

// Mock axios
jest.mock("axios");

// Mock jwt-decode
jest.mock("jwt-decode", () => jest.fn(() => ({ username: "Trainer1", UserId: "1" })));

// Mock localStorage
beforeEach(() => {
  localStorage.setItem("token", "mocked-token");
});
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("MyCourses Component - Positive Cases", () => {
  const mockCourses = [
    { id: 1, name: "React Basics", type: "Frontend", duration: 10, visibility: "Public", trainer: { id: 1 } },
    { id: 2, name: "NodeJS Advanced", type: "Backend", duration: 15, visibility: "Hidden", trainer: { id: 1 } },
  ];

  test("renders welcome message with decoded username", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Trainer1/i)).toBeInTheDocument();
    });
  });

  test("displays a list of courses fetched from API", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    for (const course of mockCourses) {
      await waitFor(() => {
        expect(screen.getByText(course.name)).toBeInTheDocument();
        expect(screen.getByText(`${course.duration} hrs • ${course.type}`)).toBeInTheDocument();
        expect(screen.getByText(course.visibility)).toBeInTheDocument();
      });
    }
  });

  test("can enter edit mode and pre-fill the form with course data", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    await waitFor(() => {
      const editButtons = screen.getAllByRole("button", { name: (n) => n.includes("Edit") });
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByPlaceholderText("Course Name").value).toBe("React Basics");
    expect(screen.getByPlaceholderText("Course Type").value).toBe("Frontend");
    expect(screen.getByPlaceholderText("Duration (hrs)").value).toBe("10");
  });

  test("can update a course successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });
    axios.put.mockResolvedValueOnce({ data: { ...mockCourses[0], name: "React Basics Updated" } });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    await waitFor(() => {
      const editButtons = screen.getAllByRole("button", { name: (n) => n.includes("Edit") });
      fireEvent.click(editButtons[0]);
    });

    const nameInput = screen.getByPlaceholderText("Course Name");
    fireEvent.change(nameInput, { target: { value: "React Basics Updated" } });

    fireEvent.click(screen.getByRole("button", { name: (n) => n.includes("Save") }));

    await waitFor(() => {
      expect(screen.getByText(/Course "React Basics Updated" updated/i)).toBeInTheDocument();
    });
  });

  test("can request takedown successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });

    // Mock global fetch for takedown
    global.fetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        headers: { entries: () => [] },
        text: () => Promise.resolve(JSON.stringify({ message: "Takedown requested" })),
      })
    );

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    window.prompt = jest.fn(() => "Some reason for takedown");

    await waitFor(() => {
      const takedownButtons = screen.getAllByRole("button", { name: (n) => n.includes("Request Takedown") });
      fireEvent.click(takedownButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText("Takedown requested")).toBeInTheDocument();
    });
  });

  test("shows modules & feedback links correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });

    render(
      <MemoryRouter>
        <MyCourses />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Use getByRole with name matcher for links containing icons
      const moduleLink = screen.getAllByRole("link").find((l) => l.textContent.includes("View Modules"));
      const feedbackLink = screen.getAllByRole("link").find((l) => l.textContent.includes("View Feedbacks"));

      expect(moduleLink).toBeInTheDocument();
      expect(feedbackLink).toBeInTheDocument();
    });
  });
});
