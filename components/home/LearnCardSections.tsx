"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import type { SubtopicKnowledge, TopicSummary } from "@/lib/learning-types";
import { renderHtml } from "./lesson-utils";
import type { ExplainFeedback, ExplainLevel } from "./types";

const EXPLAIN_LEVELS: ExplainLevel[] = ["simple", "standard", "deep"];

interface LearnHeaderProps {
  explainLevel: ExplainLevel;
  onExplainLevelChange: (level: ExplainLevel) => void;
  onOpenNotes?: () => void;
}

export function LearnHeader({ explainLevel, onExplainLevelChange, onOpenNotes }: LearnHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-text">Explain</h2>
        <p className="text-sm text-text-muted">Choose the depth that feels right.</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface/80 p-1 text-xs font-semibold text-text-muted">
        {EXPLAIN_LEVELS.map((level) => (
          <Button
            key={level}
            onClick={() => onExplainLevelChange(level)}
            variant="ghost"
            size="sm"
            className={`!rounded-full !px-3 !py-1 capitalize ${
              explainLevel === level
                ? "!bg-secondary-light !text-secondary"
                : "!text-text-muted hover:!bg-muted-bg"
            }`}
          >
            {level}
          </Button>
        ))}
      </div>
      {onOpenNotes && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenNotes}
          className="!rounded-full !px-3 !py-1"
        >
          Notes
        </Button>
      )}
    </div>
  );
}

interface SubtopicSelectorProps {
  selectedTopic: TopicSummary | null;
  selectedSubtopic: SubtopicKnowledge | null;
  onSubtopicChange: (subtopicId: string) => void;
}

