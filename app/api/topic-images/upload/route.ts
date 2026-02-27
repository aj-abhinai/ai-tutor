import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStorageClient } from "@/lib/firebase-admin";
import { getTopicImagesByChapterAndTopic, createTopicImage } from "@/lib/topic-images/firestore";
import { getRequestUserId, MAX_ID_LENGTH, isValidSubject } from "@/lib/api/shared";
import type { SubjectName } from "@/lib/learning-types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
};

const UploadImageSchema = z.object({
  subject: z.enum(["Science", "Maths"]),
  chapterId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  topicId: z.string().trim().min(1).max(MAX_ID_LENGTH),
  subtopicId: z.string().trim().min(1).max(MAX_ID_LENGTH).optional(),
  title: z.string().trim().min(1).max(200),
  caption: z.string().trim().max(500).optional(),
  type: z.enum(["comic", "diagram", "illustration"]),
  imageData: z.string().base64(),
  contentType: z.string().regex(/^image\/(png|jpeg|jpg|gif|webp)$/),
});

function unauthorized() {
  return NextResponse.json({ error: "Student login required." }, { status: 401, headers: NO_STORE_HEADERS });
}

function normalizeBucketName(raw: string): string {
  const trimmed = raw.trim();
  const withoutProtocol = trimmed.replace(/^gs:\/\//, "");
  return withoutProtocol.split("/")[0];
}

export async function GET(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) return unauthorized();

  const subjectRaw = request.nextUrl.searchParams.get("subject")?.trim() ?? "";
  const chapterId = request.nextUrl.searchParams.get("chapterId")?.trim() ?? "";
  const topicId = request.nextUrl.searchParams.get("topicId")?.trim() ?? "";

  if (!subjectRaw || !isValidSubject(subjectRaw)) {
    return NextResponse.json({ error: "subject must be Science or Maths" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (!chapterId || !topicId) {
    return NextResponse.json({ error: "subject, chapterId, and topicId are required" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  try {
    const images = await getTopicImagesByChapterAndTopic(subjectRaw as SubjectName, chapterId, topicId);
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

export async function POST(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const parsed = UploadImageSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { subject, chapterId, topicId, subtopicId, title, caption, type, imageData, contentType } = parsed.data;

  try {
    const storage = getStorageClient();
    const configuredBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = configuredBucket
      ? storage.bucket(normalizeBucketName(configuredBucket))
      : storage.bucket();
    
    const timestamp = Date.now();
    const fileName = `${subject}/${chapterId}/${topicId}/${timestamp}.${contentType.split("/")[1]}`;
    const file = bucket.file(fileName);

    const buffer = Buffer.from(imageData, "base64");
    
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
      },
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const image = await createTopicImage({
      subject,
      chapterId,
      topicId,
      subtopicId,
      title,
      imageUrl: publicUrl,
      caption,
      type,
    });

    return NextResponse.json({ image }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to upload image", details }
        : { error: "Failed to upload image" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
