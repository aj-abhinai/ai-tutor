"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";

import type { CurriculumCatalog, SubtopicKnowledge, SubjectName } from "@/lib/learning-types";
import { useAuth } from "@/components/auth/AuthProvider";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { StatusCard } from "@/components/ui/StatusCard";
import { TourModal, useTour } from "@/components/ui/TourModal";
import { CardNav } from "@/components/home/CardNav";
import { InputPanel } from "@/components/home/InputPanel";
import { PageHeader } from "@/components/home/PageHeader";
import {
  CardStep,
  ExplainLevel,
  TutorLessonResponse,
} from "@/components/home/types";
import { useCatalogSelection } from "@/components/home/hooks/useCatalogSelection";
import { useTutorAudio } from "@/components/home/hooks/useTutorAudio";
import { TopicNotesPanel } from "@/components/notes/TopicNotesPanel";
import { useQuiz } from "@/components/home/hooks/useQuiz";
import { useExplainBack } from "@/components/home/hooks/useExplainBack";
import { useDeepEssay } from "@/components/home/hooks/useDeepEssay";

const LearnCard = dynamic(
  () => import("@/components/home/LearnCard").then((m) => m.LearnCard)
);
const ListenCard = dynamic(
  () => import("@/components/home/ListenCard").then((m) => m.ListenCard)
);
const QuizCard = dynamic(
  () => import("@/components/home/QuizCard").then((m) => m.QuizCard)
);

type LessonPayload = {
  content: TutorLessonResponse;
  subtopic: SubtopicKnowledge;
};

/**
 * Standard 7 AI Tutor - Main Page
 *
 * Features:
 * - Card-based navigation (Learn / Listen / Quiz)
 * - Text-to-Speech (TTS) integration
 * - Interactive Quiz
 */

