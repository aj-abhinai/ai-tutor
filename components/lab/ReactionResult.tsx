"use client";

import { useEffect, useMemo, useState } from "react";
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

type MixPhase = "pick-a" | "pour-a" | "pick-b" | "pour-b" | "react";

function shortLabel(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    const symbolMatch = trimmed.match(/\(([^)]+)\)/);
    if (symbolMatch?.[1]) return symbolMatch[1];
    return trimmed.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function phaseText(phase: MixPhase, reaction: Reaction | null): string {
    if (phase === "pick-a") return "Pick A";
    if (phase === "pour-a") return "Pour A";
    if (phase === "pick-b") return "Pick B";
    if (phase === "pour-b") return "Pour B";
    return reaction ? "Observe" : "No visible reaction";
}

export function ReactionResult({ reaction, explanation, chemicalA, chemicalB }: ReactionResultProps) {
    // Stabilise on reaction id so that JSON-deserialised objects don't
    // cause infinite re-renders (new object reference every render).
    const reactionId = reaction?.id ?? null;
    const plan = useMemo(() => buildSimulationPlan(reaction), [reactionId]);  // eslint-disable-line react-hooks/exhaustive-deps
    const [phase, setPhase] = useState<MixPhase>("pick-a");
    const [reactionReady, setReactionReady] = useState(false);
    const reduceMotion = false;

    useEffect(() => {
        setPhase("pick-a");
        setReactionReady(false);

        if (reduceMotion) {
            setPhase("react");
            setReactionReady(true);
            return;
        }

        const timers = [
            window.setTimeout(() => setPhase("pour-a"), plan.timeline.toPourA),
            window.setTimeout(() => setPhase("pick-b"), plan.timeline.toPickB),
            window.setTimeout(() => setPhase("pour-b"), plan.timeline.toPourB),
            window.setTimeout(() => {
                setPhase("react");
                setReactionReady(true);
            }, plan.timeline.toReact),
        ];

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [chemicalA, chemicalB, reactionId, reduceMotion]);  // eslint-disable-line react-hooks/exhaustive-deps

    const leftActive = phase === "pick-a" || phase === "pour-a";
    const rightActive = phase === "pick-b" || phase === "pour-b";

    const liquidColor = reactionReady ? plan.liquid.finalColor : plan.liquid.initialColor;
    const liquidHeight = reactionReady ? plan.liquid.finalHeight : plan.liquid.initialHeight;

    return (
        <div className="mt-6 space-y-4 animate-[fadeIn_0.35s_ease-out]">
            <Card variant="highlight" padding="lg" className="flex flex-col items-center">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#eef2ff)] p-4">
                    <div className="relative h-52">
                        <div className={`absolute left-4 top-5 ${reduceMotion ? "" : "transition-all duration-400"} ${leftActive ? "opacity-100 -translate-y-1" : "opacity-55 translate-y-3"}`}>
                            <div className="h-12 w-9 rounded-md border border-slate-300 bg-cyan-100 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                                {shortLabel(chemicalA)}
                            </div>
                        </div>

                        <div className={`absolute right-4 top-5 ${reduceMotion ? "" : "transition-all duration-400"} ${rightActive ? "opacity-100 -translate-y-1" : "opacity-55 translate-y-3"}`}>
                            <div className="h-12 w-9 rounded-md border border-slate-300 bg-indigo-100 text-[10px] font-semibold text-slate-700 flex items-center justify-center">
                                {shortLabel(chemicalB)}
                            </div>
                        </div>

                        {!reduceMotion && phase === "pour-a" && (
                            <div className="absolute left-[94px] top-[58px] h-20 w-0.5 rounded-full bg-cyan-300/70 animate-[pourStream_0.6s_linear_infinite]" />
                        )}
                        {!reduceMotion && phase === "pour-b" && (
                            <div className="absolute right-[94px] top-[58px] h-20 w-0.5 rounded-full bg-indigo-300/70 animate-[pourStream_0.6s_linear_infinite]" />
                        )}

                        <div className="absolute left-1/2 bottom-1 -translate-x-1/2 w-32 h-40 flex items-end justify-center">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-6 rounded-t-md border-2 border-slate-300 bg-slate-100/80" />
                            <div className="relative w-24 h-32 overflow-hidden rounded-b-[2rem] rounded-t-md border-2 border-slate-300 bg-white/80">
                                <div
                                    className={`absolute inset-x-0 bottom-0 rounded-b-[2rem] ${reduceMotion ? "" : "transition-all duration-700"}`}
                                    style={{
                                        height: liquidHeight,
                                        backgroundColor: liquidColor,
                                        opacity: reactionReady ? plan.liquid.opacity : 0.7,
                                    }}
                                />

                                {reactionReady && plan.effects.bubbles && !reduceMotion && (
                                    <div className="absolute inset-0 overflow-hidden">
                                        <span className="absolute bottom-2 left-7 h-2 w-2 rounded-full bg-white/60 animate-[bubbleUp_1.5s_ease-in-out_infinite]" />
                                        <span className="absolute bottom-2 right-8 h-1.5 w-1.5 rounded-full bg-white/55 animate-[bubbleUp_1.8s_ease-in-out_0.4s_infinite]" />
                                    </div>
                                )}

                                {reactionReady && plan.effects.precipitate && !reduceMotion && (
                                    <div className="absolute inset-x-4 bottom-2 h-5">
                                        <span className="absolute left-3 bottom-0 h-1.5 w-1.5 rounded-full bg-white/85 animate-[precipitate_1.8s_ease-out_infinite]" />
                                        <span className="absolute left-10 bottom-0 h-1.5 w-1.5 rounded-full bg-white/85 animate-[precipitate_2.2s_ease-out_0.3s_infinite]" />
                                    </div>
                                )}
                            </div>

                            {reactionReady && plan.effects.smoke && !reduceMotion && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                                    <span className="absolute left-0 h-5 w-5 rounded-full bg-slate-300/25 blur-sm animate-[smokeFloat_2.8s_ease-out_infinite]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {phaseText(phase, reaction)}
                    </p>
                </div>

                {reaction ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3 mt-4">
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
                    <div className="mt-4">
                        <Badge variant="gray">No Reaction</Badge>
                    </div>
                )}

                <p className="mt-3 text-xs text-slate-400 font-medium uppercase tracking-wide">
                    {reaction?.category ?? "No reaction under normal conditions"}
                </p>
            </Card>

            {reaction && (
                <Card padding="md" className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Balanced Equation
                    </p>
                    <p className="text-lg font-semibold text-slate-800 tracking-wide">
                        {reaction.equation}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Products: {reaction.products}</p>
                </Card>
            )}

            {explanation && (
                <Card padding="md">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        AI Explanation
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
                </Card>
            )}
        </div>
    );
}
