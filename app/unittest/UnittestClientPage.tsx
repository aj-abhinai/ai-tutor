"use client";

import { useState, useEffect, useCallback } from "react";

import type { SubjectName, QuestionItem } from "@/lib/learning-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { OptionButton } from "@/components/ui/OptionButton";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordTestCompletion } from "@/components/progress";

interface ChapterQuestion {
  chapterId: string;
  chapterTitle: string;
  question: QuestionItem;
}

interface ChapterResult {
  chapterId: string;
  chapterTitle: string;
  correct: boolean;
}

type TestState = "select" | "testing" | "results";

// Unit test client - quiz flow
export default function UnittestClientPage() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>("Science");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ChapterQuestion[]>([]);
  const [testState, setTestState] = useState<TestState>("select");
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [chapterSubmitted, setChapterSubmitted] = useState(false);
  const [chapterResults, setChapterResults] = useState<ChapterResult[]>([]);
  const [error, setError] = useState("");

  const fetchQuestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setQuestions([]);
    setChapterResults([]);
    setTestState("select");
    setCurrentChapterIndex(0);
    setCurrentAnswer("");
    setChapterSubmitted(false);

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/unittest/questions?subject=${selectedSubject}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load questions");
        return;
      }
      setQuestions(data.questions || []);
    } catch {
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSubject]);

  useEffect(() => {
    if (user) {
      fetchQuestions();
    }
  }, [user, fetchQuestions]);

  const handleSelectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentAnswer("");
    setChapterSubmitted(false);
    setTestState("testing");
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentChapterIndex];
    if (!currentQuestion) return;

    const isCorrect = currentAnswer === currentQuestion.question.answer.correct;
    setChapterResults((prev) => {
      const filtered = prev.filter((r) => r.chapterId !== currentQuestion.chapterId);
      return [...filtered, {
        chapterId: currentQuestion.chapterId,
        chapterTitle: currentQuestion.chapterTitle,
        correct: isCorrect,
      }];
    });
    setChapterSubmitted(true);
  };

  const handleNextChapter = async () => {
    if (currentChapterIndex < questions.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setCurrentAnswer("");
      setChapterSubmitted(false);
    } else {
      // Record progress for each completed chapter
      if (user) {
        try {
          for (const q of questions) {
            await recordTestCompletion(
              `${selectedSubject}-${q.chapterId}`,
              `${q.chapterTitle} - Unit Test`,
              q.chapterId,
              q.chapterTitle
            );
          }
        } catch {
          // Silently fail - don't block UI
        }
      }
      setTestState("results");
    }
  };

  const handleSubjectChange = (subject: SubjectName) => {
    setSelectedSubject(subject);
  };

  const handleRestart = () => {
    fetchQuestions();
  };

  const currentQuestion = questions[currentChapterIndex];
  const answeredChapters = new Set(chapterResults.map((r) => r.chapterId));
  const totalScore = chapterResults.filter((r) => r.correct).length;

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <LinkButton href="/" variant="secondary" size="sm" className="mb-6 rounded-full">
            ← Back to Home
          </LinkButton>
          <Card variant="highlight" padding="lg" className="text-center py-12">
            <h2 className="text-xl font-bold text-text mb-4">Login Required</h2>
            <p className="text-text mb-6">Please log in to access the Unit Test feature.</p>
            <div className="flex justify-center gap-3">
              <LinkButton href="/login" variant="primary" className="rounded-full">
                Log in
              </LinkButton>
              <LinkButton href="/signup" variant="outline" className="rounded-full">
                Sign up
              </LinkButton>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
      </div>
      <div className="relative w-full max-w-4xl">
        <LinkButton href="/" variant="secondary" size="sm" className="mb-6 rounded-full">
          ← Back to Home
        </LinkButton>

        <Card variant="highlight" padding="lg" className="mb-6">
          <h1 className="text-2xl font-bold text-text mb-2">Unit Test</h1>
          <p className="text-text mb-4">
            {testState === "select" && "Select a chapter to test your knowledge."}
            {testState === "testing" && `Chapter ${currentChapterIndex + 1} of ${questions.length}`}
            {testState === "results" && "Your test results"}
          </p>
          
          <div className="flex gap-3">
            <Button
              variant={selectedSubject === "Science" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSubjectChange("Science")}
              disabled={testState !== "select"}
              className="rounded-full"
            >
              Science
            </Button>
            <Button
              variant={selectedSubject === "Maths" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSubjectChange("Maths")}
              disabled={testState !== "select"}
              className="rounded-full"
            >
              Maths
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-text">Loading questions...</p>
          </Card>
        )}

        {/* No Questions */}
        {!loading && questions.length === 0 && testState === "select" && (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-text">No questions available for this subject yet.</p>
          </Card>
        )}

        {/* Chapter Selection */}
        {!loading && testState === "select" && questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text mb-4">Choose a Chapter</h2>
            {questions.map((q, index) => {
              const isAnswered = answeredChapters.has(q.chapterId);
              const result = chapterResults.find((r) => r.chapterId === q.chapterId);
              return (
                <Card key={q.chapterId} variant="default" padding="lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-1 rounded-lg">
                        Chapter {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-text mt-2">{q.chapterTitle}</h3>
                      {isAnswered && (
                        <p className={`text-sm mt-1 ${result?.correct ? "text-success" : "text-error"}`}>
                          {result?.correct ? "✓ Correct" : "✗ Incorrect"}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSelectChapter(index)}
                      variant={isAnswered ? "outline" : "primary"}
                      size="sm"
                      className="rounded-full"
                    >
                      {isAnswered ? "Retake" : "Start Test"}
                    </Button>
                  </div>
                </Card>
              );
            })}
            {answeredChapters.size > 0 && answeredChapters.size < questions.length && (
              <Button onClick={() => setTestState("testing")} className="w-full" size="lg">
                Continue Testing
              </Button>
            )}
            {answeredChapters.size === questions.length && (
              <Button onClick={() => setTestState("results")} className="w-full" size="lg">
                View Results
              </Button>
            )}
          </div>
        )}

        {/* Testing State - One Question at a Time */}
        {!loading && testState === "testing" && currentQuestion && (
          <Card variant="default" padding="lg">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-1 rounded-lg">
                  Chapter {currentChapterIndex + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestState("select")}
                  className="rounded-full"
                >
                  ← Back
                </Button>
              </div>
              <h3 className="text-lg font-semibold text-text">{currentQuestion.chapterTitle}</h3>
              <p className="text-text mt-2" dangerouslySetInnerHTML={{ __html: currentQuestion.question.question }} />
            </div>

            <div className="space-y-3">
              {currentQuestion.question.options?.map((option) => (
                <OptionButton
                  key={option.label}
                  label={option.label}
                  text={option.text}
                  isSelected={currentAnswer === option.label}
                  isCorrect={option.label === currentQuestion.question.answer.correct}
                  showResult={chapterSubmitted}
                  onClick={() => !chapterSubmitted && setCurrentAnswer(option.label)}
                  disabled={chapterSubmitted}
                />
              ))}
            </div>

            {chapterSubmitted && (
              <div className="mt-4 p-3 rounded-lg bg-surface/50">
                <p className="text-sm text-text">
                  <strong>Explanation:</strong> {currentQuestion.question.answer.explanation}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {!chapterSubmitted ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer}
                  className="rounded-full"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextChapter} className="rounded-full">
                  {currentChapterIndex < questions.length - 1 ? "Next Chapter →" : "View Results"}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Results State */}
        {!loading && testState === "results" && (
          <div className="space-y-6">
            <Card variant="highlight" padding="lg" className="text-center">
              <h2 className="text-2xl font-bold text-text mb-2">
                Your Score: {totalScore} / {questions.length}
              </h2>
              <p className="text-text mb-4">
                {totalScore === questions.length
                  ? "Perfect! Great job!"
                  : totalScore >= questions.length / 2
                  ? "Good effort! Keep learning!"
                  : "Keep practicing! You'll get better!"}
              </p>
            </Card>

            <h3 className="text-lg font-semibold text-text">Chapter Breakdown</h3>
            {chapterResults.map((result, index) => {
              const originalIndex = questions.findIndex((q) => q.chapterId === result.chapterId);
              return (
                <Card key={result.chapterId} variant="default" padding="lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-1 rounded-lg">
                        Chapter {originalIndex + 1}
                      </span>
                      <h4 className="text-text mt-2">{result.chapterTitle}</h4>
                    </div>
                    <span className={`text-lg font-bold ${result.correct ? "text-success" : "text-error"}`}>
                      {result.correct ? "✓" : "✗"}
                    </span>
                  </div>
                </Card>
              );
            })}

            <Button onClick={handleRestart} variant="primary" className="w-full" size="lg">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
