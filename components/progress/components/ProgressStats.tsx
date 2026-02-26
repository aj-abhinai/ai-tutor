"use client";

interface ProgressStatsProps {
  totalCompleted: number;
  streakDays: number;
}

export function ProgressStats({ totalCompleted, streakDays }: ProgressStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <div className="text-4xl font-bold text-primary">{totalCompleted}</div>
        <div className="text-sm text-text-muted mt-1">
          {totalCompleted === 1 ? "Unit Test" : "Unit Tests"} Completed
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <div className="text-4xl font-bold text-secondary">{streakDays}</div>
        <div className="text-sm text-text-muted mt-1">
          {streakDays === 1 ? "Day" : "Days"} Streak
        </div>
      </div>
    </div>
  );
}
