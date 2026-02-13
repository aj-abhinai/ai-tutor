"use client";

export function LabHeader() {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                Virtual Lab
            </div>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900">
                Chemistry Playground
            </h1>
            <p className="text-sm text-slate-600 mt-2">
                Pick two chemicals, mix them, and watch what happens.
            </p>
        </div>
    );
}
