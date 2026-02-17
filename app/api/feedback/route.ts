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

import { NextRequest, NextResponse } from "next/server";
import { formatSubtopicForFeedback } from "@/lib/subtopic-content";
import { getSubtopicFromDB } from "@/lib/rag";
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

type FeedbackMode = "explain" | "quiz";
type FeedbackRating = "great" | "good start" | "needs work";

type TutorFeedbackResponse = {
  rating: FeedbackRating;
  praise: string;
  fix: string;
  rereadTip: string;
  isCorrect?: boolean;
};

const MAX_STUDENT_ANSWER_LENGTH = 600;
const MAX_LESSON_CONTEXT_LENGTH = 1600;
const MAX_QUESTION_LENGTH = 400;
const MAX_EXPECTED_ANSWER_LENGTH = 400;
const MAX_ANSWER_EXPLANATION_LENGTH = 700;
const MAX_FIELD_LENGTH = 240;


const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

const BASE_PROMPT = `You are a warm, encouraging NCERT Class 7 teacher who loves helping students learn.

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
- For "praise": Only mention something the student actually got RIGHT. If NOTHING is correct, just say "Good effort trying to answer!" — do NOT invent something correct that the student did not say.
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



function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExactMatch(a: string, b: string): boolean {
  const normA = normalizeAnswer(a);
  const normB = normalizeAnswer(b);
  return normA.length > 0 && normA === normB;
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

function forceStrictNeedsWork(
  focusIdea: string,
  reason: "gibberish" | "too_short" | "no_overlap"
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
  modelName = "gemini-2.5-flash-lite"
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

export async function POST(request: NextRequest) {
  const clientKey = getRateLimitKey(request);
  if (await isRateLimited(clientKey)) {
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

  const {
    subject,
    chapterId,
    topicId,
    subtopicId,
    studentAnswer,
    lessonContext,
    mode,
    question,
    expectedAnswer,
    answerExplanation,
  } = body as {
    subject?: unknown;
    chapterId?: unknown;
    topicId?: unknown;
    subtopicId?: unknown;
    studentAnswer?: unknown;
    lessonContext?: unknown;
    mode?: unknown;
    question?: unknown;
    expectedAnswer?: unknown;
    answerExplanation?: unknown;
  };

  if (!isNonEmptyString(subject) || !isValidSubject(subject)) {
    return NextResponse.json({ error: "Subject must be Science or Maths" }, { status: 400 });
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
  if (!isNonEmptyString(studentAnswer)) {
    return NextResponse.json({ error: "Student answer is required" }, { status: 400 });
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
  if (!hasAiRouteAccess(request)) {
    return NextResponse.json(
      { error: "Unauthorized request origin for AI endpoint." },
      { status: 401 }
    );
  }

  const trimmedAnswer = studentAnswer.trim();
  if (trimmedAnswer.length > MAX_STUDENT_ANSWER_LENGTH) {
    return NextResponse.json(
      { error: `Answer must be ${MAX_STUDENT_ANSWER_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  const selectedSubtopic = await getSubtopicFromDB(
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

  const feedbackMode: FeedbackMode = mode === "quiz" ? "quiz" : "explain";
  if (feedbackMode === "quiz") {
    if (!isNonEmptyString(question) || !isNonEmptyString(expectedAnswer)) {
      return NextResponse.json(
        { error: "Question and expected answer are required for quiz mode" },
        { status: 400 }
      );
    }
    if (question.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question must be ${MAX_QUESTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }
    if (expectedAnswer.trim().length > MAX_EXPECTED_ANSWER_LENGTH) {
      return NextResponse.json(
        { error: `Expected answer must be ${MAX_EXPECTED_ANSWER_LENGTH} characters or less` },
        { status: 400 }
      );
    }
  }

  const lessonText =
    typeof lessonContext === "string" && lessonContext.trim().length > 0
      ? lessonContext.trim().slice(0, MAX_LESSON_CONTEXT_LENGTH)
      : "Lesson summary not provided.";
  const contextChecklist = formatSubtopicForFeedback(selectedSubtopic);
  const focusIdea = selectedSubtopic.keyConcepts[0] || selectedSubtopic.title;

  const wordCount = (trimmedAnswer.match(/[A-Za-z]+/g) ?? []).length;
  if (wordCount < 3) {
    return NextResponse.json({ feedback: forceStrictNeedsWork(focusIdea, "too_short") });
  }
  if (isLikelyGibberish(trimmedAnswer)) {
    return NextResponse.json({ feedback: forceStrictNeedsWork(focusIdea, "gibberish") });
  }

  // Check API key before attempting Gemini call.
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const promptParts: { text: string }[] =
    feedbackMode === "quiz"
      ? [
        { text: BASE_PROMPT },
        { text: "Mode: quiz grading." },
        { text: `Question:\n${String(question).trim().slice(0, MAX_QUESTION_LENGTH)}` },
        {
          text: `Expected answer:\n${String(expectedAnswer).trim().slice(0, MAX_EXPECTED_ANSWER_LENGTH)}`,
        },
        {
          text: isNonEmptyString(answerExplanation)
            ? `Answer explanation:\n${String(answerExplanation).trim().slice(0, MAX_ANSWER_EXPLANATION_LENGTH)}`
            : "Answer explanation not provided.",
        },
        { text: contextChecklist },
        { text: `Student answer:\n${trimmedAnswer}` },
      ]
      : [
        { text: BASE_PROMPT },
        { text: "Mode: explain-back quality check." },
        { text: "Lesson summary:\n" + lessonText },
        { text: contextChecklist },
        { text: `Subject: ${subject}\nStudent answer:\n${trimmedAnswer}` },
      ];

  let parsed: unknown;
  try {
    parsed = await generateStructuredFeedback(promptParts);
  } catch (err) {
    console.error("Feedback generation failed:", err);
    // Fall back to rule-based feedback so the student still sees something.
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
    // All parsing failed — use rule-based fallback so the student still gets feedback.
    feedback = forceStrictNeedsWork(focusIdea, "no_overlap");
  }

  return NextResponse.json({ feedback });
}
