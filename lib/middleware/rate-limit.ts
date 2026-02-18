/**
 * Edge-safe in-memory rate limiter for Next.js middleware.
 *
 * Uses a plain Map so it works in the Edge Runtime (no Node.js APIs needed).
 * The state is per-instance, so it resets on cold starts — that's intentional
 * for a middleware-level coarse gate. Real per-action rate limiting lives in
 * lib/rate-limiter-prisma.ts (server actions / API routes).
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}

/**
 * Returns `true` if the given IP has exceeded the rate limit window.
 * Side-effect: increments the counter for subsequent calls.
 */
export function isRateLimited(ip: string): boolean {
  cleanupStaleEntries();

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

/** Extracts the real client IP from common proxy headers. */
export function getClientIP(request: Request): string {
  const headers = request.headers as unknown as {
    get(name: string): string | null;
  };
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
