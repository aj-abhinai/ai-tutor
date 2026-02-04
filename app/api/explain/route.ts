/**
 * /api/explain - AI Tutor API Route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject: "Science" | "Maths", topic: string }
 * Output: JSON with quickExplanation, stepByStep, practiceQuestion, answer
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getTopicKnowledge, formatKnowledgeForPrompt } from "@/lib/curriculum";

// Valid subjects for Standard 7
const VALID_SUBJECTS = ["Science", "Maths"] as const;
type Subject = typeof VALID_SUBJECTS[number];

type PracticeOption = { label: string; text: string };
type StepItem = {
    title: string;
    explanation: string;
    keyProperty?: string;
};
type TutorResponse = {
    quickExplanation: string;
    stepByStep: StepItem[];
    practiceQuestion: {
        question: string;
        options?: PracticeOption[];
        type: "mcq" | "short";
    };
    answer: {
        correct: string;
        explanation: string;
    };
    curiosityQuestion?: string;
};

// System prompt for friendly Class 7 tutor (from agent.md)
const SYSTEM_PROMPT = `You are a friendly tutor for Class 7 students.

Rules:
- Use simple language a 12-year-old can understand
- Start with a 2-3 sentence quick explanation. The first sentence must be a formal definition.
- Break it down step-by-step with examples from daily life and one key property per step
- Be encouraging and friendly ("Great question!", "You've got this!")
- Include ONE practice question (MCQ with 4 options)
- Give the answer with a short explanation
- Use LaTeX for math equations (wrap in $...$ for inline)
- Keep it SHORT - no long paragraphs
- Base content on NCERT Class 7 textbook
- Return only JSON with no markdown or code fences
- Use option labels A, B, C, D
- Add a curiosity question that starts with Why or How
- Do not use markdown symbols like **, *, #, or bullets in any field

Output strictly in this JSON format:
{
  "quickExplanation": "2-3 sentences explaining the concept simply",
  "stepByStep": [
    {
      "title": "Observation",
      "explanation": "Explain the step in 1-2 sentences with a simple example.",
      "keyProperty": "One key property of this step."
    }
  ],
  "practiceQuestion": {
    "question": "A simple question to check understanding",
    "options": [
      { "label": "A", "text": "Option A" },
      { "label": "B", "text": "Option B" },
      { "label": "C", "text": "Option C" },
      { "label": "D", "text": "Option D" }
    ],
    "type": "mcq"
  },
  "answer": {
    "correct": "A",
    "explanation": "Short explanation why this is correct"
  },
  "curiosityQuestion": "A short Why/How question to explore further"
}
`;

const MAX_TOPIC_LENGTH = 200;

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

function normalizeOptions(raw: unknown): PracticeOption[] {
    if (!Array.isArray(raw)) return [];
    const options: PracticeOption[] = [];

    for (const entry of raw) {
        if (!entry || typeof entry !== "object") continue;
        const label = (entry as { label?: unknown }).label;
        const text = (entry as { text?: unknown }).text;
        if (!isNonEmptyString(label) || !isNonEmptyString(text)) continue;
        options.push({ label: label.trim().toUpperCase(), text: text.trim() });
    }

    return options;
}

function normalizeSteps(raw: unknown): StepItem[] | null {
    if (Array.isArray(raw)) {
        const steps: StepItem[] = [];
        for (const entry of raw) {
            if (!entry || typeof entry !== "object") continue;
            const title = (entry as { title?: unknown }).title;
            const explanation = (entry as { explanation?: unknown }).explanation;
            const keyProperty = (entry as { keyProperty?: unknown }).keyProperty;

            if (!isNonEmptyString(title) || !isNonEmptyString(explanation)) continue;
            steps.push({
                title: title.trim(),
                explanation: explanation.trim(),
                keyProperty: isNonEmptyString(keyProperty) ? keyProperty.trim() : undefined,
            });
        }
        return steps.length > 0 ? steps : null;
    }

    return null;
}

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

function normalizeTutorResponse(raw: unknown): TutorResponse | null {
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const quickExplanation = obj.quickExplanation;
    const stepByStep = obj.stepByStep;
    const practiceQuestion = obj.practiceQuestion;
    const answer = obj.answer;
    const curiosityQuestion = obj.curiosityQuestion;

    if (!isNonEmptyString(quickExplanation)) return null;
    if (!practiceQuestion || typeof practiceQuestion !== "object") return null;
    if (!answer || typeof answer !== "object") return null;

    const question = (practiceQuestion as { question?: unknown }).question;
    const optionsRaw = (practiceQuestion as { options?: unknown }).options;
    const answerCorrect = (answer as { correct?: unknown }).correct;
    const answerExplanation = (answer as { explanation?: unknown }).explanation;

    if (
        !isNonEmptyString(question) ||
        !isNonEmptyString(answerCorrect) ||
        !isNonEmptyString(answerExplanation)
    ) {
        return null;
    }

    const steps = normalizeSteps(stepByStep);
    if (!steps) return null;

    const options = normalizeOptions(optionsRaw);
    const curiosity = isNonEmptyString(curiosityQuestion) ? curiosityQuestion.trim() : "";
    if (options.length >= 2) {
        const correct = answerCorrect.trim().toUpperCase();
        const labels = new Set(options.map((opt) => opt.label));
        if (!labels.has(correct)) return null;

        return {
            quickExplanation: quickExplanation.trim(),
            stepByStep: steps,
            practiceQuestion: {
                question: question.trim(),
                options,
                type: "mcq",
            },
            answer: {
                correct,
                explanation: answerExplanation.trim(),
            },
            curiosityQuestion: curiosity || undefined,
        };
    }

    return {
        quickExplanation: quickExplanation.trim(),
        stepByStep: steps,
        practiceQuestion: {
            question: question.trim(),
            type: "short",
        },
        answer: {
            correct: answerCorrect.trim(),
            explanation: answerExplanation.trim(),
        },
        curiosityQuestion: curiosity || undefined,
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

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { subject, topic } = body as { subject?: unknown; topic?: unknown };

    // Validate subject
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

    // Validate topic
    if (!topic || typeof topic !== "string") {
        return NextResponse.json(
            { error: "Topic is required" },
            { status: 400 }
        );
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length === 0) {
        return NextResponse.json(
            { error: "Topic cannot be empty" },
            { status: 400 }
        );
    }

    if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
        return NextResponse.json(
            { error: `Topic must be ${MAX_TOPIC_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
        );
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
    });

    // Build the prompt with curriculum knowledge if available
    const topicKnowledge = getTopicKnowledge(subject, trimmedTopic);
    const promptParts: { text: string }[] = [
        { text: SYSTEM_PROMPT },
    ];

    // Inject curriculum knowledge if we have it for this topic
    if (topicKnowledge) {
        promptParts.push({
            text: formatKnowledgeForPrompt(topicKnowledge),
        });
    }

    promptParts.push({
        text: `Subject: ${subject}\nTopic: "${trimmedTopic}"`,
    });

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

    let parsed: unknown;
    try {
        parsed = parseJsonFromModel(text);
    } catch {
        return NextResponse.json(
            { error: "Model returned invalid JSON. Please try again." },
            { status: 502 }
        );
    }

    const normalized = normalizeTutorResponse(parsed);
    if (!normalized) {
        return NextResponse.json(
            { error: "Model returned an unexpected response. Please try again." },
            { status: 502 }
        );
    }

    return NextResponse.json({ content: normalized });
}
