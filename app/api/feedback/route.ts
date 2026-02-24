/**
 * /api/feedback - Explain-it-back + quiz feedback route
 *
 * Input:
 * {
 *   subject, chapterId, topicId, subtopicId,
 *   studentAnswer,
 *   lessonContext?,
 *   mode?, question?, expectedAnswer?, answerExplanation?
 * }
 *
 * Output:
 * { feedback: { rating, praise, fix, rereadTip, isCorrect? } }
 */

import { type GenerativeModel } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { formatSubtopicForFeedback } from "@/lib/subtopic-content";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { FeedbackBodySchema } from "@/lib/api/validation";
import {
  createGeminiModel,
  hasAiRouteAccess,
  isNonEmptyString,
  parseJsonFromModel,
} from "@/lib/api/shared";

type FeedbackMode = "explain" | "quiz";
type FeedbackRating = "great" | "good start" | "needs work";

type TutorFeedbackResponse = {
  rating: FeedbackRating;
  praise: string;
  fix: string;
  rereadTip: string;
  isCorrect?: boolean;
};

const MAX_QUESTION_LENGTH = 400;
const MAX_EXPECTED_ANSWER_LENGTH = 400;
const MAX_ANSWER_EXPLANATION_LENGTH = 700;
const MAX_LESSON_CONTEXT_LENGTH = 1600;
const MAX_FIELD_LENGTH = 240;

const BASE_PROMPT_JSON = `You are a warm, encouraging NCERT Class 7 teacher who loves helping students learn.

Task:
Evaluate the student's answer and give kind, helpful feedback.

Your personality:
- You are like a supportive older sibling helping with homework.
- Never be harsh, sarcastic, or discouraging.
- Use simple words that a 12-year-old understands.
- Keep each field short (1-2 lines max).

Rating guide:
- "great" = the core idea is correct
- "good start" = partially correct or on the right track
- "needs work" = the idea is mostly wrong, but still encourage to try again

Rules:
- For "praise": Only mention something the student actually got RIGHT. If NOTHING is correct, just say "Good effort trying to answer!" and do NOT invent correct points.
- For "fix": Clearly state what is wrong with the student's answer, then give the CORRECT answer in simple words.
- For "rereadTip": Name the specific section or concept the student should revisit.
- Do NOT praise an incorrect idea as correct.
- Return strict JSON only. No markdown, no extra text.

Return exactly:
{
  "isCorrect": true | false,
  "rating": "great" | "good start" | "needs work",
  "praise": "Appreciate the effort or what they got right",
  "fix": "Gently explain what is wrong and give the correct answer",
  "rereadTip": "Which specific topic or concept to re-read"
}`;

const BASE_PROMPT_STREAM = `You are a warm, encouraging NCERT Class 7 teacher who loves helping students learn.

Task:
Evaluate the student's answer and give kind, helpful feedback.

Rules:
- Use simple words that a 12-year-old understands
- Keep output concise
- Do not use markdown
- Output exactly these labels, one per line

Output format:
RATING: great | good start | needs work
ISCORRECT: true | false
PRAISE: one short line
FIX: one short line
REREADTIP: one short line`;

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

