"use client";

import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";

interface ProgressEmptyProps {
  message?: string;
}

export function ProgressEmpty({
  message = "No unit tests completed yet. Start learning to track your progress!",
}: ProgressEmptyProps) {
  return (
    <Card padding="lg" className="text-center">
      <p className="text-text-muted mb-4">{message}</p>
      <LinkButton href="/unittest" variant="primary" className="rounded-full">
        Take a Unit Test
      </LinkButton>
    </Card>
  );
}
