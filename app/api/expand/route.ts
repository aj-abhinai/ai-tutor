/**
 * /api/expand - Deeper explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId, level }
 * Output: JSON with expanded explanation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSubtopicById, formatSubtopicForPrompt } from "@/lib/curriculum";
import {
  createGeminiModel,
  createRateLimiter,
  getRateLimitKey,
  hasAiRouteAccess,
  isNonEmptyString,
  isValidSubject,
  MAX_ID_LENGTH,
  parseJsonFromModel,
} from "@/lib/api/shared";

type ExplainLevel = "simple" | "standard" | "deep";
const VALID_LEVELS: ExplainLevel[] = ["simple", "standard", "deep"];

type TutorExpandResponse = {
  expandedExplanation: string;
  analogy: string;
  whyItMatters: string;
  commonConfusion: string;
};

// Prompt for expanded explanations at different depth levels.
const EXPAND_PROMPT = `You are a friendly Class 7 tutor.

Task:
Give an explanation of the subtopic using simple words.

Rules:
- Use simple language a 12-year-old understands
- Be kind and encouraging
- Respect the requested explanation level
- For simple and standard, stay within the given textbook context
- For deep, you may extend slightly beyond the textbook (up to Class 9 level), but keep it tightly related
- Add one short analogy
- Add one short "why it matters"
- Add one common confusion and fix it gently
- Keep it short, no long paragraphs
- Return only JSON, no markdown or code fences
- Do not use markdown symbols like **, *, #, or bullets in any field

Explanation levels:
- simple: 2-3 short sentences that cover the core idea (no extra example)
- standard: 3-5 short sentences including one real-life example
- deep: 5-7 short sentences including one real-life example plus one slightly advanced detail (Class 9 level)

Output strictly in this JSON format:
{
  "expandedExplanation": "Use the level guidance above",
  "analogy": "A short analogy",
  "whyItMatters": "A short line on why it matters",
  "commonConfusion": "A short confusion + correction"
}
`;

// Route-level rate limiting.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

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
  const clientKey = getRateLimitKey(request);
  if (await isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again shortly." },
      { status: 429 }
    );
  }

  if (!hasAiRouteAccess(request)) {
    return NextResponse.json(
      { error: "Unauthorized request origin for AI endpoint." },
      { status: 401 }
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

  const { subject, chapterId, topicId, subtopicId, level } = body as {
    subject?: unknown;
    chapterId?: unknown;
    topicId?: unknown;
    subtopicId?: unknown;
    level?: unknown;
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
    return NextResponse.json({ error: "Chapter is required" }, { status: 400 });
  }

  if (!isNonEmptyString(topicId)) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  if (!isNonEmptyString(subtopicId)) {
    return NextResponse.json({ error: "Subtopic is required" }, { status: 400 });
  }

  let explainLevel: ExplainLevel = "standard";
  if (isNonEmptyString(level)) {
    const normalized = level.trim().toLowerCase();
    if (VALID_LEVELS.includes(normalized as ExplainLevel)) {
      explainLevel = normalized as ExplainLevel;
    } else {
      return NextResponse.json(
        { error: "Level must be simple, standard, or deep" },
        { status: 400 }
      );
    }
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

  const model = createGeminiModel("gemini-2.5-flash-lite", {
    responseMimeType: "application/json",
    temperature: 0.3,
  });
  if (!model) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const promptParts: { text: string }[] = [
    { text: EXPAND_PROMPT },
    { text: formatSubtopicForPrompt(selectedSubtopic) },
    { text: `Subject: ${subject}\nSubtopic: "${selectedSubtopic.title}"\nLevel: ${explainLevel}` },
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
        ? {
          error: "Model returned an unexpected response. Please try again.",
          details: text,
        }
        : { error: "Model returned an unexpected response. Please try again." },
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

  return NextResponse.json(expanded);
}
