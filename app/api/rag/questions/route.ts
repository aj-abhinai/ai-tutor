import { NextRequest, NextResponse } from "next/server";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { RagQuestionsBodySchema } from "@/lib/api/validation";
import { getSubtopicQuestions } from "@/lib/rag-pipeline";

export async function POST(request: NextRequest) {
  const parsed = await parseCurriculumRequest(request, RagQuestionsBodySchema, { requireAuth: true });
  if (!parsed.ok) return parsed.response;

  const { body } = parsed.data;
  try {
    const questions = await getSubtopicQuestions(
      {
        subject: body.subject,
        chapterId: body.chapterId,
        topicId: body.topicId,
        subtopicId: body.subtopicId,
      },
      body.limit,
    );
    console.info("RAG questions fetch", {
      subject: body.subject,
      chapterId: body.chapterId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      limit: body.limit,
      returned: questions.length,
    });
    return NextResponse.json({ questions });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load generated subtopic questions", code: "RAG_FAILURE", details }
        : { error: "Failed to load generated subtopic questions", code: "RAG_FAILURE" },
      { status: 500 },
    );
  }
}
