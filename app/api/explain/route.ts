/**
 * /api/explain - AI Tutor API Route
 * 
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject: "Science" | "Maths", topic: string }
 * Output: JSON with quickExplanation, stepByStep, practiceQuestion, answer
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Valid subjects for Standard 7
const VALID_SUBJECTS = ["Science", "Maths"] as const;
type Subject = typeof VALID_SUBJECTS[number];

// System prompt for friendly Class 7 tutor (from agent.md)
const SYSTEM_PROMPT = `You are a friendly tutor for Class 7 students.

Rules:
- Use simple language a 12-year-old can understand
- Start with a 2-3 sentence quick explanation
- Break it down step-by-step with examples from daily life
- Be encouraging and friendly ("Great question!", "You've got this!")
- Include ONE practice question (MCQ with 4 options)
- Give the answer with a short explanation
- Use LaTeX for math equations (wrap in $...$ for inline)
- Keep it SHORT - no long paragraphs
- Base content on NCERT Class 7 textbook

Output strictly in this JSON format:
{
  "quickExplanation": "2-3 sentences explaining the concept simply",
  "stepByStep": "Step-by-step breakdown with everyday examples",
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
  }
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

export async function POST(request: NextRequest) {
    // Rate limit check
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please try again shortly." },
            { status: 429 }
        );
    }

    const body = await request.json();
    const { subject, topic } = body;

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
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `Subject: ${subject}\nTopic: "${trimmedTopic}"` },
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ content: JSON.parse(text) });
}
