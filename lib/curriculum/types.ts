/**
 * Shared types for curriculum knowledge and catalogs
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
    questionBank: QuestionItem[];
}

export interface TopicKnowledge {
    id: string;
    title: string;
    overview: string;
    subtopics: SubtopicKnowledge[];
}

export interface ChapterKnowledge {
    id: string;
    title: string;
    overview: string;
    topics: TopicKnowledge[];
}

export interface SubjectCurriculum {
    subject: SubjectName;
    chapters: ChapterKnowledge[];
}

export interface CatalogSubtopic {
    id: string;
    title: string;
}

export interface CatalogTopic {
    id: string;
    title: string;
    subtopics: CatalogSubtopic[];
}

export interface CatalogChapter {
    id: string;
    title: string;
    topics: CatalogTopic[];
}

export interface CurriculumCatalog {
    subject: SubjectName;
    chapters: CatalogChapter[];
}
