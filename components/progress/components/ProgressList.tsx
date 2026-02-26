"use client";

import type { UnitTestResult } from "@/lib/profile-types";

interface ProgressListProps {
  completions: UnitTestResult[];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// List of recent test completions
export function ProgressList({ completions }: ProgressListProps) {
  if (completions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-text">Recent Completions</h2>
      <div className="space-y-2">
        {completions.map((item, index) => (
          <div
            key={`${item.testId}-${index}`}
            className="flex items-center justify-between bg-surface border border-border rounded-lg px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text truncate">
                {item.testTitle}
              </div>
              <div className="text-sm text-text-muted truncate">
                {item.chapterTitle}
              </div>
            </div>
            <div className="text-sm text-text-muted ml-4 shrink-0">
              {formatDate(item.completedAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
