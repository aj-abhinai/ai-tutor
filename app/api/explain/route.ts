/**
 * /api/explain - AI Tutor API Route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId, mode?, studentAnswer? }
 * Output: JSON with quickExplanation, bulletPoints, curiosityQuestion OR feedback
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import {
    buildLessonFromSubtopic,
    formatSubtopicForFeedback,
    getSubtopicById,
} from "@/lib/curriculum";
import {
    createRateLimiter,
    getClientIp,
    isNonEmptyString,
    parseJsonFromModel,
} from "@/lib/api/shared";

// Valid subjects for Standard 7
const VALID_SUBJECTS = ["Science", "Maths"] as const;
type Subject = typeof VALID_SUBJECTS[number];

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
const MAX_ID_LENGTH = 120;
const MAX_STUDENT_ANSWER_LENGTH = 600;

// Route-level rate limiting.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

/**
 * Validate subject is Science or Maths
 */
function isValidSubject(subject: string): subject is Subject {
    return VALID_SUBJECTS.includes(subject as Subject);
}

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
    // Rate limit check
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please try again shortly." },
            { status: 429 }
        );
    }

    // Parse request body.
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
        subject,
        chapterId,
        topicId,
        subtopicId,
        mode,
        studentAnswer,
    } = body as {
        subject?: unknown;
        chapterId?: unknown;
        topicId?: unknown;
        subtopicId?: unknown;
        mode?: unknown;
        studentAnswer?: unknown;
    };

    const requestMode = mode === "feedback" ? "feedback" : "lesson";

    // Validate subject and selection IDs.
    if (!subject || typeof subject !== "string") {
        return NextResponse.json(
            { error: "Subject is required (Science or Maths)" },
            { status: 400 }
        );
    }

    if (!isValidSubject(subject)) {
        return NextResponse.json(
            { error: "Subject must be Science or Maths" },
            { status: 400 }
        );
    }

    if (!isNonEmptyString(chapterId)) {
        return NextResponse.json(
            { error: "Chapter is required" },
            { status: 400 }
        );
    }

    if (!isNonEmptyString(topicId)) {
        return NextResponse.json(
            { error: "Topic is required" },
            { status: 400 }
        );
    }

    if (!isNonEmptyString(subtopicId)) {
        return NextResponse.json(
            { error: "Subtopic is required" },
            { status: 400 }
        );
    }

    if (
        chapterId.trim().length > MAX_ID_LENGTH ||
        topicId.trim().length > MAX_ID_LENGTH ||
        subtopicId.trim().length > MAX_ID_LENGTH
    ) {
        return NextResponse.json(
            { error: `IDs must be ${MAX_ID_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    const selectedSubtopic = getSubtopicById(
        subject,
        chapterId.trim(),
        topicId.trim(),
        subtopicId.trim()
    );

    if (!selectedSubtopic) {
        return NextResponse.json(
            { error: "Selected chapter/topic/subtopic was not found" },
            { status: 400 }
        );
    }

    // Lesson mode returns static curriculum content.
    if (requestMode === "lesson") {
        const lesson: TutorLessonResponse = buildLessonFromSubtopic(selectedSubtopic);
        return NextResponse.json({ content: lesson });
    }

    // Feedback mode validates student input.
    if (!isNonEmptyString(studentAnswer)) {
        return NextResponse.json({ error: "Student answer is required" }, { status: 400 });
    }

    if (studentAnswer.trim().length > MAX_STUDENT_ANSWER_LENGTH) {
        return NextResponse.json(
            { error: `Answer must be ${MAX_STUDENT_ANSWER_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Call Gemini API for feedback.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite", // Using a lighter model for better rate limits
    });

    const promptParts: { text: string }[] = [
        { text: FEEDBACK_PROMPT },
        { text: formatSubtopicForFeedback(selectedSubtopic) },
        { text: `Student answer:\n${(studentAnswer as string).trim()}` },
    ];

    let result;
    try {
        result = await model.generateContent(promptParts);
    } catch (err) {
        console.error("Gemini generateContent failed:", err);
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to generate response. Please try again.", details }
                : { error: "Failed to generate response. Please try again." },
            { status: 502 }
        );
    }

    const response = result.response;
    const text = response.text();

    // Parse and normalize the model output.
    let parsed: unknown;
    try {
        parsed = parseJsonFromModel(text);
    } catch {
        return NextResponse.json(
            { error: "Model returned invalid JSON. Please try again." },
            { status: 502 }
        );
    }

    const feedback = normalizeFeedbackResponse(parsed);
    if (!feedback) {
        return NextResponse.json(
            { error: "Model returned an unexpected response. Please try again." },
            { status: 502 }
        );
    }
    return NextResponse.json({ feedback });
}
