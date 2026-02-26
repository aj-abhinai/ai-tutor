"use client";

import { useCallback, useRef, useState } from "react";
import type { UseExploreOptions, UseExploreReturn, ExploreMessage } from "../types";
import { requestExplore } from "../api/client";
import { useExploreCache } from "./useExploreCache";

export function useExplore({
  subject,
  chapterId,
  topicId,
  subtopicId,
  requireLoginFor,
}: UseExploreOptions): UseExploreReturn {
  const [messages, setMessages] = useState<ExploreMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { get, set: setCache, clear: clearCache } = useExploreCache();
  const isFetching = useRef(false);
  const streamingAnswer = useRef("");

  const askQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      if (isFetching.current) return;
      if (!requireLoginFor("AI exploration")) return;

      const trimmedQuestion = question.trim();
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      // Check cache first
      const cached = get(subject, chapterId, topicId, subtopicId, trimmedQuestion);
      if (cached) {
        const newMessage: ExploreMessage = {
          id: messageId,
          question: trimmedQuestion,
          answer: cached.answer,
          citations: cached.citations,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        return;
      }

      isFetching.current = true;
      setIsLoading(true);
      setError("");
      streamingAnswer.current = "";

      // Add placeholder message for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          question: trimmedQuestion,
          answer: "",
          citations: [],
          timestamp: Date.now(),
        },
      ]);

      try {
        let finalAnswer = "";
        let finalCitations: ExploreMessage["citations"] = [];

        await requestExplore(
          {
            subject,
            chapterId,
            topicId,
            subtopicId,
            question: trimmedQuestion,
          },
          (delta) => {
            streamingAnswer.current += delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId ? { ...msg, answer: streamingAnswer.current } : msg
              )
            );
          },
        );

        // Get final result from the streaming state
        finalAnswer = streamingAnswer.current;
        const result = { answer: finalAnswer, citations: finalCitations };

        // Cache the result
        setCache(subject, chapterId, topicId, subtopicId, trimmedQuestion, result);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, answer: finalAnswer, citations: finalCitations }
              : msg
          )
        );
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : "Failed to get answer";
        setError(errMessage);
        // Remove the placeholder message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } finally {
        isFetching.current = false;
        setIsLoading(false);
      }
    },
    [subject, chapterId, topicId, subtopicId, requireLoginFor, get, setCache],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearCache();
  }, [clearCache]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearMessages,
    clearError,
  };
}
