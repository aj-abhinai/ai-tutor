/**
 * NCERT Class 7 Curriculum Knowledge Base (selected chapters)
 */

import { SCIENCE_CURRICULUM } from "./science";
import { MATHS_CURRICULUM } from "./maths";
import {
    SubjectName,
    SubjectCurriculum,
    ChapterKnowledge,
    TopicKnowledge,
    SubtopicKnowledge,
} from "./types";

export type {
    SubjectName,
    SubjectCurriculum,
    ChapterKnowledge,
    TopicKnowledge,
    SubtopicKnowledge,
    QuestionItem,
    PracticeOption,
} from "./types";

export { SCIENCE_CURRICULUM } from "./science";
export { MATHS_CURRICULUM } from "./maths";

const SUBJECT_MAP: Record<SubjectName, SubjectCurriculum> = {
    Science: SCIENCE_CURRICULUM,
    Maths: MATHS_CURRICULUM,
};

export function getSubjectCurriculum(subject: SubjectName): SubjectCurriculum {
    return SUBJECT_MAP[subject];
}

export function getChapterById(
    subject: SubjectName,
    chapterId: string
): ChapterKnowledge | null {
    const curriculum = getSubjectCurriculum(subject);
    return curriculum.chapters.find((chapter) => chapter.id === chapterId) || null;
}

export function getTopicById(
    subject: SubjectName,
    chapterId: string,
    topicId: string
): TopicKnowledge | null {
    const chapter = getChapterById(subject, chapterId);
    if (!chapter) return null;
    return chapter.topics.find((topic) => topic.id === topicId) || null;
}

export function getSubtopicById(
    subject: SubjectName,
    chapterId: string,
    topicId: string,
    subtopicId: string
): SubtopicKnowledge | null {
    const topic = getTopicById(subject, chapterId, topicId);
    if (!topic) return null;
    return topic.subtopics.find((subtopic) => subtopic.id === subtopicId) || null;
}

export function formatSubtopicForPrompt(subtopic: SubtopicKnowledge): string {
    let context = "=== NCERT TOPIC REFERENCE (Class 7) ===\n\n";

    context += `SUBTOPIC: ${subtopic.title}\n\n`;

    context += "LEARNING OBJECTIVES:\n";
    subtopic.learningObjectives.forEach((obj, i) => {
        context += `${i + 1}. ${obj}\n`;
    });

    context += "\nKEY CONCEPTS:\n";
    subtopic.keyConcepts.forEach((concept, i) => {
        context += `${i + 1}. ${concept}\n`;
    });

    context += "\nKEY TERMS:\n";
    Object.entries(subtopic.keyTerms).forEach(([term, definition]) => {
        context += `- ${term}: ${definition}\n`;
    });

    context += "\nTEXTBOOK EXAMPLES:\n";
    subtopic.examples.forEach((example) => {
        context += `- ${example}\n`;
    });

    if (subtopic.misconceptions && subtopic.misconceptions.length > 0) {
        context += "\nCOMMON MISCONCEPTIONS:\n";
        subtopic.misconceptions.forEach((m) => {
            context += `- ${m}\n`;
        });
    }

    context += "\n=== END TOPIC REFERENCE ===\n";
    context += "Use this to keep the explanation accurate and age-appropriate.\n";

    return context;
}
