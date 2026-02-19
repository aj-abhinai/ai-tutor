/**
 * Zod schemas for curriculum API request validation.
 * Lab routes are intentionally excluded — the lab module validates inline.
 */

import { z } from "zod";

// ── Base schema shared by explain, deep, expand, feedback ──

export const CurriculumBodySchema = z.object({
    subject: z.enum(["Science", "Maths"]),
    chapterId: z.string().trim().min(1, "Chapter is required").max(120, "Chapter must be 120 characters or less"),
    topicId: z.string().trim().min(1, "Topic is required").max(120, "Topic must be 120 characters or less"),
    subtopicId: z.string().trim().min(1, "Subtopic is required").max(120, "Subtopic must be 120 characters or less"),
});

// ── Explain route: optional mode + optional studentAnswer ──

export const ExplainBodySchema = CurriculumBodySchema.extend({
    mode: z.enum(["lesson", "feedback"]).optional().default("lesson"),
    studentAnswer: z.string().max(600, "Student answer must be 600 characters or less").optional(),
});

// ── Expand route: optional level with default ──

export const ExpandBodySchema = CurriculumBodySchema.extend({
    level: z.enum(["simple", "standard", "deep"]).optional().default("standard"),
});

// ── Feedback route: student answer + optional quiz context ──

export const FeedbackBodySchema = CurriculumBodySchema.extend({
    studentAnswer: z
        .string()
        .trim()
        .min(1, "Student answer is required")
        .max(600, "Student answer must be 600 characters or less"),
    lessonContext: z.string().max(1600, "Lesson context must be 1600 characters or less").optional(),
    mode: z.enum(["explain", "quiz"]).optional().default("explain"),
    question: z.string().max(400, "Question must be 400 characters or less").optional(),
    expectedAnswer: z.string().max(400, "Expected answer must be 400 characters or less").optional(),
    answerExplanation: z.string().max(700, "Answer explanation must be 700 characters or less").optional(),
});

// ── Auto-inferred TypeScript types ──

export type CurriculumBody = z.infer<typeof CurriculumBodySchema>;
export type ExplainBody = z.infer<typeof ExplainBodySchema>;
export type ExpandBody = z.infer<typeof ExpandBodySchema>;
export type FeedbackBody = z.infer<typeof FeedbackBodySchema>;
