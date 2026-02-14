"use client";

import type { Experiment } from "@/lib/experiments";

interface ExperimentPickerProps {
    experiments: Experiment[];
    onSelect: (experiment: Experiment) => void;
    onBackToFree: () => void;
}

const difficultyStyles = {
    easy: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-rose-100 text-rose-700",
};

const categoryIcons: Record<string, string> = {
    "Carbonate–Acid": "🌋",
    "Metal–Acid": "⚗️",
    "Neutralization": "🧪",
    "Displacement": "🔄",
    "Double Displacement": "✨",
};

export function ExperimentPicker({ experiments, onSelect, onBackToFree }: ExperimentPickerProps) {
    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">
                    Choose an Experiment
                </h2>
                <button
                    onClick={onBackToFree}
                    className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-white hover:text-sky-600 transition-colors"
                >
                    ← Free Mix
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {experiments.map((exp) => (
                    <button
                        key={exp.id}
                        onClick={() => onSelect(exp)}
                        className="group relative flex flex-col items-start rounded-xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-sky-300 hover:shadow-md hover:bg-white/95"
                    >
                        {/* Category icon + badge */}
                        <div className="flex w-full items-center justify-between mb-2">
                            <span className="text-xl">
                                {categoryIcons[exp.category] ?? "🔬"}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${difficultyStyles[exp.difficulty]}`}>
                                {exp.difficulty}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                            {exp.title}
                        </h3>

                        {/* Description */}
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {exp.description}
                        </p>

                        {/* Category tag */}
                        <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {exp.category}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
