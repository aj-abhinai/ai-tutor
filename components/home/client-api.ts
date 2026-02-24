"use client";

import type { ExplainFeedback } from "./types";

type StreamEvent =
  | { type: "chunk"; delta?: unknown }
  | { type: "done"; deepEssay?: unknown; feedback?: unknown }
  | { type: "error"; error?: unknown };

export type FeedbackRequestPayload = {
  subject: "Science" | "Maths";
  chapterId: string;
  topicId?: string;
  subtopicId: string;
  studentAnswer: string;
  lessonContext?: string;
  mode?: "quiz" | "explain";
  question?: string;
  expectedAnswer?: string;
  answerExplanation?: string;
};

export type DeepRequestPayload = {
  subject: "Science" | "Maths";
  chapterId: string;
  topicId?: string;
  subtopicId: string;
};

function isNdjsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/x-ndjson");
}

// Parse newline-delimited JSON stream events from API routes.
async function consumeNdjsonStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("Missing response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n");
    while (boundary !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      if (line) {
        try {
          onEvent(JSON.parse(line) as StreamEvent);
        } catch {
          // Ignore malformed stream lines and keep reading.
        }
      }
      boundary = buffer.indexOf("\n");
    }
  }

  const finalLine = buffer.trim();
  if (!finalLine) return;
  try {
    onEvent(JSON.parse(finalLine) as StreamEvent);
  } catch {
    // Ignore malformed trailing line.
  }
}

export async function requestDeepEssay(
  payload: DeepRequestPayload,
  onChunk?: (delta: string) => void,
): Promise<{ deepEssay?: string; error?: string }> {
  const { getAuthHeaders } = await import("@/lib/auth-client");
  const authHeaders = await getAuthHeaders();
  // Prefer streaming so the UI can render deep text progressively.
  const response = await fetch("/api/deep", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-stream": "1",
      Accept: "application/x-ndjson, application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (isNdjsonResponse(response)) {
    let streamedEssay = "";
    let streamError = "";
    let finalEssay = "";

    await consumeNdjsonStream(response, (event) => {
      if (event.type === "chunk" && typeof event.delta === "string") {
        streamedEssay += event.delta;
        onChunk?.(event.delta);
        return;
      }
      if (event.type === "error" && typeof event.error === "string") {
        streamError = event.error;
        return;
      }
      if (event.type === "done" && typeof event.deepEssay === "string") {
        finalEssay = event.deepEssay;
      }
    });

    if (streamError) return { error: streamError };
    const deepEssay = (finalEssay || streamedEssay).trim();
    if (!deepEssay) return { error: "No deep explanation returned. Please try again." };
    return { deepEssay };
  }

  const data = await response.json();
  if (!response.ok) {
    return { error: data?.error || "Unable to generate the deep explanation right now." };
  }
  if (typeof data?.deepEssay !== "string" || !data.deepEssay.trim()) {
    return { error: "No deep explanation returned. Please try again." };
  }
  return { deepEssay: data.deepEssay.trim() };
}

export async function requestFeedback(
  payload: FeedbackRequestPayload,
  onChunk?: (delta: string) => void,
): Promise<{ feedback?: ExplainFeedback; error?: string }> {
  const { getAuthHeaders } = await import("@/lib/auth-client");
  const authHeaders = await getAuthHeaders();
  // Prefer streaming so feedback can be previewed while generating.
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-stream": "1",
      Accept: "application/x-ndjson, application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  if (isNdjsonResponse(response)) {
    let streamError = "";
    let feedback: ExplainFeedback | null = null;

    await consumeNdjsonStream(response, (event) => {
      if (event.type === "chunk" && typeof event.delta === "string") {
        onChunk?.(event.delta);
        return;
      }
      if (event.type === "error" && typeof event.error === "string") {
        streamError = event.error;
        return;
      }
      if (event.type === "done" && event.feedback && typeof event.feedback === "object") {
        feedback = event.feedback as ExplainFeedback;
      }
    });

    if (streamError) return { error: streamError };
    if (!feedback) return { error: "No feedback returned. Please try again." };
    return { feedback };
  }

  const data = await response.json();
  if (!response.ok) {
    return { error: data?.error || "Unable to check your answer right now." };
  }
  if (!data?.feedback || typeof data.feedback !== "object") {
    return { error: "No feedback returned. Please try again." };
  }
  return { feedback: data.feedback as ExplainFeedback };
}
