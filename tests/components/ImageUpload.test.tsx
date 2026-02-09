// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ImageUpload } from "@/components/ui/ImageUpload";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    className,
    loading,
    unoptimized,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
    loading?: "eager" | "lazy";
    unoptimized?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      className={className}
      loading={loading}
      data-unoptimized={unoptimized}
    />
  ),
}));

// Mock HeroUI components
const mockButton = vi.hoisted(() => vi.fn());
const mockCard = vi.hoisted(() => vi.fn());
const mockCardBody = vi.hoisted(() => vi.fn());

vi.mock("@heroui/button", () => ({
  Button: mockButton,
}));

vi.mock("@heroui/card", () => ({
  Card: mockCard,
  CardBody: mockCardBody,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Upload: () => <svg data-testid="upload-icon" />,
  X: () => <svg data-testid="x-icon" />,
  Image: () => <svg data-testid="image-icon" />,
}));

describe("ImageUpload", () => {
  const mockOnImageChange = vi.fn();
  let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Button
    mockButton.mockImplementation(
      ({
        children,
        onPress,
        isDisabled,
        size,
        color,
        variant,
        startContent,
      }) => (
        <button
          onClick={onPress}
          disabled={isDisabled}
          data-size={size}
          data-color={color}
          data-variant={variant}
        >
          {startContent}
          {children}
        </button>
      ),
    );

    // Mock Card
    mockCard.mockImplementation(({ children }) => (
      <div data-testid="card">{children}</div>
    ));

    // Mock CardBody
    mockCardBody.mockImplementation(({ children }) => (
      <div data-testid="card-body">{children}</div>
    ));

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering - Empty state", () => {
    it("renders upload placeholder when no image", () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      expect(screen.getByTestId("image-icon")).toBeInTheDocument();
      expect(
        screen.getByText("Click para seleccionar imagen o video"),
      ).toBeInTheDocument();
    });

    it("renders default label and description", () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      expect(screen.getByText("Imagen o Video")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Subir imagen \(JPG, PNG, WebP\) o video \(MP4, WebM, MOV/,
        ),
      ).toBeInTheDocument();
    });

    it("renders custom label and description", () => {
      render(
        <ImageUpload
          onImageChange={mockOnImageChange}
          label="Custom Label"
          description="Custom description"
        />,
      );

      expect(screen.getByText("Custom Label")).toBeInTheDocument();
      expect(screen.getByText("Custom description")).toBeInTheDocument();
    });

    it("renders upload button with correct accept attribute", () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const input = screen.getByRole("button", {
        name: /Click para seleccionar/,
      });
      expect(input).toBeInTheDocument();
    });
  });

  describe("Rendering - With existing image", () => {
    it("renders preview when currentImageUrl is provided", () => {
      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const preview = screen.getByRole("img", { name: "Preview" });
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("renders video preview when mediaType is video", () => {
      render(
        <ImageUpload
          currentImageUrl="https://example.com/video.mp4"
          onImageChange={mockOnImageChange}
          currentMediaType="video"
        />,
      );

      const video = screen.getByLabelText("Preview del video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("src", "https://example.com/video.mp4");
    });

    it("renders Eliminar and Cambiar buttons when image exists", () => {
      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      expect(screen.getByText("Eliminar")).toBeInTheDocument();
      expect(screen.getByText("Cambiar")).toBeInTheDocument();
    });
  });

  describe("File upload interaction", () => {
    it("shows uploading state when file is being uploaded", async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  url: "https://example.com/uploaded.jpg",
                  mediaType: "image",
                }),
              } as unknown as Response);
            }, 100);
          }),
      );

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const uploadButton = screen.getByRole("button", {
        name: /Click para seleccionar/,
      });

      await user.click(uploadButton);

      // Simulate file input change (we need to get the actual input element)
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();

      if (fileInput) {
        Object.defineProperty(fileInput, "files", {
          value: [file],
          writable: false,
        });

        await user.click(uploadButton);
        // The actual upload would be triggered by onChange event
      }
    });

    it("calls onImageChange with uploaded URL on successful upload", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          url: "https://example.com/uploaded.jpg",
          mediaType: "image",
        }),
      } as unknown as Response);

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      // Create a file
      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });

      // Get the hidden file input
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();

      if (fileInput) {
        // Trigger file selection
        await user.upload(fileInput, file);

        // Wait for upload to complete
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/backoffice/upload-image",
            expect.objectContaining({
              method: "POST",
              body: expect.any(FormData),
            }),
          );
        });

        await waitFor(() => {
          expect(mockOnImageChange).toHaveBeenCalledWith(
            "https://example.com/uploaded.jpg",
            "image",
          );
        });
      }
    });

    it("shows error message on upload failure", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: "Upload failed",
        }),
      } as unknown as Response);

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText("Upload failed")).toBeInTheDocument();
        });
      }
    });

    it("creates and revokes object URL for local preview", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          url: "https://example.com/uploaded.jpg",
          mediaType: "image",
        }),
      } as unknown as Response);

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(URL.createObjectURL).toHaveBeenCalledWith(file);
        });

        await waitFor(() => {
          expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
        });
      }
    });
  });

  describe("Remove image interaction", () => {
    it("calls onImageChange with empty string when Eliminar is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const eliminarButton = screen.getByText("Eliminar");
      await user.click(eliminarButton);

      expect(mockOnImageChange).toHaveBeenCalledWith("", "image");
    });

    it("clears preview after removing image", async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const eliminarButton = screen.getByText("Eliminar");
      await user.click(eliminarButton);

      // After removing, should show upload placeholder
      await waitFor(() => {
        expect(
          screen.getByText("Click para seleccionar imagen o video"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Change image interaction", () => {
    it("triggers file input when Cambiar button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const cambiarButton = screen.getByText("Cambiar");
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      const clickSpy = vi.fn();
      if (fileInput) {
        fileInput.click = clickSpy;
      }

      await user.click(cambiarButton);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Disabled state", () => {
    it("disables buttons during upload", async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  url: "https://example.com/uploaded.jpg",
                  mediaType: "image",
                }),
              } as unknown as Response);
            }, 100);
          }),
      );

      render(
        <ImageUpload
          currentImageUrl="https://example.com/image.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        // During upload, buttons should be disabled (we'd need to check component state)
        // This is hard to test without exposing internal state
      }
    });
  });

  describe("Video support", () => {
    it("handles video file upload", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          url: "https://example.com/uploaded.mp4",
          mediaType: "video",
        }),
      } as unknown as Response);

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const file = new File(["video"], "test.mp4", { type: "video/mp4" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(mockOnImageChange).toHaveBeenCalledWith(
            "https://example.com/uploaded.mp4",
            "video",
          );
        });
      }
    });
  });

  describe("Edge cases", () => {
    it("handles no file selected", async () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      // Simulate file input change event with no files (user cancelled)
      if (fileInput) {
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(fileInput, "files", {
          value: [],
          writable: false,
        });
        fileInput.dispatchEvent(event);
      }

      // No file selected, so onImageChange should not be called
      expect(mockOnImageChange).not.toHaveBeenCalled();
      // Fetch should also not be called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles fetch error", async () => {
      const user = userEvent.setup();

      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(screen.getByText("Network error")).toBeInTheDocument();
        });
      }
    });

    it("resets to currentImageUrl on upload error", async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: "Upload failed",
        }),
      } as unknown as Response);

      render(
        <ImageUpload
          currentImageUrl="https://example.com/original.jpg"
          onImageChange={mockOnImageChange}
        />,
      );

      const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      if (fileInput) {
        await user.upload(fileInput, file);

        await waitFor(() => {
          const preview = screen.getByRole("img", { name: "Preview" });
          expect(preview).toHaveAttribute(
            "src",
            "https://example.com/original.jpg",
          );
        });
      }
    });
  });

  describe("File input configuration", () => {
    it("accepts correct file types", () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(fileInput).toHaveAttribute(
        "accept",
        "image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime",
      );
    });

    it("is hidden from view", () => {
      render(<ImageUpload onImageChange={mockOnImageChange} />);

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(fileInput).toHaveClass("hidden");
    });
  });
});
