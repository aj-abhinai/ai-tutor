/**
 * /api/feedback - Explain-it-back + quiz feedback route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId, studentAnswer, mode?, question?, expectedAnswer?, answerExplanation?, lessonContext? }
 * Output: JSON with feedback
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getSubtopicById, formatSubtopicForFeedback } from "@/lib/curriculum";

// Valid subjects for Standard 7
const VALID_SUBJECTS = ["Science", "Maths"] as const;
type Subject = typeof VALID_SUBJECTS[number];

type TutorFeedbackResponse = {
    rating: string;
    praise: string;
    fix: string;
    rereadTip: string;
    isCorrect?: boolean;
};

type FeedbackMode = "explain" | "quiz";

// Prompt for explain-it-back feedback.
const FEEDBACK_PROMPT = `You are a friendly Class 7 tutor.

Task:
Given a student's "Explain it back" answer, check it against the lesson summary and checklist and give simple feedback.

Rules:
- Use simple words a 12-year-old understands
- Be kind and encouraging
- Never be harsh or shaming
- Identify what is RIGHT (only if the student explicitly said it)
- Identify what is MISSING or CONFUSED (correct it gently)
- If unsure, say it's missing rather than guessing
- Suggest what to re-read (mention a key idea from the lesson summary or checklist)
- If the answer is gibberish or random letters, say you couldn't understand it and ask for 1-2 real sentences
- If nothing is correct, do not praise correctness. You may still thank the student for trying.
- Keep it short, no long paragraphs
- Return only JSON, no markdown or code fences

Output strictly in this JSON format:
{
  "rating": "great" | "good start" | "needs work",
  "praise": "Right: ...",
  "fix": "Wrong or missing: ...",
  "rereadTip": "Re-read: ..."
}
`;

// Prompt for descriptive quiz answer feedback.
const QUIZ_FEEDBACK_PROMPT = `You are a friendly Class 7 tutor.

Task:
Grade a student's descriptive answer to a quiz question using the expected answer.

Rules:
- Use simple words a 12-year-old understands
- Be kind and encouraging
- Decide if the answer is correct based on the core idea
- If partially correct, mark it as not correct but encourage it
- Point out what is right and what is missing
- Use the expected answer and explanation to guide your decision
- Keep it short, no long paragraphs
- Return only JSON, no markdown or code fences

Output strictly in this JSON format:
{
  "isCorrect": true | false,
  "rating": "correct" | "partially correct" | "incorrect",
  "praise": "Right: ...",
  "fix": "Missing or incorrect: ...",
  "rereadTip": "Re-read: ..."
}
`;

// Input length limits.
const MAX_ID_LENGTH = 120;
const MAX_STUDENT_ANSWER_LENGTH = 600;

// Stopwords used for quick keyword overlap checks.
const STOPWORDS = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "then",
    "so",
    "to",
    "of",
    "in",
    "on",
    "for",
    "with",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "it",
    "this",
    "that",
    "these",
    "those",
    "by",
    "from",
    "at",
    "into",
    "about",
    "over",
    "under",
    "we",
    "you",
    "they",
    "he",
    "she",
    "i",
    "my",
    "your",
    "their",
    "our",
]);

// Rate limiting (simple in-memory)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
type RateLimitEntry = { count: number; windowStartMs: number };
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
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
 * Check if client is rate limited
 */
function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry) {
        rateLimitStore.set(ip, { count: 1, windowStartMs: now });
        return false;
    }

    if (now - entry.windowStartMs > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { count: 1, windowStartMs: now });
        return false;
    }

    entry.count += 1;
    rateLimitStore.set(ip, entry);
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Validate subject is Science or Maths
 */
