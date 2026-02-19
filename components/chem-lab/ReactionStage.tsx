"use client";

/**
 * ReactionStage.tsx
 * The centre of the lab bench — shows the beaker and, after a reaction,
 * colour-coded product information.
 *
 * Layer: chem-lab (chemistry-specific). Uses BeakerSVG + global StatusCard.
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BeakerSVG, type ChemPhase } from "./BeakerSVG";
import { StatusCard } from "@/components/ui/StatusCard";
import { type Reaction } from "@/lib/reactions";

interface ReactionStageProps {
    phase: ChemPhase;
    reaction: Reaction | null;
    isLoading: boolean;
    addedNames: string[];
}

function buildBeakerProps(phase: ChemPhase, reaction: Reaction | null, addedCount: number) {
    if (!reaction || phase === "idle" || phase === "pouring") {
        return {
            color: addedCount === 1 ? "#bae6fd" : "#dbeafe",
            level: addedCount === 0 ? 0 : addedCount === 1 ? 30 : 60,
            hasBubbles: false,
            hasPrecipitate: false,
            hasSmoke: false,
            heatType: "none" as const,
        };
    }
    return {
        color: reaction.visual.color ?? "#d1fae5",
        level: 65,
        hasBubbles: reaction.visual.gas ?? false,
        hasPrecipitate: reaction.visual.precipitate ?? false,
        hasSmoke: reaction.visual.heat === "exothermic",
        heatType: (reaction.visual.heat ?? "none") as "exothermic" | "endothermic" | "none",
    };
}

function ReactionStageComponent({ phase, reaction, isLoading, addedNames }: ReactionStageProps) {
    const beakerProps = buildBeakerProps(phase, reaction, addedNames.length);

    return (
        <div className="reaction-stage">
            {/* Beaker centred on the bench */}
            <div className="reaction-stage-beaker">
                <BeakerSVG phase={phase} {...beakerProps} />
            </div>

            {/* Loading indicator */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="reaction-stage-loading"
                    >
                        <StatusCard message="⚗️ Analysing reaction…" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Added chemicals list */}
            {addedNames.length > 0 && phase !== "done" && (
                <div className="reaction-stage-added-list" aria-live="polite">
                    {addedNames.map((name, i) => (
                        <span key={name} className="reaction-stage-added-chip">
                            {i === 0 ? "A: " : "B: "}
                            {name.replace(/ \(.+\)$/, "")}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export const ReactionStage = memo(ReactionStageComponent);
