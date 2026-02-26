"use client";

import type { ExploreMessage } from "../types";
import { ExploreChat } from "./ExploreChat";
import { ExploreInput } from "./ExploreInput";
import { ExploreResponse } from "./ExploreResponse";
import { ExploreCitations } from "./ExploreCitations";
import { Alert } from "@/components/ui/Alert";
import { StatusCard } from "@/components/ui/StatusCard";

interface ExploreCardProps {
  messages: ExploreMessage[];
  isLoading: boolean;
  error: string;
  onAskQuestion: (question: string) => void;
}

export function ExploreCard({
  messages,
  isLoading,
  error,
  onAskQuestion,
}: ExploreCardProps) {
  const lastMessage = messages[messages.length - 1];
  const isStreaming = isLoading && lastMessage && !lastMessage.answer;

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 && !isLoading && (
        <StatusCard message="Ask a question to explore this topic deeper." />
      )}

      {messages.length > 0 && (
        <div className="space-y-4">
          <ExploreChat messages={messages} isStreaming={isStreaming} />
        </div>
      )}

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {isLoading && messages.length > 0 && !lastMessage?.answer && (
        <StatusCard message="Thinking..." />
      )}

      <div className="sticky bottom-0 bg-background pt-2">
        <ExploreInput onSubmit={onAskQuestion} isLoading={isLoading} disabled={!messages.length} />
      </div>
    </div>
  );
}
