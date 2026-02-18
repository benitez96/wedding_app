// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FeedbackMessage, {
  MessageTypes,
  type FeedbackMessageProps,
} from "@/components/ui/FeedbackMessage";

describe("FeedbackMessage", () => {
  const defaultProps: FeedbackMessageProps = {
    type: MessageTypes.SUCCESS,
    message: "Test message",
  };

  describe("Rendering", () => {
    it("renders success message with text", () => {
      render(<FeedbackMessage {...defaultProps} />);

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("renders error message with text", () => {
      render(
        <FeedbackMessage type={MessageTypes.ERROR} message="Error occurred" />,
      );

      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<FeedbackMessage {...defaultProps} className="custom-class" />);

      const container = screen.getByText("Test message").parentElement;
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Success state", () => {
    it("applies success styles", () => {
      render(<FeedbackMessage type={MessageTypes.SUCCESS} message="Success" />);

      const container = screen.getByText("Success").parentElement;
      expect(container).toHaveClass("bg-success-50");
      expect(container).toHaveClass("border-success-200");
      expect(container).toHaveClass("text-success-700");
    });

    it("renders default success icon (CheckCircle)", () => {
      const { container } = render(
        <FeedbackMessage type={MessageTypes.SUCCESS} message="Success" />,
      );

      // CheckCircle renders as an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("w-4");
      expect(svg).toHaveClass("h-4");
      expect(svg).toHaveClass("flex-shrink-0");
    });

    it("renders custom icon when provided", () => {
      const customIcon = <span data-testid="custom-icon">✓</span>;

      render(
        <FeedbackMessage
          type={MessageTypes.SUCCESS}
          message="Success"
          icon={customIcon}
        />,
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("applies error styles", () => {
      render(<FeedbackMessage type={MessageTypes.ERROR} message="Error" />);

      const container = screen.getByText("Error").parentElement;
      expect(container).toHaveClass("bg-danger-50");
      expect(container).toHaveClass("border-danger-200");
      expect(container).toHaveClass("text-danger-700");
    });

    it("renders default error icon (AlertCircle)", () => {
      const { container } = render(
        <FeedbackMessage type={MessageTypes.ERROR} message="Error" />,
      );

      // AlertCircle renders as an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("w-4");
      expect(svg).toHaveClass("h-4");
      expect(svg).toHaveClass("flex-shrink-0");
    });

    it("renders custom icon when provided", () => {
      const customIcon = <span data-testid="custom-icon">✗</span>;

      render(
        <FeedbackMessage
          type={MessageTypes.ERROR}
          message="Error"
          icon={customIcon}
        />,
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("Layout structure", () => {
    it("includes base container classes", () => {
      render(<FeedbackMessage {...defaultProps} />);

      const container = screen.getByText("Test message").parentElement;
      expect(container).toHaveClass("p-3");
      expect(container).toHaveClass("rounded-lg");
      expect(container).toHaveClass("text-sm");
      expect(container).toHaveClass("flex");
      expect(container).toHaveClass("items-start");
      expect(container).toHaveClass("gap-2");
    });

    it("message has flex-1 class for proper spacing", () => {
      render(<FeedbackMessage {...defaultProps} />);

      const messageSpan = screen.getByText("Test message");
      expect(messageSpan).toHaveClass("flex-1");
    });
  });

  describe("Edge cases", () => {
    it("renders with empty message", () => {
      const { container } = render(
        <FeedbackMessage type={MessageTypes.SUCCESS} message="" />,
      );

      // Check container exists with proper classes
      const messageContainer = container.querySelector(".bg-success-50");
      expect(messageContainer).toBeInTheDocument();
    });

    it("renders with long message", () => {
      const longMessage = "A".repeat(500);
      render(
        <FeedbackMessage type={MessageTypes.SUCCESS} message={longMessage} />,
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("handles special characters in message", () => {
      const specialMessage = '<script>alert("xss")</script>';
      render(
        <FeedbackMessage
          type={MessageTypes.SUCCESS}
          message={specialMessage}
        />,
      );

      // React auto-escapes text content
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe("Props combinations", () => {
    it("renders with all props combined", () => {
      const customIcon = <span data-testid="custom">Icon</span>;

      render(
        <FeedbackMessage
          type={MessageTypes.ERROR}
          message="Custom message"
          icon={customIcon}
          className="my-class"
        />,
      );

      expect(screen.getByText("Custom message")).toBeInTheDocument();
      expect(screen.getByTestId("custom")).toBeInTheDocument();

      const container = screen.getByText("Custom message").parentElement;
      expect(container).toHaveClass("my-class");
      expect(container).toHaveClass("bg-danger-50");
    });

    it("works with minimal props (type + message only)", () => {
      render(<FeedbackMessage type={MessageTypes.SUCCESS} message="Minimal" />);

      expect(screen.getByText("Minimal")).toBeInTheDocument();
    });
  });
});
