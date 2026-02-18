// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TokenActionsCell from "@/components/InvitationDetailModal/TokenActionsCell";
import type { InvitationToken } from "@/types/invitation";

// Mock HeroUI components
const mockButton = vi.hoisted(() => vi.fn());
const mockTooltip = vi.hoisted(() => vi.fn());

vi.mock("@heroui/button", () => ({
  Button: mockButton,
}));

vi.mock("@heroui/tooltip", () => ({
  Tooltip: mockTooltip,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ExternalLink: () => <svg data-testid="external-link-icon" />,
  Ban: () => <svg data-testid="ban-icon" />,
  RotateCcw: () => <svg data-testid="rotate-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
}));

describe("TokenActionsCell", () => {
  const mockOnRevoke = vi.fn();
  const mockOnReactivate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnOpen = vi.fn();

  const activeToken: InvitationToken = {
    id: "token-1",
    isActive: true,
    isUsed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    invitationId: "inv-1",
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
    firstAccessAt: null,
    lastAccessAt: null,
    deviceId: null,
    userAgent: null,
    accessCount: 0,
  };

  const revokedToken: InvitationToken = {
    id: "token-2",
    isActive: false,
    isUsed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    invitationId: "inv-1",
    expiresAt: new Date(Date.now() + 86400000),
    firstAccessAt: null,
    lastAccessAt: null,
    deviceId: null,
    userAgent: null,
    accessCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Button component
    mockButton.mockImplementation(
      ({ children, onPress, isDisabled, isLoading, color, ...props }) => (
        <button
          onClick={onPress}
          disabled={isDisabled || isLoading}
          data-color={color}
          data-loading={isLoading}
          {...props}
        >
          {isLoading ? "Loading..." : children}
        </button>
      ),
    );

    // Mock Tooltip component - renders children and content as title
    mockTooltip.mockImplementation(({ children, content }) => (
      <div title={content}>{children}</div>
    ));
  });

  describe("Rendering", () => {
    it("renders all action buttons for active token", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTestId("external-link-icon")).toBeInTheDocument();
      expect(screen.getByTestId("ban-icon")).toBeInTheDocument(); // Revoke
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("renders reactivate button for revoked token", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTestId("external-link-icon")).toBeInTheDocument();
      expect(screen.getByTestId("rotate-icon")).toBeInTheDocument(); // Reactivate
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("ban-icon")).not.toBeInTheDocument(); // No revoke button
    });

    it("renders tooltips with correct labels", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTitle("Abrir invitación")).toBeInTheDocument();
      expect(screen.getByTitle("Revocar token")).toBeInTheDocument();
      expect(screen.getByTitle("Eliminar token")).toBeInTheDocument();
    });

    it("renders reactivate tooltip for revoked token", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTitle("Reactivar token")).toBeInTheDocument();
    });
  });

  describe("Open button", () => {
    it("calls onOpen with token id when clicked", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const openButton = screen
        .getByTestId("external-link-icon")
        .closest("button");
      await user.click(openButton!);

      expect(mockOnOpen).toHaveBeenCalledWith("token-1");
    });

    it("is disabled when token is not active", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const openButton = screen
        .getByTestId("external-link-icon")
        .closest("button");
      expect(openButton).toBeDisabled();
    });

    it("has primary color", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const openButton = screen
        .getByTestId("external-link-icon")
        .closest("button");
      expect(openButton).toHaveAttribute("data-color", "primary");
    });
  });

  describe("Revoke button (active token)", () => {
    it("calls onRevoke with token id when clicked", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const revokeButton = screen.getByTestId("ban-icon").closest("button");
      await user.click(revokeButton!);

      expect(mockOnRevoke).toHaveBeenCalledWith("token-1");
    });

    it("shows loading state when revoking", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="revoke"
        />,
      );

      // When loading, the button shows "Loading..." instead of icon
      const revokeButton = screen
        .getByTitle("Revocar token")
        .querySelector("button");
      expect(revokeButton).toHaveAttribute("data-loading", "true");
      expect(revokeButton).toBeDisabled();
      expect(revokeButton).toHaveTextContent("Loading...");
    });

    it("is disabled when any action is loading", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="delete"
        />,
      );

      const revokeButton = screen.getByTestId("ban-icon").closest("button");
      expect(revokeButton).toBeDisabled();
    });

    it("has warning color", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const revokeButton = screen.getByTestId("ban-icon").closest("button");
      expect(revokeButton).toHaveAttribute("data-color", "warning");
    });
  });

  describe("Reactivate button (revoked token)", () => {
    it("calls onReactivate with token id when clicked", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const reactivateButton = screen
        .getByTestId("rotate-icon")
        .closest("button");
      await user.click(reactivateButton!);

      expect(mockOnReactivate).toHaveBeenCalledWith("token-2");
    });

    it("shows loading state when reactivating", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="reactivate"
        />,
      );

      // When loading, the button shows "Loading..." instead of icon
      const reactivateButton = screen
        .getByTitle("Reactivar token")
        .querySelector("button");
      expect(reactivateButton).toHaveAttribute("data-loading", "true");
      expect(reactivateButton).toBeDisabled();
      expect(reactivateButton).toHaveTextContent("Loading...");
    });

    it("is disabled when any action is loading", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="delete"
        />,
      );

      const reactivateButton = screen
        .getByTestId("rotate-icon")
        .closest("button");
      expect(reactivateButton).toBeDisabled();
    });

    it("has success color", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const reactivateButton = screen
        .getByTestId("rotate-icon")
        .closest("button");
      expect(reactivateButton).toHaveAttribute("data-color", "success");
    });
  });

  describe("Delete button", () => {
    it("calls onDelete with token id when clicked (active token)", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      await user.click(deleteButton!);

      expect(mockOnDelete).toHaveBeenCalledWith("token-1");
    });

    it("calls onDelete with token id when clicked (revoked token)", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      await user.click(deleteButton!);

      expect(mockOnDelete).toHaveBeenCalledWith("token-2");
    });

    it("shows loading state when deleting", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="delete"
        />,
      );

      // When loading, the button shows "Loading..." instead of icon
      const deleteButton = screen
        .getByTitle("Eliminar token")
        .querySelector("button");
      expect(deleteButton).toHaveAttribute("data-loading", "true");
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveTextContent("Loading...");
    });

    it("is disabled when any action is loading", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="revoke"
        />,
      );

      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      expect(deleteButton).toBeDisabled();
    });

    it("has danger color", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const deleteButton = screen.getByTestId("trash-icon").closest("button");
      expect(deleteButton).toHaveAttribute("data-color", "danger");
    });
  });

  describe("Loading states", () => {
    it("only shows loading spinner on the active action", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="revoke"
        />,
      );

      const revokeButton = screen
        .getByTitle("Revocar token")
        .querySelector("button");
      const deleteButton = screen.getByTestId("trash-icon").closest("button");

      expect(revokeButton).toHaveAttribute("data-loading", "true");
      expect(revokeButton).toHaveTextContent("Loading...");
      expect(deleteButton).toHaveAttribute("data-loading", "false");
      expect(deleteButton).not.toHaveTextContent("Loading...");
    });

    it("disables all buttons when loading", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="revoke"
        />,
      );

      const buttons = screen.getAllByRole("button");
      // Open button is NOT disabled when token is active (only when !isActive)
      // But revoke and delete should be disabled due to isLoading
      expect(buttons.length).toBe(3);

      const openButton = screen
        .getByTestId("external-link-icon")
        .closest("button");
      const revokeButton = screen
        .getByTitle("Revocar token")
        .querySelector("button");
      const deleteButton = screen.getByTestId("trash-icon").closest("button");

      expect(openButton).not.toBeDisabled(); // Open button is not affected by isLoading
      expect(revokeButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    it("handles loading with no loadingAction specified", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction={null}
        />,
      );

      const revokeButton = screen.getByTestId("ban-icon").closest("button");
      const deleteButton = screen.getByTestId("trash-icon").closest("button");

      // Action buttons are disabled when isLoading=true, but none show loading spinner
      expect(revokeButton).toBeDisabled();
      expect(revokeButton).toHaveAttribute("data-loading", "false");
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveAttribute("data-loading", "false");
    });
  });

  describe("Conditional rendering", () => {
    it("renders Ban icon for active token", () => {
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTestId("ban-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("rotate-icon")).not.toBeInTheDocument();
    });

    it("renders RotateCcw icon for revoked token", () => {
      render(
        <TokenActionsCell
          token={revokedToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      expect(screen.getByTestId("rotate-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("ban-icon")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles multiple rapid clicks on same button", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
        />,
      );

      const revokeButton = screen.getByTestId("ban-icon").closest("button");

      await user.click(revokeButton!);
      await user.click(revokeButton!);
      await user.click(revokeButton!);

      expect(mockOnRevoke).toHaveBeenCalledTimes(3);
    });

    it("does not call callbacks when buttons are disabled", async () => {
      const user = userEvent.setup();
      render(
        <TokenActionsCell
          token={activeToken}
          onRevoke={mockOnRevoke}
          onReactivate={mockOnReactivate}
          onDelete={mockOnDelete}
          onOpen={mockOnOpen}
          isLoading={true}
          loadingAction="revoke"
        />,
      );

      const revokeButton = screen
        .getByTitle("Revocar token")
        .querySelector("button");
      await user.click(revokeButton!);

      expect(mockOnRevoke).not.toHaveBeenCalled();
    });
  });
});
