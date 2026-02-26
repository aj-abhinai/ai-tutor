import { NextRequest, NextResponse } from "next/server";
import { getFirestoreClient } from "@/lib/firebase-admin";
import { isValidSubject } from "@/lib/api/shared";
import type { QuestionItem, SubtopicKnowledge } from "@/lib/learning-types";

export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject || !isValidSubject(subject)) {
    return NextResponse.json(
      { error: "Subject query param must be Science or Maths" },
      { status: 400 }
    );
  }

  try {
    const db = getFirestoreClient();
    const snap = await db
      .collection("curriculum_chunks")
      .where("subject", "==", subject)
      .get();

    const questions: { chapterId: string; chapterTitle: string; question: QuestionItem }[] = [];
    const seenChapters = new Set<string>();

    for (const doc of snap.docs) {
      const data = doc.data() as { chapterId: string; chapterTitle?: string; topicId: string; subtopicId: string; content?: SubtopicKnowledge };
      const content = data.content;

      if (!content?.questionBank) continue;
      if (seenChapters.has(data.chapterId)) continue;

      const chapterId = data.chapterId;
      const chapterTitle = data.chapterTitle;

      if (!chapterTitle) continue;

      const mcq = content.questionBank.find((q: QuestionItem) => q.type === "mcq");
      if (mcq) {
        seenChapters.add(chapterId);
        questions.push({
          chapterId,
          chapterTitle,
          question: mcq,
        });
      }

      if (questions.length >= 5) break;
    }

    return NextResponse.json({ questions });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load questions", details }
        : { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}
