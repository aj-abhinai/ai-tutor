"use client";

import { useCallback, useState } from "react";
import type { ExplainFeedback } from "../types";
import { requestFeedback } from "../client-api";
import type { SubjectName } from "@/lib/learning-types";
import type { SubtopicKnowledge, TopicSummary, ChapterSummary } from "@/lib/learning-types";

interface UseExplainBackOptions {
  subject: SubjectName;
  selectedChapter: ChapterSummary | null;
  selectedTopic: TopicSummary | null;
  selectedSubtopicRef: SubtopicKnowledge | null;
  data: { quickExplanation?: string; bulletPoints?: { standard?: string[] } } | null;
  requireLoginFor: (action: string) => boolean;
  setError: (error: string) => void;
}

interface UseExplainBackReturn {
  explainBack: string;
  curiosityResponse: string;
  explainFeedback: ExplainFeedback | null;
  checkingExplain: boolean;
  explainFeedbackPreview: string;
  buildLessonContext: () => string;
  handleExplainBackCheck: () => Promise<void>;
  setExplainBack: (value: string) => void;
  setCuriosityResponse: (value: string) => void;
  setExplainFeedback: (feedback: ExplainFeedback | null) => void;
  setExplainFeedbackPreview: (preview: string) => void;
  resetExplainState: () => void;
}

export function useExplainBack({
  subject,
  selectedChapter,
  selectedTopic,
  selectedSubtopicRef,
  data,
  requireLoginFor,
  setError,
}: UseExplainBackOptions): UseExplainBackReturn {
  const [explainBack, setExplainBack] = useState("");
  const [curiosityResponse, setCuriosityResponse] = useState("");
  const [explainFeedback, setExplainFeedback] = useState<ExplainFeedback | null>(null);
  const [checkingExplain, setCheckingExplain] = useState(false);
  const [explainFeedbackPreview, setExplainFeedbackPreview] = useState("");

  const resetExplainState = useCallback(() => {
    setExplainFeedback(null);
    setExplainFeedbackPreview("");
    setCheckingExplain(false);
  }, []);

  const buildLessonContext = useCallback(() => {
    if (!data) return "";
    const points = data.bulletPoints?.standard?.slice(0, 4) ?? [];
    return `Quick Explanation: ${data.quickExplanation ?? ""}\nKey Points: ${points.join(" | ")}`;
  }, [data]);

  const handleExplainBackCheck = useCallback(async () => {
    if (!selectedChapter || !selectedSubtopicRef || !explainBack.trim() || checkingExplain) return;
    if (!requireLoginFor("AI explain-back feedback")) return;

    setCheckingExplain(true);
    setExplainFeedback(null);
    setExplainFeedbackPreview("");
    setError("");

    try {
      let streamed = "";
      const { feedback, error: feedbackError } = await requestFeedback(
        {
          subject,
          chapterId: selectedChapter.id,
          topicId: selectedTopic?.id,
          subtopicId: selectedSubtopicRef.id,
          studentAnswer: explainBack.trim(),
          lessonContext: buildLessonContext(),
        },
        (delta) => {
          streamed += delta;
          setExplainFeedbackPreview(streamed);
        },
      );

      if (feedbackError) {
        setError(feedbackError);
      } else if (feedback) {
        setExplainFeedback(feedback);
        setExplainFeedbackPreview("");
      } else {
        setError("No feedback returned. Please try again.");
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      setCheckingExplain(false);
    }
  }, [buildLessonContext, checkingExplain, explainBack, requireLoginFor, selectedChapter, selectedSubtopicRef, selectedTopic?.id, setError, subject]);

  return {
    explainBack,
    curiosityResponse,
    explainFeedback,
    checkingExplain,
    explainFeedbackPreview,
    buildLessonContext,
    handleExplainBackCheck,
    setExplainBack,
    setCuriosityResponse,
    setExplainFeedback,
    setExplainFeedbackPreview,
    resetExplainState,
  };
}
