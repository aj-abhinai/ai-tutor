"use client";

export function LabHeader() {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                Virtual Lab
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-slate-900">
                Chemistry Playground
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
                Pick two chemicals, mix them, and observe the reaction with a quick explanation.
            </p>
        </div>
    );
}
