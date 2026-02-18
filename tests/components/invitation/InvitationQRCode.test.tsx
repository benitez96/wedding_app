// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitationQRCode from "@/components/invitation/InvitationQRCode";

vi.mock("next-qrcode", () => ({
  useQRCode: () => ({
    Canvas: ({ text }: { text: string }) => (
      <canvas data-testid="qr-canvas" data-text={text} />
    ),
  }),
}));

describe("InvitationQRCode", () => {
  describe("rendering", () => {
    it("renders the QR canvas with the tokenId as text", () => {
      render(<InvitationQRCode tokenId="tok-abc123" guestName="Ana" />);
      const canvas = screen.getByTestId("qr-canvas");
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveAttribute("data-text", "tok-abc123");
    });

    it("renders 'Código de acceso' label", () => {
      render(<InvitationQRCode tokenId="tok-abc123" guestName="Ana" />);
      expect(screen.getByText("Código de acceso")).toBeInTheDocument();
    });

    it("renders the scan instruction text", () => {
      render(<InvitationQRCode tokenId="tok-abc123" guestName="Ana" />);
      expect(
        screen.getByText("Mostrar al ingresar al evento"),
      ).toBeInTheDocument();
    });

    it("applies custom className to the root container", () => {
      const { container } = render(
        <InvitationQRCode
          tokenId="tok-abc123"
          guestName="Ana"
          className="my-qr-class"
        />,
      );
      expect(container.firstChild).toHaveClass("my-qr-class");
    });
  });

  describe("development token display", () => {
    it("shows tokenId in development mode", () => {
      vi.stubEnv("NODE_ENV", "development");
      render(<InvitationQRCode tokenId="tok-dev-secret" guestName="Ana" />);
      expect(screen.getByText("tok-dev-secret")).toBeInTheDocument();
      vi.unstubAllEnvs();
    });

    it("does not show tokenId in production mode", () => {
      vi.stubEnv("NODE_ENV", "production");
      render(<InvitationQRCode tokenId="tok-prod-secret" guestName="Ana" />);
      expect(screen.queryByText("tok-prod-secret")).not.toBeInTheDocument();
      vi.unstubAllEnvs();
    });
  });
});
