import { z } from "zod";
import { CommonSectionFieldsSchema } from "@/types/section-settings-schemas";

export const ACCOMMODATION_SECTION_KEY = "accommodation" as const;

export const AccommodationSectionMetadata = {
  key: ACCOMMODATION_SECTION_KEY,
  name: "Alojamiento",
  description: "Lista de opciones de alojamiento cercanas",
  icon: "🏨",
  defaultOrder: 10,
  defaultEnabled: true,
};

// Contact type constants
export const CONTACT_TYPE = {
  LINK: "link",
  PHONE: "phone",
} as const;

export type ContactType = (typeof CONTACT_TYPE)[keyof typeof CONTACT_TYPE];

// Schema for an individual accommodation item (for storage/display)
// Allows empty values for editing, strict validation done in form before save
export const AccommodationItemSchema = z
  .object({
    name: z.string().default(""),
    contactType: z.enum(["link", "phone"]).default("link"),
    contactValue: z.string().default(""),
    hasDescription: z.boolean().default(false),
    description: z.string().default(""),
    hasDistance: z.boolean().default(false),
    distance: z.string().default(""),

    // Backwards compatibility - old schema had "phone" field
    phone: z.string().optional(),
  })
  .transform((data) => {
    // Migrate old data: if "phone" exists but contactValue doesn't, migrate it
    if (data.phone && !data.contactValue) {
      return {
        ...data,
        contactType: "phone" as const,
        contactValue: data.phone,
      };
    }
    return data;
  });

// Strict validation schema for form submission
export const AccommodationItemValidationSchema = z
  .object({
    name: z
      .string()
      .min(1, { error: "El nombre es obligatorio" })
      .max(100, { error: "El nombre no puede exceder 100 caracteres" })
      .regex(/^[\p{L}\p{N}\s\-']+$/u, {
        error: "El nombre contiene caracteres no permitidos",
      }),
    contactType: z.enum(["link", "phone"]),
    contactValue: z
      .string()
      .min(1, { error: "El contacto es obligatorio" })
      .max(200, { error: "El contacto no puede exceder 200 caracteres" }),
    hasDescription: z.boolean(),
    description: z.string().max(200, {
      error: "La descripción no puede exceder 200 caracteres",
    }),
    hasDistance: z.boolean(),
    distance: z.string().max(100, {
      error: "La distancia no puede exceder 100 caracteres",
    }),
  })
  .refine(
    (data) => {
      if (data.contactType === "phone" && data.contactValue) {
        return /^[0-9\s\-()+ ]+$/.test(data.contactValue);
      }
      return true;
    },
    {
      message: "El teléfono solo puede contener números y símbolos permitidos",
      path: ["contactValue"],
    },
  )
  .refine(
    (data) => {
      if (data.contactType === "link" && data.contactValue) {
        // Allow full URLs or relative paths
        if (data.contactValue.startsWith("/")) return true;
        if (data.contactValue.startsWith("http://")) return true;
        if (data.contactValue.startsWith("https://")) return true;
        // If no protocol, it's invalid
        return false;
      }
      return true;
    },
    {
      message: "El link debe empezar con https:// o http://",
      path: ["contactValue"],
    },
  );

export const AccommodationSectionSettingsSchema =
  CommonSectionFieldsSchema.extend({
    title: z.string().default("ALOJAMIENTOS"),
    description: z
      .string()
      .default(
        "Sabemos que podés venir de lejos, así que te facilitamos algunos teléfonos de alojamientos cercanos",
      ),

    // Dynamic accommodations list
    accommodations: z.array(AccommodationItemSchema).default([]),
  }).merge(
    z.object({
      // Override icon default for this section
      icon: CommonSectionFieldsSchema.shape.icon.default("accommodation"),
    }),
  );

export type AccommodationSectionSettings = z.infer<
  typeof AccommodationSectionSettingsSchema
>;

export type AccommodationItem = z.infer<typeof AccommodationItemSchema>;
