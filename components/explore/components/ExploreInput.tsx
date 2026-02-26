"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";

interface ExploreInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ExploreInput({ onSubmit, isLoading, disabled }: ExploreInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = useCallback(() => {
    if (!question.trim() || isLoading) return;
    onSubmit(question);
    setQuestion("");
  }, [question, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex gap-2">
      <TextArea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a follow-up question..."
        disabled={disabled || isLoading}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!question.trim() || isLoading || disabled}
        variant="primary"
        className="shrink-0 px-4"
      >
        {isLoading ? "..." : "Ask"}
      </Button>
    </div>
  );
}
