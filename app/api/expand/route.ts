/**
 * /api/expand - Deeper explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId }
 * Output: JSON with expanded explanation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getSubtopicById, formatSubtopicForPrompt } from "@/lib/curriculum";

// Valid subjects for Standard 7
const VALID_SUBJECTS = ["Science", "Maths"] as const;
type Subject = typeof VALID_SUBJECTS[number];

type TutorExpandResponse = {
  expandedExplanation: string;
  analogy: string;
  whyItMatters: string;
  commonConfusion: string;
};

const EXPAND_PROMPT = `You are a friendly Class 7 tutor.

Task:
Give a deeper explanation of the subtopic using simple words.

Rules:
- Use simple language a 12-year-old understands
- Be kind and encouraging
- Add one short analogy
- Add one short "why it matters"
- Add one common confusion and fix it gently
- Keep it short, no long paragraphs
- Return only JSON, no markdown or code fences
- Do not use markdown symbols like **, *, #, or bullets in any field

Output strictly in this JSON format:
{
  "expandedExplanation": "3-5 simple sentences",
  "analogy": "A short analogy",
  "whyItMatters": "A short line on why it matters",
  "commonConfusion": "A short confusion + correction"
}
`;

const MAX_ID_LENGTH = 120;

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

function normalizeExpandResponse(raw: unknown): TutorExpandResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const expandedExplanation = obj.expandedExplanation;
  const analogy = obj.analogy;
  const whyItMatters = obj.whyItMatters;
  const commonConfusion = obj.commonConfusion;

  if (
    !isNonEmptyString(expandedExplanation) ||
    !isNonEmptyString(analogy) ||
    !isNonEmptyString(whyItMatters) ||
    !isNonEmptyString(commonConfusion)
  ) {
    return null;
  }

  return {
    expandedExplanation: expandedExplanation.trim(),
    analogy: analogy.trim(),
    whyItMatters: whyItMatters.trim(),
    commonConfusion: commonConfusion.trim(),
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

  const { subject, chapterId, topicId, subtopicId } = body as {
    subject?: unknown;
    chapterId?: unknown;
    topicId?: unknown;
    subtopicId?: unknown;
  };

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

  if (!isNonEmptyString(chapterId)) {
    return NextResponse.json({ error: "Chapter is required" }, { status: 400 });
  }

  if (!isNonEmptyString(topicId)) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (!isNonEmptyString(subtopicId)) {
    return NextResponse.json({ error: "Subtopic is required" }, { status: 400 });
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

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Call Gemini API
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const promptParts: { text: string }[] = [
    { text: EXPAND_PROMPT },
    { text: formatSubtopicForPrompt(selectedSubtopic) },
    { text: `Subject: ${subject}\nSubtopic: "${selectedSubtopic.title}"` },
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

  let parsed: unknown;
  try {
    parsed = parseJsonFromModel(text);
  } catch {
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Model returned invalid JSON. Please try again.", details: text }
        : { error: "Model returned invalid JSON. Please try again." },
      { status: 502 }
    );
  }

  const expanded = normalizeExpandResponse(parsed);
  if (!expanded) {
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? {
            error: "Model returned an unexpected response. Please try again.",
            details: parsed,
          }
        : { error: "Model returned an unexpected response. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ expanded });
}
