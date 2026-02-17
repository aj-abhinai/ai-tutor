/**
 * RAG lookup — fetches subtopic data from Firestore.
 *
 * getSubtopicFromDB does a direct .where() query (no vector search).
 * Returns null on any error (missing creds, network, empty result)
 * so callers can safely fall back to static curriculum data.
 */

import { getFirestoreClient } from "./firebase-admin";
import type { SubtopicKnowledge } from "./curriculum/types";

export async function getSubtopicFromDB(
    subject: string,
    chapterId: string,
    topicId: string,
    subtopicId: string,
): Promise<SubtopicKnowledge | null> {
    try {
        const db = getFirestoreClient();
        const snap = await db
            .collection("curriculum_chunks")
            .where("subject", "==", subject)
            .where("chapterId", "==", chapterId)
            .where("topicId", "==", topicId)
            .where("subtopicId", "==", subtopicId)
            .limit(1)
            .get();

        if (snap.empty) return null;
        return snap.docs[0].data().content as SubtopicKnowledge;
    } catch {
        // Missing credentials, network error, etc. — fall back silently.
        return null;
    }
}
