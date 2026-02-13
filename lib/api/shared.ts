import { NextRequest } from "next/server";

type RateLimitEntry = { count: number; windowStartMs: number };

/**
 * Parse non-empty string values from unknown input.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Read client IP from standard proxy headers.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Build an in-memory rate limiter per route.
 */
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const store = new Map<string, RateLimitEntry>();

  return (ip: string): boolean => {
    // Keep tests deterministic and avoid cross-test throttling.
    if (process.env.NODE_ENV === "test") return false;

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry) {
      store.set(ip, { count: 1, windowStartMs: now });
      return false;
    }

    if (now - entry.windowStartMs > windowMs) {
      store.set(ip, { count: 1, windowStartMs: now });
      return false;
    }

    entry.count += 1;
    store.set(ip, entry);

    // Opportunistic cleanup to avoid unbounded memory growth.
    if (store.size > 500 && entry.count % 20 === 0) {
      for (const [key, value] of store.entries()) {
        if (now - value.windowStartMs > windowMs) {
          store.delete(key);
        }
      }
    }

    return entry.count > maxRequests;
  };
}

/**
 * Strip markdown fences and parse JSON from model output.
 */
export function parseJsonFromModel(text: string): unknown {
  if (!text) throw new Error("Empty response");

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}
