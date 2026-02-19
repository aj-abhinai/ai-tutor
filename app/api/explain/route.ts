/**
 * /api/explain - AI Tutor API Route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId, mode?, studentAnswer? }
 * Output: JSON with quickExplanation, bulletPoints, curiosityQuestion OR feedback
 */

import { NextRequest, NextResponse } from "next/server";
import {
    buildLessonFromSubtopic,
    formatSubtopicForFeedback,
} from "@/lib/subtopic-content";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { ExplainBodySchema } from "@/lib/api/validation";
import {
    createGeminiModel,
    hasAiRouteAccess,
    isNonEmptyString,
    parseJsonFromModel,
} from "@/lib/api/shared";

type TutorLessonResponse = {
    quickExplanation: string;
    bulletPoints: {
        simple: string[];
        standard: string[];
        deep: string[];
    };
    curiosityQuestion?: string;
};

type TutorFeedbackResponse = {
    rating: string;
    praise: string;
    fix: string;
    rereadTip: string;
};

// Prompt for explain-it-back feedback.
const FEEDBACK_PROMPT = `You are a friendly Class 7 tutor.

Task:
Given a student's "Explain it back" answer, give kind feedback.

Rules:
- Use simple words a 12-year-old understands
- Always appreciate effort
- Point out one thing they did right
- Point out one thing to improve
- Suggest what to re-read (mention a step or key idea)
- Keep it short, no long paragraphs
- Return only JSON, no markdown or code fences

Output strictly in this JSON format:
{
  "rating": "great" | "good start" | "needs work",
  "praise": "A short encouraging line",
  "fix": "One clear improvement tip",
  "rereadTip": "What to re-read or review"
}
`;

// Input length limits.
const MAX_STUDENT_ANSWER_LENGTH = 600;

// Validate and normalize model feedback into the expected shape.
function normalizeFeedbackResponse(raw: unknown): TutorFeedbackResponse | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const rating = obj.rating;
    const praise = obj.praise;
    const fix = obj.fix;
    const rereadTip = obj.rereadTip;

    if (
        !isNonEmptyString(rating) ||
        !isNonEmptyString(praise) ||
        !isNonEmptyString(fix) ||
        !isNonEmptyString(rereadTip)
    ) {
        return null;
    }

    return {
        rating: rating.trim(),
        praise: praise.trim(),
        fix: fix.trim(),
        rereadTip: rereadTip.trim(),
    };
}

export async function POST(request: NextRequest) {
    // Shared validation: rate limit, parse body, validate fields, Firestore lookup.
    const result = await parseCurriculumRequest(request, ExplainBodySchema);
    if (!result.ok) return result.response;
    const { subtopic, body } = result.data;

    // Lesson mode: return static curriculum content (no AI needed).
    if (body.mode !== "feedback") {
        const lesson: TutorLessonResponse = buildLessonFromSubtopic(subtopic);
        return NextResponse.json({ content: lesson, subtopic });
    }

    // ── Feedback mode: route-level validation for studentAnswer ──

    if (!isNonEmptyString(body.studentAnswer)) {
        return NextResponse.json(
            { error: "Student answer is required", code: "VALIDATION" },
            { status: 400 },
        );
    }

    if (!hasAiRouteAccess(request)) {
        return NextResponse.json(
            { error: "Unauthorized request origin for AI endpoint.", code: "UNAUTHORIZED" },
            { status: 401 },
        );
    }

    if (body.studentAnswer.trim().length > MAX_STUDENT_ANSWER_LENGTH) {
        return NextResponse.json(
            { error: `Answer must be ${MAX_STUDENT_ANSWER_LENGTH} characters or less`, code: "VALIDATION" },
            { status: 400 },
        );
    }

    const model = createGeminiModel("gemini-2.5-flash-lite");
    if (!model) {
        return NextResponse.json(
            { error: "Server configuration error", code: "AI_UNAVAILABLE" },
            { status: 500 },
        );
    }

    // Build prompt and call Gemini.
    const promptParts: { text: string }[] = [
        { text: FEEDBACK_PROMPT },
        { text: formatSubtopicForFeedback(subtopic) },
        { text: `Student answer:\n${body.studentAnswer.trim()}` },
    ];

    let genResult;
    try {
        genResult = await model.generateContent(promptParts);
    } catch (err) {
        console.error("Gemini generateContent failed:", err);
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to generate response. Please try again.", code: "AI_FAILURE", details }
                : { error: "Failed to generate response. Please try again.", code: "AI_FAILURE" },
            { status: 502 },
        );
    }

    const text = genResult.response.text();

    // Parse and validate model output.
    let parsed: unknown;
    try {
        parsed = parseJsonFromModel(text);
    } catch {
        return NextResponse.json(
            { error: "Model returned invalid JSON. Please try again.", code: "AI_FAILURE" },
            { status: 502 },
        );
    }

    const feedback = normalizeFeedbackResponse(parsed);
    if (!feedback) {
        return NextResponse.json(
            { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE" },
            { status: 502 },
        );
    }
    return NextResponse.json({ feedback });
}
