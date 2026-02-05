"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import { getSubjectCurriculum } from "@/lib/curriculum";

import { Alert, Card } from "@/components/ui";
import { CardNav } from "@/components/home/CardNav";
import { InputPanel } from "@/components/home/InputPanel";
import { LearnCard } from "@/components/home/LearnCard";
import { ListenCard } from "@/components/home/ListenCard";
import { PageHeader } from "@/components/home/PageHeader";
import { QuizCard } from "@/components/home/QuizCard";
import { cleanTextForSpeech } from "@/components/home/lesson-utils";
import {
  CardStep,
  ExplainFeedback,
  ExplainLevel,
  TutorLessonResponse,
} from "@/components/home/types";

/**
 * Standard 7 AI Tutor - Main Page
 *
 * Features:
 * - Card-based navigation (Learn / Listen / Quiz)
 * - Text-to-Speech (TTS) integration
 * - Interactive Quiz
 */

// Local chapter lists for dropdown labels (mapped to curriculum data below).
// NCERT Class 7 Science chapters (2024-25 "Curiosity" textbook)
const SCIENCE_CHAPTERS = [
  "The Ever-Evolving World of Science",
  "Exploring Substances: Acidic, Basic, and Neutral",
  "Electricity: Circuits and Their Components",
  "The World of Metals and Non-metals",
  "Changes Around Us: Physical and Chemical",
  "Adolescence: A Stage of Growth and Change",
  "Heat Transfer in Nature",
  "Measurement of Time and Motion",
  "Life Processes in Animals",
  "Life Processes in Plants",
  "Light: Shadows and Reflections",
  "Earth, Moon, and the Sun",
];

// NCERT Class 7 Maths chapters (2024-25 rationalized syllabus)
const MATHS_CHAPTERS = [
  "Integers",
  "Fractions and Decimals",
  "Data Handling",
  "Simple Equations",
  "Lines and Angles",
  "The Triangle and its Properties",
  "Comparing Quantities",
  "Rational Numbers",
  "Perimeter and Area",
  "Algebraic Expressions",
  "Exponents and Powers",
  "Symmetry",
  "Visualising Solid Shapes",
];

