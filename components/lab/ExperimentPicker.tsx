"use client";

/**
 * ExperimentPicker.tsx
 * App-store-style card grid for selecting a guided experiment.
 * Layer: lab-shared. Uses global Card, Badge, Button.
 */

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { type Experiment } from "@/lib/experiments";

interface ExperimentPickerProps {
    experiments: Experiment[];
    onSelect: (exp: Experiment) => void;
    onBackToFree: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    "Carbonate–Acid": "bg-orange-100 text-orange-800",
    "Metal–Acid": "bg-blue-100 text-blue-800",
    "Neutralization": "bg-teal-100 text-teal-800",
    "Displacement": "bg-indigo-100 text-indigo-800",
    "Double Displacement": "bg-purple-100 text-purple-800",
};

function difficultyVariant(d: Experiment["difficulty"]) {
    if (d === "easy") return "sky" as const;
    if (d === "hard") return "rose" as const;
    return "amber" as const;
}

function difficultyLabel(d: Experiment["difficulty"]) {
    return d === "easy" ? "⭐ Easy" : d === "hard" ? "🔥 Hard" : "⚡ Medium";
}

export function ExperimentPicker({ experiments, onSelect, onBackToFree }: ExperimentPickerProps) {
    return (
        <div className="exp-picker">
            {/* Header */}
            <div className="exp-picker-header">
                <div>
                    <h2 className="exp-picker-title">🔬 Choose an Experiment</h2>
                    <p className="exp-picker-subtitle">
                        Step-by-step guided activities from your NCERT textbook
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onBackToFree}>
                    Free Mix →
                </Button>
            </div>

            {/* Card grid */}
            <div className="exp-picker-grid">
                {experiments.map((exp) => {
                    const catColor = CATEGORY_COLORS[exp.category] ?? "bg-slate-100 text-slate-700";
                    return (
                        <Card
                            key={exp.id}
                            variant="default"
                            padding="none"
                            className="exp-card"
                            role="button"
                            tabIndex={0}
                            aria-label={`Start experiment: ${exp.title}`}
                            onClick={() => onSelect(exp)}
                            onKeyDown={(e) => e.key === "Enter" && onSelect(exp)}
                        >
                            {/* Category banner */}
                            <div className={`exp-card-banner ${catColor}`}>
                                {exp.category}
                            </div>

                            <div className="exp-card-body">
                                {/* Title + badges */}
                                <div className="exp-card-top">
                                    <h3 className="exp-card-title">{exp.title}</h3>
                                    <div className="exp-card-badges">
                                        <Badge variant={difficultyVariant(exp.difficulty)}>
                                            {difficultyLabel(exp.difficulty)}
                                        </Badge>
                                        <Badge variant="gray">
                                            Age {exp.ageMin}–{exp.ageMax}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="exp-card-desc">{exp.description}</p>

                                {/* Concept tag */}
                                <div className="exp-card-concept">
                                    <span className="exp-card-concept-label">Concept:</span>
                                    {exp.concept}
                                </div>

                                {/* Chapter link */}
                                {exp.chapterName && (
                                    <div className="exp-card-chapter">
                                        📖 {exp.chapterName}
                                    </div>
                                )}

                                {/* CTA */}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    fullWidth
                                    className="exp-card-cta"
                                    onClick={(e) => { e.stopPropagation(); onSelect(exp); }}
                                >
                                    Start Experiment →
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
