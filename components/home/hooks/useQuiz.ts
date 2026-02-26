"use client";

import { type Dispatch, type SetStateAction, useCallback, useState } from "react";
import type { ExplainFeedback } from "../types";
import { requestFeedback } from "../client-api";
import type { SubjectName } from "@/lib/learning-types";
import type { SubtopicKnowledge, TopicSummary, ChapterSummary } from "@/lib/learning-types";

interface UseQuizOptions {
  subject: SubjectName;
  selectedChapter: ChapterSummary | null;
  selectedTopic: TopicSummary | null;
  selectedSubtopicRef: SubtopicKnowledge | null;
  data: { quickExplanation?: string; bulletPoints?: { standard?: string[] } } | null;
  requireLoginFor: (action: string) => boolean;
  setError: (error: string) => void;
}

interface UseQuizReturn {
  questionIndex: number;
  setQuestionIndex: Dispatch<SetStateAction<number>>;
  quizFeedback: ExplainFeedback | null;
  checkingQuiz: boolean;
  quizFeedbackPreview: string;
  handleCheckShortAnswer: (payload: {
    answer: string;
    question: string;
    expectedAnswer: string;
    answerExplanation?: string;
  }) => Promise<void>;
  resetQuizState: () => void;
  handleNextQuestion: (questionsLength: number) => void;
  handlePrevQuestion: () => void;
  handleRestartQuestions: () => void;
}

export function useQuiz({
  subject,
  selectedChapter,
  selectedTopic,
  selectedSubtopicRef,
  data,
  requireLoginFor,
  setError,
}: UseQuizOptions): UseQuizReturn {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<ExplainFeedback | null>(null);
  const [checkingQuiz, setCheckingQuiz] = useState(false);
  const [quizFeedbackPreview, setQuizFeedbackPreview] = useState("");

  const buildLessonContext = useCallback(() => {
    if (!data) return "";
    const points = data.bulletPoints?.standard?.slice(0, 4) ?? [];
    return `Quick Explanation: ${data.quickExplanation ?? ""}\nKey Points: ${points.join(" | ")}`;
  }, [data]);

  const resetQuizState = useCallback(() => {
    setQuizFeedback(null);
    setQuizFeedbackPreview("");
    setCheckingQuiz(false);
  }, []);

  const handleCheckShortAnswer = useCallback(
    async (payload: {
      answer: string;
      question: string;
      expectedAnswer: string;
      answerExplanation?: string;
    }) => {
      if (!selectedChapter || !selectedSubtopicRef || checkingQuiz) return;
      if (!requireLoginFor("AI quiz feedback")) return;

      setCheckingQuiz(true);
      setQuizFeedback(null);
      setQuizFeedbackPreview("");
      setError("");

      try {
        let streamedPreview = "";
        const { feedback, error: feedbackError } = await requestFeedback(
          {
            subject,
            chapterId: selectedChapter.id,
            topicId: selectedTopic?.id,
            subtopicId: selectedSubtopicRef.id,
            studentAnswer: payload.answer,
            lessonContext: buildLessonContext(),
            mode: "quiz",
            question: payload.question,
            expectedAnswer: payload.expectedAnswer,
            answerExplanation: payload.answerExplanation,
          },
          (delta) => {
            streamedPreview += delta;
            setQuizFeedbackPreview(streamedPreview);
          },
        );

        if (feedbackError) {
          setError(feedbackError);
          return;
        }
        if (feedback) {
          setQuizFeedback(feedback);
          setQuizFeedbackPreview("");
          return;
        }
        setError("No feedback returned. Please try again.");
      } catch {
        setError("Failed to connect to API");
      } finally {
        setCheckingQuiz(false);
      }
    },
    [buildLessonContext, checkingQuiz, requireLoginFor, selectedChapter, selectedSubtopicRef, selectedTopic?.id, setError, subject],
  );

  const handleNextQuestion = useCallback((questionsLength: number) => {
    if (questionsLength <= 0) return;
    setQuestionIndex((prev) => Math.min(prev + 1, questionsLength - 1));
    resetQuizState();
  }, [resetQuizState]);

  const handlePrevQuestion = useCallback(() => {
    setQuestionIndex((prev) => Math.max(prev - 1, 0));
    resetQuizState();
  }, [resetQuizState]);

  const handleRestartQuestions = useCallback(() => {
    setQuestionIndex(0);
    resetQuizState();
  }, [resetQuizState]);

  return {
    questionIndex,
    setQuestionIndex,
    quizFeedback,
    checkingQuiz,
    quizFeedbackPreview,
    handleCheckShortAnswer,
    resetQuizState,
    handleNextQuestion,
    handlePrevQuestion,
    handleRestartQuestions,
  };
}
