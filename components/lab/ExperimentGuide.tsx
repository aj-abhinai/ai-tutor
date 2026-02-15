"use client";

import { useEffect, useState } from "react";
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
    }, [currentStep]);

    return (
        <div className="mt-4 rounded-xl border border-sky-200/80 bg-gradient-to-b from-white/95 to-sky-50/80 p-4 shadow-sm backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h3 className="text-sm font-semibold text-slate-800">
                        {experiment.title}
                    </h3>
                </div>
                <button
                    onClick={onQuit}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                    ✕ Quit
                </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-3">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${i < currentStep
                                ? "w-6 bg-emerald-400"
                                : i === currentStep && !reactionDone
                                    ? "w-6 bg-sky-400 animate-pulse"
                                    : i === currentStep && reactionDone
                                        ? "w-6 bg-emerald-400"
                                        : "w-2 bg-slate-200"
                            }`}
                    />
                ))}
                {/* Reaction step dot */}
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${reactionDone ? "w-6 bg-emerald-400" : "w-2 bg-slate-200"
                        }`}
                />
            </div>

            {/* Current instruction */}
            {!reactionDone && step && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Step {currentStep + 1} of {totalSteps}
                    </p>
                    <p
                        className="text-sm text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatInstruction(step.instruction) }}
                    />

                    {/* Hint */}
                    {step.hint && (
                        <div>
                            {!showHint ? (
                                <button
                                    onClick={() => setShowHint(true)}
                                    className="text-[11px] font-medium text-sky-500 hover:text-sky-700 transition-colors"
                                >
                                    💡 Need a hint?
                                </button>
                            ) : (
                                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200/60">
                                    💡 {step.hint}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Waiting for reaction */}
            {currentStep >= totalSteps && !reactionDone && (
                <p className="text-sm text-sky-600 font-medium animate-pulse">
                    ⚗️ Reaction in progress...
                </p>
            )}

            {/* Feedback flash */}
            {feedback && (
                <div
                    className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium border ${feedback.type === "correct"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        } animate-[fadeIn_0.2s_ease-out]`}
                >
                    {feedback.type === "correct" ? "✅" : "❌"} {feedback.message}
                </div>
            )}

            {/* Completion (no quiz) */}
            {isComplete && (
                <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-center">
                    <p className="text-sm font-semibold text-emerald-700">🎉 Experiment Complete!</p>
                    <p className="text-xs text-emerald-600 mt-1">Check the results below.</p>
                </div>
            )}

            {/* Observation quiz */}
            {reactionDone && experiment.observation && (
                <ObservationQuiz question={experiment.observation} />
            )}
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────

function ObservationQuiz({ question }: { question: ObservationQuestion }) {
    const [selected, setSelected] = useState<number | null>(null);
    const answered = selected !== null;
    const isCorrect = selected === question.correctIndex;

    return (
        <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                🧐 Quick Check
            </p>
            <p className="text-sm font-medium text-slate-700">{question.question}</p>

            <div className="grid gap-1.5">
                {question.options.map((opt, i) => {
                    let style = "border-slate-200 bg-white/80 text-slate-700 hover:border-sky-300";
                    if (answered) {
                        if (i === question.correctIndex) {
                            style = "border-emerald-300 bg-emerald-50 text-emerald-700";
                        } else if (i === selected && !isCorrect) {
                            style = "border-rose-300 bg-rose-50 text-rose-600";
                        } else {
                            style = "border-slate-200 bg-slate-50 text-slate-400";
                        }
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => !answered && setSelected(i)}
                            disabled={answered}
                            className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${style}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {answered && (
                <p className={`text-xs font-medium ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                    {isCorrect
                        ? "✅ Correct! Great observation."
                        : `❌ Not quite — the answer is: ${question.options[question.correctIndex]}`}
                </p>
            )}
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────

/** Converts **bold** markdown to <strong> tags for instructions. */
function formatInstruction(text: string): string {
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
