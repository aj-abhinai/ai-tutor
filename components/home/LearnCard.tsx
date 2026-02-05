"use client";

import { Badge, Button, Card, TextArea } from "@/components/ui";
import { SubtopicKnowledge } from "@/lib/curriculum";
import { renderHtml } from "./lesson-utils";
import { ExplainFeedback, ExplainLevel, TutorLessonResponse } from "./types";

interface LearnCardProps {
  data: TutorLessonResponse;
  selectedSubtopic: SubtopicKnowledge | null;
  explainLevel: ExplainLevel;
  onExplainLevelChange: (level: ExplainLevel) => void;
  deepEssay?: string | null;
  deepLoading?: boolean;
  deepError?: string;
  deepCooldownUntil?: number | null;
  onGenerateDeep?: (force?: boolean) => void;
  curiosityResponse: string;
  onCuriosityResponseChange: (value: string) => void;
  explainBack: string;
  onExplainBackChange: (value: string) => void;
  onExplainBackCheck: () => void;
  checkingExplain: boolean;
  explainFeedback: ExplainFeedback | null;
  selfCheck: "confident" | "unsure" | null;
  onSelfCheckChange: (value: "confident" | "unsure") => void;
}

export function LearnCard({
  data,
  selectedSubtopic,
  explainLevel,
  onExplainLevelChange,
  deepEssay,
  deepLoading = false,
  deepError = "",
  deepCooldownUntil = null,
  onGenerateDeep,
  curiosityResponse,
  onCuriosityResponseChange,
  explainBack,
  onExplainBackChange,
  onExplainBackCheck,
  checkingExplain,
  explainFeedback,
  selfCheck,
  onSelfCheckChange,
}: LearnCardProps) {
  // Derived display content for the current explain level.
  const bulletPoints = explainLevel === "deep" ? [] : data.bulletPoints?.[explainLevel] ?? [];
  const explanationHtml = data.quickExplanation;
  const deepEssayHtml = deepEssay || data.bulletPoints?.deep?.join("") || "";
  const deepHasAi = Boolean(deepEssay);
  const cooldownMs = deepCooldownUntil ? Math.max(deepCooldownUntil - Date.now(), 0) : 0;
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);
  const cooldownLabel = cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : null;
  const canGenerate = !deepLoading && cooldownSeconds === 0;

  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      {/* Header + explain-level toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Explain</h2>
          <p className="text-sm text-slate-600">Choose the depth that feels right.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-600">
          {(["simple", "standard", "deep"] as ExplainLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onExplainLevelChange(level)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                explainLevel === level
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Main explanation panel */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <Badge variant="amber">{explainLevel === "simple" ? "Simple" : "Explain"}</Badge>
          <span className="text-xs text-slate-500">
            {explainLevel === "simple"
              ? "Short and clear with the core idea."
              : explainLevel === "standard"
                ? "Elaborated overview with examples and key terms."
                : "Academic-style deep dive with classification and applications."}
          </span>
          {explainLevel === "deep" && onGenerateDeep && (
            <button
              type="button"
              onClick={() => onGenerateDeep(deepHasAi)}
              disabled={!canGenerate}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                !canGenerate
                  ? "cursor-not-allowed border-slate-200 text-slate-400"
                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              }`}
              aria-label="Generate deep explanation with AI"
              title="Generate a longer deep explanation with AI"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                AI
              </span>
              {deepLoading
                ? "Generating..."
                : cooldownLabel
                  ? cooldownLabel
                  : deepHasAi
                    ? "Regenerate"
                    : "Generate"}
            </button>
          )}
        </div>
        <div className="prose prose-base max-w-none text-slate-800 leading-relaxed">
          {explanationHtml ? (
            <div dangerouslySetInnerHTML={renderHtml(explanationHtml)} />
          ) : null}
        </div>
        {explainLevel === "deep" && deepLoading && (
          <div className="mt-4 text-sm text-slate-600">Generating the deep explanation…</div>
        )}

        {explainLevel === "deep" && deepError && (
          <div className="mt-3 text-sm text-rose-700">{deepError}</div>
        )}

        {explainLevel === "deep" && deepEssayHtml && (
          <div className="mt-4 flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <div
              className="flex-1 prose prose-base max-w-none text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={renderHtml(deepEssayHtml)}
            />
          </div>
        )}

        {/* Bullet points for simple/standard levels */}
        {bulletPoints.length > 0 && explainLevel !== "deep" && (
          <ul className="mt-4 space-y-3 text-slate-800">
            {bulletPoints.map((point, index) => (
              <li key={`${point}-${index}`} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <div
                  className="flex-1 prose prose-base max-w-none text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={renderHtml(point)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Study guide details */}
      {selectedSubtopic && (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-white/75 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Study guide (goals + key terms)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
                Learning Goals
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-800">
                {selectedSubtopic.learningObjectives.map((objective) => (
                  <li key={objective}>- {objective}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
                Key Terms
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-800">
                {Object.entries(selectedSubtopic.keyTerms).map(([term, definition]) => (
                  <li key={term}>
                    <span className="font-semibold">{term}:</span> {definition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* Optional examples and misconceptions */}
      {(selectedSubtopic?.examples?.length || selectedSubtopic?.misconceptions?.length) && (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-white/75 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Examples and misconceptions
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {selectedSubtopic?.examples && selectedSubtopic.examples.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
                  Examples
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-800">
                  {selectedSubtopic.examples.map((example) => (
                    <li key={example}>- {example}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSubtopic?.misconceptions && selectedSubtopic.misconceptions.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
                  Common Misconceptions
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-800">
                  {selectedSubtopic.misconceptions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Curiosity prompt and student response */}
      {data.curiosityQuestion && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/75 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
            Curiosity Corner
          </div>
          <div
            className="mt-2 text-slate-700"
            dangerouslySetInnerHTML={renderHtml(data.curiosityQuestion)}
          />
          <TextArea
            variant="teal"
            value={curiosityResponse}
            onChange={(e) => onCuriosityResponseChange(e.target.value)}
            rows={3}
            className="mt-3"
            placeholder="Write your guess or question here."
          />
        </div>
      )}

      {/* Explain-it-back input + feedback */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
          Explain It Back
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Write 1-2 sentences in your own words. This helps memory.
        </p>
        <TextArea
          variant="indigo"
          value={explainBack}
          onChange={(e) => onExplainBackChange(e.target.value)}
          rows={3}
          className="mt-3"
          placeholder="Example: An acid is a substance that..."
        />
        <div className="mt-4">
          <Button
            variant="secondary"
            size="md"
            onClick={onExplainBackCheck}
            disabled={!explainBack.trim() || checkingExplain || !selectedSubtopic}
          >
            {checkingExplain ? "Checking..." : "Check My Explanation"}
          </Button>
        </div>

        {explainFeedback && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold">
              {explainFeedback.rating}
            </div>
            <div className="font-semibold mb-1 mt-2">Feedback</div>
            <div>{explainFeedback.praise}</div>
            <div className="mt-2">
              <span className="font-semibold">Improve:</span> {explainFeedback.fix}
            </div>
            <div className="mt-2">
              <span className="font-semibold">Re-read:</span> {explainFeedback.rereadTip}
            </div>
          </div>
        )}
      </div>

      {/* Self-check confidence buttons */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
        <div className="text-sm font-semibold text-slate-800">
          How do you feel about this subtopic?
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => onSelfCheckChange("confident")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              selfCheck === "confident"
                ? "bg-emerald-200 border-emerald-300 text-emerald-900"
                : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            I can explain it
          </button>
          <button
            onClick={() => onSelfCheckChange("unsure")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              selfCheck === "unsure"
                ? "bg-amber-200 border-amber-300 text-amber-900"
                : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50"
            }`}
          >
            I need more help
          </button>
        </div>

        {selfCheck === "confident" && (
          <p className="mt-3 text-sm text-emerald-800">
            Great! Try the Quiz card or answer the Curiosity question above.
          </p>
        )}
        {selfCheck === "unsure" && (
          <p className="mt-3 text-sm text-amber-800">
            No worries. Re-read the steps, then switch to Listen or try the Quiz with hints.
          </p>
        )}
      </div>
    </Card>
  );
}
