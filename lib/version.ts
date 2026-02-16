/**
 * Application version metadata
 */

export const VERSION = {
    /** Semantic version string */
    current: "0.1.0",

    /** Short description of this version */
    label: "Hardcoded Curriculum",

    /** What changed in this version */
    notes: [
        "NCERT Class 7 Science chapters (2, 3, 10, 11) with hardcoded curriculum data",
        "Interactive circuit lab with React Flow",
        "Chemistry reaction lab",
        "AI-powered explain, feedback, deep-dive, and expand routes",
        "Practice question bank per subtopic",
    ],
} as const;
