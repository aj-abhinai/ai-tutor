/**
 * Shared types for curriculum knowledge
 */

export interface TopicKnowledge {
    keyConcepts: string[];
    formulas?: string[];
    keyTerms: Record<string, string>;
    textbookExamples: string[];
    commonMisconceptions?: string[];
}