function createNdjsonLine(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`);
}

function isLikelyGibberish(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return true;
  const totalChars = trimmed.length;
  const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const digits = (trimmed.match(/[0-9]/g) ?? []).length;
  const vowels = (trimmed.match(/[AEIOUaeiou]/g) ?? []).length;
  const words = trimmed.match(/[A-Za-z]+/g) ?? [];
  const wordCount = words.length;
  const letterRatio = totalChars > 0 ? letters / totalChars : 0;
  const digitRatio = totalChars > 0 ? digits / totalChars : 0;
  const avgWordLen =
    wordCount > 0 ? words.reduce((sum, word) => sum + word.length, 0) / wordCount : 0;
  const vowelRatio = letters > 0 ? vowels / letters : 0;

  // Heuristic: symbol-heavy text or extremely consonant-heavy words are likely junk.
  if (totalChars >= 25 && (letterRatio < 0.6 || digitRatio > 0.25)) return true;
  if (avgWordLen >= 8 && vowelRatio < 0.25) return true;
  return false;
}

function trimField(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_FIELD_LENGTH);
}

function normalizeRating(value: string): FeedbackRating | null {
  const lowered = value.trim().toLowerCase();
  if (lowered === "great" || lowered === "good start" || lowered === "needs work") {
    return lowered;
  }
  if (lowered === "correct") return "great";
  if (lowered === "partially correct") return "good start";
  if (lowered === "incorrect") return "needs work";
  return null;
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "yes", "correct"].includes(lowered)) return true;
    if (["false", "no", "incorrect"].includes(lowered)) return false;
  }
  return undefined;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (isNonEmptyString(value)) return value.trim();
  }
  return null;
}

function normalizeFeedbackResponse(raw: unknown): TutorFeedbackResponse | null {
  if (!raw || typeof raw !== "object") return null;
  let obj = raw as Record<string, unknown>;
  if (obj.feedback && typeof obj.feedback === "object") {
    obj = obj.feedback as Record<string, unknown>;
  }

  // Accept common alternative key names to make model parsing tolerant.
  const ratingRaw = pickString(obj, ["rating", "result", "score"]);
  const praiseRaw = pickString(obj, ["praise", "positive", "strength", "right", "whatWasRight"]);
  const fixRaw = pickString(obj, ["fix", "improve", "improvement", "missing", "wrong", "whatToFix"]);
  const rereadRaw = pickString(obj, ["rereadTip", "reread", "review", "next", "reReadTip", "reread_tip"]);
  const isCorrectRaw = obj.isCorrect ?? obj.correct ?? obj.is_correct;

  if (!ratingRaw || !praiseRaw || !fixRaw || !rereadRaw) {
    return null;
  }

  const rating = normalizeRating(ratingRaw);
  if (!rating) return null;

  return {
    rating,
    praise: trimField(praiseRaw),
    fix: trimField(fixRaw),
    rereadTip: trimField(rereadRaw),
    isCorrect: parseBoolean(isCorrectRaw),
  };
}

function normalizeStreamFeedbackResponse(rawText: string): TutorFeedbackResponse | null {
  const text = rawText
    .replace(/^```(?:text|markdown)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!text) return null;

  const labelPattern = /(RATING|ISCORRECT|PRAISE|FIX|REREADTIP)\s*:/gi;
  const matches = [...text.matchAll(labelPattern)];
  if (matches.length === 0) return null;

  const values: Record<string, string> = {};
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    if (current.index === undefined) continue;
    const label = current[1]?.toUpperCase();
    if (!label) continue;
    const valueStart = current.index + current[0].length;
    const valueEnd = next?.index ?? text.length;
    values[label] = text.slice(valueStart, valueEnd).trim();
  }

  const rating = normalizeRating(values.RATING ?? "");
  const praise = values.PRAISE ? trimField(values.PRAISE) : null;
  const fix = values.FIX ? trimField(values.FIX) : null;
  const rereadTip = values.REREADTIP ? trimField(values.REREADTIP) : null;
  const isCorrect = parseBoolean(values.ISCORRECT ?? "");

  if (!rating || !praise || !fix || !rereadTip) return null;
  return { rating, praise, fix, rereadTip, isCorrect };
}

function forceStrictNeedsWork(
  focusIdea: string,
  reason: "gibberish" | "too_short" | "no_overlap",
): TutorFeedbackResponse {
  if (reason === "gibberish") {
    return {
      rating: "needs work",
      isCorrect: false,
      praise: "I could not understand your explanation yet.",
      fix: "Write 1-2 clear sentences with the correct concept.",
      rereadTip: `Re-read: ${focusIdea}`,
    };
  }

  if (reason === "too_short") {
    return {
      rating: "needs work",
      isCorrect: false,
      praise: "Your answer is too short to check properly.",
      fix: "Write at least one complete sentence with the main concept.",
      rereadTip: `Re-read: ${focusIdea}`,
    };
  }

  return {
    rating: "needs work",
    isCorrect: false,
    praise: "I could not find the main idea in your answer yet.",
    fix: "Correct the concept and explain it in one clear sentence.",
    rereadTip: `Re-read: ${focusIdea}`,
  };
}

async function generateStructuredFeedback(
  promptParts: { text: string }[],
  modelName = "gemini-2.5-flash-lite",
): Promise<unknown> {
  const model = createGeminiModel(modelName, {
    responseMimeType: "application/json",
    temperature: 0.1,
  });
  if (!model) throw new Error("missing_api_key");
  const result = await model.generateContent(promptParts);
  const text = result.response.text();
  return parseJsonFromModel(text);
}

