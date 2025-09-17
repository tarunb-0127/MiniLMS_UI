import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TakedownManagement from "../TakedownManagement";
import axios from "axios";

// mock Navbar
jest.mock("../../Components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem("token", "fake-jwt"); // mock token
});

describe("TakedownManagement Component (success cases)", () => {
  test("renders with no requests", async () => {
    axios.create.mockReturnValue({
      get: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 1, name: "React Basics" }] }) // /Course/all
        .mockResolvedValueOnce({ data: [] }), // /Notifications
    });

    render(
      <MemoryRouter>
        <TakedownManagement />
      </MemoryRouter>
    );

    expect(await screen.findByText("No pending takedown requests.")).toBeInTheDocument();
  });

  test("renders takedown requests", async () => {
    axios.create.mockReturnValue({
      get: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 1, name: "React Basics" }] }) // /Course/all
        .mockResolvedValueOnce({
          data: [
            {
              id: 10,
              type: "TakedownRequested",
              message: "Request for takedown of 'React Basics'",
              reason: "Outdated content",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      delete: jest.fn(),
    });

    render(
      <MemoryRouter>
        <TakedownManagement />
      </MemoryRouter>
    );

    expect(await screen.findByText("Course: React Basics")).toBeInTheDocument();
    expect(screen.getByText(/Reason:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reject/i })).toBeInTheDocument();
  });

  test("approves takedown successfully", async () => {
    const mockDelete = jest.fn().mockResolvedValue({});
    axios.create.mockReturnValue({
      get: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 1, name: "React Basics" }] }) // /Course/all
        .mockResolvedValueOnce({
          data: [
            {
              id: 10,
              type: "TakedownRequested",
              message: "Request for takedown of 'React Basics'",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      delete: mockDelete,
    });

    render(
      <MemoryRouter>
        <TakedownManagement />
      </MemoryRouter>
    );

    const approveBtn = await screen.findByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/Course/1");
      expect(screen.getByText("Course deleted and takedown approved.")).toBeInTheDocument();
    });
  });

  test("rejects takedown successfully", async () => {
    axios.create.mockReturnValue({
      get: jest
        .fn()
        .mockResolvedValueOnce({ data: [{ id: 1, name: "React Basics" }] }) // /Course/all
        .mockResolvedValueOnce({
          data: [
            {
              id: 20,
              type: "TakedownRequested",
              message: "Request for takedown of 'React Basics'",
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      delete: jest.fn(),
    });

    render(
      <MemoryRouter>
        <TakedownManagement />
      </MemoryRouter>
    );

    const rejectBtn = await screen.findByRole("button", { name: /Reject/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText("Takedown request rejected.")).toBeInTheDocument();
    });
  });
});
