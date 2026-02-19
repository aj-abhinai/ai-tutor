"use client";

/**
 * LabBench.tsx
 * Top-level chemistry lab component — replaces ChemistryCanvas.
 * Orchestrates ChemicalShelf + ReactionStage side by side as a lab bench.
 *
 * Layer: chem-lab (chemistry-specific).
 * Uses: ChemicalShelf, ReactionStage (chem-lab); no globals directly.
 */

import { useState, useCallback, useRef } from "react";
import { ChemicalShelf } from "./ChemicalShelf";
import { ReactionStage } from "./ReactionStage";
import { type Reaction } from "@/lib/reactions";
import { type Experiment } from "@/lib/experiments";
import { type ChemPhase } from "./BeakerSVG";
import { Button } from "@/components/ui/Button";

export interface LabBenchProps {
    chemicals: string[];
    onMix: (chemA: string, chemB: string) => void;
    reaction: Reaction | null;
    isLoading: boolean;
    onReset: () => void;
    // Guided mode
    mode: "free" | "guided";
    experiment?: Experiment | null;
    guidedStep?: number;
    onGuidedCorrect?: () => void;
    onGuidedWrong?: (name?: string) => void;
}

export function LabBench({
    chemicals,
    onMix,
    reaction,
    isLoading,
    onReset,
    mode,
    experiment,
    guidedStep = 0,
    onGuidedCorrect,
    onGuidedWrong,
}: LabBenchProps) {
    const [addedNames, setAddedNames] = useState<string[]>([]);
    const [phase, setPhase] = useState<ChemPhase>("idle");

    // Refs so event-handler callbacks always see the latest values
    // without needing them in the dependency array
    const addedNamesRef = useRef<string[]>([]);
    const mixedRef = useRef(false);

    // Keep ref in sync
    addedNamesRef.current = addedNames;

    const handleAddChemical = useCallback(
        (name: string) => {
            // Read current state from ref — this is an event handler (click),
            // NOT a render phase, so reading the ref here is safe and accurate.
            const prev = addedNamesRef.current;
            if (prev.includes(name) || prev.length >= 2) return;

            // ── Guided-mode validation ─────────────────────────────────────
            // All parent state setters called here (event-handler scope) — never
            // inside a React updater function, so no "setState during render" error.
            if (mode === "guided" && experiment) {
                const expected = experiment.steps[guidedStep]?.expectedChemical;
                if (name !== expected) {
                    onGuidedWrong?.(name);
                    return; // reject — don't add to beaker
                }
                onGuidedCorrect?.();
            }

            // ── Add chemical ───────────────────────────────────────────────
            const next = [...prev, name];
            setAddedNames(next);
            addedNamesRef.current = next;

            if (next.length === 1) {
                setPhase("pouring");
            } else if (next.length === 2 && !mixedRef.current) {
                mixedRef.current = true;
                setPhase("reacting");
                onMix(next[0], next[1]);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [mode, experiment, guidedStep, onGuidedCorrect, onGuidedWrong, onMix]
    );

    // When reaction result arrives, move to done
    const currentPhase: ChemPhase = (() => {
        if (addedNames.length === 0) return "idle";
        if (phase === "reacting") {
            return isLoading ? "reacting" : "done";
        }
        return phase;
    })();

    const handleReset = useCallback(() => {
        setAddedNames([]);
        addedNamesRef.current = [];
        setPhase("idle");
        mixedRef.current = false;
        onReset();
    }, [onReset]);

    const isDisabled = currentPhase === "reacting" || currentPhase === "done";

    return (
        <div className="lab-bench">
            {/* Shelf — left side on desktop, full width on mobile */}
            <div className="lab-bench-shelf">
                <ChemicalShelf
                    chemicals={chemicals}
                    addedNames={addedNames}
                    onAdd={handleAddChemical}
                    isDisabled={isDisabled}
                    experiment={experiment}
                    guidedStep={guidedStep}
                />
            </div>

            {/* Stage — centre of the bench */}
            <div className="lab-bench-stage">
                <ReactionStage
                    phase={currentPhase}
                    reaction={reaction}
                    isLoading={isLoading}
                    addedNames={addedNames}
                />

                {/* Reset button — only shown after reaction */}
                {currentPhase === "done" && (
                    <div className="lab-bench-controls">
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            🔄 Reset Bench
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