function streamStructuredFeedback(
  model: GenerativeModel,
  promptParts: { text: string }[],
  focusIdea: string,
): NextResponse {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(createNdjsonLine(payload));
      };

      let generatedText = "";
      try {
        const result = await model.generateContentStream(promptParts);
        for await (const chunk of result.stream) {
          const delta = chunk.text();
          if (!isNonEmptyString(delta)) continue;
          generatedText += delta;
          send({ type: "chunk", delta });
        }

        const normalized =
          normalizeStreamFeedbackResponse(generatedText) ??
          normalizeFeedbackResponse(
            (() => {
              try {
                return parseJsonFromModel(generatedText);
              } catch {
                return null;
              }
            })(),
          ) ??
          forceStrictNeedsWork(focusIdea, "no_overlap");

        send({ type: "done", feedback: normalized });
      } catch (err) {
        console.error("Feedback generateContentStream failed:", err);
        send({ type: "done", feedback: forceStrictNeedsWork(focusIdea, "no_overlap"), degraded: true });
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

  const wantsStream = shouldStreamResponse(request);

  // Shared validation: rate limit, parse body, validate fields, Firestore lookup.
  const result = await parseCurriculumRequest(request, FeedbackBodySchema, { requireAuth: true });
  if (!result.ok) return result.response;
  const { subtopic, subject, body } = result.data;

  const trimmedAnswer = body.studentAnswer.trim();
  const contextChecklist = formatSubtopicForFeedback(subtopic);
  const focusIdea = subtopic.keyConcepts[0] || subtopic.title;

  // Quick reject: gibberish or too short.
  const wordCount = (trimmedAnswer.match(/[A-Za-z]+/g) ?? []).length;
  if (wordCount < 3) {
    return NextResponse.json({ feedback: forceStrictNeedsWork(focusIdea, "too_short") });
  }
  if (isLikelyGibberish(trimmedAnswer)) {
    return NextResponse.json({ feedback: forceStrictNeedsWork(focusIdea, "gibberish") });
  }

  // Check API key before attempting Gemini call.
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error", code: "AI_UNAVAILABLE" },
      { status: 500 },
    );
  }

  // Route-specific: quiz mode extra validation.
  const feedbackMode: FeedbackMode = body.mode === "quiz" ? "quiz" : "explain";
  if (feedbackMode === "quiz") {
    if (!isNonEmptyString(body.question) || !isNonEmptyString(body.expectedAnswer)) {
      return NextResponse.json(
        { error: "Question and expected answer are required for quiz mode", code: "VALIDATION" },
        { status: 400 },
      );
    }
    if (body.question.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question must be ${MAX_QUESTION_LENGTH} characters or less`, code: "VALIDATION" },
        { status: 400 },
      );
    }
    if (body.expectedAnswer.trim().length > MAX_EXPECTED_ANSWER_LENGTH) {
      return NextResponse.json(
        { error: `Expected answer must be ${MAX_EXPECTED_ANSWER_LENGTH} characters or less`, code: "VALIDATION" },
        { status: 400 },
      );
    }
  }

  const lessonText =
    typeof body.lessonContext === "string" && body.lessonContext.trim().length > 0
      ? body.lessonContext.trim().slice(0, MAX_LESSON_CONTEXT_LENGTH)
      : "Lesson summary not provided.";

  // Build prompt based on mode.
  const basePrompt = wantsStream ? BASE_PROMPT_STREAM : BASE_PROMPT_JSON;
  const promptParts: { text: string }[] =
    feedbackMode === "quiz"
      ? [
        { text: basePrompt },
        { text: "Mode: quiz grading." },
        { text: `Question:\n${String(body.question).trim().slice(0, MAX_QUESTION_LENGTH)}` },
        {
          text: `Expected answer:\n${String(body.expectedAnswer).trim().slice(0, MAX_EXPECTED_ANSWER_LENGTH)}`,
        },
        {
          text: isNonEmptyString(body.answerExplanation)
            ? `Answer explanation:\n${String(body.answerExplanation).trim().slice(0, MAX_ANSWER_EXPLANATION_LENGTH)}`
            : "Answer explanation not provided.",
        },
        { text: contextChecklist },
        { text: `Student answer:\n${trimmedAnswer}` },
      ]
      : [
        { text: basePrompt },
        { text: "Mode: explain-back quality check." },
        { text: "Lesson summary:\n" + lessonText },
        { text: contextChecklist },
        { text: `Subject: ${subject}\nStudent answer:\n${trimmedAnswer}` },
      ];

  if (wantsStream) {
    const streamModel = createGeminiModel("gemini-2.5-flash-lite", {
      temperature: 0.1,
    });
    if (!streamModel) {
      return NextResponse.json(
        { error: "Server configuration error", code: "AI_UNAVAILABLE" },
        { status: 500 },
      );
    }
    return streamStructuredFeedback(streamModel, promptParts, focusIdea);
  }

  // Generate AI feedback with repair fallback.
  let parsed: unknown;
  try {
    parsed = await generateStructuredFeedback(promptParts);
  } catch (err) {
    console.error("Feedback generation failed:", err);
    parsed = null;
  }

  let feedback = normalizeFeedbackResponse(parsed);
  if (!feedback) {
    // One repair attempt: force strict JSON conversion.
    try {
      const repairPrompt: { text: string }[] = [
        {
          text: `Convert this to strict JSON with keys isCorrect, rating, praise, fix, rereadTip.\nData:\n${JSON.stringify(parsed)}`,
        },
      ];
      const repaired = await generateStructuredFeedback(repairPrompt);
      feedback = normalizeFeedbackResponse(repaired);
    } catch {
      feedback = null;
    }
  }

  if (!feedback) {
    // All parsing failed: use rule-based fallback so the student still gets feedback.
    feedback = forceStrictNeedsWork(focusIdea, "no_overlap");
  }

  return NextResponse.json({ feedback });
}
