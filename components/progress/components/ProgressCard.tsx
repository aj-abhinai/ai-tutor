"use client";

import { ProgressStats } from "./ProgressStats";
import { ProgressList } from "./ProgressList";
import { StatusCard } from "@/components/ui/StatusCard";

interface ProgressCardProps {
  totalCompleted: number;
  streakDays: number;
  completions: Array<{
    testId: string;
    testTitle: string;
    chapterId: string;
    chapterTitle: string;
    completedAt: number;
    score?: number;
  }>;
  isLoading?: boolean;
}

export function ProgressCard({
  totalCompleted,
  streakDays,
  completions,
  isLoading,
}: ProgressCardProps) {
  if (isLoading) {
    return <StatusCard message="Loading progress..." />;
  }

  return (
    <div className="space-y-6">
      <ProgressStats
        totalCompleted={totalCompleted}
        streakDays={streakDays}
      />

      <ProgressList completions={completions} />
    </div>
  );
}
