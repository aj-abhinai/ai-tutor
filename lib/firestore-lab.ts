/**
 * Firestore-backed chemistry data access.
 */

import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { Experiment } from "@/lib/experiments";
import type { Reaction } from "@/lib/reactions";
import { getChemicalsList } from "@/lib/reaction-engine";

const EXPERIMENTS_COLLECTION = "chemistry_experiments";
const REACTIONS_COLLECTION = "chemistry_reactions";

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
