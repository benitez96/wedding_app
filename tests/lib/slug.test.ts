import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSlug, isSlugAvailable, generateUniqueSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("should convert text to lowercase", () => {
    expect(generateSlug("BODA DE ANA Y JUAN")).toBe("boda-de-ana-y-juan");
  });

  it("should remove accents and diacritics", () => {
    expect(generateSlug("Chambita de José y María")).toBe(
      "chambita-de-jose-y-maria",
    );
    expect(generateSlug("Fiesta de Año Nuevo")).toBe("fiesta-de-ano-nuevo");
    expect(generateSlug("Niño Güeño")).toBe("nino-gueno");
  });

  it("should replace spaces with hyphens", () => {
    expect(generateSlug("Mi Evento Especial")).toBe("mi-evento-especial");
  });

  it("should remove special characters", () => {
    expect(generateSlug("Fiesta 2024!!!")).toBe("fiesta-2024");
    expect(generateSlug("Boda @Ana & Juan#")).toBe("boda-ana-juan");
    expect(generateSlug("Evento $100% único")).toBe("evento-100-unico");
  });

  it("should remove multiple consecutive hyphens", () => {
    expect(generateSlug("Mi    Evento    Especial")).toBe("mi-evento-especial");
    expect(generateSlug("Evento---Con---Guiones")).toBe("evento-con-guiones");
  });

  it("should trim leading and trailing spaces", () => {
    expect(generateSlug("  Mi Evento  ")).toBe("mi-evento");
  });

  it("should limit slug length to 100 characters", () => {
    const longText = "a".repeat(150);
    const slug = generateSlug(longText);
    expect(slug.length).toBe(100);
  });

  it("should throw error on empty strings", () => {
    expect(() => generateSlug("")).toThrow("El texto no puede estar vacío");
    expect(() => generateSlug("   ")).toThrow("El texto no puede estar vacío");
  });

  it("should throw error when slug would be empty after sanitization", () => {
    // Solo emojis/unicode - no quedan caracteres alfanuméricos
    expect(() => generateSlug("🎉🎊✨")).toThrow(
      "El nombre del evento debe contener al menos caracteres alfanuméricos",
    );
    expect(() => generateSlug("👰🤵💒")).toThrow(
      "El nombre del evento debe contener al menos caracteres alfanuméricos",
    );
  });

  it("should handle mix of emojis and valid text", () => {
    expect(generateSlug("Boda 💒 2024")).toBe("boda-2024");
    expect(generateSlug("🎉 Fiesta")).toBe("fiesta");
  });

  it("should handle complex real-world cases", () => {
    expect(generateSlug("La Chambita de Juan y Ramón")).toBe(
      "la-chambita-de-juan-y-ramon",
    );
    expect(generateSlug("Fiesta de Cumpleaños #30!!!")).toBe(
      "fiesta-de-cumpleanos-30",
    );
    expect(generateSlug("Boda en la Playa 🏖️ 2024")).toBe(
      "boda-en-la-playa-2024",
    );
  });
});

describe("isSlugAvailable", () => {
  it("should return true when slug does not exist", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const result = await isSlugAvailable("mi-evento", mockPrisma);
    expect(result).toBe(true);
    expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
      where: { slug: "mi-evento" },
      select: { id: true },
    });
  });

  it("should return false when slug exists", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue({ id: "event-123" }),
      },
    };

    const result = await isSlugAvailable("mi-evento", mockPrisma);
    expect(result).toBe(false);
  });

  it("should return true when slug exists but is the same event being edited", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue({ id: "event-123" }),
      },
    };

    const result = await isSlugAvailable("mi-evento", mockPrisma, "event-123");
    expect(result).toBe(true);
  });

  it("should return false when slug exists and belongs to a different event", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue({ id: "event-456" }),
      },
    };

    const result = await isSlugAvailable("mi-evento", mockPrisma, "event-123");
    expect(result).toBe(false);
  });
});

describe("generateUniqueSlug", () => {
  it("should return base slug when it is available", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const result = await generateUniqueSlug("Mi Evento", mockPrisma);
    expect(result).toBe("mi-evento");
  });

  it("should add numeric suffix when base slug is taken", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "event-1" }) // mi-evento exists
          .mockResolvedValueOnce(null), // mi-evento-2 is available
      },
    };

    const result = await generateUniqueSlug("Mi Evento", mockPrisma);
    expect(result).toBe("mi-evento-2");
    expect(mockPrisma.event.findUnique).toHaveBeenCalledTimes(2);
  });

  it("should increment suffix until finding available slug", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: "event-1" }) // mi-evento exists
          .mockResolvedValueOnce({ id: "event-2" }) // mi-evento-2 exists
          .mockResolvedValueOnce({ id: "event-3" }) // mi-evento-3 exists
          .mockResolvedValueOnce(null), // mi-evento-4 is available
      },
    };

    const result = await generateUniqueSlug("Mi Evento", mockPrisma);
    expect(result).toBe("mi-evento-4");
    expect(mockPrisma.event.findUnique).toHaveBeenCalledTimes(4);
  });

  it("should exclude current event when checking availability", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue({ id: "event-123" }),
      },
    };

    // Slug exists but belongs to the event we're editing
    const result = await generateUniqueSlug(
      "Mi Evento",
      mockPrisma,
      "event-123",
    );
    expect(result).toBe("mi-evento");
  });

  it("should use timestamp fallback after 100 attempts", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue({ id: "event-taken" }),
      },
    };

    // Mock Date.now for consistent testing
    const mockNow = 1234567890;
    vi.spyOn(Date, "now").mockReturnValue(mockNow);

    const result = await generateUniqueSlug("Mi Evento", mockPrisma);
    expect(result).toBe(`mi-evento-${mockNow}`);

    vi.restoreAllMocks();
  });

  it("should handle complex names with normalization", async () => {
    const mockPrisma = {
      event: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const result = await generateUniqueSlug(
      "La Chambita de José y María!!!",
      mockPrisma,
    );
    expect(result).toBe("la-chambita-de-jose-y-maria");
  });
});
