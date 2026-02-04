"use client";

import { Badge, Button, Card, TextArea } from "@/components/ui";
import { SubtopicKnowledge } from "@/lib/curriculum";
import { renderHtml } from "./lesson-utils";
import { ExplainFeedback, TutorExpandResponse, TutorLessonResponse } from "./types";

interface LearnCardProps {
  data: TutorLessonResponse;
  selectedSubtopic: SubtopicKnowledge | null;
  expandedExplain: TutorExpandResponse | null;
  expandingExplain: boolean;
  expandError: string;
  onExpandExplain: () => void;
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
  expandedExplain,
  expandingExplain,
  expandError,
  onExpandExplain,
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
  const stepItems = data.stepByStep;

  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Explanation</h2>

      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Badge variant="amber">Quick Idea</Badge>
          <span className="text-xs text-amber-700">Say it once in your own words.</span>
        </div>
        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          <div dangerouslySetInnerHTML={renderHtml(data.quickExplanation)} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8">Let&apos;s break it down:</h3>
      <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
        {stepItems.length > 0 ? (
          <ul className="space-y-4 text-gray-700">
            {stepItems.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <div className="text-base font-semibold text-gray-800">
                  Step {index + 1} - {step.title}
                </div>
                <div
                  className="mt-1 text-gray-700"
                  dangerouslySetInnerHTML={renderHtml(step.explanation)}
                />
                {step.keyProperty && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-semibold text-sky-700">Key property:</span>{" "}
                    <span dangerouslySetInnerHTML={renderHtml(step.keyProperty)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-600">No steps available yet.</div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="text-xs uppercase tracking-wide text-violet-700 font-semibold">
          Deeper Explanation
        </div>
        <p className="mt-2 text-sm text-violet-700">
          Want a little more detail? Get an extra explanation, a simple analogy, and a common
          confusion to avoid.
        </p>
        <div className="mt-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onExpandExplain}
            disabled={expandingExplain || !selectedSubtopic}
          >
            {expandingExplain ? "Expanding..." : "Explain More"}
          </Button>
        </div>
        {expandError && <div className="mt-3 text-sm text-rose-700">{expandError}</div>}
        {expandedExplain && (
          <div className="mt-4 space-y-3 text-sm text-violet-900">
            <div dangerouslySetInnerHTML={renderHtml(expandedExplain.expandedExplanation)} />
            <div>
              <span className="font-semibold">Analogy:</span>{" "}
              <span dangerouslySetInnerHTML={renderHtml(expandedExplain.analogy)} />
            </div>
            <div>
              <span className="font-semibold">Why it matters:</span>{" "}
              <span dangerouslySetInnerHTML={renderHtml(expandedExplain.whyItMatters)} />
            </div>
            <div>
              <span className="font-semibold">Common confusion:</span>{" "}
              <span dangerouslySetInnerHTML={renderHtml(expandedExplain.commonConfusion)} />
            </div>
          </div>
        )}
      </div>

      {selectedSubtopic && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
              Learning Goals
            </div>
            <ul className="mt-3 space-y-2 text-sm text-emerald-900">
              {selectedSubtopic.learningObjectives.map((objective) => (
                <li key={objective}>- {objective}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
              Key Terms
            </div>
            <ul className="mt-3 space-y-2 text-sm text-indigo-900">
              {Object.entries(selectedSubtopic.keyTerms).map(([term, definition]) => (
                <li key={term}>
                  <span className="font-semibold">{term}:</span> {definition}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selectedSubtopic && selectedSubtopic.examples.length > 0 && (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="text-xs uppercase tracking-wide text-sky-700 font-semibold">Examples</div>
          <ul className="mt-3 space-y-2 text-sm text-sky-900">
            {selectedSubtopic.examples.map((example) => (
              <li key={example}>- {example}</li>
            ))}
          </ul>
        </div>
      )}

      {selectedSubtopic?.misconceptions && selectedSubtopic.misconceptions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-xs uppercase tracking-wide text-rose-700 font-semibold">
            Common Misconceptions
          </div>
          <ul className="mt-3 space-y-2 text-sm text-rose-900">
            {selectedSubtopic.misconceptions.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      )}

      {data.curiosityQuestion && (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <div className="text-xs uppercase tracking-wide text-teal-700 font-semibold">
            Curiosity Corner
          </div>
          <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={renderHtml(data.curiosityQuestion)} />
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

      <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
        <div className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
          Explain It Back
        </div>
        <p className="mt-2 text-sm text-indigo-700">
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
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-white p-4 text-sm text-indigo-900">
            <div className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">
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

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="text-sm font-semibold text-amber-800">
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