export function SubtopicSelector({
  selectedTopic,
  selectedSubtopic,
  onSubtopicChange,
}: SubtopicSelectorProps) {
  const availableSubtopics = selectedTopic?.subtopics ?? [];

  if (availableSubtopics.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Subtopic</div>
      <div className="flex flex-wrap gap-2">
        {availableSubtopics.map((subtopic) => {
          const isActive = selectedSubtopic?.id === subtopic.id;
          return (
            <Button
              key={subtopic.id}
              onClick={() => onSubtopicChange(subtopic.id)}
              variant="ghost"
              size="sm"
              className={`!rounded-xl !border !px-3 !py-2 !text-sm !font-medium ${
                isActive
                  ? "!border-secondary !bg-secondary-light !text-secondary"
                  : "!border-border !bg-surface/80 !text-text hover:!border-accent hover:!bg-accent-light/60"
              }`}
            >
              {subtopic.title}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface ExplanationPanelProps {
  explainLevel: ExplainLevel;
  explanationHtml: string;
  bulletPoints: string[];
  deepEssayHtml: string;
  deepLoading: boolean;
  deepError: string;
  canGenerate: boolean;
  deepHasAi: boolean;
  cooldownLabel: string | null;
  onGenerateDeep?: (force?: boolean) => void;
}

export function ExplanationPanel({
  explainLevel,
  explanationHtml,
  bulletPoints,
  deepEssayHtml,
  deepLoading,
  deepError,
  canGenerate,
  deepHasAi,
  cooldownLabel,
  onGenerateDeep,
}: ExplanationPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Badge variant="indigo">{explainLevel === "simple" ? "Simple" : "Explain"}</Badge>
        <span className="text-xs text-text-muted">
          {explainLevel === "simple"
            ? "Short and clear with the core idea."
            : explainLevel === "standard"
              ? "Elaborated overview with examples and key terms."
              : "Academic-style deep dive with classification and applications."}
        </span>
        {explainLevel === "deep" && onGenerateDeep && (
          <Button
            onClick={() => onGenerateDeep(deepHasAi)}
            disabled={!canGenerate}
            variant="ghost"
            size="sm"
            className={`inline-flex items-center gap-2 !rounded-full !border !px-3 !py-1 !text-xs !font-semibold ${
              !canGenerate
                ? "!cursor-not-allowed !border-border !text-text-muted/50"
                : "!border-accent !text-accent-hover hover:!bg-accent-light"
            }`}
            aria-label="Generate deep explanation with AI"
            title="Generate a longer deep explanation with AI"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-light text-[10px] font-bold text-accent-hover">
              AI
            </span>
            {deepLoading
              ? "Generating..."
              : cooldownLabel
                ? cooldownLabel
                : deepHasAi
                  ? "Regenerate"
                  : "Generate"}
          </Button>
        )}
      </div>

      <div className="prose prose-base max-w-none leading-relaxed text-text">
        {explanationHtml ? <div dangerouslySetInnerHTML={renderHtml(explanationHtml)} /> : null}
      </div>

      {explainLevel === "deep" && deepLoading && (
        <div className="mt-4 text-sm text-text-muted">Generating the deep explanation...</div>
      )}

      {explainLevel === "deep" && deepError && <div className="mt-3 text-sm text-error">{deepError}</div>}

      {explainLevel === "deep" && deepEssayHtml && (
        <div className="mt-4 flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary" />
          <div
            className="prose prose-base max-w-none flex-1 leading-relaxed text-text"
            dangerouslySetInnerHTML={renderHtml(deepEssayHtml)}
          />
        </div>
      )}

      {bulletPoints.length > 0 && explainLevel !== "deep" && (
        <ul className="mt-4 space-y-3 text-text">
          {bulletPoints.map((point, index) => (
            <li key={`${point}-${index}`} className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary" />
              <div
                className="prose prose-base max-w-none flex-1 leading-relaxed text-text"
                dangerouslySetInnerHTML={renderHtml(point)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface VisualCardsPanelProps {
  visualCards: NonNullable<SubtopicKnowledge["visualCards"]>;
  visualIndex: number;
  isFlipping: boolean;
  onNext: () => void;
}

export function VisualCardsPanel({ visualCards, visualIndex, isFlipping, onNext }: VisualCardsPanelProps) {
  const currentVisualCard = visualCards[visualIndex] ?? null;

  if (!currentVisualCard) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Visual Card</div>
          <div className="text-sm font-semibold text-text">{currentVisualCard.title}</div>
        </div>
        <div className="text-xs text-text-muted">
          {visualIndex + 1} / {visualCards.length}
        </div>
      </div>
      <div
        className={`learn-visual-card rounded-xl border border-border bg-surface-alt p-3 transition-transform duration-200 ${
          isFlipping ? "learn-visual-card--flipping" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <img
          src={currentVisualCard.imageSrc}
          alt={currentVisualCard.title}
          className="learn-visual-card__image h-auto w-full rounded-lg bg-surface object-contain"
        />
      </div>
      {currentVisualCard.caption && <p className="mt-3 text-sm text-text">{currentVisualCard.caption}</p>}
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onNext} disabled={visualCards.length <= 1 || isFlipping}>
          Next
        </Button>
      </div>
    </div>
  );
}

interface StudyGuidePanelProps {
  selectedSubtopic: SubtopicKnowledge | null;
}

export function StudyGuidePanel({ selectedSubtopic }: StudyGuidePanelProps) {
  if (!selectedSubtopic) return null;

  return (
    <details className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-text">
        Study guide (goals + key terms)
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Learning Goals</div>
          <ul className="mt-3 space-y-2 text-sm text-text">
            {selectedSubtopic.learningObjectives.map((objective) => (
              <li key={objective}>- {objective}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Key Terms</div>
          <ul className="mt-3 space-y-2 text-sm text-text">
            {Object.entries(selectedSubtopic.keyTerms).map(([term, description]) => (
              <li key={term}>
                <span className="font-semibold">{term}:</span> {description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

interface ExamplesPanelProps {
  selectedSubtopic: SubtopicKnowledge | null;
}

export function ExamplesPanel({ selectedSubtopic }: ExamplesPanelProps) {
  const hasExamples = Boolean(selectedSubtopic?.examples?.length);
  const hasMisconceptions = Boolean(selectedSubtopic?.misconceptions?.length);

  if (!hasExamples && !hasMisconceptions) return null;

  return (
    <details className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-text">Examples and misconceptions</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {hasExamples && selectedSubtopic ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Examples</div>
            <ul className="mt-3 space-y-2 text-sm text-text">
              {selectedSubtopic.examples.map((example) => (
                <li key={example}>- {example}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {hasMisconceptions && selectedSubtopic ? (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Common Misconceptions
            </div>
            <ul className="mt-3 space-y-2 text-sm text-text">
              {selectedSubtopic.misconceptions?.map((misconception) => (
                <li key={misconception}>- {misconception}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

interface CuriosityPanelProps {
  curiosityQuestion?: string;
  curiosityResponse: string;
  onCuriosityResponseChange: (value: string) => void;
}

export function CuriosityPanel({
  curiosityQuestion,
  curiosityResponse,
  onCuriosityResponseChange,
}: CuriosityPanelProps) {
  if (!curiosityQuestion) return null;

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Curiosity Corner</div>
      <div className="mt-2 text-text" dangerouslySetInnerHTML={renderHtml(curiosityQuestion)} />
      <TextArea
        variant="teal"
        value={curiosityResponse}
        onChange={(e) => onCuriosityResponseChange(e.target.value)}
        rows={3}
        className="mt-3"
        placeholder="Write your guess or question here."
      />
    </div>
  );
}

interface ExplainBackPanelProps {
  explainBack: string;
  onExplainBackChange: (value: string) => void;
  onExplainBackCheck: () => void;
  checkingExplain: boolean;
  explainFeedbackPreview?: string;
  explainFeedback: ExplainFeedback | null;
  canCheck: boolean;
}

export function ExplainBackPanel({
  explainBack,
  onExplainBackChange,
  onExplainBackCheck,
  checkingExplain,
  explainFeedbackPreview,
  explainFeedback,
  canCheck,
}: ExplainBackPanelProps) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Explain It Back</div>
      <p className="mt-2 text-sm text-text-muted">
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
        <Button variant="secondary" size="md" onClick={onExplainBackCheck} disabled={!canCheck}>
          {checkingExplain ? "Checking..." : "Check My Explanation"}
        </Button>
      </div>

      {checkingExplain && explainFeedbackPreview && (
        <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-surface/70 p-3 text-sm text-text">
          {explainFeedbackPreview}
        </div>
      )}

      {explainFeedback && (
        <div className="mt-4 rounded-2xl border border-border bg-surface-alt p-4 text-sm text-text">
          <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {explainFeedback.rating}
          </div>
          <div className="mb-1 mt-2 font-semibold">Feedback</div>
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
  );
}

interface SelfCheckPanelProps {
  selfCheck: "confident" | "unsure" | null;
  onSelfCheckChange: (value: "confident" | "unsure") => void;
}

export function SelfCheckPanel({ selfCheck, onSelfCheckChange }: SelfCheckPanelProps) {
  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
      <div className="text-sm font-semibold text-text">How do you feel about this subtopic?</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelfCheckChange("confident")}
          className={`!rounded-full !border !px-4 !py-2 !text-sm !font-semibold ${
            selfCheck === "confident"
              ? "!border-accent !bg-accent-light !text-accent-hover"
              : "!border-accent/30 !bg-surface !text-accent-hover hover:!bg-accent-light"
          }`}
        >
          I can explain it
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelfCheckChange("unsure")}
          className={`!rounded-full !border !px-4 !py-2 !text-sm !font-semibold ${
            selfCheck === "unsure"
              ? "!border-warning !bg-warning-light !text-warning"
              : "!border-warning/30 !bg-surface !text-warning hover:!bg-warning-light"
          }`}
        >
          I need more help
        </Button>
      </div>
      {selfCheck === "confident" && (
        <p className="mt-3 text-sm text-accent-hover">
          Great! Try the Quiz card or answer the Curiosity question above.
        </p>
      )}
      {selfCheck === "unsure" && (
        <p className="mt-3 text-sm text-warning">
          No worries. Re-read the steps, then switch to Listen or try the Quiz with hints.
        </p>
      )}
    </div>
  );
}
