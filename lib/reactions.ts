/**
 * Chemistry reaction types.
 * Runtime chemistry data is sourced from Firestore.
 */

export interface ReactionVisual {
    color?: string;
    gas?: boolean;
    heat?: "exothermic" | "endothermic" | null;
    precipitate?: boolean;
}

export interface Reaction {
    id: string;
    reactantA: string;
    reactantB: string;
    equation: string;
    products: string;
    visual: ReactionVisual;
    category: string;
}
