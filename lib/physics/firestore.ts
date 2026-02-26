/**
 * Physics Firestore data access.
 */

import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { ChapterLab } from "@/lib/physics-lab-types";
import { withServerCache } from "@/lib/server-cache";

const PHYSICS_CHAPTER_LABS_COLLECTION = "physics_chapter_labs";
const PHYSICS_CACHE_TTL_SECONDS = 300;

function normalizePhysicsChapterLab(docId: string, rawData: unknown): ChapterLab | null {
    if (!rawData || typeof rawData !== "object") {
        return null;
    }

    const data = rawData as {
        chapterId?: unknown;
        chapterTitle?: unknown;
        experiments?: unknown;
    };

    const chapterId =
        typeof data.chapterId === "string" && data.chapterId.trim().length > 0
            ? data.chapterId.trim()
            : docId;
    const chapterTitle =
        typeof data.chapterTitle === "string" && data.chapterTitle.trim().length > 0
            ? data.chapterTitle.trim()
            : "Physics Lab";
    const experiments = Array.isArray(data.experiments)
        ? (data.experiments as ChapterLab["experiments"])
        : [];

    return {
        chapterId,
        chapterTitle,
        experiments,
    };
}

export async function getPhysicsChapterLabFromFirestore(
    chapterId: string
): Promise<ChapterLab | null> {
    const safeChapterId = chapterId.trim();
    if (!safeChapterId) return null;
    return getCachedPhysicsChapterLab(safeChapterId);
}

export async function getPhysicsLabChapterIdsFromFirestore(): Promise<string[]> {
    return getCachedPhysicsLabChapterIds();
}

const getCachedPhysicsChapterLab = withServerCache(
    async (chapterId: string): Promise<ChapterLab | null> => {
        const db = getFirestoreClient();
        const collection = db.collection(PHYSICS_CHAPTER_LABS_COLLECTION);

        const docById = await collection.doc(chapterId).get();
        if (docById.exists) {
            return normalizePhysicsChapterLab(docById.id, docById.data()) ?? null;
        }

        const snap = await collection.where("chapterId", "==", chapterId).limit(1).get();
        if (snap.empty) return null;

        const first = snap.docs[0];
        return normalizePhysicsChapterLab(first.id, first.data()) ?? null;
    },
    ["physics-chapter-lab"],
    { revalidate: PHYSICS_CACHE_TTL_SECONDS }
);

const getCachedPhysicsLabChapterIds = withServerCache(
    async (): Promise<string[]> => {
        const db = getFirestoreClient();
        const snap = await db.collection(PHYSICS_CHAPTER_LABS_COLLECTION).get();

        const chapterIds = snap.docs
            .map((doc) => {
                const raw = doc.data() as { chapterId?: unknown };
                if (typeof raw.chapterId === "string" && raw.chapterId.trim().length > 0) {
                    return raw.chapterId.trim();
                }
                return doc.id;
            })
            .filter((id) => id.length > 0);

        return Array.from(new Set(chapterIds)).sort((a, b) => a.localeCompare(b));
    },
    ["physics-lab-chapter-ids"],
    { revalidate: PHYSICS_CACHE_TTL_SECONDS }
);
