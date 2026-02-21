/**
 * Shared Physics Lab data types.
 * Runtime physics lab data is sourced from Firestore.
 */

import type { ComponentType } from "./circuit-components";

export interface ExperimentStep {
    instruction: string;
    hint: string;
    expectedComponent?: ComponentType;
    toggleSwitch?: boolean;
    successTip?: string;
}

export interface CircuitExperiment {
    id: string;
    title: string;
    description: string;
    conceptTaught: string;
    difficulty: "easy" | "medium";
    steps: ExperimentStep[];
}

export interface ChapterLab {
    chapterId: string;
    chapterTitle: string;
    experiments: CircuitExperiment[];
}

