"use client";

import type { ExploreMessage } from "../types";
import { ExploreResponse } from "./ExploreResponse";
import { ExploreCitations } from "./ExploreCitations";

interface ExploreChatProps {
  messages: ExploreMessage[];
  isStreaming: boolean;
}

export function ExploreChat({ messages, isStreaming }: ExploreChatProps) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <div key={message.id} className="space-y-2">
          {/* Question */}
          <div className="flex justify-end">
            <div className="bg-primary text-white px-4 py-2 rounded-2xl rounded-br-md max-w-[85%]">
              <p className="text-sm">{message.question}</p>
            </div>
          </div>

          {/* Answer */}
          <div className="flex justify-start">
            <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]">
              {message.answer ? (
                <>
                  <ExploreResponse answer={message.answer} isStreaming={false} />
                  {message.citations.length > 0 && (
                    <ExploreCitations citations={message.citations} />
                  )}
                </>
              ) : (
                <p className="text-text-muted text-sm animate-pulse">Thinking...</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
