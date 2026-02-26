import { NextRequest, NextResponse } from "next/server";
import { getFirestoreClient } from "@/lib/firebase-admin";
import { isValidSubject } from "@/lib/api/shared";
import type { SubtopicKnowledge } from "@/lib/learning-types";

interface Flashcard {
  id: string;
  chapterId: string;
  chapterTitle: string;
  term: string;
  definition: string;
}

// GET /api/quick-revision/flashcards - fetch flashcards
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

    const flashcards: Flashcard[] = [];
    const seenTerms = new Set<string>();
    const seenChapters = new Set<string>();

    for (const doc of snap.docs) {
      const data = doc.data() as { 
        chapterId: string; 
        chapterTitle?: string; 
        content?: SubtopicKnowledge 
      };
      const content = data.content;

      if (!content) continue;
      if (seenChapters.has(data.chapterId)) continue;

      const chapterId = data.chapterId;
      const chapterTitle = data.chapterTitle;

      if (!chapterTitle) continue;

      if (content.keyTerms && Object.keys(content.keyTerms).length > 0) {
        for (const [term, definition] of Object.entries(content.keyTerms)) {
          const termKey = term.toLowerCase().trim();
          if (!seenTerms.has(termKey)) {
            seenTerms.add(termKey);
            flashcards.push({
              id: `${chapterId}-${termKey}`,
              chapterId,
              chapterTitle,
              term,
              definition,
            });
          }
        }
      }

      if (content.keyConcepts && content.keyConcepts.length > 0) {
        for (const concept of content.keyConcepts) {
          const conceptKey = concept.toLowerCase().trim().substring(0, 50);
          if (!seenTerms.has(conceptKey)) {
            seenTerms.add(conceptKey);
            flashcards.push({
              id: `${chapterId}-concept-${conceptKey}`,
              chapterId,
              chapterTitle,
              term: concept,
              definition: `Learn more about ${concept} in the chapter ${chapterTitle}`,
            });
          }
        }
      }

      seenChapters.add(chapterId);
      if (flashcards.length >= 10) break;
    }

    return NextResponse.json({ flashcards });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load flashcards", details }
        : { error: "Failed to load flashcards" },
      { status: 500 }
    );
  }
}
