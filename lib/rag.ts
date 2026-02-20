/**
 * Firestore curriculum access helpers.
 */

import { unstable_cache } from "next/cache";
import { getFirestoreClient } from "./firebase-admin";
import type { ChapterSummary, CurriculumCatalog, SubjectName, SubtopicKnowledge } from "./learning-types";

type CurriculumChunkDoc = {
  subject: SubjectName;
  chapterId: string;
  chapterTitle?: string;
  topicId: string;
  topicTitle?: string;
  subtopicId: string;
  subtopicTitle?: string;
  content: SubtopicKnowledge;
};

// Deterministic doc ID shared by seed scripts and lookup.
export function makeDocId(subject: string, chapterId: string, topicId: string, subtopicId: string): string {
  return `${subject}__${chapterId}__${topicId}__${subtopicId}`;
}

function humanizeId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";
  return trimmed
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getSubtopicFromDB(
  subject: string,
  chapterId: string,
  topicId: string,
  subtopicId: string
): Promise<SubtopicKnowledge | null> {
  try {
    const db = getFirestoreClient();
    const docId = makeDocId(subject, chapterId, topicId, subtopicId);
    const snap = await db.collection("curriculum_chunks").doc(docId).get();

    if (!snap.exists) return null;
    const data = snap.data() as CurriculumChunkDoc | undefined;
    return data?.content ?? null;
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Firestore lookup failed:", err instanceof Error ? err.message : String(err));
    }
    return null;
  }
}

// Cache catalog reads for one hour to reduce repeated Firestore queries.
const getCachedCatalog = unstable_cache(
  async (subj: SubjectName): Promise<CurriculumCatalog> => {
    const db = getFirestoreClient();
    const snap = await db
      .collection("curriculum_chunks")
      .where("subject", "==", subj)
      .get();

    const chapterMap = new Map<
      string,
      {
        chapter: ChapterSummary;
        topicMap: Map<string, { id: string; title: string; subtopics: { id: string; title: string }[] }>;
      }
    >();

    for (const doc of snap.docs) {
      const data = doc.data() as CurriculumChunkDoc;
      const chapterId = data.chapterId;
      const topicId = data.topicId;
      const subtopicId = data.subtopicId;

      if (!chapterId || !topicId || !subtopicId) continue;

      const chapterTitle = data.chapterTitle || humanizeId(chapterId);
      const topicTitle = data.topicTitle || humanizeId(topicId);
      const subtopicTitle = data.content?.title || data.subtopicTitle || humanizeId(subtopicId);

      let chapterEntry = chapterMap.get(chapterId);
      if (!chapterEntry) {
        chapterEntry = {
          chapter: { id: chapterId, title: chapterTitle, topics: [] },
          topicMap: new Map(),
        };
        chapterMap.set(chapterId, chapterEntry);
      }

      let topicEntry = chapterEntry.topicMap.get(topicId);
      if (!topicEntry) {
        topicEntry = { id: topicId, title: topicTitle, subtopics: [] };
        chapterEntry.topicMap.set(topicId, topicEntry);
        chapterEntry.chapter.topics.push(topicEntry);
      }

      if (!topicEntry.subtopics.some((subtopic) => subtopic.id === subtopicId)) {
        topicEntry.subtopics.push({ id: subtopicId, title: subtopicTitle });
      }
    }

    const chapters = Array.from(chapterMap.values()).map((entry) => ({
      ...entry.chapter,
      topics: entry.chapter.topics.map((topic) => ({
        ...topic,
        subtopics: [...topic.subtopics].sort((a, b) => a.title.localeCompare(b.title)),
      })),
    }));

    chapters.sort((a, b) => a.title.localeCompare(b.title));
    chapters.forEach((chapter) => chapter.topics.sort((a, b) => a.title.localeCompare(b.title)));

    return { subject: subj, chapters };
  },
  ["catalog"],
  { revalidate: 3600 }
);

export async function getCatalogFromDB(subject: SubjectName): Promise<CurriculumCatalog> {
  return getCachedCatalog(subject);
}

