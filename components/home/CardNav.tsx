"use client";

import { NavCard } from "@/components/ui/NavCard";
import { CardStep } from "./types";

interface CardNavProps {
  activeCard: CardStep | null;
  cardDisabled: boolean;
  onSelectCard: (card: CardStep) => void;
}

export function CardNav({ activeCard, cardDisabled, onSelectCard }: CardNavProps) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      <NavCard
        onClick={() => onSelectCard("learn")}
        disabled={cardDisabled}
        isActive={activeCard === "learn"}
        label="Learn"
        title="Quick explanation"
        description="Simple summary and step-by-step notes."
      />
      <NavCard
        onClick={() => onSelectCard("listen")}
        disabled={cardDisabled}
        isActive={activeCard === "listen"}
        label="Listen"
        title="Play narration"
        description="Hear the explanation out loud."
      />
      <NavCard
        onClick={() => onSelectCard("quiz")}
        disabled={cardDisabled}
        isActive={activeCard === "quiz"}
        label="Quiz"
        title="Check understanding"
        description="Answer a few questions."
      />
    </div>
  );
}
