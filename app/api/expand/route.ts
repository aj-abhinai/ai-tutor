/**
 * /api/expand - Deeper explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId, level }
 * Output: JSON with expanded explanation
 */

import { NextRequest, NextResponse } from "next/server";
import { formatSubtopicForPrompt } from "@/lib/subtopic-content";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { ExpandBodySchema } from "@/lib/api/validation";
import {
  createGeminiModel,
  hasAiRouteAccess,
  isNonEmptyString,
  parseJsonFromModel,
} from "@/lib/api/shared";

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

// Validate and normalize model output into the expected shape.
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
  // Route-specific: AI access check.
  if (!hasAiRouteAccess(request)) {
    return NextResponse.json(
      { error: "Unauthorized request origin for AI endpoint.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  // Shared validation: rate limit, parse body, validate fields, Firestore lookup.
  const result = await parseCurriculumRequest(request, ExpandBodySchema);
  if (!result.ok) return result.response;
  const { subtopic, subject, body } = result.data;
  const { level } = body; // Zod already validated + defaulted to "standard"

  const model = createGeminiModel("gemini-2.5-flash-lite", {
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
    { text: EXPAND_PROMPT },
    { text: formatSubtopicForPrompt(subtopic) },
    { text: `Subject: ${subject}\nSubtopic: "${subtopic.title}"\nLevel: ${level}` },
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
        ? { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE", details: text }
        : { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE" },
      { status: 502 },
    );
  }

  const expanded = normalizeExpandResponse(parsed);
  if (!expanded) {
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE", details: parsed }
        : { error: "Model returned an unexpected response. Please try again.", code: "AI_FAILURE" },
      { status: 502 },
    );
  }

  return NextResponse.json(expanded);
}
