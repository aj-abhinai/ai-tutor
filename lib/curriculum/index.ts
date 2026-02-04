/**
 * NCERT Class 7 Curriculum Knowledge Base (2024-25)
 *
 * Main entry point that re-exports all curriculum content and provides
 * helper functions for looking up topic knowledge.
 */

// Re-export types
export type { TopicKnowledge } from "./types";

// Re-export topic lists and knowledge bases
export { SCIENCE_TOPICS, SCIENCE_KNOWLEDGE } from "./science";
export { MATHS_TOPICS, MATHS_KNOWLEDGE } from "./maths";

// Import for helper functions
import { SCIENCE_KNOWLEDGE } from "./science";
import { MATHS_KNOWLEDGE } from "./maths";
import { TopicKnowledge } from "./types";

/**
 * Get curriculum knowledge for a specific topic
 */
export function getTopicKnowledge(
    subject: "Science" | "Maths",
    topic: string
): TopicKnowledge | null {
    const knowledgeBase = subject === "Science" ? SCIENCE_KNOWLEDGE : MATHS_KNOWLEDGE;
    return knowledgeBase[topic] || null;
}

/**
 * Format topic knowledge as context string for AI prompt
 */
export function formatKnowledgeForPrompt(knowledge: TopicKnowledge): string {
    let context = "=== NCERT TEXTBOOK REFERENCE (2024-25) ===\n\n";

    context += "KEY CONCEPTS:\n";
    knowledge.keyConcepts.forEach((concept, i) => {
        context += `${i + 1}. ${concept}\n`;
    });

    if (knowledge.formulas && knowledge.formulas.length > 0) {
        context += "\nFORMULAS:\n";
        knowledge.formulas.forEach((formula) => {
            context += `• ${formula}\n`;
        });
    }

    context += "\nKEY TERMS:\n";
    Object.entries(knowledge.keyTerms).forEach(([term, definition]) => {
        context += `• ${term}: ${definition}\n`;
    });

    context += "\nTEXTBOOK EXAMPLES:\n";
    knowledge.textbookExamples.forEach((example) => {
        context += `• ${example}\n`;
    });

    if (knowledge.commonMisconceptions && knowledge.commonMisconceptions.length > 0) {
        context += "\nCOMMON MISCONCEPTIONS TO CORRECT:\n";
        knowledge.commonMisconceptions.forEach((m) => {
            context += `• ${m}\n`;
        });
    }

    context += "\n=== END TEXTBOOK REFERENCE ===\n";
    context += "\nUse this reference to ensure accuracy. Include examples when relevant.\n";

    return context;
}
