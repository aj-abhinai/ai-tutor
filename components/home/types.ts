export type CardStep = "learn" | "listen" | "quiz";

export interface TutorLessonResponse {
  quickExplanation: string;
  stepByStep: {
    title: string;
    explanation: string;
    keyProperty?: string;
  }[];
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
}