export default function ClientPage({
  initialCatalog,
  initialSubject
}: {
  initialCatalog: CurriculumCatalog | null;
  initialSubject: SubjectName;
}) {
  const { user } = useAuth();
  const { showTour, closeTour, tourReady } = useTour();
  const [isLessonPending, startLessonTransition] = useTransition();
  const [showLoginNudge, setShowLoginNudge] = useState(false);
  const [loginNudgeAction, setLoginNudgeAction] = useState<string>("this feature");
  // Lesson data + UI state for the active card.
  const [selectedSubtopicData, setSelectedSubtopicData] = useState<SubtopicKnowledge | null>(null);
  const [data, setData] = useState<TutorLessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCard, setActiveCard] = useState<CardStep | null>(null);
  const [selfCheck, setSelfCheck] = useState<"confident" | "unsure" | null>(null);
  const [explainLevel, setExplainLevel] = useState<ExplainLevel>("simple");
  const [notesOpen, setNotesOpen] = useState(false);

  // Manage catalog/selection effects in one place.
  const {
    subject,
    setSubject,
    catalogLoading,
    chapterTitle,
    setChapterTitle,
    topicId,
    setTopicId,
    subtopicId,
    setSubtopicId,
    chapterOptions,
    topicOptions,
    selectedChapter,
    selectedTopic,
    selectedSubtopicRef,
    physicsLabChapterIds,
  } = useCatalogSelection({ initialCatalog, initialSubject, setError });

  // Lesson cache to prevent duplicate API calls.
  const lessonCache = useRef<Map<string, LessonPayload>>(new Map());
  const isFetching = useRef(false);

  const selectedSubtopic = selectedSubtopicData;

  // Gate AI/lab features behind login without blocking the whole home screen.
  const requireLoginFor = useCallback(
    (action: string) => {
      if (user) return true;
      setLoginNudgeAction(action);
      setShowLoginNudge(true);
      setError("Please log in to use AI and lab features.");
      return false;
    },
    [user],
  );

  // Deep essay hook
  const {
    deepEssay,
    deepLoading,
    deepError,
    deepCooldownUntil,
    fetchDeepEssay,
    resetDeepState,
  } = useDeepEssay({
    subject,
    selectedChapter,
    selectedTopic,
    selectedSubtopicRef,
    requireLoginFor,
  });

  // Explain back hook
  const {
    explainBack,
    curiosityResponse,
    explainFeedback,
    checkingExplain,
    explainFeedbackPreview,
    handleExplainBackCheck,
    setExplainBack,
    setCuriosityResponse,
    resetExplainState,
  } = useExplainBack({
    subject,
    selectedChapter,
    selectedTopic,
    selectedSubtopicRef,
    data,
    requireLoginFor,
    setError,
  });

  // Quiz hook
  const {
    questionIndex,
    setQuestionIndex,
    quizFeedback,
    checkingQuiz,
    quizFeedbackPreview,
    handleCheckShortAnswer,
    resetQuizState,
    handleNextQuestion,
    handlePrevQuestion,
    handleRestartQuestions,
  } = useQuiz({
    subject,
    selectedChapter,
    selectedTopic,
    selectedSubtopicRef,
    data,
    requireLoginFor,
    setError,
  });

  const { isPlaying, ttsSupported, stopAudio, handlePlayAudio } = useTutorAudio({
    data,
    explainLevel,
    deepEssay,
  });

  const resetInteractionState = useCallback(() => {
    setSelfCheck(null);
    setExplainBack("");
    setCuriosityResponse("");
    resetExplainState();
  }, [resetExplainState, setExplainBack, setCuriosityResponse]);

  // Reset all lesson-related UI state between selections.
  const resetLessonState = useCallback((options?: { preserveActiveCard?: boolean; preserveExplainLevel?: boolean }) => {
    const preserveActiveCard = options?.preserveActiveCard ?? false;
    const preserveExplainLevel = options?.preserveExplainLevel ?? false;
    setData(null);
    if (!preserveActiveCard) {
      setActiveCard(null);
    }
    setQuestionIndex(0);
    setError("");
    resetInteractionState();
    resetQuizState();
    if (!preserveExplainLevel) {
      setExplainLevel("simple");
    }
    resetDeepState();
    setSelectedSubtopicData(null);
    stopAudio();
  }, [resetInteractionState, resetQuizState, resetDeepState, stopAudio]);

  // Selection handlers cascade resets to keep state consistent.
  const handleSubjectChange = (newSubject: SubjectName) => {
    setSubject(newSubject);
    setChapterTitle("");
    setTopicId("");
    setSubtopicId("");
    resetLessonState();
  };

  const handleChapterChange = (newChapter: string) => {
    setChapterTitle(newChapter);
    setTopicId("");
    setSubtopicId("");
    resetLessonState();
  };

  const handleTopicChange = (newTopicId: string) => {
    setTopicId(newTopicId);
    setSubtopicId("");
    resetLessonState();
  };

  const handleSubtopicChange = async (newSubtopicId: string) => {
    setSubtopicId(newSubtopicId);
    resetLessonState({ preserveActiveCard: true, preserveExplainLevel: true });
    if (activeCard) {
      await fetchLesson({ subtopicIdOverride: newSubtopicId, preserveExplainLevel: true });
    }
  };

  // Fetch lesson content (with cache + concurrency guard).
  const fetchLesson = async (options?: { subtopicIdOverride?: string; preserveExplainLevel?: boolean }) => {
    if (!selectedChapter || !selectedTopic) return;
    if (!requireLoginFor("AI lesson generation")) return;
    const subtopicIdOverride = options?.subtopicIdOverride;
    const preserveExplainLevel = options?.preserveExplainLevel ?? false;
    const targetSubtopic = subtopicIdOverride
      ? selectedTopic.subtopics.find((subtopic) => subtopic.id === subtopicIdOverride) ?? null
      : selectedSubtopicRef;
    if (!targetSubtopic) return;

    // Prevent concurrent fetches (React StrictMode double-render protection)
    if (isFetching.current || loading) return;

    // Check cache first
    const cacheKey = `${subject}:${selectedChapter.id}:${selectedTopic.id}:${targetSubtopic.id}`;
    const cached = lessonCache.current.get(cacheKey);
    if (cached) {
      setData(cached.content);
      setSelectedSubtopicData(cached.subtopic);
      resetInteractionState();
      if (!preserveExplainLevel) {
        setExplainLevel("simple");
      }
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError("");

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          subject,
          chapterId: selectedChapter.id,
          topicId: selectedTopic.id,
          subtopicId: targetSubtopic.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "Something went wrong");
      } else if (!resData?.content || !resData?.subtopic) {
        setError("Received an empty response. Please try again.");
      } else {
        // Store in cache
        lessonCache.current.set(cacheKey, {
          content: resData.content as TutorLessonResponse,
          subtopic: resData.subtopic as SubtopicKnowledge,
        });
        // Wrap state updates in transition so the old content stays visible
        // until the new lesson is ready to render.
        startLessonTransition(() => {
          setData(resData.content);
          setSelectedSubtopicData(resData.subtopic);
          resetInteractionState();
          if (!preserveExplainLevel) {
            setExplainLevel("simple");
          }
        });
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  // Activate a card and ensure lesson content is loaded.
  const handleSelectCard = async (card: CardStep) => {
    if (!requireLoginFor("AI learning cards")) return;
    if (!selectedTopic) {
      setError("Please choose a chapter and topic first.");
      return;
    }

    if (!selectedSubtopicRef) {
      setError("No subtopics are available for this topic yet.");
      return;
    }

    setActiveCard(card);
    resetInteractionState();
    if (card === "quiz") {
      setQuestionIndex(0);
      resetQuizState();
    }
    if (card !== "listen") stopAudio();

    if (!data) {
      await fetchLesson();
    }
  };

  // Update explain level (simple / standard / deep).
  const handleExplainLevelChange = (level: ExplainLevel) => {
    setExplainLevel(level);
  };

  // Derived quiz state for rendering + validation.
  const questions = selectedSubtopic?.questionBank ?? [];
  const currentQuestion = questions[questionIndex];
  const hasOptions = Boolean(currentQuestion?.options?.length);
  const isReasoning = currentQuestion?.type === "reasoning";
  const isShortAnswer = Boolean(
    currentQuestion && (!hasOptions || currentQuestion.type !== "mcq")
  );
  const questionsLength = questions.length;
  const cardDisabled = !selectedSubtopicRef || loading || isLessonPending || catalogLoading;
  const isTopicDisabled = !selectedChapter;
  const showChapterWarning = false;
  const hasPhysicsLabForChapter = Boolean(
    selectedChapter && physicsLabChapterIds.includes(selectedChapter.id)
  );

  // Shortcut to clear selections and start a new lesson.
  const handleChooseNewLesson = () => {
    setChapterTitle("");
    setTopicId("");
    setSubtopicId("");
    resetLessonState();
  };

  const handleOpenNotes = () => {
    if (!selectedChapter || !selectedTopic) {
      setError("Please choose a chapter and topic first.");
      return;
    }
    if (!requireLoginFor("topic notes")) return;
    setNotesOpen(true);
  };

  return (
    <>
      {tourReady && <TourModal isOpen={showTour} onClose={closeTour} />}
      <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-4xl">
        {/* Hero header + subject selectors */}
        <PageHeader />

        {/* Lab links */}
        <div className="flex justify-center gap-3 mb-4">
          <LinkButton
            href={user ? "/chemistry-lab" : "#"}
            onClick={(event) => {
              if (user) return;
              event.preventDefault();
              requireLoginFor("Chemistry Lab");
            }}
            onMouseEnter={() => void import("@/app/chemistry-lab/page")}
            onFocus={() => void import("@/app/chemistry-lab/page")}
            variant="secondary"
            size="md"
            className="rounded-full"
          >
            Chemistry Lab
          </LinkButton>
          {hasPhysicsLabForChapter && (
            <LinkButton
              href={user ? (selectedChapter ? `/physics-lab?chapter=${selectedChapter.id}` : "/physics-lab") : "#"}
              onClick={(event) => {
                if (user) return;
                event.preventDefault();
                requireLoginFor("Physics Lab");
              }}
              onMouseEnter={() => void import("@/app/physics-lab/page")}
              onFocus={() => void import("@/app/physics-lab/page")}
              variant="outline"
              size="md"
              className="border-accent/30 bg-accent-light text-accent-hover hover:border-accent hover:bg-accent-light"
            >
              Try in Lab
            </LinkButton>
          )}
        </div>
        {showLoginNudge && !user && (
          <Alert variant="warning" className="mb-4 text-text">
            <p>
              Log in to use <strong>{loginNudgeAction}</strong>.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <LinkButton href="/login" size="sm" className="rounded-full">
                Log in
              </LinkButton>
              <LinkButton href="/signup" variant="outline" size="sm" className="rounded-full border-secondary/30 text-secondary hover:bg-secondary-light">
                Sign up
              </LinkButton>
              <Button
                type="button"
                onClick={() => setShowLoginNudge(false)}
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                Dismiss
              </Button>
            </div>
          </Alert>
        )}

        <InputPanel
          subject={subject}
          chapterTitle={chapterTitle}
          topicId={topicId}
          chapterOptions={chapterOptions}
          topicOptions={topicOptions}
          onSubjectChange={handleSubjectChange}
          onChapterChange={handleChapterChange}
          onTopicChange={handleTopicChange}
          isTopicDisabled={isTopicDisabled}
          showChapterWarning={showChapterWarning}
          onRequireLogin={requireLoginFor}
        />

        {/* Learn / Listen / Quiz navigation */}
        <CardNav
          activeCard={activeCard}
          cardDisabled={cardDisabled}
          onSelectCard={handleSelectCard}
        />

        {/* STATUS */}
        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}

        {/* CONTENT PANEL */}
        <div className="mt-6">
          {/* Empty state before a card is selected */}
          {!activeCard && (
            <StatusCard message="Choose a card to start. The lesson loads only after you pick a card." />
          )}

          {/* Loading state for lesson fetch */}
          {activeCard && (loading || isLessonPending) && (
            <StatusCard message="Preparing your lesson..." />
          )}

          {/* Learn card (text + activities) */}
          {activeCard === "learn" && data && !loading && (
            <article id="tour-explain-section">
              <LearnCard
              data={data}
              selectedTopic={selectedTopic}
              selectedSubtopic={selectedSubtopic}
              onSubtopicChange={handleSubtopicChange}
              explainLevel={explainLevel}
              onExplainLevelChange={handleExplainLevelChange}
              deepEssay={deepEssay}
              deepLoading={deepLoading}
              deepError={deepError}
              deepCooldownUntil={deepCooldownUntil}
              onGenerateDeep={(force) => void fetchDeepEssay(force)}
              curiosityResponse={curiosityResponse}
              onCuriosityResponseChange={(value) => setCuriosityResponse(value)}
              explainBack={explainBack}
              onExplainBackChange={(value) => setExplainBack(value)}
              onExplainBackCheck={handleExplainBackCheck}
              checkingExplain={checkingExplain}
              explainFeedbackPreview={explainFeedbackPreview}
              explainFeedback={explainFeedback}
              selfCheck={selfCheck}
              onSelfCheckChange={(value) => setSelfCheck(value)}
              onOpenNotes={handleOpenNotes}
            />
          </article>
          )}

          {/* Listen card (TTS) */}
          {activeCard === "listen" && data && !loading && (
            <ListenCard
              isPlaying={isPlaying}
              ttsSupported={ttsSupported}
              onPlayAudio={handlePlayAudio}
            />
          )}

          {/* Quiz card (questions + feedback) */}
          {activeCard === "quiz" && data && !loading && (
            <QuizCard
              currentQuestion={currentQuestion}
              questionIndex={questionIndex}
              questionsLength={questionsLength}
              isShortAnswer={isShortAnswer}
              isReasoning={isReasoning}
              checkingQuiz={checkingQuiz}
              quizFeedbackPreview={quizFeedbackPreview}
              quizFeedback={quizFeedback}
              onCheckShortAnswer={handleCheckShortAnswer}
              onClearQuizFeedback={resetQuizState}
              onPrevQuestion={handlePrevQuestion}
              onNextQuestion={() => handleNextQuestion(questionsLength)}
              onRestartQuestions={handleRestartQuestions}
              onChooseNewLesson={handleChooseNewLesson}
            />
          )}
        </div>
      </div>
      <TopicNotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        context={
          selectedChapter && selectedTopic
            ? {
              subject,
              chapterId: selectedChapter.id,
              chapterTitle: selectedChapter.title,
              topicId: selectedTopic.id,
              topicTitle: selectedTopic.title,
            }
            : null
        }
      />
    </main>
    </>
  );
}



