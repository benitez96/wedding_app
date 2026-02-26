import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSlugPreview, generateSlugPreview } from "@/hooks/useSlugPreview";

describe("generateSlugPreview", () => {
  it("should generate slug from text", () => {
    expect(generateSlugPreview("Boda de Ana y Juan")).toBe(
      "boda-de-ana-y-juan",
    );
  });

  it("should handle accents", () => {
    expect(generateSlugPreview("Fiesta de José")).toBe("fiesta-de-jose");
  });

  it("should handle special characters", () => {
    expect(generateSlugPreview("Evento 2024!!!")).toBe("evento-2024");
  });

  it("should return empty string for empty input", () => {
    expect(generateSlugPreview("")).toBe("");
    expect(generateSlugPreview("   ")).toBe("");
  });

  it("should limit to 100 characters", () => {
    const longText = "a".repeat(150);
    expect(generateSlugPreview(longText).length).toBe(100);
  });
});

describe("useSlugPreview", () => {
  it("should initialize with initial values", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Mi Evento", "mi-evento"),
    );

    expect(result.current.eventName).toBe("Mi Evento");
    expect(result.current.slugPreview).toBe("mi-evento");
    expect(result.current.nameChanged).toBe(false);
    expect(result.current.slugWillChange).toBe(false);
  });

  it("should update slug preview when name changes", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Mi Evento", "mi-evento"),
    );

    act(() => {
      result.current.setEventName("Nuevo Evento");
    });

    expect(result.current.eventName).toBe("Nuevo Evento");
    expect(result.current.slugPreview).toBe("nuevo-evento");
    expect(result.current.nameChanged).toBe(true);
    expect(result.current.slugWillChange).toBe(true);
  });

  it("should detect when name changed but slug stays same", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Mi Evento", "mi-evento"),
    );

    // Cambiar a un nombre que genera el mismo slug
    act(() => {
      result.current.setEventName("MI EVENTO");
    });

    expect(result.current.nameChanged).toBe(true);
    expect(result.current.slugWillChange).toBe(false); // Slug no cambia
  });

  it("should handle accents in preview", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Evento Original", "evento-original"),
    );

    act(() => {
      result.current.setEventName("Fiesta de José y María");
    });

    expect(result.current.slugPreview).toBe("fiesta-de-jose-y-maria");
    expect(result.current.slugWillChange).toBe(true);
  });

  it("should trim whitespace when checking if name changed", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Mi Evento", "mi-evento"),
    );

    act(() => {
      result.current.setEventName("  Mi Evento  ");
    });

    expect(result.current.nameChanged).toBe(false); // Trimmed es igual
  });

  it("should fall back to current slug when preview is empty", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Mi Evento", "mi-evento"),
    );

    act(() => {
      result.current.setEventName("   "); // Empty after trim
    });

    expect(result.current.slugPreview).toBe("mi-evento"); // Fallback
  });

  it("should handle special characters in name", () => {
    const { result } = renderHook(() =>
      useSlugPreview("Evento Original", "evento-original"),
    );

    act(() => {
      result.current.setEventName("Fiesta 2024!!! @#$");
    });

    expect(result.current.slugPreview).toBe("fiesta-2024");
  });

  it("should update when initial slug changes (edge case)", () => {
    const { result, rerender } = renderHook(
      ({ name, slug }) => useSlugPreview(name, slug),
      {
        initialProps: { name: "Mi Evento", slug: "mi-evento" },
      },
    );

    // Cambiar el slug inicial (ej: después de un server update)
    rerender({ name: "Mi Evento", slug: "mi-evento-2" });

    expect(result.current.slugPreview).toBe("mi-evento-2");
  });

  it("should handle multiple rapid changes", () => {
    const { result } = renderHook(() => useSlugPreview("Original", "original"));

    act(() => {
      result.current.setEventName("Primero");
      result.current.setEventName("Segundo");
      result.current.setEventName("Tercero");
    });

    expect(result.current.eventName).toBe("Tercero");
    expect(result.current.slugPreview).toBe("tercero");
    expect(result.current.slugWillChange).toBe(true);
  });
});
