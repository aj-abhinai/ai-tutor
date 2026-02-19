/**
 * firestore-lab.ts
 * Fetches chemistry experiments and reactions from Firestore.
 * Falls back to local static data on any error (offline-safe).
 *
 * Collections expected in Firestore:
 *   chemistry_experiments  — enriched Experiment documents
 *   chemistry_reactions    — Reaction documents
 */

import { getFirestoreClient } from "@/lib/firebase-admin";
import LOCAL_EXPERIMENTS, { type Experiment } from "@/lib/experiments";
import LOCAL_REACTIONS, { type Reaction } from "@/lib/reactions";

/** Fetch all guided experiments, falling back to local if Firestore unavailable. */
export async function getExperimentsFromFirestore(): Promise<Experiment[]> {
    try {
        const db = getFirestoreClient();
        const snap = await db.collection("chemistry_experiments").get();
        if (snap.empty) return LOCAL_EXPERIMENTS;
        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Experiment));
    } catch {
        return LOCAL_EXPERIMENTS;
    }
}

/** Fetch a single experiment by ID, falling back to local. */
export async function getExperimentById(id: string): Promise<Experiment | null> {
    try {
        const db = getFirestoreClient();
        const doc = await db.collection("chemistry_experiments").doc(id).get();
        if (!doc.exists) {
            return LOCAL_EXPERIMENTS.find((e) => e.id === id) ?? null;
        }
        return { id: doc.id, ...doc.data() } as Experiment;
    } catch {
        return LOCAL_EXPERIMENTS.find((e) => e.id === id) ?? null;
    }
}

/** Fetch all reactions, falling back to local if Firestore unavailable. */
export async function getReactionsFromFirestore(): Promise<Reaction[]> {
    try {
        const db = getFirestoreClient();
        const snap = await db.collection("chemistry_reactions").get();
        if (snap.empty) return LOCAL_REACTIONS;
        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reaction));
    } catch {
        return LOCAL_REACTIONS;
    }
}
