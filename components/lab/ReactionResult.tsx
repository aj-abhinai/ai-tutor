"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { buildSimulationPlan } from "@/lib/simulation-engine";
import type { Reaction } from "@/lib/reactions";

interface ReactionResultProps {
    reaction: Reaction | null;
    explanation: string;
    chemicalA: string;
    chemicalB: string;
}

export function ReactionResult({ reaction, explanation, chemicalA, chemicalB }: ReactionResultProps) {
    const plan = useMemo(() => buildSimulationPlan(reaction), [reaction]);

    return (
        <div className="mt-6 space-y-4 animate-[fadeIn_0.35s_ease-out]">
            {/* Observation Badges */}
            <Card variant="highlight" padding="lg" className="flex flex-col items-center bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.92))]">
                {chemicalA && chemicalB && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                        Mix: {chemicalA} + {chemicalB}
                    </p>
                )}

                {reaction ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                        {plan.badges.colorChange && (
                            <Badge variant="indigo">
                                <span
                                    className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-slate-300"
                                    style={{ backgroundColor: plan.liquid.finalColor }}
                                />
                                Colour Change
                            </Badge>
                        )}
                        {plan.badges.gasReleased && <Badge variant="teal">Gas Released</Badge>}
                        {plan.effects.heat === "exothermic" && <Badge variant="amber">Exothermic</Badge>}
                        {plan.effects.heat === "endothermic" && <Badge variant="indigo">Endothermic</Badge>}
                        {plan.badges.precipitate && <Badge variant="gray">Precipitate</Badge>}
                    </div>
                ) : (
                    <div>
                        <Badge variant="gray">No Reaction</Badge>
                    </div>
                )}

                <p className="mt-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
                    {reaction?.category ?? "No reaction under normal conditions"}
                </p>
            </Card>

            {/* Balanced Equation */}
            {reaction && (
                <Card padding="md" className="text-center bg-white/90">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Balanced Equation
                    </p>
                    <p className="text-lg font-semibold text-slate-800 tracking-wide">
                        {reaction.equation}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Products: {reaction.products}</p>
                </Card>
            )}

            {/* AI Explanation */}
            {explanation && (
                <Card padding="md" className="bg-white/90">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        AI Explanation
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
                </Card>
            )}
        </div>
    );
}
