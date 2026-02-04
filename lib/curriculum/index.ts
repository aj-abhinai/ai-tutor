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

export function formatSubtopicForFeedback(subtopic: SubtopicKnowledge): string {
    let context = "=== NCERT TOPIC CHECKLIST (Class 7) ===\n\n";

    context += `SUBTOPIC: ${subtopic.title}\n\n`;

    context += "KEY IDEAS (short):\n";
    subtopic.keyConcepts.slice(0, 4).forEach((concept, i) => {
        context += `${i + 1}. ${concept}\n`;
    });

    if (subtopic.misconceptions && subtopic.misconceptions.length > 0) {
        context += "\nCOMMON MISCONCEPTIONS:\n";
        subtopic.misconceptions.slice(0, 3).forEach((m, i) => {
            context += `${i + 1}. ${m}\n`;
        });
    }

    context += "\n=== END TOPIC CHECKLIST ===\n";
    context += "Use this only to judge if the student's answer is on track.\n";

    return context;
}

function normalizeList(items: string[]): string[] {
    return Array.from(
        new Set(
            items
                .map((item) => (typeof item === "string" ? item.trim() : ""))
                .filter((item) => item.length > 0)
        )
    );
}

function buildCuriosityQuestion(subtopic: SubtopicKnowledge): string {
    const primaryTerm = Object.keys(subtopic.keyTerms)[0];
    if (primaryTerm) {
        return `How do we use ${primaryTerm.toLowerCase()} in daily life?`;
    }
    return `Why is ${subtopic.title.toLowerCase()} important in daily life?`;
}

