"use client";

import { Badge, Card } from "@/components/ui";
import type { Reaction } from "@/lib/reactions";

interface ReactionResultProps {
    reaction: Reaction | null;
    explanation: string;
}

export function ReactionResult({ reaction, explanation }: ReactionResultProps) {
    if (!reaction) {
        return (
            <div className="mt-6 space-y-4 animate-[fadeIn_0.4s_ease-out]">
                <Card variant="subtle" padding="lg" className="text-center">
                    <p className="text-3xl mb-3">No Match</p>
                    <p className="text-sm font-semibold text-slate-700 mb-1">No Reaction</p>
                    <p className="text-sm text-slate-500">
                        These chemicals do not react under normal conditions.
                    </p>
                </Card>

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

    const { visual } = reaction;

    return (
        <div className="mt-6 space-y-4 animate-[fadeIn_0.4s_ease-out]">
            <Card variant="highlight" padding="lg" className="flex flex-col items-center">
                <div className="relative w-32 h-40 flex items-end justify-center mb-4">
                    <div
                        className="w-20 h-28 rounded-b-3xl rounded-t-md border-2 border-slate-300 relative overflow-hidden transition-colors duration-700"
                        style={{ backgroundColor: visual.color ?? "#e2e8f0" }}
                    >
                        <div
                            className="absolute inset-x-0 bottom-0 h-[70%] rounded-b-3xl transition-colors duration-700"
                            style={{
                                backgroundColor: visual.color ?? "#e2e8f0",
                                opacity: 0.8,
                            }}
                        />

                        {visual.gas && (
                            <div className="absolute inset-0 overflow-hidden">
                                <span className="absolute bottom-2 left-3 w-2 h-2 rounded-full bg-white/60 animate-[bubbleUp_1.6s_ease-in-out_infinite]" />
                                <span className="absolute bottom-1 left-7 w-1.5 h-1.5 rounded-full bg-white/50 animate-[bubbleUp_2s_ease-in-out_0.4s_infinite]" />
                                <span className="absolute bottom-3 left-10 w-2.5 h-2.5 rounded-full bg-white/40 animate-[bubbleUp_1.8s_ease-in-out_0.8s_infinite]" />
                                <span className="absolute bottom-0 left-5 w-1 h-1 rounded-full bg-white/50 animate-[bubbleUp_2.2s_ease-in-out_1.2s_infinite]" />
                            </div>
                        )}

                        {visual.precipitate && (
                            <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70 animate-[precipitate_1.5s_ease-out_infinite]" />
                                <span className="w-2 h-2 rounded-full bg-slate-500/60 animate-[precipitate_2s_ease-out_0.5s_infinite]" />
                                <span className="w-1 h-1 rounded-full bg-slate-400/50 animate-[precipitate_1.8s_ease-out_1s_infinite]" />
                            </div>
                        )}
                    </div>

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-6 bg-slate-200/60 border-2 border-slate-300 rounded-t-md" />

                    {visual.heat === "exothermic" && (
                        <div className="absolute -inset-4 rounded-full bg-rose-400/20 animate-[heatGlow_1.5s_ease-in-out_infinite] pointer-events-none" />
                    )}
                    {visual.heat === "endothermic" && (
                        <div className="absolute -inset-4 rounded-full bg-sky-400/20 animate-[heatGlow_1.5s_ease-in-out_infinite] pointer-events-none" />
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    {visual.color && (
                        <Badge variant="indigo">
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-slate-300"
                                style={{ backgroundColor: visual.color }}
                            />
                            Colour Change
                        </Badge>
                    )}
                    {visual.gas && <Badge variant="teal">Gas Released</Badge>}
                    {visual.heat === "exothermic" && <Badge variant="amber">Exothermic</Badge>}
                    {visual.heat === "endothermic" && <Badge variant="indigo">Endothermic</Badge>}
                    {visual.precipitate && <Badge variant="gray">Precipitate</Badge>}
                </div>

                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    {reaction.category}
                </p>
            </Card>

            <Card padding="md" className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                    Balanced Equation
                </p>
                <p className="text-lg font-semibold text-slate-800 tracking-wide">
                    {reaction.equation}
                </p>
                <p className="text-sm text-slate-500 mt-1">Products: {reaction.products}</p>
            </Card>

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
