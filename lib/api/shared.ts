import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import { NextRequest } from "next/server";

type RateLimitEntry = { count: number; windowStartMs: number };
type RateLimitBackend = "upstash" | "memory";

const RATE_LIMIT_PREFIX = "ai_tutor:rate_limit";

/**
 * Parse non-empty string values from unknown input.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeIp(value: string): string | null {
  const ip = value.trim();
  if (!ip) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
  if (/^[0-9a-fA-F:]+$/.test(ip)) return ip.toLowerCase();
  return null;
}

function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Read client IP from standard proxy headers.
 * Proxy headers are only trusted when explicitly enabled.
 */
export function getClientIp(request: NextRequest): string {
  const trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true";
  if (trustProxyHeaders) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const first = forwardedFor.split(",")[0]?.trim();
      const normalized = first ? normalizeIp(first) : null;
      if (normalized) return normalized;
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      const normalized = normalizeIp(realIp);
      if (normalized) return normalized;
    }
  }
  return "unknown";
}

/**
 * Build a route key that is harder to bypass than a raw X-Forwarded-For value.
 */
export function getRateLimitKey(request: NextRequest): string {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.trim().slice(0, 160) || "unknown";
  const acceptLanguage =
    request.headers.get("accept-language")?.trim().slice(0, 80) || "unknown";
  return `${ip}:${simpleHash(`${userAgent}|${acceptLanguage}`)}`;
}

function getRateLimitBackend(): RateLimitBackend {
  const hasUpstashConfig =
    isNonEmptyString(process.env.UPSTASH_REDIS_REST_URL) &&
    isNonEmptyString(process.env.UPSTASH_REDIS_REST_TOKEN);
  return hasUpstashConfig ? "upstash" : "memory";
}

async function isRateLimitedWithUpstash(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  const redisKey = `${RATE_LIMIT_PREFIX}:${key}`;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, windowMs, "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return false;
    const data = (await response.json()) as Array<{ result?: unknown }>;
    const count = Number(data?.[0]?.result ?? 0);
    if (!Number.isFinite(count) || count <= 0) return false;
    return count > maxRequests;
  } catch {
    return false;
  }
}

/**
 * Build a rate limiter per route.
 * Uses Upstash Redis when configured for cross-instance consistency.
 * Falls back to in-memory storage for local/dev.
 */
export function createRateLimiter(windowMs: number, maxRequests: number) {
  const store = new Map<string, RateLimitEntry>();
  const backend = getRateLimitBackend();

  return async (key: string): Promise<boolean> => {
    // Keep tests deterministic and avoid cross-test throttling.
    if (process.env.NODE_ENV === "test") return false;

    if (backend === "upstash") {
      return isRateLimitedWithUpstash(key, windowMs, maxRequests);
    }

    const now = Date.now();
    const entry = store.get(key);

    if (!entry) {
      store.set(key, { count: 1, windowStartMs: now });
      return false;
    }

    if (now - entry.windowStartMs > windowMs) {
      store.set(key, { count: 1, windowStartMs: now });
      return false;
    }

    entry.count += 1;
    store.set(key, entry);

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

/**
 * Restrict public AI routes to same-origin browser calls by default.
 * Optionally require an explicit token for stricter deployments.
 */
export function hasAiRouteAccess(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "test") return true;

  const expectedToken = process.env.AI_ROUTE_ACCESS_TOKEN;
  if (isNonEmptyString(expectedToken)) {
    const incomingToken = request.headers.get("x-ai-route-token");
    if (incomingToken !== expectedToken) return false;
  }

  const enforceOrigin = process.env.AI_ROUTE_ENFORCE_ORIGIN !== "false";
  if (!enforceOrigin) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    const requestUrl = new URL(request.url);

    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.protocol === requestUrl.protocol && originUrl.host === requestUrl.host) {
        return true;
      }
    }

    // Some same-origin requests may omit Origin; fall back to Referer origin.
    if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.protocol === requestUrl.protocol && refererUrl.host === requestUrl.host) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// ── Shared constants & types for curriculum API routes ──

export const VALID_SUBJECTS = ["Science", "Maths"] as const;
export type Subject = typeof VALID_SUBJECTS[number];

/** Maximum length for chapter / topic / subtopic IDs. */
export const MAX_ID_LENGTH = 120;

/** Validate subject is Science or Maths. */
export function isValidSubject(subject: string): subject is Subject {
  return VALID_SUBJECTS.includes(subject as Subject);
}

/**
 * Build a Gemini GenerativeModel with a single API-key lookup.
 * Returns `null` when `GEMINI_API_KEY` is not set.
 */
export function createGeminiModel(
  modelName: string,
  generationConfig?: GenerationConfig,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    ...(generationConfig ? { generationConfig } : {}),
  });
}

