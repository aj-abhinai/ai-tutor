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
  TutorExpandResponse,
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
  // App State
  const [subject, setSubject] = useState<"Science" | "Maths">("Science");
  const [chapterTitle, setChapterTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [data, setData] = useState<TutorLessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCard, setActiveCard] = useState<CardStep | null>(null);
  const [selfCheck, setSelfCheck] = useState<"confident" | "unsure" | null>(null);
  const [explainBack, setExplainBack] = useState("");
  const [curiosityResponse, setCuriosityResponse] = useState("");
  const [explainFeedback, setExplainFeedback] = useState<ExplainFeedback | null>(null);
  const [checkingExplain, setCheckingExplain] = useState(false);
  const [expandedExplain, setExpandedExplain] = useState<TutorExpandResponse | null>(null);
  const [expandingExplain, setExpandingExplain] = useState(false);
  const [expandError, setExpandError] = useState("");

  // Lesson cache to prevent duplicate API calls
  const lessonCache = useRef<Map<string, TutorLessonResponse>>(new Map());
  const isFetching = useRef(false);
  const expandCache = useRef<Map<string, TutorExpandResponse>>(new Map());

  // Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

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
    setExpandedExplain(null);
    setExpandingExplain(false);
    setExpandError("");
    stopAudio();
  };

  const resetQuizState = () => {
    setSelectedAnswer(null);
    setShortAnswer("");
    setShowAnswer(false);
  };

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
      setExpandedExplain(null);
      setExpandError("");
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
        setExpandedExplain(null);
        setExpandError("");
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

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

  const handlePlayAudio = () => {
    if (!data || !ttsSupported) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    const stepNarration = data.stepByStep
      .map((step, index) => `Step ${index + 1}. ${step.title}. ${step.explanation}`)
      .join(" ");
    const textToRead = `Quick Explanation. ${cleanTextForSpeech(
      data.quickExplanation
    )}. Let's understand step by step. ${cleanTextForSpeech(stepNarration)}`;

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

  const handleCheckAnswer = () => {
    setShowAnswer(true);
  };

  const handleExpandExplain = async () => {
    if (!selectedChapter || !selectedSubtopic || expandingExplain) return;
    if (!data) {
      await fetchLesson();
    }

    const cacheKey = `${subject}:${selectedChapter.id}:${selectedTopic?.id}:${selectedSubtopic.id}`;
    const cached = expandCache.current.get(cacheKey);
    if (cached) {
      setExpandedExplain(cached);
      setExpandError("");
      return;
    }

    setExpandingExplain(true);
    setExpandError("");
    setExpandedExplain(null);

    try {
      const res = await fetch("/api/expand", {
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
        setExpandError(resData.error || "Unable to expand the explanation right now.");
      } else if (resData?.expanded) {
        expandCache.current.set(cacheKey, resData.expanded);
        setExpandedExplain(resData.expanded);
      } else {
        setExpandError("No extra explanation returned. Please try again.");
      }
    } catch {
      setExpandError("Failed to connect to API");
    } finally {
      setExpandingExplain(false);
    }
  };

  const buildLessonContext = () => {
    if (!data) return "";
    const steps = data.stepByStep.slice(0, 3).map((step) => {
      const detail = step.keyProperty || step.explanation;
      return `${step.title}: ${detail}`;
    });
    return `Quick Explanation: ${data.quickExplanation}\nKey Steps: ${steps.join(" | ")}`;
  };

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
  const isAnswerCorrect = isShortAnswer ? isShortCorrect : isMcqCorrect;
  const questionsLength = questions.length;
  const cardDisabled = !selectedSubtopic || loading;
  const isTopicDisabled = !selectedChapter;
  const isSubtopicDisabled = !selectedTopic;
  const showChapterWarning = Boolean(chapterTitle && !selectedChapter);

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => Math.min(prev + 1, questionsLength - 1));
    resetQuizState();
  };

  const handleRestartQuestions = () => {
    setQuestionIndex(0);
    resetQuizState();
  };

  const handleChooseNewLesson = () => {
    setChapterTitle("");
    setTopicId("");
    setSubtopicId("");
    resetLessonState();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-amber-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
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
          {!activeCard && (
            <Card className="text-center text-gray-600">
              Choose a card to start. The lesson loads only after you pick a card.
            </Card>
          )}

          {activeCard && loading && (
            <Card className="text-center text-gray-600">Preparing your lesson...</Card>
          )}

          {activeCard === "learn" && data && !loading && (
            <LearnCard
              data={data}
              selectedSubtopic={selectedSubtopic}
              expandedExplain={expandedExplain}
              expandingExplain={expandingExplain}
              expandError={expandError}
              onExpandExplain={handleExpandExplain}
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

          {activeCard === "listen" && data && !loading && (
            <ListenCard
              isPlaying={isPlaying}
              ttsSupported={ttsSupported}
              onPlayAudio={handlePlayAudio}
            />
          )}

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
              onCheckAnswer={handleCheckAnswer}
              onResetQuiz={resetQuizState}
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
