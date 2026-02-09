import { ARGENTINA_TIMEZONE, ARGENTINA_LOCALE } from "@/config/timezone";

// Re-export timezone functions from config for backward compatibility
export {
  getCurrentDateArgentina,
  toArgentinaTimeZone,
} from "@/config/timezone";

export function formatWeddingDate(dateString: string): string {
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6));
  const day = parseInt(dateString.substring(6, 8));

  const date = new Date(year, month - 1, day);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("es-ES", options);
}

export function getWeddingDate(): Date {
  const defaultDate = "20260214193000";
  const weddingDateRaw = process.env.NEXT_PUBLIC_WEDDING_DATE || defaultDate;

  const parseDateParts = (value: string) => {
    const normalized = value.padEnd(14, "0");
    return {
      year: Number.parseInt(normalized.substring(0, 4), 10),
      month: Number.parseInt(normalized.substring(4, 6), 10) - 1, // 0-indexed
      day: Number.parseInt(normalized.substring(6, 8), 10),
      hour: Number.parseInt(normalized.substring(8, 10), 10),
      minute: Number.parseInt(normalized.substring(10, 12), 10),
      second: Number.parseInt(normalized.substring(12, 14), 10),
    };
  };

  const parts = parseDateParts(weddingDateRaw);
  const isValid = Object.values(parts).every((value) => !Number.isNaN(value));
  const safeParts = isValid ? parts : parseDateParts(defaultDate);

  return new Date(
    safeParts.year,
    safeParts.month,
    safeParts.day,
    safeParts.hour,
    safeParts.minute,
    safeParts.second,
  );
}

// Función para formatear fechas de manera consistente entre servidor y cliente
export function formatDate(date: Date | null): string {
  if (!date) return "-";

  // Convertir a zona horaria de Argentina usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return formatter.format(date);
}

// Función para formatear fecha y hora en zona horaria de Argentina
export function formatDateTime(date: Date | null): string {
  if (!date) return "-";

  // Convertir a zona horaria de Argentina usando Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    timeZone: ARGENTINA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatter.format(date);
}
