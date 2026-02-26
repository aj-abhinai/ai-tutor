"use client";

import { useRef, useCallback } from "react";
import type { ExploreResult } from "../types";

interface CacheEntry {
  result: ExploreResult;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function useExploreCache() {
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const getCacheKey = useCallback(
    (subject: string, chapterId: string, topicId: string, subtopicId: string, question: string) => {
      return `${subject}:${chapterId}:${topicId}:${subtopicId}:${question.toLowerCase().trim()}`;
    },
    [],
  );

  const get = useCallback(
    (subject: string, chapterId: string, topicId: string, subtopicId: string, question: string): ExploreResult | null => {
      const key = getCacheKey(subject, chapterId, topicId, subtopicId, question);
      const entry = cache.current.get(key);

      if (!entry) return null;

      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.current.delete(key);
        return null;
      }

      return entry.result;
    },
    [getCacheKey],
  );

  const set = useCallback(
    (subject: string, chapterId: string, topicId: string, subtopicId: string, question: string, result: ExploreResult) => {
      const key = getCacheKey(subject, chapterId, topicId, subtopicId, question);
      cache.current.set(key, { result, timestamp: Date.now() });
    },
    [getCacheKey],
  );

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  return { get, set, clear };
}
