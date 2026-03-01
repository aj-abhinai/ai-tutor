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
const MAX_SUBJECT_FILTERS = 5;
const MAX_TOPIC_FILTERS = 20;
const MAX_TOPIC_LENGTH = 100;
const VALID_SUBJECTS = ["science", "maths"] as const;
const MINUTE_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MINUTE_RATE_LIMIT_MAX_REQUESTS = 5;
const DAILY_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_RATE_LIMIT_MAX_REQUESTS = 50;
const minuteRateLimiter = createRateLimiter(MINUTE_RATE_LIMIT_WINDOW_MS, MINUTE_RATE_LIMIT_MAX_REQUESTS);
const dailyRateLimiter = createRateLimiter(DAILY_RATE_LIMIT_WINDOW_MS, DAILY_RATE_LIMIT_MAX_REQUESTS);

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

  const routePath = request.nextUrl.pathname || "/api/explore";
  const rateLimitBaseKey = `${routePath}:user:${userId}`;

  if (await minuteRateLimiter(`${rateLimitBaseKey}:minute`)) {
    return NextResponse.json(
      { error: "Rate limit exceeded: maximum 5 requests per minute." },
      { status: 429 }
    );
  }

  if (await dailyRateLimiter(`${rateLimitBaseKey}:day`)) {
    return NextResponse.json(
      { error: "Daily limit reached: maximum 50 requests per day." },
      { status: 429 }
    );
  }

  try {
    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = rawBody as ExploreBody;
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

    const subjectValues = Array.isArray(body.subjects)
      ? body.subjects.slice(0, MAX_SUBJECT_FILTERS)
      : [];
    const topicValues = Array.isArray(body.topics)
      ? body.topics.slice(0, MAX_TOPIC_FILTERS)
      : [];

    const subjects = Array.from(
      new Set(
        subjectValues.filter((s: unknown): s is string =>
          typeof s === "string" && VALID_SUBJECTS.includes(s.toLowerCase() as typeof VALID_SUBJECTS[number])
        )
      )
    );
    const topics = Array.from(
      new Set(
        topicValues
          .filter((t: unknown): t is string => typeof t === "string")
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0 && t.length <= MAX_TOPIC_LENGTH)
      )
    );

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
