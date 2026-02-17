/**
 * Shared curriculum data shapes used by API routes and UI.
 * These are data contracts only (no local curriculum content).
 */

export type SubjectName = "Science" | "Maths";

export interface PracticeOption {
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface QuestionItem {
  id: string;
  question: string;
  type: "mcq" | "short" | "reasoning";
  options?: PracticeOption[];
  answer: {
    correct: string;
    explanation: string;
  };
  hint?: string;
}

export interface SubtopicKnowledge {
  id: string;
  title: string;
  learningObjectives: string[];
  keyConcepts: string[];
  keyTerms: Record<string, string>;
  examples: string[];
  misconceptions?: string[];
  deepDives?: string[];
  visualCards?: {
    id: string;
    title: string;
    imageSrc: string;
    caption?: string;
  }[];
  questionBank: QuestionItem[];
}

export interface TopicSummary {
  id: string;
  title: string;
  subtopics: { id: string; title: string }[];
}

export interface ChapterSummary {
  id: string;
  title: string;
  topics: TopicSummary[];
}

export interface CurriculumCatalog {
  subject: SubjectName;
  chapters: ChapterSummary[];
}

