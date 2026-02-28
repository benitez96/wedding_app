/**
 * String sanitization utilities to prevent XSS attacks
 *
 * IMPORTANT: React automatically escapes content in JSX,
 * but we sanitize anyway for:
 * - Defense in depth
 * - Preventing attacks in HTML attributes
 * - Cleaning data before saving to DB
 */

/**
 * Removes dangerous characters that could be used in XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return (
    input
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove control characters except normal whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize whitespace
      .trim()
      // Limit to safe characters (letters, numbers, spaces, common punctuation)
      .replace(/[^\p{L}\p{N}\p{Z}\p{P}\p{S}\s]/gu, "")
  );
}

/**
 * Sanitizes a phone number
 * Allows: numbers, spaces, hyphens, parentheses, +
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[^0-9\s\-()+ ]/g, "")
    .slice(0, 50); // Reasonable limit for phone numbers
}

/**
 * Sanitizes long text (descriptions, etc)
 * More permissive but with length limit
 */
export function sanitizeText(input: string, maxLength = 500): string {
  return sanitizeString(input).slice(0, maxLength);
}

/**
 * Sanitizes a name (places, people, etc)
 * Only letters, numbers, spaces and hyphens
 */
export function sanitizeName(input: string, maxLength = 100): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[^\p{L}\p{N}\s\-']/gu, "")
    .slice(0, maxLength);
}

/**
 * Sanitizes an entire object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : typeof item === "string"
            ? sanitizeString(item)
            : item,
      ) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      result[key as keyof T] = sanitizeObject(
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

/**
 * Escapes HTML entities to prevent XSS when rendering user content as HTML
 * Use this when you need to display user input in a non-React context
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes IDs (alphanumeric, hyphens, underscores only)
 * Use for database IDs, slugs, etc.
 */
export function sanitizeId(input: string, maxLength = 50): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, maxLength);
}

/**
 * Sanitizes search queries
 * Removes dangerous special characters while preserving search functionality
 */
export function sanitizeSearch(input: string, maxLength = 100): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>\\"'%&;\\/]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}
