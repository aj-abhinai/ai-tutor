"use client";

import "katex/dist/katex.min.css";
import { Card } from "@/components/ui/Card";
import type { SubtopicKnowledge, TopicSummary } from "@/lib/learning-types";
import {
  CuriosityPanel,
  ExamplesPanel,
  ExplainBackPanel,
  ExplanationPanel,
  LearnHeader,
  SelfCheckPanel,
  StoryPanel,
  StudyGuidePanel,
  SubtopicSelector,
} from "./LearnCardSections";
import type { ExplainFeedback, ExplainLevel, TutorLessonResponse } from "./types";

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
  onOpenNotes?: () => void;
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
  onOpenNotes,
}: LearnCardProps) {
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
      <LearnHeader
        explainLevel={explainLevel}
        onExplainLevelChange={onExplainLevelChange}
        onOpenNotes={onOpenNotes}
      />

      <SubtopicSelector
        selectedTopic={selectedTopic}
        selectedSubtopic={selectedSubtopic}
        onSubtopicChange={onSubtopicChange}
      />

      <ExplanationPanel
        explainLevel={explainLevel}
        explanationHtml={explanationHtml}
        bulletPoints={bulletPoints}
        deepEssayHtml={deepEssayHtml}
        deepLoading={deepLoading}
        deepError={deepError}
        canGenerate={canGenerate}
        deepHasAi={deepHasAi}
        cooldownLabel={cooldownLabel}
        onGenerateDeep={onGenerateDeep}
      />

      <StoryPanel selectedSubtopic={selectedSubtopic} />

      <StudyGuidePanel selectedSubtopic={selectedSubtopic} />
      <ExamplesPanel selectedSubtopic={selectedSubtopic} />

      <CuriosityPanel
        curiosityQuestion={data.curiosityQuestion}
        curiosityResponse={curiosityResponse}
        onCuriosityResponseChange={onCuriosityResponseChange}
      />

      <ExplainBackPanel
        explainBack={explainBack}
        onExplainBackChange={onExplainBackChange}
        onExplainBackCheck={onExplainBackCheck}
        checkingExplain={checkingExplain}
        explainFeedbackPreview={explainFeedbackPreview}
        explainFeedback={explainFeedback}
        canCheck={Boolean(explainBack.trim()) && !checkingExplain && Boolean(selectedSubtopic)}
      />

      <SelfCheckPanel selfCheck={selfCheck} onSelfCheckChange={onSelfCheckChange} />
    </Card>
  );
}
