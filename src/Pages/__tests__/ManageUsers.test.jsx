import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ManageUsers from "../ManageUsers";
import axios from "axios";

// mock Navbar
jest.mock("../../Components/Navbar", () => () => <div data-testid="navbar">Navbar</div>);

jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ManageUsers Component (success cases)", () => {
  test("renders form and table correctly", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    expect(await screen.findByText("Manage Users")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter user email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add User" })).toBeInTheDocument();
  });

  test("fetches and displays users", async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        { id: 1, username: "alice", email: "alice@example.com", role: "Learner", isActive: true },
      ],
    });

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Learner")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  test("adds a new user successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: [] }); // initial fetch
    axios.post.mockResolvedValueOnce({ data: {} });
    axios.get.mockResolvedValueOnce({ data: [] }); // refetch after add

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "bob" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter user email"), {
      target: { value: "bob@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add User" }));

    expect(await screen.findByText("✅ User added successfully!")).toBeInTheDocument();
  });

  test("edits and updates an existing user successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, username: "alice", email: "alice@example.com", role: "Learner", isActive: true }],
    });
    axios.put.mockResolvedValueOnce({ data: {} });
    axios.get.mockResolvedValueOnce({ data: [] }); // refetch after update

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    const editButton = await screen.findByTitle("Edit User");
    fireEvent.click(editButton);

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "alice-updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update User" }));

    expect(await screen.findByText("✅ User updated successfully!")).toBeInTheDocument();
  });

  test("sends invite successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, username: "alice", email: "alice@example.com", role: "Learner", isActive: true }],
    });
    axios.post.mockResolvedValueOnce({ data: {} });

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    const inviteBtn = await screen.findByTitle("Send Invite");
    fireEvent.click(inviteBtn);

    expect(await screen.findByText("📩 Invite/setup link sent successfully!")).toBeInTheDocument();
  });

  test("toggles user status successfully", async () => {
    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, username: "alice", email: "alice@example.com", role: "Learner", isActive: true }],
    });
    axios.patch.mockResolvedValueOnce({ data: { message: "User deactivated" } });
    axios.get.mockResolvedValueOnce({ data: [] }); // refetch after toggle

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    const toggleBtn = await screen.findByTitle("Deactivate");
    fireEvent.click(toggleBtn);

    expect(await screen.findByText("User deactivated")).toBeInTheDocument();
  });

  test("deletes a user successfully", async () => {
    window.confirm = jest.fn(() => true); // confirm deletion
    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, username: "alice", email: "alice@example.com", role: "Learner", isActive: true }],
    });
    axios.delete.mockResolvedValueOnce({ data: {} });
    axios.get.mockResolvedValueOnce({ data: [] }); // refetch after delete

    render(
      <MemoryRouter>
        <ManageUsers />
      </MemoryRouter>
    );

    const deleteBtn = await screen.findByTitle("Delete User");
    fireEvent.click(deleteBtn);

    expect(await screen.findByText("🗑️ User deleted successfully.")).toBeInTheDocument();
  });
});
