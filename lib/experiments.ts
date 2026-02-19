/**
 * Chemistry experiment types.
 * Runtime chemistry data is sourced from Firestore.
 */

export interface ExperimentStep {
    instruction: string;
    expectedChemical: string;
    hint?: string;
}

export interface ObservationQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface Experiment {
    id: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    reactionId: string;
    steps: ExperimentStep[];
    observation?: ObservationQuestion;
    ageMin: number;
    ageMax: number;
    concept: string;
    whyItHappens: string;
    chapterId?: string;
    chapterName?: string;
}
