import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { parseCurriculumRequest } from "@/lib/api/middleware";
import { RagIngestBodySchema } from "@/lib/api/validation";
import { ingestSubtopicPdf } from "@/lib/rag-pipeline";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

function hasAdminToken(request: NextRequest): boolean {
  const expected = process.env.RAG_INGEST_ADMIN_TOKEN;
  if (!expected) return false;
  const incoming = request.headers.get("x-rag-admin-token");
  return incoming === expected;
}

function decodeBase64Pdf(pdfBase64: string): Uint8Array {
  const cleaned = pdfBase64.replace(/^data:application\/pdf;base64,/i, "").trim();
  const bytes = Buffer.from(cleaned, "base64");
  if (!bytes.length) {
    throw new Error("Decoded PDF is empty.");
  }
  if (bytes.length > MAX_PDF_BYTES) {
    throw new Error(`PDF exceeds ${MAX_PDF_BYTES} byte limit.`);
  }
  return new Uint8Array(bytes);
}

export async function POST(request: NextRequest) {
  if (!hasAdminToken(request)) {
    return NextResponse.json(
      { error: "Missing or invalid ingest admin token", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const parsed = await parseCurriculumRequest(request, RagIngestBodySchema, { requireAuth: false });
  if (!parsed.ok) return parsed.response;

  const { body } = parsed.data;
  try {
    console.info("RAG ingest start", {
      subject: body.subject,
      chapterId: body.chapterId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      sourceName: body.sourceName || "uploaded.pdf",
    });
    const result = await ingestSubtopicPdf({
      subject: body.subject,
      chapterId: body.chapterId,
      topicId: body.topicId,
      subtopicId: body.subtopicId,
      title: body.title,
      sourceName: body.sourceName || "uploaded.pdf",
      pdfBytes: decodeBase64Pdf(body.pdfBase64),
    });

    console.info("RAG ingest done", { docId: result.docId, factChunkCount: result.factChunkCount, activityChunkCount: result.activityChunkCount, questionCount: result.questionCount });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Subtopic ingestion failed", code: "RAG_INGEST_FAILURE", details }
        : { error: "Subtopic ingestion failed", code: "RAG_INGEST_FAILURE" },
      { status: 500 },
    );
  }
}
