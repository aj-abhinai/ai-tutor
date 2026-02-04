"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { getSubjectCurriculum } from "@/lib/curriculum";

// UI Components
import {
  Button,
  Card,
  NavCard,
  Select,
  TextArea,
  Input,
  Badge,
  Alert,
  SubjectButton,
  OptionButton,
} from "@/components/ui";

/**
 * Standard 7 AI Tutor - Main Page
 *
 * Features:
 * - Card-based navigation (Learn / Listen / Quiz)
 * - Text-to-Speech (TTS) integration
 * - Interactive Quiz
 */

// Response structure from API
interface TutorLessonResponse {
  quickExplanation: string;
  stepByStep: {
    title: string;
    explanation: string;
    keyProperty?: string;
  }[];
  curiosityQuestion?: string;
}

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

type CardStep = "learn" | "listen" | "quiz";

/**
 * Render LaTeX equations using KaTeX
 */
function renderWithKaTeX(text: string): string {
  if (!text) return "";
  let rendered = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${eq}$$`;
    }
  });
  rendered = rendered.replace(/\$([^$\n]+?)\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${eq}$`;
    }
  });
  return rendered;
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHtml(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  ["script", "style", "iframe", "object", "embed", "link", "meta"].forEach((tag) =>
    doc.querySelectorAll(tag).forEach((el) => el.remove())
  );

  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (
        name.startsWith("on") ||
        name === "src" ||
        name === "srcset" ||
        name === "href" ||
        name === "xlink:href"
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Strip Markdown/HTML for TTS
 */
function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  let clean = text.replace(/\$\$[\s\S]*?\$\$/g, " equation ");
  clean = clean.replace(/\$[^$]*?\$/g, " equation ");
  clean = clean.replace(/[*#_`]/g, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, "text/html");
  return doc.body.textContent || "";
}

const renderHtml = (text: string) => ({ __html: sanitizeHtml(renderWithKaTeX(text)) });

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
  const [explainFeedback, setExplainFeedback] = useState<{
    rating: string;
    praise: string;
    fix: string;
    rereadTip: string;
  } | null>(null);
  const [checkingExplain, setCheckingExplain] = useState(false);

  // Lesson cache to prevent duplicate API calls
  const lessonCache = useRef<Map<string, TutorLessonResponse>>(new Map());
  const isFetching = useRef(false);

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
  const stepItems = data ? data.stepByStep : [];

  const cardDisabled = !selectedSubtopic || loading;

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50 to-amber-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">AI Tutor</h1>
          <p className="text-sm text-gray-600 mt-1">NCERT Science and Maths</p>
        </div>

        {/* INPUT PANEL */}
        <Card>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <div className="flex gap-4">
              {(["Science", "Maths"] as const).map((s) => (
                <SubjectButton
                  key={s}
                  subject={s}
                  isActive={subject === s}
                  onClick={() => handleSubjectChange(s)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
            <Select
              value={chapterTitle}
              onChange={(e) => handleChapterChange(e.target.value)}
              options={chapterOptions}
              placeholder="-- Choose a Chapter --"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <Select
              value={topicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              options={topicOptions}
              placeholder="-- Choose a Topic --"
              disabled={!selectedChapter}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
            <Select
              value={subtopicId}
              onChange={(e) => handleSubtopicChange(e.target.value)}
              options={subtopicOptions}
              placeholder="-- Choose a Subtopic --"
              disabled={!selectedTopic}
            />
            <p className="text-sm text-gray-500 mt-2">
              Pick a chapter, topic, and subtopic, then choose a card below to load the lesson.
            </p>
            {chapterTitle && !selectedChapter && (
              <p className="text-xs text-amber-700 mt-2">
                Detailed topics are coming soon for this chapter. Please pick a chapter without the
                "Coming soon" tag.
              </p>
            )}
          </div>
        </Card>

        {/* CARD NAV */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <NavCard
            onClick={() => handleSelectCard("learn")}
            disabled={cardDisabled}
            isActive={activeCard === "learn"}
            label="Learn"
            title="Quick explanation"
            description="Simple summary and step-by-step notes."
          />
          <NavCard
            onClick={() => handleSelectCard("listen")}
            disabled={cardDisabled}
            isActive={activeCard === "listen"}
            label="Listen"
            title="Play narration"
            description="Hear the explanation out loud."
          />
          <NavCard
            onClick={() => handleSelectCard("quiz")}
            disabled={cardDisabled}
            isActive={activeCard === "quiz"}
            label="Quiz"
            title="Check understanding"
            description="Answer a few questions."
          />
        </div>

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
                  <div className="text-xs uppercase tracking-wide text-sky-700 font-semibold">
                    Examples
                  </div>
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
                  <div
                    className="mt-2 text-gray-700"
                    dangerouslySetInnerHTML={renderHtml(data.curiosityQuestion)}
                  />
                  <TextArea
                    variant="teal"
                    value={curiosityResponse}
                    onChange={(e) => setCuriosityResponse(e.target.value)}
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
                  onChange={(e) => setExplainBack(e.target.value)}
                  rows={3}
                  className="mt-3"
                  placeholder="Example: An acid is a substance that..."
                />
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleExplainBackCheck}
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
                    onClick={() => setSelfCheck("confident")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${selfCheck === "confident"
                      ? "bg-emerald-200 border-emerald-300 text-emerald-900"
                      : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                  >
                    I can explain it
                  </button>
                  <button
                    onClick={() => setSelfCheck("unsure")}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${selfCheck === "unsure"
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
          )}

          {activeCard === "listen" && data && !loading && (
            <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Listen and Learn</h2>

              <div className="bg-teal-50 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center border-2 border-teal-100">
                <button
                  onClick={handlePlayAudio}
                  disabled={!ttsSupported}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all transform ${isPlaying
                    ? "bg-red-500 text-white animate-pulse scale-105"
                    : "bg-teal-600 text-white hover:scale-110"
                    } ${!ttsSupported ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-disabled={!ttsSupported}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <p className="mt-4 text-gray-600 font-medium">
                  {ttsSupported
                    ? isPlaying
                      ? "Reading aloud..."
                      : "Tap to play narration"
                    : "Text-to-speech is not supported in this browser."}
                </p>
              </div>

              <div className="text-sm text-gray-600">
                Tip: You can go back to the Learn card to read the text version.
              </div>
            </Card>
          )}

          {activeCard === "quiz" && data && !loading && (
            <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Knowledge Check</h2>

              {currentQuestion ? (
                <>
                  <div className="text-sm text-gray-500 mb-2">
                    Question {questionIndex + 1} of {questions.length}
                  </div>
                  <div
                    className="text-lg font-medium text-gray-800 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100"
                    dangerouslySetInnerHTML={renderHtml(currentQuestion.question)}
                  />
                </>
              ) : (
                <div className="text-sm text-gray-600 mb-6">
                  No questions available for this subtopic yet.
                </div>
              )}

              {currentQuestion && isShortAnswer ? (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isReasoning ? "Your explanation" : "Your answer"}
                  </label>
                  <Input
                    value={shortAnswer}
                    onChange={(e) => setShortAnswer(e.target.value)}
                    disabled={showAnswer}
                    placeholder={isReasoning ? "Explain in 1-2 sentences" : "Type your answer here"}
                  />
                </div>
              ) : currentQuestion ? (
                <div className="space-y-3 mb-8">
                  {(currentQuestion.options || []).map((option) => (
                    <OptionButton
                      key={option.label}
                      label={option.label}
                      text={renderWithKaTeX(option.text)}
                      isSelected={selectedAnswer === option.label}
                      isCorrect={option.label === currentQuestion.answer.correct}
                      showResult={showAnswer}
                      onClick={() => !showAnswer && setSelectedAnswer(option.label)}
                      disabled={showAnswer}
                    />
                  ))}
                </div>
              ) : null}

              {currentQuestion && !showAnswer ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckAnswer}
                  disabled={!canCheckAnswer}
                >
                  Check Answer
                </Button>
              ) : currentQuestion ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div
                    className={`p-6 rounded-xl mb-6 ${isAnswerCorrect
                      ? "bg-green-50 border-2 border-green-100"
                      : "bg-yellow-50 border-2 border-yellow-100"
                      }`}
                  >
                    <h3
                      className={`font-bold text-xl mb-2 ${isAnswerCorrect ? "text-green-700" : "text-yellow-700"
                        }`}
                    >
                      {isReasoning
                        ? "Nice try! Compare with the model answer."
                        : isAnswerCorrect
                          ? "Correct! Great job."
                          : "Nice try! Check the explanation below."}
                    </h3>
                    {isShortAnswer && (
                      <div className="text-gray-700 text-sm mb-3">
                        <div>
                          <strong>Your answer:</strong> {shortAnswer.trim() || "No answer provided"}
                        </div>
                        <div>
                          <strong>Expected answer:</strong> {currentQuestion.answer.correct}
                        </div>
                      </div>
                    )}
                    <div className="text-gray-700">
                      <strong>Explanation:</strong>{" "}
                      <span
                        dangerouslySetInnerHTML={renderHtml(currentQuestion.answer.explanation)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="secondary" size="md" className="flex-1" onClick={resetQuizState}>
                      Try Again
                    </Button>
                    {questionIndex < questions.length - 1 ? (
                      <Button
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        onClick={() => {
                          setQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
                          resetQuizState();
                        }}
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        onClick={() => {
                          setQuestionIndex(0);
                          resetQuizState();
                        }}
                      >
                        Restart Questions
                      </Button>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      className="!bg-gray-800 !text-white hover:!bg-gray-900"
                      onClick={() => {
                        setChapterTitle("");
                        setTopicId("");
                        setSubtopicId("");
                        resetLessonState();
                      }}
                    >
                      Choose New Lesson
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
