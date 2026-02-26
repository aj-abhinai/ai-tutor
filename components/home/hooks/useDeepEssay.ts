"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestDeepEssay } from "../client-api";
import type { SubjectName } from "@/lib/learning-types";
import type { SubtopicKnowledge, TopicSummary, ChapterSummary } from "@/lib/learning-types";

interface UseDeepEssayOptions {
  subject: SubjectName;
  selectedChapter: ChapterSummary | null;
  selectedTopic: TopicSummary | null;
  selectedSubtopicRef: SubtopicKnowledge | null;
  requireLoginFor: (action: string) => boolean;
}

interface UseDeepEssayReturn {
  deepEssay: string | null;
  deepLoading: boolean;
  deepError: string;
  deepCooldownUntil: number | null;
  fetchDeepEssay: (force?: boolean) => Promise<void>;
  resetDeepState: () => void;
}

export function useDeepEssay({
  subject,
  selectedChapter,
  selectedTopic,
  selectedSubtopicRef,
  requireLoginFor,
}: UseDeepEssayOptions): UseDeepEssayReturn {
  const [deepEssay, setDeepEssay] = useState<string | null>(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState("");
  const [deepCooldownUntil, setDeepCooldownUntil] = useState<number | null>(null);

  const deepCache = useRef<Map<string, string>>(new Map());
  const deepGenerateLog = useRef<Map<string, number[]>>(new Map());

  useEffect(() => {
    if (!deepCooldownUntil) return;
    const remaining = deepCooldownUntil - Date.now();
    if (remaining <= 0) {
      setDeepCooldownUntil(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setDeepCooldownUntil(null);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [deepCooldownUntil]);

  const resetDeepState = useCallback(() => {
    setDeepEssay(null);
    setDeepLoading(false);
    setDeepError("");
    setDeepCooldownUntil(null);
  }, []);

  const fetchDeepEssay = useCallback(
    async (force = false) => {
      if (!selectedChapter || !selectedSubtopicRef || deepLoading) return;
      if (!requireLoginFor("deep explanation")) return;

      const cacheKey = `${subject}:${selectedChapter.id}:${selectedTopic?.id}:${selectedSubtopicRef.id}`;
      const cached = deepCache.current.get(cacheKey);
      if (cached && !force) {
        setDeepEssay(cached);
        setDeepError("");
        return;
      }

      const now = Date.now();
      const windowMs = 2 * 60 * 1000;
      const entries = deepGenerateLog.current.get(cacheKey) ?? [];
      const recent = entries.filter((timestamp) => now - timestamp < windowMs);
      if (recent.length >= 2) {
        const lockUntil = Math.max(...recent) + windowMs;
        setDeepCooldownUntil(lockUntil);
        setDeepError("You can regenerate twice within 2 minutes. Please wait a bit.");
        deepGenerateLog.current.set(cacheKey, recent);
        return;
      }

      setDeepLoading(true);
      setDeepError("");
      setDeepEssay("");

      try {
        let streamedEssay = "";
        const { deepEssay: generatedEssay, error: deepRequestError } = await requestDeepEssay(
          {
            subject,
            chapterId: selectedChapter.id,
            topicId: selectedTopic?.id,
            subtopicId: selectedSubtopicRef.id,
          },
          (delta) => {
            streamedEssay += delta;
            setDeepEssay(streamedEssay);
          },
        );

        if (deepRequestError) {
          setDeepError(deepRequestError);
          setDeepEssay(null);
        } else if (generatedEssay) {
          deepCache.current.set(cacheKey, generatedEssay);
          setDeepEssay(generatedEssay);
          const updated = [...recent, now];
          deepGenerateLog.current.set(cacheKey, updated);
          if (updated.length >= 2) {
            const lockUntil = updated[0] + windowMs;
            setDeepCooldownUntil(lockUntil);
          } else {
            setDeepCooldownUntil(null);
          }
        } else {
          setDeepError("No deep explanation returned. Please try again.");
          setDeepEssay(null);
        }
      } catch {
        setDeepError("Failed to connect to API");
        setDeepEssay(null);
      } finally {
        setDeepLoading(false);
      }
    },
    [deepLoading, requireLoginFor, selectedChapter, selectedSubtopicRef, selectedTopic?.id, subject],
  );

  return {
    deepEssay,
    deepLoading,
    deepError,
    deepCooldownUntil,
    fetchDeepEssay,
    resetDeepState,
  };
}
