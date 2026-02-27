import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_ID_LENGTH, getRequestUserId, isValidSubject } from "@/lib/api/shared";
import { getTopicImagesByChapterAndTopic, createTopicImage, deleteTopicImage } from "@/lib/topic-images/firestore";
import type { SubjectName } from "@/lib/learning-types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
};

const CreateImageSchema = z.object({
  subject: z.enum(["Science", "Maths"]),
  chapterId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  topicId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  subtopicId: z.string().trim().min(1).max(MAX_ID_LENGTH).optional(),
  title: z.string().trim().min(1).max(200),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "imageUrl must be an absolute URL or root-relative path",
    ),
  caption: z.string().trim().max(500).optional(),
  type: z.enum(["comic", "diagram", "illustration"]),
});

const DeleteImageSchema = z.object({
  id: z.string().trim().min(1),
});

function unauthorized() {
  return NextResponse.json({ error: "Student login required." }, { status: 401, headers: NO_STORE_HEADERS });
}

function parseTopicQuery(request: NextRequest):
  | {
      kind: "success";
      subject: SubjectName;
      chapterId: string;
      topicId: string;
      subtopicId?: string;
      type?: "comic" | "diagram" | "illustration";
    }
  | { kind: "error"; message: string } {
  const subjectRaw = request.nextUrl.searchParams.get("subject")?.trim() ?? "";
  const chapterId = request.nextUrl.searchParams.get("chapterId")?.trim() ?? "";
  const topicId = request.nextUrl.searchParams.get("topicId")?.trim() ?? "";
  const subtopicId = request.nextUrl.searchParams.get("subtopicId")?.trim() ?? "";
  const typeRaw = request.nextUrl.searchParams.get("type")?.trim() ?? "";

  if (!subjectRaw || !isValidSubject(subjectRaw)) {
    return { kind: "error", message: "subject must be Science or Maths" };
  }

  if (!chapterId || !topicId) {
    return { kind: "error", message: "subject, chapterId, and topicId are required" };
  }

  if (chapterId.length > MAX_ID_LENGTH || topicId.length > MAX_ID_LENGTH) {
    return { kind: "error", message: `chapterId/topicId must be ${MAX_ID_LENGTH} characters or less` };
  }

  if (subtopicId && subtopicId.length > MAX_ID_LENGTH) {
    return { kind: "error", message: `subtopicId must be ${MAX_ID_LENGTH} characters or less` };
  }

  if (typeRaw && !["comic", "diagram", "illustration"].includes(typeRaw)) {
    return { kind: "error", message: "type must be comic, diagram, or illustration" };
  }

  return {
    kind: "success",
    subject: subjectRaw as SubjectName,
    chapterId,
    topicId,
    subtopicId: subtopicId || undefined,
    type: (typeRaw as "comic" | "diagram" | "illustration") || undefined,
  };
}

export async function GET(request: NextRequest) {
  // Secure by default: require auth unless explicitly enabled for public read.
  const allowPublicRead = process.env.TOPIC_IMAGES_PUBLIC_READ === "true";
  if (!allowPublicRead) {
    const userId = await getRequestUserId(request);
    if (!userId) return unauthorized();
  }

  const parsed = parseTopicQuery(request);
  if (parsed.kind === "error") {
    return NextResponse.json({ error: parsed.message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const images = await getTopicImagesByChapterAndTopic(parsed.subject, parsed.chapterId, parsed.topicId, {
      subtopicId: parsed.subtopicId,
      type: parsed.type,
    });
    return NextResponse.json({ images }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load images", details }
        : { error: "Failed to load images" },
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

  const parsed = CreateImageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const image = await createTopicImage(parsed.data);
    return NextResponse.json({ image }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to create image", details }
        : { error: "Failed to create image" },
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

  const parsed = DeleteImageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const deleted = await deleteTopicImage(parsed.data.id);
    return NextResponse.json({ deleted }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to delete image", details }
        : { error: "Failed to delete image" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
