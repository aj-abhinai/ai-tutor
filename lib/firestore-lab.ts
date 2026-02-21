/**
 * Firestore-backed chemistry data access.
 */

import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { ChemicalInfo } from "@/lib/chemical-facts-types";
import type { Experiment } from "@/lib/experiments";
import type { ChapterLab } from "@/lib/physics-lab-types";
import type { Reaction } from "@/lib/reactions";
import { getChemicalsList } from "@/lib/reaction-engine";

const EXPERIMENTS_COLLECTION = "chemistry_experiments";
const REACTIONS_COLLECTION = "chemistry_reactions";
const CHEMICAL_FACTS_COLLECTION = "chemistry_chemical_facts";
const PHYSICS_CHAPTER_LABS_COLLECTION = "physics_chapter_labs";

export async function getExperimentsFromFirestore(): Promise<Experiment[]> {
    const db = getFirestoreClient();
    const snap = await db.collection(EXPERIMENTS_COLLECTION).get();

    return snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Experiment))
        .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getExperimentById(id: string): Promise<Experiment | null> {
    const db = getFirestoreClient();
    const doc = await db.collection(EXPERIMENTS_COLLECTION).doc(id).get();
    if (!doc.exists) return null;

    return { id: doc.id, ...doc.data() } as Experiment;
}

export async function getReactionsFromFirestore(): Promise<Reaction[]> {
    const db = getFirestoreClient();
    const snap = await db.collection(REACTIONS_COLLECTION).get();

    return snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Reaction))
        .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getChemicalsFromFirestore(): Promise<string[]> {
    const reactions = await getReactionsFromFirestore();
    return getChemicalsList(reactions);
}

function normalizeChemicalFact(
    docId: string,
    rawData: unknown
): { name: string; info: ChemicalInfo } | null {
    if (!rawData || typeof rawData !== "object") return null;

    const data = rawData as {
        name?: unknown;
        chemicalName?: unknown;
        fact?: unknown;
        state?: unknown;
    };

    const nameCandidate =
        typeof data.name === "string" && data.name.trim().length > 0
            ? data.name.trim()
            : typeof data.chemicalName === "string" && data.chemicalName.trim().length > 0
                ? data.chemicalName.trim()
                : docId.trim();

    if (!nameCandidate) return null;
    if (typeof data.fact !== "string" || data.fact.trim().length === 0) return null;

    return {
        name: nameCandidate,
        info: {
            fact: data.fact.trim(),
            state:
                typeof data.state === "string" && data.state.trim().length > 0
                    ? data.state.trim()
                    : "Unknown",
        },
    };
}

export async function getChemicalFactsFromFirestore(): Promise<Record<string, ChemicalInfo>> {
    const db = getFirestoreClient();
    const snap = await db.collection(CHEMICAL_FACTS_COLLECTION).get();

    const facts: Record<string, ChemicalInfo> = {};
    for (const doc of snap.docs) {
        const normalized = normalizeChemicalFact(doc.id, doc.data());
        if (!normalized) continue;
        facts[normalized.name] = normalized.info;
    }

    return facts;
}

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

    const db = getFirestoreClient();
    const collection = db.collection(PHYSICS_CHAPTER_LABS_COLLECTION);

    const docById = await collection.doc(safeChapterId).get();
    if (docById.exists) {
        return normalizePhysicsChapterLab(docById.id, docById.data()) ?? null;
    }

    const snap = await collection.where("chapterId", "==", safeChapterId).limit(1).get();
    if (snap.empty) return null;

    const first = snap.docs[0];
    return normalizePhysicsChapterLab(first.id, first.data()) ?? null;
}

export async function getPhysicsLabChapterIdsFromFirestore(): Promise<string[]> {
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
}
