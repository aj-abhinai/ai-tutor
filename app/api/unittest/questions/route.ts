import { NextRequest, NextResponse } from "next/server";
import { getFirestoreClient } from "@/lib/firebase-admin";
import { getRequestUserId, isValidSubject } from "@/lib/api/shared";
import { withServerCache } from "@/lib/server-cache";
import type { QuestionItem, SubtopicKnowledge } from "@/lib/learning-types";

interface QuestionData {
  chapterId: string;
  chapterTitle: string;
  question: QuestionItem;
}

const fetchQuestionsFromDb = async (subject: string): Promise<QuestionData[]> => {
  const db = getFirestoreClient();
  const snap = await db
    .collection("curriculum_chunks")
    .where("subject", "==", subject)
    .get();

  const questions: QuestionData[] = [];
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

  return questions;
};

const getCachedQuestions = withServerCache(
  fetchQuestionsFromDb,
  ["unittest-questions"],
  { revalidate: 3600, tags: ["curriculum"] }
);

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
};

// GET /api/unittest/questions - fetch quiz questions
export async function GET(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject || !isValidSubject(subject)) {
    return NextResponse.json(
      { error: "Subject query param must be Science or Maths" },
      { status: 400 }
    );
  }

  try {
    const questions = await getCachedQuestions(subject);
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
