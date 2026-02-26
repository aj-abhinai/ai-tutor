"use client";

import type { ExploreQueryPayload, ExploreResult } from "../types";

function isNdjsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/x-ndjson");
}

type StreamEvent =
  | { type: "chunk"; delta?: unknown }
  | { type: "done"; answer?: unknown; citations?: unknown }
  | { type: "error"; error?: unknown };

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
          // Ignore malformed stream lines
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
    // Ignore malformed trailing line
  }
}

export async function requestExplore(
  payload: ExploreQueryPayload,
  onChunk?: (delta: string) => void,
): Promise<ExploreResult> {
  const { getAuthHeaders } = await import("@/lib/auth-client");
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/rag/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-stream": "1",
      Accept: "application/x-ndjson, application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      subject: payload.subject,
      chapterId: payload.chapterId,
      topicId: payload.topicId,
      subtopicId: payload.subtopicId,
      question: payload.question,
      topK: payload.topK ?? 5,
      lane: payload.lane ?? "both",
    }),
  });

  if (isNdjsonResponse(response)) {
    let streamedAnswer = "";
    let streamError = "";
    let finalAnswer = "";
    let citations: ExploreResult["citations"] = [];

    await consumeNdjsonStream(response, (event) => {
      if (event.type === "chunk" && typeof event.delta === "string") {
        streamedAnswer += event.delta;
        onChunk?.(event.delta);
        return;
      }
      if (event.type === "error" && typeof event.error === "string") {
        streamError = event.error;
        return;
      }
      if (event.type === "done") {
        if (typeof event.answer === "string") {
          finalAnswer = event.answer;
        }
        if (Array.isArray(event.citations)) {
          citations = event.citations as ExploreResult["citations"];
        }
      }
    });

    if (streamError) {
      throw new Error(streamError);
    }

    const answer = (finalAnswer || streamedAnswer).trim();
    return { answer, citations };
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Unable to get answer right now.");
  }
  if (typeof data?.answer !== "string" || !data.answer.trim()) {
    throw new Error("No answer returned. Please try again.");
  }

  return {
    answer: data.answer.trim(),
    citations: Array.isArray(data.citations) ? data.citations : [],
  };
}
