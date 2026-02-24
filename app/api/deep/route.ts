/**
 * /api/deep - Deep explanation route
 *
 * Standard 7 NCERT Interactive Tutor
 * Input: { subject, chapterId, topicId, subtopicId }
 * Output: JSON with deepEssay
 */

import { type GenerativeModel } from "@google/generative-ai";
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
const DEEP_PROMPT_JSON = `You are a friendly tutor for Class 7 students.

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

const STREAM_HEADERS = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

function shouldStreamResponse(request: NextRequest): boolean {
  const streamHeader = request.headers.get("x-ai-stream");
  if (streamHeader === "1" || streamHeader === "true") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/x-ndjson");
}

function sanitizeDeepEssay(text: string): string {
  const cleaned = text
    .replace(/^```(?:html)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return cleaned;
}

function decodeEscapedChar(value: string): string {
  if (value === "n") return "\n";
  if (value === "r") return "\r";
  if (value === "t") return "\t";
  if (value === "\\" || value === "\"" || value === "/" || value === "b" || value === "f") {
    return value === "b" ? "\b" : value === "f" ? "\f" : value;
  }
  return value;
}

// Incrementally extract deepEssay text when the model streams JSON.
function extractDeepEssayPreview(raw: string): string | null {
  const keyMatch = /"deepEssay"\s*:\s*"/.exec(raw);
  if (!keyMatch || keyMatch.index === undefined) return null;

  let cursor = keyMatch.index + keyMatch[0].length;
  let escaped = false;
  let preview = "";

  while (cursor < raw.length) {
    const char = raw[cursor];
    if (escaped) {
      preview += decodeEscapedChar(char);
      escaped = false;
      cursor += 1;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      cursor += 1;
      continue;
    }

    if (char === "\"") {
      break;
    }

    preview += char;
    cursor += 1;
  }

  return preview;
}

function resolveStreamPreview(raw: string): string {
  const deepPreview = extractDeepEssayPreview(raw);
  if (deepPreview !== null) return deepPreview;

  // If output still looks like top-level JSON, wait until deepEssay appears.
  if (raw.trimStart().startsWith("{")) return "";

  // Fallback for plain-text model output.
  return sanitizeDeepEssay(raw);
}

function createNdjsonLine(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
}

function splitForProgressiveStreaming(htmlChunk: string): string[] {
  const tokens = htmlChunk.match(/<[^>]*>|[^<]+/g) ?? [htmlChunk];
  const pieces: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("<")) {
      pieces.push(token);
      continue;
    }

    const words = token.match(/\S+\s*|\s+/g) ?? [token];
    let buffer = "";

    for (const word of words) {
      buffer += word;
      if (buffer.length >= 24 || /[.!?]\s*$/.test(buffer)) {
        pieces.push(buffer);
        buffer = "";
      }
    }

    if (buffer) {
      pieces.push(buffer);
    }
  }

  return pieces;
}

function streamDeepEssay(model: GenerativeModel, promptParts: { text: string }[]): NextResponse {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let generatedText = "";
      let lastPreview = "";

      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(createNdjsonLine(payload));
      };

      try {
        const result = await model.generateContentStream(promptParts);
        for await (const chunk of result.stream) {
          const delta = chunk.text();
          if (!isNonEmptyString(delta)) continue;
          generatedText += delta;
          const preview = resolveStreamPreview(generatedText);
          if (!preview.startsWith(lastPreview)) {
            lastPreview = preview;
            continue;
          }

          const nextDelta = preview.slice(lastPreview.length);
          if (nextDelta) {
            const pieces = splitForProgressiveStreaming(nextDelta);
            for (const piece of pieces) {
              send({ type: "chunk", delta: piece });
            }
            lastPreview = preview;
          }
        }

        let deepEssay = "";
        try {
          const parsed = parseJsonFromModel(generatedText) as Record<string, unknown>;
          deepEssay = isNonEmptyString(parsed.deepEssay) ? parsed.deepEssay.trim() : "";
        } catch {
          deepEssay = sanitizeDeepEssay(generatedText);
        }
        if (!isNonEmptyString(deepEssay)) {
          send({ type: "error", error: "Model returned an empty deep explanation.", code: "AI_FAILURE" });
        } else {
          send({ type: "done", deepEssay });
        }
      } catch (err) {
        console.error("Gemini generateContentStream failed:", err);
        const details = err instanceof Error ? err.message : String(err);
        send(
          process.env.NODE_ENV !== "production"
            ? { type: "error", error: "Failed to generate response. Please try again.", code: "AI_FAILURE", details }
            : { type: "error", error: "Failed to generate response. Please try again.", code: "AI_FAILURE" },
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, { headers: STREAM_HEADERS });
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

  const wantsStream = shouldStreamResponse(request);

  // Build prompt and call Gemini.
  const promptParts: { text: string }[] = [
    { text: DEEP_PROMPT_JSON },
    { text: formatSubtopicForPrompt(subtopic) },
    { text: `Subject: ${subject}\nSubtopic: "${subtopic.title}"` },
  ];

  if (wantsStream) {
    return streamDeepEssay(model, promptParts);
  }

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
