"use client";

import { useEffect, useState } from "react";
import "katex/dist/katex.min.css";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/TextArea";
import type { SubtopicKnowledge, TopicSummary } from "@/lib/learning-types";
import { renderHtml } from "./lesson-utils";
import { ExplainFeedback, ExplainLevel, TutorLessonResponse } from "./types";

interface LearnCardProps {
  data: TutorLessonResponse;
  selectedTopic: TopicSummary | null;
  selectedSubtopic: SubtopicKnowledge | null;
  onSubtopicChange: (subtopicId: string) => void;
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
  explainFeedbackPreview?: string;
  explainFeedback: ExplainFeedback | null;
  selfCheck: "confident" | "unsure" | null;
  onSelfCheckChange: (value: "confident" | "unsure") => void;
}

export function LearnCard({
  data,
  selectedTopic,
  selectedSubtopic,
  onSubtopicChange,
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
  explainFeedbackPreview = "",
  explainFeedback,
  selfCheck,
  onSelfCheckChange,
}: LearnCardProps) {
  const bulletPoints = explainLevel === "deep" ? [] : data.bulletPoints?.[explainLevel] ?? [];
  const explanationHtml = data.quickExplanation;
  const deepEssayHtml = deepEssay || data.bulletPoints?.deep?.join("") || "";
  const deepHasAi = Boolean(deepEssay);
  const cooldownMs = deepCooldownUntil ? Math.max(deepCooldownUntil - Date.now(), 0) : 0;
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);
  const cooldownLabel = cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : null;
  const canGenerate = !deepLoading && cooldownSeconds === 0;
  const availableSubtopics = selectedTopic?.subtopics ?? [];
  const visualCards = selectedSubtopic?.visualCards ?? [];
  const [visualIndex, setVisualIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const currentVisualCard = visualCards[visualIndex] ?? null;

  useEffect(() => {
    setVisualIndex(0);
    setIsFlipping(false);
  }, [selectedSubtopic?.id]);

  const handleNextVisualCard = () => {
    if (visualCards.length <= 1 || isFlipping) return;
    setIsFlipping(true);
    window.setTimeout(() => {
      setVisualIndex((prev) => (prev + 1) % visualCards.length);
      setIsFlipping(false);
    }, 180);
  };

  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      {/* Header + explain-level toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-text">Explain</h2>
          <p className="text-sm text-text-muted">Choose the depth that feels right.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface/80 p-1 text-xs font-semibold text-text-muted">
          {(["simple", "standard", "deep"] as ExplainLevel[]).map((level) => (
            <Button
              key={level}
              onClick={() => onExplainLevelChange(level)}
              variant="ghost"
              size="sm"
              className={`!rounded-full !px-3 !py-1 capitalize ${explainLevel === level
                ? "!bg-secondary-light !text-secondary"
                : "!text-text-muted hover:!bg-muted-bg"
                }`}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Subtopic selector */}
      {availableSubtopics.length > 0 && (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-text-muted font-semibold mb-2">
            Subtopic
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSubtopics.map((subtopic) => {
              const isActive = selectedSubtopic?.id === subtopic.id;
              return (
                <Button
                  key={subtopic.id}
                  onClick={() => onSubtopicChange(subtopic.id)}
                  variant="ghost"
                  size="sm"
                  className={`!rounded-xl !border !px-3 !py-2 !text-sm !font-medium ${isActive
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
      )}

      {/* Main explanation panel */}
      <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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
              className={`inline-flex items-center gap-2 !rounded-full !border !px-3 !py-1 !text-xs !font-semibold ${!canGenerate
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
        <div className="prose prose-base max-w-none text-text leading-relaxed">
          {explanationHtml ? (
            <div dangerouslySetInnerHTML={renderHtml(explanationHtml)} />
          ) : null}
        </div>
        {explainLevel === "deep" && deepLoading && (
          <div className="mt-4 text-sm text-text-muted">Generating the deep explanation...</div>
        )}

        {explainLevel === "deep" && deepError && (
          <div className="mt-3 text-sm text-error">{deepError}</div>
        )}

        {explainLevel === "deep" && deepEssayHtml && (
          <div className="mt-4 flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary" />
            <div
              className="flex-1 prose prose-base max-w-none text-text leading-relaxed"
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
                  className="flex-1 prose prose-base max-w-none text-text leading-relaxed"
                  dangerouslySetInnerHTML={renderHtml(point)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Visual cards */}
      {currentVisualCard && (
        <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Visual Card</div>
              <div className="text-sm font-semibold text-text">{currentVisualCard.title}</div>
            </div>
            <div className="text-xs text-text-muted">{visualIndex + 1} / {visualCards.length}</div>
          </div>
          <div
            className={`rounded-xl border border-border bg-surface-alt p-3 transition-transform duration-200 ${isFlipping ? "[transform:rotateY(90deg)]" : "[transform:rotateY(0deg)]"}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <img src={currentVisualCard.imageSrc} alt={currentVisualCard.title} className="w-full h-auto rounded-lg max-h-[520px] object-contain bg-surface" />
          </div>
          {currentVisualCard.caption && <p className="mt-3 text-sm text-text">{currentVisualCard.caption}</p>}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={handleNextVisualCard} disabled={visualCards.length <= 1 || isFlipping}>Next</Button>
          </div>
        </div>
      )}

      {/* Study guide */}
      {selectedSubtopic && (
        <details className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text">Study guide (goals + key terms)</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Learning Goals</div>
              <ul className="mt-3 space-y-2 text-sm text-text">
                {selectedSubtopic.learningObjectives.map((o) => <li key={o}>- {o}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Key Terms</div>
              <ul className="mt-3 space-y-2 text-sm text-text">
                {Object.entries(selectedSubtopic.keyTerms).map(([t, d]) => <li key={t}><span className="font-semibold">{t}:</span> {d}</li>)}
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* Examples and misconceptions */}
      {(selectedSubtopic?.examples?.length || selectedSubtopic?.misconceptions?.length) && (
        <details className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-text">Examples and misconceptions</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {selectedSubtopic?.examples && selectedSubtopic.examples.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Examples</div>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  {selectedSubtopic.examples.map((e) => <li key={e}>- {e}</li>)}
                </ul>
              </div>
            )}
            {selectedSubtopic?.misconceptions && selectedSubtopic.misconceptions.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Common Misconceptions</div>
                <ul className="mt-3 space-y-2 text-sm text-text">
                  {selectedSubtopic.misconceptions.map((m) => <li key={m}>- {m}</li>)}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Curiosity prompt */}
      {data.curiosityQuestion && (
        <div className="mt-5 rounded-2xl border border-border bg-surface/75 p-4">
          <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Curiosity Corner</div>
          <div className="mt-2 text-text" dangerouslySetInnerHTML={renderHtml(data.curiosityQuestion)} />
          <TextArea variant="teal" value={curiosityResponse} onChange={(e) => onCuriosityResponseChange(e.target.value)} rows={3} className="mt-3" placeholder="Write your guess or question here." />
        </div>
      )}

      {/* Explain-it-back */}
      <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
        <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">Explain It Back</div>
        <p className="mt-2 text-sm text-text-muted">Write 1-2 sentences in your own words. This helps memory.</p>
        <TextArea variant="indigo" value={explainBack} onChange={(e) => onExplainBackChange(e.target.value)} rows={3} className="mt-3" placeholder="Example: An acid is a substance that..." />
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={onExplainBackCheck} disabled={!explainBack.trim() || checkingExplain || !selectedSubtopic}>
            {checkingExplain ? "Checking..." : "Check My Explanation"}
          </Button>
        </div>

        {checkingExplain && explainFeedbackPreview && (
          <div className="mt-3 rounded-xl border border-border bg-surface/70 p-3 text-sm text-text whitespace-pre-wrap">{explainFeedbackPreview}</div>
        )}

        {explainFeedback && (
          <div className="mt-4 rounded-2xl border border-border bg-surface-alt p-4 text-sm text-text">
            <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">{explainFeedback.rating}</div>
            <div className="font-semibold mb-1 mt-2">Feedback</div>
            <div>{explainFeedback.praise}</div>
            <div className="mt-2"><span className="font-semibold">Improve:</span> {explainFeedback.fix}</div>
            <div className="mt-2"><span className="font-semibold">Re-read:</span> {explainFeedback.rereadTip}</div>
          </div>
        )}
      </div>

      {/* Self-check */}
      <div className="mt-5 rounded-2xl border border-border bg-surface/80 p-4">
        <div className="text-sm font-semibold text-text">How do you feel about this subtopic?</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSelfCheckChange("confident")}
            className={`!px-4 !py-2 !rounded-full !text-sm !font-semibold !border ${selfCheck === "confident"
              ? "!bg-accent-light !border-accent !text-accent-hover"
              : "!bg-surface !border-accent/30 !text-accent-hover hover:!bg-accent-light"
              }`}>I can explain it</Button>
          <Button variant="ghost" size="sm" onClick={() => onSelfCheckChange("unsure")}
            className={`!px-4 !py-2 !rounded-full !text-sm !font-semibold !border ${selfCheck === "unsure"
              ? "!bg-warning-light !border-warning !text-warning"
              : "!bg-surface !border-warning/30 !text-warning hover:!bg-warning-light"
              }`}>I need more help</Button>
        </div>
        {selfCheck === "confident" && <p className="mt-3 text-sm text-accent-hover">Great! Try the Quiz card or answer the Curiosity question above.</p>}
        {selfCheck === "unsure" && <p className="mt-3 text-sm text-warning">No worries. Re-read the steps, then switch to Listen or try the Quiz with hints.</p>}
      </div>
    </Card>
  );
}
