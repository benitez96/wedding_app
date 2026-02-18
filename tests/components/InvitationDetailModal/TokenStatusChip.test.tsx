// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TokenStatusChip from "@/components/InvitationDetailModal/TokenStatusChip";
import type { InvitationToken } from "@/types/invitation";

const BASE_TOKEN: InvitationToken = {
  id: "tok-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  isUsed: false,
  expiresAt: new Date(Date.now() + 86400000),
  firstAccessAt: null,
  lastAccessAt: null,
  deviceId: null,
  userAgent: null,
  accessCount: 0,
  invitationId: "inv-123",
};

describe("TokenStatusChip", () => {
  it("renders 'Disponible' when active and not used", () => {
    render(
      <TokenStatusChip
        token={{ ...BASE_TOKEN, isActive: true, isUsed: false }}
      />,
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders 'Usado' when active and used", () => {
    render(
      <TokenStatusChip
        token={{ ...BASE_TOKEN, isActive: true, isUsed: true }}
      />,
    );
    expect(screen.getByText("Usado")).toBeInTheDocument();
  });

  it("renders 'Revocado' when not active", () => {
    render(
      <TokenStatusChip
        token={{ ...BASE_TOKEN, isActive: false, isUsed: false }}
      />,
    );
    expect(screen.getByText("Revocado")).toBeInTheDocument();
  });

  it("renders 'Revocado' when not active even if isUsed is true", () => {
    // isActive check takes priority over isUsed
    render(
      <TokenStatusChip
        token={{ ...BASE_TOKEN, isActive: false, isUsed: true }}
      />,
    );
    expect(screen.getByText("Revocado")).toBeInTheDocument();
  });

  it("does not render 'Usado' when token is revoked", () => {
    render(
      <TokenStatusChip
        token={{ ...BASE_TOKEN, isActive: false, isUsed: true }}
      />,
    );
    expect(screen.queryByText("Usado")).not.toBeInTheDocument();
  });
});
