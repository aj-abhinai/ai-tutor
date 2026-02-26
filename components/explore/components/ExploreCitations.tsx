"use client";

import { Badge } from "@/components/ui/Badge";
import type { ExploreCitation } from "../types";

interface ExploreCitationsProps {
  citations: ExploreCitation[];
}

export function ExploreCitations({ citations }: ExploreCitationsProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs text-text-muted mb-2">Sources:</p>
      <div className="flex flex-wrap gap-1">
        {citations.map((citation, index) => (
          <Badge
            key={`${citation.chunkId}-${index}`}
            variant="gray"
            className="text-xs py-0.5"
          >
            {citation.heading || citation.lane}
          </Badge>
        ))}
      </div>
    </div>
  );
}
