"use client";

export function PageHeader() {
  return (
    <div className="text-center mb-8">
      {/* Small badge + product title */}
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Class 7 NCERT
      </div>
      <h1 className="mt-4 text-4xl font-semibold text-slate-900">AI Tutor</h1>
      <p className="text-sm text-slate-600 mt-2">
        Learn. Listen. Quiz. Build confidence one topic at a time.
      </p>
    </div>
  );
}