export function buildLessonFromSubtopic(subtopic: SubtopicKnowledge) {
    const ensureSentence = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return "";
        if (/[.!?]$/.test(trimmed)) return trimmed;
        return `${trimmed}.`;
    };

    const sentenceFromTerm = (term: string, definition: string) => {
        const cleanTerm = term.trim();
        const cleanDef = definition.trim();
        if (!cleanTerm || !cleanDef) return "";
        const defLower = cleanDef.toLowerCase();
        const termLower = cleanTerm.toLowerCase();
        if (defLower.startsWith(termLower)) {
            return ensureSentence(cleanDef);
        }
        return ensureSentence(`${cleanTerm} is ${cleanDef}`);
    };

    const listHtml = (items: string[], ordered = false) => {
        const filtered = items.map((item) => item.trim()).filter(Boolean);
        if (filtered.length === 0) return "";
        const tag = ordered ? "ol" : "ul";
        return `<${tag}>${filtered.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
    };

    const keyConcepts = normalizeList(subtopic.keyConcepts);
    const objectives = normalizeList(subtopic.learningObjectives);
    const examples = normalizeList(subtopic.examples);
    const misconceptions = normalizeList(subtopic.misconceptions ?? []);
    const deepDives = normalizeList(subtopic.deepDives ?? []);
    const termEntries = Object.entries(subtopic.keyTerms).filter(
        ([term, definition]) => term.trim().length > 0 && definition.trim().length > 0
    );

    const basePoints = keyConcepts.length > 0 ? keyConcepts : objectives;
    const definitionSentence = termEntries[0]
        ? sentenceFromTerm(termEntries[0][0], termEntries[0][1])
        : ensureSentence(basePoints[0] || `Let's learn about ${subtopic.title.toLowerCase()}`);
    const termSentences = termEntries
        .slice(0, 3)
        .map(([term, definition]) => sentenceFromTerm(term, definition))
        .filter((item): item is string => item.length > 0);
    const academicDefinition = termSentences.length > 0
        ? termSentences.join(" ")
        : definitionSentence;

    const quickSentences: string[] = [];
    if (definitionSentence) quickSentences.push(definitionSentence);
    if (basePoints[0]) quickSentences.push(ensureSentence(basePoints[0]));
    if (examples[0]) quickSentences.push(ensureSentence(`Example: ${examples[0]}`));
    const quickExplanation = quickSentences.slice(0, 3).join(" ");

    const simple: string[] = [];
    if (definitionSentence) {
        simple.push(`<strong>Definition:</strong> ${definitionSentence}`);
    }
    const simpleKeys = basePoints.slice(0, 2).map((item) => ensureSentence(item));
    if (simpleKeys.length > 0) {
        simple.push(`<strong>Key points:</strong>${listHtml(simpleKeys)}`);
    }
    if (examples[0]) {
        simple.push(`<strong>Example:</strong> ${ensureSentence(examples[0])}`);
    }
    if (termEntries[0]) {
        const [term, definition] = termEntries[0];
        simple.push(`<strong>Key term:</strong> ${term} - ${definition}`);
    }
    if (misconceptions[0]) {
        simple.push(`<strong>Watch out:</strong> ${ensureSentence(misconceptions[0])}`);
    }

    const standard: string[] = [];
    const overviewParts = [basePoints[0], basePoints[1], objectives[0]]
        .filter(Boolean)
        .map((item) => ensureSentence(item as string));
    if (overviewParts.length > 0) {
        standard.push(`<strong>Overview:</strong> ${overviewParts.join(" ")}`);
    }
    if (academicDefinition) {
        standard.push(`<strong>Formal definition:</strong> ${academicDefinition}`);
    }
    const standardKeyPoints = basePoints.slice(0, 4).map((item) => ensureSentence(item));
    if (standardKeyPoints.length > 0) {
        standard.push(`<strong>Key points:</strong>${listHtml(standardKeyPoints, true)}`);
    }
    const exampleList = examples.slice(0, 2).map((item) => ensureSentence(item));
    if (exampleList.length > 0) {
        standard.push(`<strong>Real-life examples:</strong>${listHtml(exampleList)}`);
    }
    const termList = termEntries.slice(0, 2).map(([term, definition]) => `${term} - ${definition}`);
    if (termList.length > 0) {
        standard.push(`<strong>Key terms:</strong>${listHtml(termList)}`);
    }
    if (misconceptions[0]) {
        standard.push(`<strong>Common confusion:</strong> ${ensureSentence(misconceptions[0])}`);
    }
    if (objectives[0]) {
        standard.push(`<strong>Why it matters:</strong> ${ensureSentence(objectives[0])}`);
    }

    const deepEssayParts: string[] = [];
    if (academicDefinition) {
        deepEssayParts.push(`<p><strong>Academic definition:</strong> ${academicDefinition}</p>`);
    }
    if (overviewParts.length > 0) {
        deepEssayParts.push(`<p><strong>Big idea:</strong> ${overviewParts.join(" ")}</p>`);
    }
    const deepKeyPoints = basePoints.slice(0, 6).map((item) => ensureSentence(item));
    if (deepKeyPoints.length > 0) {
        deepEssayParts.push(
            `<p><strong>Classification / parts:</strong></p>${listHtml(deepKeyPoints, true)}`
        );
    }
    if (termEntries.length > 0) {
        const deepTerms = termEntries
            .slice(0, 3)
            .map(([term, definition]) => `${term} - ${definition}`);
        deepEssayParts.push(`<p><strong>Key terms:</strong></p>${listHtml(deepTerms)}`);
    }
    const deepExamples = examples.slice(0, 3).map((item) => ensureSentence(item));
    if (deepExamples.length > 0) {
        deepEssayParts.push(
            `<p><strong>Real-life connections:</strong></p>${listHtml(deepExamples)}`
        );
    }
    if (misconceptions[0]) {
        deepEssayParts.push(
            `<p><strong>Common confusion:</strong> ${ensureSentence(misconceptions[0])}</p>`
        );
    }
    const advancedDetail = deepDives[0] || basePoints[2] || "";
    if (advancedDetail) {
        deepEssayParts.push(
            `<p><strong>Advanced detail:</strong> ${ensureSentence(advancedDetail)}</p>`
        );
    }
    if (objectives[0]) {
        deepEssayParts.push(
            `<p><strong>Why this matters academically:</strong> ${ensureSentence(objectives[0])}</p>`
        );
    }

    const deep = [deepEssayParts.join("")];

    return {
        quickExplanation,
        bulletPoints: {
            simple,
            standard,
            deep,
        },
        curiosityQuestion: buildCuriosityQuestion(subtopic),
    };
}