function isValidSubject(subject: string): subject is Subject {
    return VALID_SUBJECTS.includes(subject as Subject);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

// Strip markdown fences and parse JSON from the model response.
function parseJsonFromModel(text: string): unknown {
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

// Extract key words for a lightweight overlap check.
function extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
    const filtered = words.filter((word) => !STOPWORDS.has(word));
    return Array.from(new Set(filtered));
}

// Heuristic to detect random or unreadable input.
function isLikelyGibberish(answer: string): boolean {
    const trimmed = answer.trim();
    if (!trimmed) return true;
    const totalChars = trimmed.length;
    const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
    const digits = (trimmed.match(/[0-9]/g) ?? []).length;
    const vowels = (trimmed.match(/[AEIOUaeiou]/g) ?? []).length;
    const words = trimmed.match(/[A-Za-z]+/g) ?? [];
    const wordCount = words.length;
    const letterRatio = totalChars > 0 ? letters / totalChars : 0;
    const digitRatio = totalChars > 0 ? digits / totalChars : 0;
    const avgWordLen =
        wordCount > 0 ? words.reduce((sum, word) => sum + word.length, 0) / wordCount : 0;
    const vowelRatio = letters > 0 ? vowels / letters : 0;

    if (totalChars >= 25 && (letterRatio < 0.6 || digitRatio > 0.25)) return true;
    if (avgWordLen >= 8 && vowelRatio < 0.25) return true;
    return false;
}

// Normalize strings for exact-match checks.
function normalizeAnswer(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Quick exact-match fallback for short answers.
function isExactMatch(a: string, b: string): boolean {
    const normA = normalizeAnswer(a);
    const normB = normalizeAnswer(b);
    return normA.length > 0 && normA === normB;
}

// Build rule-based feedback when the model output is invalid.
function buildFallbackFeedback(
    studentAnswer: string,
    lessonText: string,
    keyConcepts: string[],
    subtopicTitle: string
): TutorFeedbackResponse {
    const cleaned = studentAnswer.trim();
    const words = cleaned.match(/[A-Za-z]+/g) ?? [];
    const wordCount = words.length;
    const focusIdea = keyConcepts[0] || subtopicTitle;

    if (wordCount < 4) {
        return {
            rating: "needs work",
            praise: "Thanks for trying!",
            fix: "Please write 1-2 full sentences so I can check your idea.",
            rereadTip: `Re-read: ${focusIdea}`,
        };
    }

    if (isLikelyGibberish(cleaned)) {
        return {
            rating: "needs work",
            praise: "Thanks for trying!",
            fix: "I couldn't understand the words. Please write 1-2 clear sentences.",
            rereadTip: `Re-read: ${focusIdea}`,
        };
    }

    const keyWords = new Set(extractKeywords(`${lessonText} ${keyConcepts.join(" ")}`));
    const answerWords = extractKeywords(cleaned);
    const overlap = answerWords.filter((word) => keyWords.has(word));

    if (overlap.length === 0) {
        return {
            rating: "needs work",
            praise: "Thanks for trying!",
            fix: "I couldn't find the key idea yet. Try to mention the main concept from the lesson.",
            rereadTip: `Re-read: ${focusIdea}`,
        };
    }

    const highlighted = overlap.slice(0, 2).join(" and ");
    return {
        rating: overlap.length >= 2 ? "good start" : "needs work",
        praise: `Right: You mentioned ${highlighted}.`,
        fix: "Now add the main idea in a full sentence and connect it to the lesson.",
        rereadTip: `Re-read: ${focusIdea}`,
    };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = obj[key];
        if (isNonEmptyString(value)) return value.trim();
    }
    return null;
}

// Normalize varied model response shapes into a single format.
function normalizeFeedbackResponse(raw: unknown): TutorFeedbackResponse | null {
    if (!raw || typeof raw !== "object") return null;
    let obj = raw as Record<string, unknown>;

    const nested = obj.feedback;
    if (nested && typeof nested === "object") {
        obj = nested as Record<string, unknown>;
    }

    const rating = pickString(obj, ["rating", "result", "score"]);
    const praise = pickString(obj, ["praise", "positive", "strength", "right", "whatWasRight"]);
    const fix = pickString(obj, ["fix", "improve", "improvement", "missing", "wrong", "whatToFix"]);
    const rereadTip = pickString(obj, ["rereadTip", "reread", "review", "next", "reReadTip"]);
    const rawCorrect = obj.isCorrect ?? obj.correct ?? obj.is_correct;
    let isCorrect: boolean | undefined;
    if (typeof rawCorrect === "boolean") {
        isCorrect = rawCorrect;
    } else if (typeof rawCorrect === "string") {
        const lowered = rawCorrect.trim().toLowerCase();
        if (["true", "yes", "correct"].includes(lowered)) isCorrect = true;
        if (["false", "no", "incorrect"].includes(lowered)) isCorrect = false;
    }

    if (!rating || !praise || !fix || !rereadTip) {
        return null;
    }

    return {
        rating,
        praise,
        fix,
        rereadTip,
        isCorrect,
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
        studentAnswer,
        lessonContext,
        mode,
        question,
        expectedAnswer,
        answerExplanation,
    } = body as {
        subject?: unknown;
        chapterId?: unknown;
        topicId?: unknown;
        subtopicId?: unknown;
        studentAnswer?: unknown;
        lessonContext?: unknown;
        mode?: unknown;
        question?: unknown;
        expectedAnswer?: unknown;
        answerExplanation?: unknown;
    };

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

    if (!isNonEmptyString(studentAnswer)) {
        return NextResponse.json(
            { error: "Student answer is required" },
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

    if (studentAnswer.trim().length > MAX_STUDENT_ANSWER_LENGTH) {
        return NextResponse.json(
            { error: `Answer must be ${MAX_STUDENT_ANSWER_LENGTH} characters or less` },
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

    // Decide which prompt to use (explain vs quiz).
    const feedbackMode: FeedbackMode = mode === "quiz" ? "quiz" : "explain";

    if (feedbackMode === "quiz") {
        if (!isNonEmptyString(question)) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }
        if (!isNonEmptyString(expectedAnswer)) {
            return NextResponse.json({ error: "Expected answer is required" }, { status: 400 });
        }
    }

    // Check API key before calling Gemini.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
        );
    }

    // Call Gemini API for feedback.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
        },
    });

    // Build a smaller prompt for feedback.
    const lessonText =
        typeof lessonContext === "string" && lessonContext.trim().length > 0
            ? lessonContext.trim()
            : "Lesson summary not provided.";

    const promptParts: { text: string }[] =
        feedbackMode === "quiz"
            ? [
                  { text: QUIZ_FEEDBACK_PROMPT },
                  { text: `Question:\n${String(question).trim()}` },
                  { text: `Expected answer:\n${String(expectedAnswer).trim()}` },
                  {
                      text: isNonEmptyString(answerExplanation)
                          ? `Answer explanation:\n${String(answerExplanation).trim()}`
                          : "Answer explanation not provided.",
                  },
                  { text: formatSubtopicForFeedback(selectedSubtopic) },
                  { text: `Student answer:\n${studentAnswer.trim()}` },
              ]
            : [
                  { text: FEEDBACK_PROMPT },
                  { text: "LESSON SUMMARY:\n" + lessonText },
                  { text: formatSubtopicForFeedback(selectedSubtopic) },
                  { text: `Subject: ${subject}\nStudent answer:\n${studentAnswer.trim()}` },
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

    // Parse JSON; fall back to rules if the model fails.
    let parsed: unknown;
    try {
        parsed = parseJsonFromModel(text);
    } catch {
        const fallback = buildFallbackFeedback(
            studentAnswer.trim(),
            lessonText,
            selectedSubtopic.keyConcepts,
            selectedSubtopic.title
        );
        if (feedbackMode === "quiz" && isNonEmptyString(expectedAnswer)) {
            return NextResponse.json({
                feedback: {
                    ...fallback,
                    isCorrect: isExactMatch(studentAnswer.trim(), String(expectedAnswer).trim()),
                },
            });
        }
        return NextResponse.json({ feedback: fallback });
    }

    const feedback = normalizeFeedbackResponse(parsed);
    if (!feedback) {
        const fallback = buildFallbackFeedback(
            studentAnswer.trim(),
            lessonText,
            selectedSubtopic.keyConcepts,
            selectedSubtopic.title
        );
        if (feedbackMode === "quiz" && isNonEmptyString(expectedAnswer)) {
            return NextResponse.json({
                feedback: {
                    ...fallback,
                    isCorrect: isExactMatch(studentAnswer.trim(), String(expectedAnswer).trim()),
                },
            });
        }
        return NextResponse.json({ feedback: fallback });
    }

    if (feedbackMode === "quiz" && feedback.isCorrect === undefined && isNonEmptyString(expectedAnswer)) {
        feedback.isCorrect = isExactMatch(studentAnswer.trim(), String(expectedAnswer).trim());
    }

    return NextResponse.json({ feedback });
}
