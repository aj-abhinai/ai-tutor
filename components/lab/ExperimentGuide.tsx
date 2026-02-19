"use client";

/**
 * ExperimentGuide.tsx — Guided experiment sidebar panel.
 * Layer: lab-shared. Uses global Alert, Button, OptionButton.
 *
 * Key improvements vs the old version:
 * - No dangerouslySetInnerHTML (instruction bold replaced with React spans)
 * - Wrong-answer feedback persists until next action (no auto-dismiss)
 * - OptionButton used for quiz choices
 * - Alert used for feedback messages
 * - Button used for Quit / Hint
 */

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { OptionButton } from "@/components/ui/OptionButton";
import type { Experiment, ExperimentStep, ObservationQuestion } from "@/lib/experiments";

interface ExperimentGuideProps {
    experiment: Experiment;
    currentStep: number;          // 0-based
    totalSteps: number;
    feedback: { type: "correct" | "wrong"; message: string } | null;
    reactionDone: boolean;
    onQuit: () => void;
}

export function ExperimentGuide({
    experiment,
    currentStep,
    totalSteps,
    feedback,
    reactionDone,
    onQuit,
}: ExperimentGuideProps) {
    const step: ExperimentStep | undefined = experiment.steps[currentStep];
    const isComplete = reactionDone && !experiment.observation;
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        setShowHint(false);
    }, [currentStep, experiment.id]);

    return (
        <div className="guide-panel">
            {/* Header */}
            <div className="guide-panel-header">
                <div>
                    <p className="guide-panel-label">🔬 Guided Experiment</p>
                    <h3 className="guide-panel-title">{experiment.title}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={onQuit} aria-label="Quit experiment">
                    Quit ✕
                </Button>
            </div>

            {/* Concept tag */}
            <div className="guide-panel-concept">
                {experiment.concept}
            </div>

            {/* Progress bar */}
            <div className="guide-panel-progress" role="progressbar"
                aria-valuenow={currentStep} aria-valuemax={totalSteps}>
                {Array.from({ length: totalSteps + 1 }, (_, i) => {
                    const done = i < currentStep || (reactionDone && i === currentStep);
                    const active = i === currentStep && !reactionDone;
                    return (
                        <div
                            key={i}
                            className={`guide-progress-dot ${done ? "done" : active ? "active" : "pending"}`}
                        />
                    );
                })}
            </div>

            {/* Current step instruction */}
            {!reactionDone && step && (
                <div className="guide-step">
                    <p className="guide-step-label">Step {currentStep + 1} of {totalSteps}</p>
                    <p className="guide-step-instruction">
                        <InstructionText text={step.instruction} />
                    </p>

                    {/* Hint */}
                    {step.hint && (
                        <div className="guide-hint-zone">
                            {!showHint ? (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="guide-hint-link"
                                >
                                    💡 Need a hint?
                                </button>
                            ) : (
                                <Alert variant="warning">
                                    💡 {step.hint}
                                </Alert>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Waiting for reaction to resolve */}
            {currentStep >= totalSteps && !reactionDone && (
                <p className="guide-waiting">⚗️ Reaction in progress…</p>
            )}

            {/* Feedback — persists until next interaction */}
            {feedback && (
                <Alert variant={feedback.type === "correct" ? "success" : "error"}>
                    {feedback.type === "correct" ? "✓ " : "✗ "}{feedback.message}
                </Alert>
            )}

            {/* Completion (no quiz variant) */}
            {isComplete && (
                <Alert variant="success">
                    🎉 Experiment complete! Check the reaction result below.
                </Alert>
            )}

            {/* "Study in Tutor" deep-link */}
            {reactionDone && experiment.chapterId && (
                <a
                    href={`/?chapter=${experiment.chapterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="guide-chapter-link"
                >
                    📖 Study "{experiment.chapterName}" in the Tutor →
                </a>
            )}

            {/* Observation quiz */}
            {reactionDone && experiment.observation && (
                <ObservationQuiz question={experiment.observation} />
            )}
        </div>
    );
}

/* ── Observation quiz ─────────────────────────────────────── */

function ObservationQuiz({ question }: { question: ObservationQuestion }) {
    const [selected, setSelected] = useState<number | null>(null);
    const answered = selected !== null;
    const isCorrect = selected === question.correctIndex;

    return (
        <div className="guide-quiz">
            <p className="guide-quiz-label">🧠 Quick Check</p>
            <p className="guide-quiz-question">{question.question}</p>
            <div className="guide-quiz-options">
                {question.options.map((opt, i) => (
                    <OptionButton
                        key={i}
                        label={String.fromCharCode(65 + i)}
                        text={opt}
                        isSelected={selected === i}
                        isCorrect={i === question.correctIndex}
                        showResult={answered}
                        onClick={() => !answered && setSelected(i)}
                        disabled={answered}
                    />
                ))}
            </div>
            {answered && (
                <Alert variant={isCorrect ? "success" : "error"}>
                    {isCorrect
                        ? "✓ Correct! Great observation."
                        : `✗ The answer is: ${question.options[question.correctIndex]}`}
                </Alert>
            )}
        </div>
    );
}

/* ── Instruction text parser ─────────────────────────────── */
// Replaces **bold** with <strong> without dangerouslySetInnerHTML

function InstructionText({ text }: { text: string }) {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
        </>
    );
}
