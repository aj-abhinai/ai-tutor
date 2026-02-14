/**
 * /api/deep - Deep explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId }
 * Output: JSON with deepEssay
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

// Prompt for deep, structured explanations.
const DEEP_PROMPT = `You are a friendly tutor for Class 7 students.

Task:
Write a deep, academic explanation of the subtopic.

Rules:
- Use simple but academic language a 12-year-old can follow
- Stay within the provided textbook context
- You may add one small Class 9 level detail if it helps depth
- Make it longer than a normal explanation
- Include the following sections in order:
  1) Definition (formal)
  2) Big idea (short paragraph)
  3) Classification or parts (numbered list)
  4) Key terms (bulleted list)
  5) Real-life applications (bulleted list)
  6) Common confusion (short correction)
- Use HTML tags only: <p>, <strong>, <ol>, <ul>, <li>
- Do not use markdown symbols like **, *, #, or bullets in plain text
- Return only JSON, no markdown or code fences

Output strictly in this JSON format:
{
  "deepEssay": "<p>...</p><p>...</p><ol>...</ol><ul>...</ul><ul>...</ul><p>...</p>"
}
`;


// Route-level rate limiting.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);



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

  const { subject, chapterId, topicId, subtopicId } = body as {
    subject?: unknown;
    chapterId?: unknown;
    topicId?: unknown;
    subtopicId?: unknown;
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

  const model = createGeminiModel("gemini-2.5-flash", {
    responseMimeType: "application/json",
    temperature: 0.3,
  });
  if (!model) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const promptParts: { text: string }[] = [
    { text: DEEP_PROMPT },
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

  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json(
      { error: "Model returned an unexpected response. Please try again." },
      { status: 502 }
    );
  }

  const deepEssay = (parsed as Record<string, unknown>).deepEssay;
  if (!isNonEmptyString(deepEssay)) {
    return NextResponse.json(
      { error: "Model returned an unexpected response. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ deepEssay: deepEssay.trim() });
}
