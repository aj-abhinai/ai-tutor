"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getProgress,
  recordTestCompletion,
  type StudentProgressView,
} from "../api/client";

interface UseProgressReturn {
  progress: StudentProgressView | null;
  isLoading: boolean;
  error: string;
  recordCompletion: (
    testId: string,
    testTitle: string,
    chapterId: string,
    chapterTitle: string,
    score?: number
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

// Hook to manage student progress state
export function useProgress(): UseProgressReturn {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgressView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getProgress();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const recordCompletion = useCallback(
    async (
      testId: string,
      testTitle: string,
      chapterId: string,
      chapterTitle: string,
      score?: number
    ) => {
      if (!user) return;

      try {
        const updated = await recordTestCompletion(
          testId,
          testTitle,
          chapterId,
          chapterTitle,
          score
        );
        setProgress(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record progress");
      }
    },
    [user]
  );

  return {
    progress,
    isLoading,
    error,
    recordCompletion,
    refresh: loadProgress,
  };
}
