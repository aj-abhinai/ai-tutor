/**
 * Reaction matching helpers over caller-provided datasets.
 */

import type { Reaction } from "./reactions";

function normalizeChemicalName(value: string): string {
    return value.trim().toLowerCase();
}

function makePairKey(a: string, b: string): string {
    const left = normalizeChemicalName(a);
    const right = normalizeChemicalName(b);
    return left < right ? `${left}||${right}` : `${right}||${left}`;
}

interface ReactionIndex {
    byPair: Map<string, Reaction>;
    byChemical: Map<string, Reaction[]>;
    chemicals: string[];
}

const INDEX_CACHE = new WeakMap<Reaction[], ReactionIndex>();

function buildIndex(reactions: Reaction[]): ReactionIndex {
    const byPair = new Map<string, Reaction>();
    const byChemical = new Map<string, Reaction[]>();
    const chemicals = new Set<string>();

    for (const reaction of reactions) {
        byPair.set(makePairKey(reaction.reactantA, reaction.reactantB), reaction);
        chemicals.add(reaction.reactantA);
        chemicals.add(reaction.reactantB);

        const left = normalizeChemicalName(reaction.reactantA);
        const right = normalizeChemicalName(reaction.reactantB);

        const leftList = byChemical.get(left) ?? [];
        leftList.push(reaction);
        byChemical.set(left, leftList);

        const rightList = byChemical.get(right) ?? [];
        rightList.push(reaction);
        byChemical.set(right, rightList);
    }

    return {
        byPair,
        byChemical,
        chemicals: Array.from(chemicals).sort((a, b) => a.localeCompare(b)),
    };
}

function getIndex(reactions: Reaction[]): ReactionIndex {
    const cached = INDEX_CACHE.get(reactions);
    if (cached) return cached;

    const index = buildIndex(reactions);
    INDEX_CACHE.set(reactions, index);
    return index;
}

/** Return a unique, sorted list of all chemical names from the dataset. */
export function getChemicalsList(reactions: Reaction[] = []): string[] {
    return getIndex(reactions).chemicals;
}

/**
 * Find a reaction for the given chemical pair (order-agnostic).
 * Returns the matching `Reaction` or `null` if none exists.
 */
export function findReaction(a: string, b: string, reactions: Reaction[] = []): Reaction | null {
    return getIndex(reactions).byPair.get(makePairKey(a, b)) ?? null;
}

/** Find a known reaction that includes a given chemical for safe no-reaction guidance. */
export function findExampleReactionForChemical(
    chemical: string,
    excluding?: string,
    reactions: Reaction[] = []
): Reaction | null {
    const key = normalizeChemicalName(chemical);
    const blocked = excluding ? normalizeChemicalName(excluding) : "";
    const candidates = getIndex(reactions).byChemical.get(key) ?? [];

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
export function getDefaultReactionPair(
    reactions: Reaction[] = []
): { chemicalA: string; chemicalB: string } | null {
    const first = reactions[0];
    if (!first) return null;

    return {
        chemicalA: first.reactantA,
        chemicalB: first.reactantB,
    };
}
