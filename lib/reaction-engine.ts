/**
 * Reaction Matching Engine
 *
 * Provides helpers to list chemicals and find reactions by pair.
 */

import REACTIONS, { type Reaction } from "./reactions";

function normalizeChemicalName(value: string): string {
    return value.trim().toLowerCase();
}

function makePairKey(a: string, b: string): string {
    const left = normalizeChemicalName(a);
    const right = normalizeChemicalName(b);
    return left < right ? `${left}||${right}` : `${right}||${left}`;
}

// Fast lookup tables for reaction matching and example retrieval.
const REACTION_BY_PAIR = new Map<string, Reaction>();
const REACTIONS_BY_CHEMICAL = new Map<string, Reaction[]>();
const CHEMICALS = new Set<string>();

for (const reaction of REACTIONS) {
    REACTION_BY_PAIR.set(makePairKey(reaction.reactantA, reaction.reactantB), reaction);
    CHEMICALS.add(reaction.reactantA);
    CHEMICALS.add(reaction.reactantB);

    const left = normalizeChemicalName(reaction.reactantA);
    const right = normalizeChemicalName(reaction.reactantB);

    const leftList = REACTIONS_BY_CHEMICAL.get(left) ?? [];
    leftList.push(reaction);
    REACTIONS_BY_CHEMICAL.set(left, leftList);

    const rightList = REACTIONS_BY_CHEMICAL.get(right) ?? [];
    rightList.push(reaction);
    REACTIONS_BY_CHEMICAL.set(right, rightList);
}

/** Return a unique, sorted list of all chemical names from the dataset. */
export function getChemicalsList(): string[] {
    return Array.from(CHEMICALS).sort((a, b) => a.localeCompare(b));
}

/**
 * Find a reaction for the given chemical pair (order-agnostic).
 * Returns the matching `Reaction` or `null` if none exists.
 */
export function findReaction(a: string, b: string): Reaction | null {
    return REACTION_BY_PAIR.get(makePairKey(a, b)) ?? null;
}

/** Find a known reaction that includes a given chemical for safe no-reaction guidance. */
export function findExampleReactionForChemical(
    chemical: string,
    excluding?: string
): Reaction | null {
    const key = normalizeChemicalName(chemical);
    const blocked = excluding ? normalizeChemicalName(excluding) : "";
    const candidates = REACTIONS_BY_CHEMICAL.get(key) ?? [];
    for (const reaction of candidates) {
        const a = normalizeChemicalName(reaction.reactantA);
        const b = normalizeChemicalName(reaction.reactantB);
        if (!blocked || (a !== blocked && b !== blocked)) {
            return reaction;
        }
    }
    return null;
}

/** Return a stable default reacting pair for initial lab selections. */
export function getDefaultReactionPair(): { chemicalA: string; chemicalB: string } | null {
    const first = REACTIONS[0];
    if (!first) return null;
    return {
        chemicalA: first.reactantA,
        chemicalB: first.reactantB,
    };
}
