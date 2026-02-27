/**
 * Shared request parsing middleware for curriculum API routes.
 * Uses Zod for validation and returns a discriminated union result.
 *
 * Lab routes are intentionally excluded — the lab module validates inline.
 */

import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getSubtopicFromDBCached } from "@/lib/rag";
import { createRateLimiter, getRateLimitKey, getRequestUserId } from "./shared";
import type { SubtopicKnowledge, SubjectName } from "@/lib/learning-types";

// ── Result types (discriminated union on `ok`) ──

type ParseSuccess<T> = { ok: true; data: T };
type ParseFailure = { ok: false; response: NextResponse };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

// ── Error codes for machine-readable API error responses ──

export type ApiErrorCode =
    | "RATE_LIMIT"
    | "INVALID_JSON"
    | "VALIDATION"
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "AI_UNAVAILABLE"
    | "AI_FAILURE";

// ── Context returned to route handlers after successful parsing ──

export type CurriculumContext<T> = {
    body: T;
    subject: SubjectName;
    subtopic: SubtopicKnowledge;
    request: NextRequest;
    userId: string | null;
};

// Default rate limiter (10 requests per minute).
const defaultRateLimiter = createRateLimiter(60_000, 10);

/**
 * Parse, validate, and resolve a curriculum API request.
 *
 * Steps: rate limit → JSON parse → Zod validation → Firestore subtopic lookup.
 * Returns a discriminated union so the route can early-return on failure.
 */
export async function parseCurriculumRequest<T extends { subject: string; chapterId: string; topicId: string; subtopicId: string }>(
    request: NextRequest,
    schema: z.ZodSchema<T>,
    options?: { rateLimiter?: (key: string) => Promise<boolean>; requireAuth?: boolean },
): Promise<ParseResult<CurriculumContext<T>>> {
    const requireAuth = options?.requireAuth ?? false;
    const userId = await getRequestUserId(request);

    if (requireAuth && !userId) {
        return fail("Student login required.", 401, "UNAUTHORIZED");
    }

    // 1. Rate limit
    const limiter = options?.rateLimiter ?? defaultRateLimiter;
    // Scope limits by route so heavy use of one endpoint does not throttle others.
    const routePath = request.nextUrl.pathname || "unknown-route";
    const clientKey = `${routePath}:${userId ? `user:${userId}` : getRateLimitKey(request)}`;
    if (await limiter(clientKey)) {
        return fail("Rate limit exceeded. Please try again shortly.", 429, "RATE_LIMIT");
    }

    // 2. Parse JSON body
    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return fail("Invalid JSON body", 400, "INVALID_JSON");
    }

    // 3. Validate with Zod schema
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const message = issue ? formatZodError(issue) : "Invalid request";
        return fail(message, 400, "VALIDATION");
    }

    const body = parsed.data;
    const { subject, chapterId, topicId, subtopicId } = body;

    // 4. Resolve subtopic from Firestore
    const subtopic = await getSubtopicFromDBCached(subject, chapterId, topicId, subtopicId);
    if (!subtopic) {
        return fail("Selected chapter/topic/subtopic was not found", 400, "NOT_FOUND");
    }

    return { ok: true, data: { body, subject: subject as SubjectName, subtopic, request, userId } };
}

// ── Consistent error response builder ──

function fail(message: string, status: number, code: ApiErrorCode): ParseFailure {
    return {
        ok: false,
        response: NextResponse.json({ error: message, code }, { status }),
    };
}

// ── Zod error formatting ──

/** Map field paths to user-friendly labels. */
const FIELD_LABELS: Record<string, string> = {
    subject: "Subject",
    chapterId: "Chapter",
    topicId: "Topic",
    subtopicId: "Subtopic",
    level: "Level",
    studentAnswer: "Student answer",
    mode: "Mode",
    question: "Question",
    expectedAnswer: "Expected answer",
    title: "Title",
    sourceName: "Source name",
    pdfBase64: "PDF payload",
    topK: "TopK",
    lane: "Lane",
    limit: "Limit",
};

/** Format a Zod issue into a user-friendly error message with field name. */
function formatZodError(issue: z.ZodIssue): string {
    const fieldPath = issue.path?.join(".") ?? "";
    const label = FIELD_LABELS[fieldPath] ?? fieldPath;

    // If the Zod message already mentions the field, return as-is.
    if (issue.message.includes(label)) {
        return issue.message;
    }

    // For missing/required fields, return a clean message.
    if (label && (issue.code === "invalid_type" || issue.message === "Required")) {
        return `${label} is required`;
    }

    // For enum mismatches (invalid subject, bad level, etc.), prepend the field name.
    if (label) {
        return `${label}: ${issue.message}`;
    }

    return issue.message;
}
