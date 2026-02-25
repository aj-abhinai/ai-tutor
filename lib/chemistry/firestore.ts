/**
 * Chemistry Firestore data access.
 */

import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { ChemicalInfo } from "@/lib/chemical-facts-types";
import type { Experiment } from "@/lib/experiments";
import type { Reaction } from "@/lib/reactions";
import { getChemicalsList } from "@/lib/reaction-engine";

const EXPERIMENTS_COLLECTION = "chemistry_experiments";
const REACTIONS_COLLECTION = "chemistry_reactions";
const CHEMICAL_FACTS_COLLECTION = "chemistry_chemical_facts";

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
