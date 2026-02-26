import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_ID_LENGTH, getRequestUserId, isValidSubject } from "@/lib/api/shared";
import {
  deleteStudentTopicNote,
  getStudentTopicNote,
  listStudentTopicNotes,
  upsertStudentTopicNote,
} from "@/lib/notes/firestore";
import type { SubjectName } from "@/lib/learning-types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
};

const CONTENT_MAX_LENGTH = 10000;

const UpsertNoteSchema = z.object({
  subject: z.enum(["Science", "Maths"]),
  chapterId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  chapterTitle: z.string().trim().min(1).max(200),
  topicId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  topicTitle: z.string().trim().min(1).max(200),
  content: z.string().trim().max(CONTENT_MAX_LENGTH),
});

const DeleteNoteSchema = z.object({
  subject: z.enum(["Science", "Maths"]),
  chapterId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  topicId: z.string().trim().min(1).max(MAX_ID_LENGTH),
});

function unauthorized() {
  return NextResponse.json({ error: "Student login required." }, { status: 401, headers: NO_STORE_HEADERS });
}

function parseTopicQuery(request: NextRequest):
  | { kind: "single"; subject: SubjectName; chapterId: string; topicId: string }
  | { kind: "list"; subject?: SubjectName }
  | { kind: "error"; message: string } {
  const subjectRaw = request.nextUrl.searchParams.get("subject")?.trim() ?? "";
  const chapterId = request.nextUrl.searchParams.get("chapterId")?.trim() ?? "";
  const topicId = request.nextUrl.searchParams.get("topicId")?.trim() ?? "";

  if (subjectRaw && !isValidSubject(subjectRaw)) {
    return { kind: "error", message: "subject must be Science or Maths" };
  }

  const hasSubject = Boolean(subjectRaw);
  const hasChapterId = Boolean(chapterId);
  const hasTopicId = Boolean(topicId);
  const subject = hasSubject ? (subjectRaw as SubjectName) : undefined;

  if (!hasChapterId && !hasTopicId) {
    return { kind: "list", subject };
  }

  if (!hasSubject || !hasChapterId || !hasTopicId) {
    return { kind: "error", message: "subject, chapterId, and topicId are required together" };
  }

  if (chapterId.length > MAX_ID_LENGTH || topicId.length > MAX_ID_LENGTH) {
    return { kind: "error", message: `chapterId/topicId must be ${MAX_ID_LENGTH} characters or less` };
  }

  return { kind: "single", subject: subject as SubjectName, chapterId, topicId };
}

export async function GET(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) return unauthorized();

  const parsed = parseTopicQuery(request);
  if (parsed.kind === "error") {
    return NextResponse.json({ error: parsed.message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    if (parsed.kind === "single") {
      const note = await getStudentTopicNote(userId, parsed.subject, parsed.chapterId, parsed.topicId);
      return NextResponse.json({ note }, { headers: NO_STORE_HEADERS });
    }

    const notes = await listStudentTopicNotes(userId, parsed.subject ? { subject: parsed.subject } : undefined);
    return NextResponse.json({ notes }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load notes", details }
        : { error: "Failed to load notes" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const parsed = UpsertNoteSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const note = await upsertStudentTopicNote({ userId, ...parsed.data });
    return NextResponse.json({ note }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to save note", details }
        : { error: "Failed to save note" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const parsed = DeleteNoteSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const deleted = await deleteStudentTopicNote(
      userId,
      parsed.data.subject,
      parsed.data.chapterId,
      parsed.data.topicId
    );
    return NextResponse.json({ deleted }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to delete note", details }
        : { error: "Failed to delete note" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
