/**
 * /api/explore - AI Explorer API Route
 *
 * Free-form AI search using Gemini
 * Input: { query, subjects[], topics[] }
 * Output: JSON with answer, sources
 */

import { NextRequest, NextResponse } from "next/server";
import { createGeminiModel, createRateLimiter, getRequestUserId, hasAiRouteAccess, isNonEmptyString } from "@/lib/api/shared";

const MAX_QUERY_LENGTH = 2000;
const VALID_SUBJECTS = ["science", "maths"] as const;
const rateLimiter = createRateLimiter(60 * 1000, 10);

interface ExploreBody {
  query: string;
  subjects?: string[];
  topics?: string[];
}

const EXPLORE_PROMPT = `You are a helpful AI tutor. Answer the user's question directly.

Rules:
- Use simple words appropriate for a 12-year-old
- Explain concepts step-by-step  
- Use examples when helpful
- If you don't know something, honestly say so
- Keep answers concise but complete
- Use bullet points (•) for lists
- Do not use emojis
- Do not add conversational endings like "I'm here to help!"

User's question: `;

// POST /api/explore - AI search endpoint
export async function POST(request: NextRequest) {
  const originCheck = hasAiRouteAccess(request);
  if (!originCheck) {
    return NextResponse.json(
      { error: "Invalid origin" },
      { status: 403 }
    );
  }

  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const rateLimitKey = userId || request.headers.get("x-forwarded-for") || "unknown";
  
  if (await rateLimiter(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json() as ExploreBody;
    
    if (!isNonEmptyString(body.query)) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const query = body.query.trim();
    
    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` },
        { status: 400 }
      );
    }

    const subjects = (body.subjects || []).filter((s: unknown): s is string => 
      typeof s === "string" && VALID_SUBJECTS.includes(s.toLowerCase() as typeof VALID_SUBJECTS[number])
    );
    const topics = (body.topics || []).filter((t: unknown): t is string => 
      typeof t === "string" && t.length > 0 && t.length <= 100
    ).map((t: string) => t.trim().slice(0, 100));

    const model = createGeminiModel("gemini-2.5-flash-lite");
    
    if (!model) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    let context = "";
    if (subjects.length > 0 || topics.length > 0) {
      context += `\n\nRelevant subjects: ${subjects.join(", ")}\n`;
      context += `Relevant topics: ${topics.join(", ")}\n`;
    }

    const prompt = `${EXPLORE_PROMPT}${context}\n\n${query}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    if (!answer) {
      return NextResponse.json(
        { error: "No answer generated. Please try again." },
        { status: 500 }
      );
    }

    const sources: string[] = [];
    if (subjects.includes("science")) sources.push("Science");
    if (subjects.includes("maths")) sources.push("Maths");
    topics.forEach(t => sources.push(t.charAt(0).toUpperCase() + t.slice(1)));
    if (sources.length === 0) sources.push("General Knowledge");

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to generate answer", details }
        : { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
