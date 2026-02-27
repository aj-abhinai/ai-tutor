import { NextRequest } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import {
  createGeminiModel,
  createRateLimiter,
  getClientIp,
  getRateLimitKey,
  getRequestUserId,
  hasAiRouteAccess,
  isNonEmptyString,
  isValidSubject,
  parseJsonFromModel,
} from "@/lib/api/shared";

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseIdToken: jest.fn(),
}));

const verifyFirebaseIdTokenMock = verifyFirebaseIdToken as jest.MockedFunction<
  typeof verifyFirebaseIdToken
>;

const makeRequest = (
  url = "http://localhost:3000/api/test",
  headers: Record<string, string> = {}
) =>
  new NextRequest(url, {
    method: "POST",
    headers,
  });

describe("lib/api/shared", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTrustProxy = process.env.TRUST_PROXY_HEADERS;
  const originalAccessToken = process.env.AI_ROUTE_ACCESS_TOKEN;
  const originalEnforceOrigin = process.env.AI_ROUTE_ENFORCE_ORIGIN;
  const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const originalGeminiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
    delete process.env.TRUST_PROXY_HEADERS;
    delete process.env.AI_ROUTE_ACCESS_TOKEN;
    delete process.env.AI_ROUTE_ENFORCE_ORIGIN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.TRUST_PROXY_HEADERS = originalTrustProxy;
    process.env.AI_ROUTE_ACCESS_TOKEN = originalAccessToken;
    process.env.AI_ROUTE_ENFORCE_ORIGIN = originalEnforceOrigin;
    process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
    process.env.GEMINI_API_KEY = originalGeminiKey;
  });

  describe("string and subject guards", () => {
    it("validates non-empty strings", () => {
      expect(isNonEmptyString("text")).toBe(true);
      expect(isNonEmptyString("   ")).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(7)).toBe(false);
    });

    it("validates supported subjects", () => {
      expect(isValidSubject("Science")).toBe(true);
      expect(isValidSubject("Maths")).toBe(true);
      expect(isValidSubject("History")).toBe(false);
    });
  });

  describe("IP and rate-limit key", () => {
    it("returns unknown IP when proxy headers are not trusted", () => {
      const request = makeRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "203.0.113.10",
      });

      expect(getClientIp(request)).toBe("unknown");
    });

    it("reads first x-forwarded-for IP when trust is enabled", () => {
      process.env.TRUST_PROXY_HEADERS = "true";
      const request = makeRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "203.0.113.10, 10.0.0.2",
      });

      expect(getClientIp(request)).toBe("203.0.113.10");
    });

    it("falls back to x-real-ip and normalizes IPv6", () => {
      process.env.TRUST_PROXY_HEADERS = "true";
      const request = makeRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "invalid ip",
        "x-real-ip": "2001:DB8::1",
      });

      expect(getClientIp(request)).toBe("2001:db8::1");
    });

    it("builds stable keys with hashed user-agent metadata", () => {
      process.env.TRUST_PROXY_HEADERS = "true";
      const requestA = makeRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "203.0.113.20",
        "user-agent": "UA-1",
        "accept-language": "en-US",
      });
      const requestB = makeRequest("http://localhost:3000/api/test", {
        "x-forwarded-for": "203.0.113.20",
        "user-agent": "UA-2",
        "accept-language": "en-US",
      });

      const keyA = getRateLimitKey(requestA);
      const keyB = getRateLimitKey(requestB);

      expect(keyA.startsWith("203.0.113.20:")).toBe(true);
      expect(keyA).not.toBe(keyB);
    });
  });

  describe("auth token extraction and verification", () => {
    it("returns null when authorization header is missing", async () => {
      const userId = await getRequestUserId(makeRequest());

      expect(userId).toBeNull();
      expect(verifyFirebaseIdTokenMock).not.toHaveBeenCalled();
    });

    it("returns null when auth scheme is not Bearer", async () => {
      const request = makeRequest("http://localhost:3000/api/test", {
        authorization: "Token abc",
      });
      const userId = await getRequestUserId(request);

      expect(userId).toBeNull();
      expect(verifyFirebaseIdTokenMock).not.toHaveBeenCalled();
    });

    it("returns uid when bearer token verifies", async () => {
      verifyFirebaseIdTokenMock.mockResolvedValueOnce({ uid: "student-7" } as never);
      const request = makeRequest("http://localhost:3000/api/test", {
        authorization: "Bearer token-123",
      });

      const userId = await getRequestUserId(request);

      expect(userId).toBe("student-7");
      expect(verifyFirebaseIdTokenMock).toHaveBeenCalledWith("token-123");
    });
  });

  describe("model JSON parsing", () => {
    it("parses JSON wrapped in markdown fences", () => {
      const parsed = parseJsonFromModel("```json\n{\"rating\":\"great\"}\n```") as {
        rating: string;
      };
      expect(parsed.rating).toBe("great");
    });

    it("parses JSON embedded in text", () => {
      const parsed = parseJsonFromModel("Answer:\n{\"ok\":true}\nThanks") as {
        ok: boolean;
      };
      expect(parsed.ok).toBe(true);
    });

    it("throws on empty text", () => {
      expect(() => parseJsonFromModel("")).toThrow("Empty response");
    });
  });

  describe("AI route access policy", () => {
    it("always allows access in test env", () => {
      process.env.NODE_ENV = "test";
      process.env.AI_ROUTE_ACCESS_TOKEN = "secret";
      const request = makeRequest("http://localhost:3000/api/deep", {
        origin: "https://evil.example.com",
      });

      expect(hasAiRouteAccess(request)).toBe(true);
    });

    it("requires x-ai-route-token when configured", () => {
      process.env.NODE_ENV = "production";
      process.env.AI_ROUTE_ACCESS_TOKEN = "secret";
      const request = makeRequest("http://localhost:3000/api/deep", {
        origin: "http://localhost:3000",
      });

      expect(hasAiRouteAccess(request)).toBe(false);
    });

    it("allows same-origin with valid token", () => {
      process.env.NODE_ENV = "production";
      process.env.AI_ROUTE_ACCESS_TOKEN = "secret";
      const request = makeRequest("http://localhost:3000/api/deep", {
        "x-ai-route-token": "secret",
        origin: "http://localhost:3000",
      });

      expect(hasAiRouteAccess(request)).toBe(true);
    });

    it("allows referer-origin fallback when origin is missing", () => {
      process.env.NODE_ENV = "production";
      const request = makeRequest("http://localhost:3000/api/deep", {
        referer: "http://localhost:3000/explore",
      });

      expect(hasAiRouteAccess(request)).toBe(true);
    });

    it("allows requests when origin enforcement is disabled", () => {
      process.env.NODE_ENV = "production";
      process.env.AI_ROUTE_ENFORCE_ORIGIN = "false";
      const request = makeRequest("http://localhost:3000/api/deep", {});

      expect(hasAiRouteAccess(request)).toBe(true);
    });

    it("rejects malformed origin header", () => {
      process.env.NODE_ENV = "production";
      const request = makeRequest("http://localhost:3000/api/deep", {
        origin: "::not-a-url::",
      });

      expect(hasAiRouteAccess(request)).toBe(false);
    });
  });

  describe("rate limiter", () => {
    it("skips throttling in test env", async () => {
      process.env.NODE_ENV = "test";
      const limiter = createRateLimiter(60_000, 1);

      await expect(limiter("k")).resolves.toBe(false);
      await expect(limiter("k")).resolves.toBe(false);
      await expect(limiter("k")).resolves.toBe(false);
    });

    it("enforces in-memory limits in production", async () => {
      process.env.NODE_ENV = "production";
      const limiter = createRateLimiter(60_000, 2);

      await expect(limiter("k")).resolves.toBe(false);
      await expect(limiter("k")).resolves.toBe(false);
      await expect(limiter("k")).resolves.toBe(true);
    });

    it("resets in-memory window after expiry", async () => {
      process.env.NODE_ENV = "production";
      const nowSpy = jest.spyOn(Date, "now");
      const limiter = createRateLimiter(1_000, 1);

      nowSpy.mockReturnValue(0);
      await expect(limiter("k")).resolves.toBe(false);
      await expect(limiter("k")).resolves.toBe(true);

      nowSpy.mockReturnValue(2_000);
      await expect(limiter("k")).resolves.toBe(false);
    });

    it("uses upstash backend when configured", async () => {
      process.env.NODE_ENV = "production";
      process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
      process.env.UPSTASH_REDIS_REST_TOKEN = "token";
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => [{ result: 3 }, { result: "OK" }],
      } as Response);

      const limiter = createRateLimiter(60_000, 2);
      const limited = await limiter("user-key");

      expect(limited).toBe(true);
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("Gemini model factory", () => {
    it("returns null when GEMINI_API_KEY is missing", () => {
      delete process.env.GEMINI_API_KEY;
      expect(createGeminiModel("gemini-2.5-flash-lite")).toBeNull();
    });

    it("returns a model instance when GEMINI_API_KEY exists", () => {
      process.env.GEMINI_API_KEY = "test-key";
      const model = createGeminiModel("gemini-2.5-flash-lite");
      expect(model).toBeTruthy();
    });
  });
});
