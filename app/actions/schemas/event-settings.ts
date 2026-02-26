import { z } from "zod";

/**
 * Schema de validación para actualización de configuraciones del evento
 * Protege contra inputs maliciosos y valida límites
 */
export const updateEventSettingsSchema = z.object({
  eventName: z
    .string({ error: "El nombre del evento es requerido" })
    .trim()
    .min(3, { error: "El nombre debe tener al menos 3 caracteres" })
    .max(100, { error: "El nombre no puede exceder 100 caracteres" })
    .refine((val) => val.length > 0, {
      message: "El nombre no puede estar vacío",
    }),

  eventDescription: z
    .string()
    .trim()
    .max(1000, {
      error: "La descripción no puede exceder 1000 caracteres",
    })
    .transform((val) => (val === "" ? null : val)) // Convertir string vacío a null
    .optional(), // optional después del transform

  checkinStrategy: z
    .enum(["IDB_FIRST", "SERVER_FIRST", "HYBRID_SMART"], {
      error: "Estrategia de check-in inválida",
    })
    .optional()
    .default("HYBRID_SMART"),
});

export type UpdateEventSettingsInput = z.infer<
  typeof updateEventSettingsSchema
>;
