// Shared types for home cards and API responses.
export type CardStep = "learn" | "listen" | "quiz";
export type ExplainLevel = "simple" | "standard" | "deep";

export interface TutorLessonResponse {
  quickExplanation: string;
  bulletPoints: {
    simple: string[];
    standard: string[];
    deep: string[];
  };
  curiosityQuestion?: string;
}

export interface TutorExpandResponse {
  expandedExplanation: string;
  analogy: string;
  whyItMatters: string;
  commonConfusion: string;
}

export interface ExplainFeedback {
  rating: string;
  praise: string;
  fix: string;
  rereadTip: string;
  isCorrect?: boolean;
}
