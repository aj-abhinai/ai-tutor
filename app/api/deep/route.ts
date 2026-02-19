/**
 * /api/deep - Deep explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId }
 * Output: JSON with deepEssay
 */

import { NextRequest, NextResponse } from "next/server";
import { formatSubtopicForPrompt } from "@/lib/subtopic-content";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { CurriculumBodySchema } from "@/lib/api/validation";
import {
  createGeminiModel,
  hasAiRouteAccess,
  isNonEmptyString,
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

export async function POST(request: NextRequest) {
  // Route-specific: AI access check.
  if (!hasAiRouteAccess(request)) {
    return NextResponse.json(
      { error: "Unauthorized request origin for AI endpoint.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  // Shared validation: rate limit, parse body, validate fields, Firestore lookup.
  const result = await parseCurriculumRequest(request, CurriculumBodySchema);
  if (!result.ok) return result.response;
  const { subtopic, subject } = result.data;

  const model = createGeminiModel("gemini-2.5-flash", {
    responseMimeType: "application/json",
    temperature: 0.3,
  });
  if (!model) {
    return NextResponse.json(
      { error: "Server configuration error", code: "AI_UNAVAILABLE" },
      { status: 500 },
    );
  }

  // Build prompt and call Gemini.
  const promptParts: { text: string }[] = [
    { text: DEEP_PROMPT },
    { text: formatSubtopicForPrompt(subtopic) },
    { text: `Subject: ${subject}\nSubtopic: "${subtopic.title}"` },
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
      process.env.NODE_ENV !== "production"
        ? { error: "Model returned invalid JSON. Please try again.", code: "AI_FAILURE", details: text }
        : { error: "Model returned invalid JSON. Please try again.", code: "AI_FAILURE" },
      { status: 502 },
    );
  }

  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json(
      { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE" },
      { status: 502 },
    );
  }

  const deepEssay = (parsed as Record<string, unknown>).deepEssay;
  if (!isNonEmptyString(deepEssay)) {
    return NextResponse.json(
      { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE" },
      { status: 502 },
    );
  }

  return NextResponse.json({ deepEssay: deepEssay.trim() });
}
