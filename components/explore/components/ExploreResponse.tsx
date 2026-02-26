"use client";

interface ExploreResponseProps {
  answer: string;
  isStreaming: boolean;
}

export function ExploreResponse({ answer, isStreaming }: ExploreResponseProps) {
  return (
    <div className="prose prose-sm max-w-none text-text">
      <p className="whitespace-pre-wrap">{answer}</p>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
      )}
    </div>
  );
}