export default function Home() {
  // App state for subject + lesson selection.
  const [subject, setSubject] = useState<"Science" | "Maths">("Science");
  const [chapterTitle, setChapterTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  // Lesson data + UI state for the active card.
  const [data, setData] = useState<TutorLessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCard, setActiveCard] = useState<CardStep | null>(null);
  const [selfCheck, setSelfCheck] = useState<"confident" | "unsure" | null>(null);
  const [explainBack, setExplainBack] = useState("");
  const [curiosityResponse, setCuriosityResponse] = useState("");
  const [explainFeedback, setExplainFeedback] = useState<ExplainFeedback | null>(null);
  const [checkingExplain, setCheckingExplain] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<ExplainFeedback | null>(null);
  const [checkingQuiz, setCheckingQuiz] = useState(false);
  const [explainLevel, setExplainLevel] = useState<ExplainLevel>("simple");
  const [deepEssay, setDeepEssay] = useState<string | null>(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState("");
  const [deepCooldownUntil, setDeepCooldownUntil] = useState<number | null>(null);

  // Lesson cache to prevent duplicate API calls.
  const lessonCache = useRef<Map<string, TutorLessonResponse>>(new Map());
  const isFetching = useRef(false);
  // Cache + throttle for deep explanations.
  const deepCache = useRef<Map<string, string>>(new Map());
  const deepGenerateLog = useRef<Map<string, number[]>>(new Map());

  // Quiz state.
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Audio state (TTS).
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Derived curriculum and dropdown options.
  const curriculum = useMemo(() => getSubjectCurriculum(subject), [subject]);
  const chapterTitles = useMemo(
    () => (subject === "Science" ? SCIENCE_CHAPTERS : MATHS_CHAPTERS),
    [subject]
  );
  const availableChaptersByTitle = useMemo(() => {
    const map = new Map<string, typeof curriculum.chapters[number]>();
    curriculum.chapters.forEach((chapter) => {
      map.set(chapter.title, chapter);
    });
    return map;
  }, [curriculum]);

  const chapterOptions = useMemo(
    () =>
      chapterTitles.map((title) => ({
        value: title,
        label: availableChaptersByTitle.has(title) ? title : `${title} (Coming soon)`,
      })),
    [chapterTitles, availableChaptersByTitle]
  );

  // Resolve current selection chain.
  const selectedChapter = chapterTitle
    ? availableChaptersByTitle.get(chapterTitle) ?? null
    : null;

  const topicOptions = useMemo(() => {
    if (!selectedChapter) {
      return [{ value: "", label: "N/A (coming soon)" }];
    }
    return selectedChapter.topics.map((topic) => ({
      value: topic.id,
      label: topic.title,
    }));
  }, [selectedChapter]);

  const selectedTopic = selectedChapter
    ? selectedChapter.topics.find((topic) => topic.id === topicId) ?? null
    : null;

  const subtopicOptions = useMemo(() => {
    if (!selectedTopic) {
      return [{ value: "", label: "N/A (coming soon)" }];
    }
    return selectedTopic.subtopics.map((subtopic) => ({
      value: subtopic.id,
      label: subtopic.title,
    }));
  }, [selectedTopic]);

  const selectedSubtopic = selectedTopic
    ? selectedTopic.subtopics.find((subtopic) => subtopic.id === subtopicId) ?? null
    : null;

  // Load TTS voices and cleanup audio on unmount
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setTtsSupported(false);
      return;
    }

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Clear deep cooldown when time elapses.
  useEffect(() => {
    if (!deepCooldownUntil) return;
    const remaining = deepCooldownUntil - Date.now();
    if (remaining <= 0) {
      setDeepCooldownUntil(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setDeepCooldownUntil(null);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [deepCooldownUntil]);

  // When subject changes, auto-select the first available chapter
  useEffect(() => {
    // Find the first chapter that has curriculum data
    const firstAvailableTitle = chapterTitles.find((title) =>
      availableChaptersByTitle.has(title)
    );
    if (firstAvailableTitle && firstAvailableTitle !== chapterTitle) {
      setChapterTitle(firstAvailableTitle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, chapterTitles, availableChaptersByTitle]);

  // When chapter changes, set default topic and subtopic
  useEffect(() => {
    if (!chapterTitle) {
      setTopicId("");
      setSubtopicId("");
      return;
    }
    const chapter = availableChaptersByTitle.get(chapterTitle);
    if (!chapter) {
      setTopicId("");
      setSubtopicId("");
      return;
    }
    // Only set defaults when chapter changes - don't reset user's selection
    const firstTopicId = chapter.topics[0]?.id ?? "";
    const firstSubtopicId = chapter.topics[0]?.subtopics[0]?.id ?? "";
    setTopicId(firstTopicId);
    setSubtopicId(firstSubtopicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterTitle, availableChaptersByTitle]);

  // When topic changes, set default subtopic
  useEffect(() => {
    if (!selectedTopic) {
      setSubtopicId("");
      return;
    }
    // Set first subtopic when topic changes
    const firstSubtopicId = selectedTopic.subtopics[0]?.id ?? "";
    setSubtopicId(firstSubtopicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, selectedTopic]);

  // Stop audio playback and reset UI state.
  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Reset all lesson-related UI state between selections.
  const resetLessonState = () => {
    setData(null);
    setActiveCard(null);
    setSelectedAnswer(null);
    setShortAnswer("");
    setShowAnswer(false);
    setQuestionIndex(0);
    setError("");
    setSelfCheck(null);
    setExplainBack("");
    setCuriosityResponse("");
    setExplainFeedback(null);
    setCheckingExplain(false);
    setQuizFeedback(null);
    setCheckingQuiz(false);
    setExplainLevel("simple");
    setDeepEssay(null);
    setDeepLoading(false);
    setDeepError("");
    setDeepCooldownUntil(null);
    stopAudio();
  };

  // Reset quiz-only UI state when moving between questions.
  const resetQuizState = () => {
    setSelectedAnswer(null);
    setShortAnswer("");
    setShowAnswer(false);
    setQuizFeedback(null);
    setCheckingQuiz(false);
  };

  // Selection handlers cascade resets to keep state consistent.
  const handleSubjectChange = (newSubject: "Science" | "Maths") => {
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

  const handleSubtopicChange = (newSubtopicId: string) => {
    setSubtopicId(newSubtopicId);
    resetLessonState();
  };

  // Fetch lesson content (with cache + concurrency guard).
  const fetchLesson = async () => {
    if (!selectedChapter || !selectedSubtopic) return;

    // Prevent concurrent fetches (React StrictMode double-render protection)
    if (isFetching.current || loading) return;

    // Check cache first
    const cacheKey = `${subject}:${selectedChapter.id}:${selectedTopic?.id}:${selectedSubtopic.id}`;
    const cached = lessonCache.current.get(cacheKey);
    if (cached) {
      setData(cached);
      setSelfCheck(null);
      setExplainBack("");
      setCuriosityResponse("");
      setExplainFeedback(null);
      setExplainLevel("simple");
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError("");
    setSelectedAnswer(null);
    setShortAnswer("");
    setShowAnswer(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          chapterId: selectedChapter.id,
          topicId: selectedTopic?.id,
          subtopicId: selectedSubtopic.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "Something went wrong");
      } else if (!resData?.content) {
        setError("Received an empty response. Please try again.");
      } else {
        // Store in cache
        lessonCache.current.set(cacheKey, resData.content);
        setData(resData.content);
        setSelfCheck(null);
        setExplainBack("");
        setCuriosityResponse("");
        setExplainFeedback(null);
        setExplainLevel("simple");
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
    if (!selectedSubtopic) {
      setError("Please choose a chapter, topic, and subtopic first.");
      return;
    }

    setActiveCard(card);
    setSelfCheck(null);
    setExplainBack("");
    setCuriosityResponse("");
    if (card === "quiz") {
      setQuestionIndex(0);
      resetQuizState();
    }
    if (card !== "listen") stopAudio();

    if (!data) {
      await fetchLesson();
    }
  };

  // Build and play a TTS narration from the current lesson data.
  const handlePlayAudio = () => {
    if (!data || !ttsSupported) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    const deepNarrationSource =
      explainLevel === "deep"
        ? deepEssay || (data.bulletPoints?.deep ?? []).join(" ")
        : "";
    const bulletNarrationSource =
      explainLevel === "deep"
        ? deepNarrationSource
        : (data.bulletPoints?.[explainLevel] ?? []).join(" ");
    const bulletNarration = bulletNarrationSource
      .split(/\n+/)
      .map((point, index) => {
        const cleaned = cleanTextForSpeech(point);
        return cleaned ? `Point ${index + 1}. ${cleaned}` : "";
      })
      .filter(Boolean)
      .join(" ");
    const textToRead = `Quick Explanation. ${cleanTextForSpeech(
      data.quickExplanation
    )}. Key points. ${bulletNarration}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const preferredVoice =
      availableVoices.find((v) => v.lang.toLowerCase().includes("en-in")) ||
      availableVoices.find((v) => v.lang.toLowerCase().includes("en-us"));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  // Check quiz answers (local for MCQ, API for short answers).
  const handleCheckAnswer = async () => {
    if (!currentQuestion) return;
    if (isShortAnswer) {
      if (!selectedChapter || !selectedSubtopic || checkingQuiz) return;
      if (!shortAnswer.trim()) return;
      setCheckingQuiz(true);
      setQuizFeedback(null);
      setError("");
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            chapterId: selectedChapter.id,
            topicId: selectedTopic?.id,
            subtopicId: selectedSubtopic.id,
            studentAnswer: shortAnswer.trim(),
            lessonContext: buildLessonContext(),
            mode: "quiz",
            question: currentQuestion.question,
            expectedAnswer: currentQuestion.answer.correct,
            answerExplanation: currentQuestion.answer.explanation,
          }),
        });
        const resData = await res.json();
        if (!res.ok) {
          setError(resData.error || "Unable to check your answer right now.");
        } else if (resData?.feedback) {
          setQuizFeedback(resData.feedback);
        } else {
          setError("No feedback returned. Please try again.");
        }
      } catch {
        setError("Failed to connect to API");
      } finally {
        setCheckingQuiz(false);
        setShowAnswer(true);
      }
      return;
    }
    setShowAnswer(true);
  };

  // Update explain level (simple / standard / deep).
  const handleExplainLevelChange = (level: ExplainLevel) => {
    setExplainLevel(level);
  };

  // Fetch the deep essay and throttle regenerations.
  const fetchDeepEssay = async (force = false) => {
    if (!selectedChapter || !selectedSubtopic || deepLoading) return;

    const cacheKey = `${subject}:${selectedChapter.id}:${selectedTopic?.id}:${selectedSubtopic.id}`;
    const cached = deepCache.current.get(cacheKey);
    if (cached && !force) {
      setDeepEssay(cached);
      setDeepError("");
      return;
    }

    const now = Date.now();
    const windowMs = 2 * 60 * 1000;
    const entries = deepGenerateLog.current.get(cacheKey) ?? [];
    const recent = entries.filter((timestamp) => now - timestamp < windowMs);
    if (recent.length >= 2) {
      const lockUntil = Math.max(...recent) + windowMs;
      setDeepCooldownUntil(lockUntil);
      setDeepError("You can regenerate twice within 2 minutes. Please wait a bit.");
      deepGenerateLog.current.set(cacheKey, recent);
      return;
    }

    setDeepLoading(true);
    setDeepError("");

    try {
      const res = await fetch("/api/deep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          chapterId: selectedChapter.id,
          topicId: selectedTopic?.id,
          subtopicId: selectedSubtopic.id,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setDeepError(resData.error || "Unable to generate the deep explanation right now.");
      } else if (resData?.deepEssay) {
        deepCache.current.set(cacheKey, resData.deepEssay);
        setDeepEssay(resData.deepEssay);
        const updated = [...recent, now];
        deepGenerateLog.current.set(cacheKey, updated);
        if (updated.length >= 2) {
          const lockUntil = updated[0] + windowMs;
          setDeepCooldownUntil(lockUntil);
        } else {
          setDeepCooldownUntil(null);
        }
      } else {
        setDeepError("No deep explanation returned. Please try again.");
      }
    } catch {
      setDeepError("Failed to connect to API");
    } finally {
      setDeepLoading(false);
    }
  };

  // Build a short lesson context for feedback prompts.
  const buildLessonContext = () => {
    if (!data) return "";
    const points = data.bulletPoints?.standard?.slice(0, 4) ?? [];
    return `Quick Explanation: ${data.quickExplanation}\nKey Points: ${points.join(" | ")}`;
  };

  // Submit the "explain back" response for AI feedback.
  const handleExplainBackCheck = async () => {
    if (!selectedChapter || !selectedSubtopic || !explainBack.trim() || checkingExplain) return;
    setCheckingExplain(true);
    setExplainFeedback(null);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          chapterId: selectedChapter.id,
          topicId: selectedTopic?.id,
          subtopicId: selectedSubtopic.id,
          studentAnswer: explainBack.trim(),
          lessonContext: buildLessonContext(),
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setError(resData.error || "Unable to check your explanation right now.");
      } else if (resData?.feedback) {
        setExplainFeedback(resData.feedback);
      } else {
        setError("No feedback returned. Please try again.");
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      setCheckingExplain(false);
    }
  };

  // Derived quiz state for rendering + validation.
  const questions = selectedSubtopic?.questionBank ?? [];
  const currentQuestion = questions[questionIndex];
  const hasOptions = Boolean(currentQuestion?.options?.length);
  const isReasoning = currentQuestion?.type === "reasoning";
  const isShortAnswer = Boolean(
    currentQuestion && (!hasOptions || currentQuestion.type !== "mcq")
  );
  const canCheckAnswer = isShortAnswer ? shortAnswer.trim().length > 0 : Boolean(selectedAnswer);
  const isShortCorrect = Boolean(
    currentQuestion &&
    !isReasoning &&
    shortAnswer.trim().length > 0 &&
    currentQuestion.answer.correct &&
    shortAnswer.trim().toLowerCase() === currentQuestion.answer.correct.trim().toLowerCase()
  );
  const isMcqCorrect = Boolean(
    currentQuestion && selectedAnswer && selectedAnswer === currentQuestion.answer.correct
  );
  const aiCorrect = isShortAnswer ? quizFeedback?.isCorrect : undefined;
  const isAnswerCorrect = isShortAnswer ? (aiCorrect ?? isShortCorrect) : isMcqCorrect;
  const questionsLength = questions.length;
  const cardDisabled = !selectedSubtopic || loading;
  const isTopicDisabled = !selectedChapter;
  const isSubtopicDisabled = !selectedTopic;
  const showChapterWarning = Boolean(chapterTitle && !selectedChapter);

  // Quiz navigation actions.
  const handleNextQuestion = () => {
    setQuestionIndex((prev) => Math.min(prev + 1, questionsLength - 1));
    resetQuizState();
  };

  const handlePrevQuestion = () => {
    setQuestionIndex((prev) => Math.max(prev - 1, 0));
    resetQuizState();
  };

  const handleRestartQuestions = () => {
    setQuestionIndex(0);
    resetQuizState();
  };

  // Shortcut to clear selections and start a new lesson.
  const handleChooseNewLesson = () => {
    setChapterTitle("");
    setTopicId("");
    setSubtopicId("");
    resetLessonState();
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff1e6,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf5e6_55%,#f9f0dd)] px-6 py-8 flex flex-col items-center">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-4xl">
        {/* Hero header + subject selectors */}
        <PageHeader />

        <InputPanel
          subject={subject}
          chapterTitle={chapterTitle}
          topicId={topicId}
          subtopicId={subtopicId}
          chapterOptions={chapterOptions}
          topicOptions={topicOptions}
          subtopicOptions={subtopicOptions}
          onSubjectChange={handleSubjectChange}
          onChapterChange={handleChapterChange}
          onTopicChange={handleTopicChange}
          onSubtopicChange={handleSubtopicChange}
          isTopicDisabled={isTopicDisabled}
          isSubtopicDisabled={isSubtopicDisabled}
          showChapterWarning={showChapterWarning}
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
            <Card className="text-center text-gray-600">
              Choose a card to start. The lesson loads only after you pick a card.
            </Card>
          )}

          {/* Loading state for lesson fetch */}
          {activeCard && loading && (
            <Card className="text-center text-gray-600">Preparing your lesson...</Card>
          )}

          {/* Learn card (text + activities) */}
          {activeCard === "learn" && data && !loading && (
            <LearnCard
              data={data}
              selectedSubtopic={selectedSubtopic}
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
              explainFeedback={explainFeedback}
              selfCheck={selfCheck}
              onSelfCheckChange={(value) => setSelfCheck(value)}
            />
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
              shortAnswer={shortAnswer}
              onShortAnswerChange={(value) => setShortAnswer(value)}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={(value) => setSelectedAnswer(value)}
              showAnswer={showAnswer}
              canCheckAnswer={canCheckAnswer}
              isAnswerCorrect={isAnswerCorrect}
              checkingQuiz={checkingQuiz}
              quizFeedback={quizFeedback}
              onCheckAnswer={handleCheckAnswer}
              onResetQuiz={resetQuizState}
              onPrevQuestion={handlePrevQuestion}
              onNextQuestion={handleNextQuestion}
              onRestartQuestions={handleRestartQuestions}
              onChooseNewLesson={handleChooseNewLesson}
            />
          )}
        </div>
      </div>
    </main>
  );
}
