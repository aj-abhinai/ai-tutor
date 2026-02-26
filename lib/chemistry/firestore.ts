/**
 * Chemistry Firestore data access.
 */

import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { ChemicalInfo } from "@/lib/chemical-facts-types";
import type { Experiment } from "@/lib/experiments";
import type { Reaction } from "@/lib/reactions";
import { getChemicalsList } from "@/lib/reaction-engine";
import { withServerCache } from "@/lib/server-cache";

const EXPERIMENTS_COLLECTION = "chemistry_experiments";
const REACTIONS_COLLECTION = "chemistry_reactions";
const CHEMICAL_FACTS_COLLECTION = "chemistry_chemical_facts";
const CHEMISTRY_CACHE_TTL_SECONDS = 300;

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
    return getCachedExperiments();
}

export async function getExperimentById(id: string): Promise<Experiment | null> {
    const safeId = id.trim();
    if (!safeId) return null;
    return getCachedExperimentById(safeId);
}

export async function getReactionsFromFirestore(): Promise<Reaction[]> {
    return getCachedReactions();
}

export async function getChemicalsFromFirestore(): Promise<string[]> {
    return getCachedChemicals();
}

export async function getChemicalFactsFromFirestore(): Promise<Record<string, ChemicalInfo>> {
    return getCachedChemicalFacts();
}

const getCachedExperiments = withServerCache(
    async (): Promise<Experiment[]> => {
        const db = getFirestoreClient();
        const snap = await db.collection(EXPERIMENTS_COLLECTION).get();

        return snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Experiment))
            .sort((a, b) => a.title.localeCompare(b.title));
    },
    ["chemistry-experiments"],
    { revalidate: CHEMISTRY_CACHE_TTL_SECONDS }
);

const getCachedExperimentById = withServerCache(
    async (id: string): Promise<Experiment | null> => {
        const db = getFirestoreClient();
        const doc = await db.collection(EXPERIMENTS_COLLECTION).doc(id).get();
        if (!doc.exists) return null;

        return { id: doc.id, ...doc.data() } as Experiment;
    },
    ["chemistry-experiment-by-id"],
    { revalidate: CHEMISTRY_CACHE_TTL_SECONDS }
);

const getCachedReactions = withServerCache(
    async (): Promise<Reaction[]> => {
        const db = getFirestoreClient();
        const snap = await db.collection(REACTIONS_COLLECTION).get();

        return snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Reaction))
            .sort((a, b) => a.id.localeCompare(b.id));
    },
    ["chemistry-reactions"],
    { revalidate: CHEMISTRY_CACHE_TTL_SECONDS }
);

const getCachedChemicals = withServerCache(
    async (): Promise<string[]> => {
        const reactions = await getCachedReactions();
        return getChemicalsList(reactions);
    },
    ["chemistry-chemicals"],
    { revalidate: CHEMISTRY_CACHE_TTL_SECONDS }
);

const getCachedChemicalFacts = withServerCache(
    async (): Promise<Record<string, ChemicalInfo>> => {
        const db = getFirestoreClient();
        const snap = await db.collection(CHEMICAL_FACTS_COLLECTION).get();

        const facts: Record<string, ChemicalInfo> = {};
        for (const doc of snap.docs) {
            const normalized = normalizeChemicalFact(doc.id, doc.data());
            if (!normalized) continue;
            facts[normalized.name] = normalized.info;
        }

        return facts;
    },
    ["chemistry-chemical-facts"],
    { revalidate: CHEMISTRY_CACHE_TTL_SECONDS }
);
