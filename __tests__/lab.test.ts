/**
 * Tests for /api/lab route – Reaction Playground
 *
 * These tests call the route handler directly (no running server required).
 * Covers input validation, reaction matching, and response structure.
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/lab/route";

/* ── Helpers ─────────────────────────────────────────────── */

const makeJsonRequest = (body: unknown, headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
    });

const makeRawRequest = (rawBody: string, headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: rawBody,
    });

/* ── Known reaction pair for positive tests ──────────────── */
const VALID_PAIR = {
    chemicalA: "Zinc (Zn)",
    chemicalB: "Hydrochloric Acid (HCl)",
};

/* ── Known pair with no reaction ─────────────────────────── */
const NO_REACTION_PAIR = {
    chemicalA: "Carbon (C)",
    chemicalB: "Sodium Hydroxide (NaOH)",
};

const NEW_REACTION_PAIR = {
    chemicalA: "Calcium Carbonate (CaCO₃)",
    chemicalB: "Vinegar (CH₃COOH)",
};

const LEAD_IODIDE_PAIR = {
    chemicalA: "Lead Nitrate (Pb(NO₃)₂)",
    chemicalB: "Potassium Iodide (KI)",
};

/* ── Tests ────────────────────────────────────────────────── */

describe("/api/lab – Reaction Playground API", () => {
    /* ---------- Input validation ---------- */
    describe("Input validation", () => {
        it("rejects invalid JSON body", async () => {
            const res = await POST(makeRawRequest("{"));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Invalid JSON");
        });

        it("rejects request without chemicalA", async () => {
            const res = await POST(makeJsonRequest({ chemicalB: "Water (H₂O)" }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Chemical A");
        });

        it("rejects request without chemicalB", async () => {
            const res = await POST(makeJsonRequest({ chemicalA: "Zinc (Zn)" }));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Chemical B");
        });

        it("rejects empty string chemicalA", async () => {
            const res = await POST(
                makeJsonRequest({ chemicalA: "   ", chemicalB: "Water (H₂O)" })
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("Chemical A");
        });

        it("rejects when both chemicals are the same", async () => {
            const res = await POST(
                makeJsonRequest({ chemicalA: "Zinc (Zn)", chemicalB: "Zinc (Zn)" })
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("different");
        });

        it("rejects chemical name longer than 200 characters", async () => {
            const res = await POST(
                makeJsonRequest({
                    chemicalA: "a".repeat(201),
                    chemicalB: "Water (H₂O)",
                })
            );
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toContain("200");
        });
    });

    /* ---------- API key guard ---------- */
    describe("API key guard", () => {
        const originalEnv = process.env.GEMINI_API_KEY;

        afterEach(() => {
            if (originalEnv !== undefined) {
                process.env.GEMINI_API_KEY = originalEnv;
            } else {
                delete process.env.GEMINI_API_KEY;
            }
        });

        it("returns 500 when GEMINI_API_KEY is missing", async () => {
            delete process.env.GEMINI_API_KEY;
            const res = await POST(makeJsonRequest(VALID_PAIR));
            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toContain("configuration");
        });
    });

    /* ---------- Reaction matching (unit-level) ---------- */
    describe("Reaction lookup (via route)", () => {
        // We can't easily test the full Gemini path in unit tests
        // unless the API key is set. So we test the validation path
        // and check that unknown pairs still get validated.

        it("validates a known reaction pair without error (up to Gemini call)", async () => {
            // If no API key, this should return 500 (config error), not 400
            const prev = process.env.GEMINI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const res = await POST(makeJsonRequest(VALID_PAIR));
            // Should pass validation — either 500 (no key) or 200 (if key exists)
            expect(res.status).not.toBe(400);

            if (prev !== undefined) {
                process.env.GEMINI_API_KEY = prev;
            }
        });

        it("validates a newly added reaction pair (Vinegar + CaCO3)", async () => {
            const prev = process.env.GEMINI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const res = await POST(makeJsonRequest(NEW_REACTION_PAIR));
            // Should find the reaction, get 500 from API key check (not 400 validation error)
            expect(res.status).not.toBe(400);

            if (prev !== undefined) {
                process.env.GEMINI_API_KEY = prev;
            }
        });

        it("validates the new Lead Nitrate + KI reaction", async () => {
            const prev = process.env.GEMINI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const res = await POST(makeJsonRequest(LEAD_IODIDE_PAIR));
            // Should find the reaction
            expect(res.status).not.toBe(400);

            if (prev !== undefined) {
                process.env.GEMINI_API_KEY = prev;
            }
        });

        it("validates an unknown pair without error (up to Gemini call)", async () => {
            const prev = process.env.GEMINI_API_KEY;
            delete process.env.GEMINI_API_KEY;

            const res = await POST(makeJsonRequest(NO_REACTION_PAIR));
            // Should pass validation — 500 because no API key, not 400
            expect(res.status).toBe(500);

            if (prev !== undefined) {
                process.env.GEMINI_API_KEY = prev;
            }
        });
    });
});
