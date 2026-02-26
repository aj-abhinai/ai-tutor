import { NextRequest, NextResponse } from "next/server";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { RagQueryBodySchema } from "@/lib/api/validation";
import { answerSubtopicQuestion } from "@/lib/rag-pipeline";

function isRagEnabled(): boolean {
  return process.env.ENABLE_RAG_ROUTES === "true";
}

export async function POST(request: NextRequest) {
  if (!isRagEnabled()) {
    return NextResponse.json(
      { error: "RAG routes are disabled.", code: "RAG_DISABLED" },
      { status: 503 },
    );
  }

  const parsed = await parseCurriculumRequest(request, RagQueryBodySchema, { requireAuth: true });
  if (!parsed.ok) return parsed.response;

  const { body } = parsed.data;
  try {
    const startedAt = Date.now();
    const result = await answerSubtopicQuestion({
      subject: body.subject,
      chapterId: body.chapterId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      question: body.question,
      topK: body.topK,
      lane: body.lane,
    });

    console.info("RAG query", {
      subject: body.subject,
      chapterId: body.chapterId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      lane: body.lane,
      topK: body.topK,
      citations: result.citations.length,
      latencyMs: Date.now() - startedAt,
    });
    return NextResponse.json(result);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to answer question from subtopic context", code: "RAG_FAILURE", details }
        : { error: "Failed to answer question from subtopic context", code: "RAG_FAILURE" },
      { status: 500 },
    );
  }
}
