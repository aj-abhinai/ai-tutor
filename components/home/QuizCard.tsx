"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { OptionButton } from "@/components/ui/OptionButton";
import type { QuestionItem } from "@/lib/learning-types";
import { ExplainFeedback } from "./types";
import { renderHtml, renderWithKaTeX } from "./lesson-utils";

interface QuizCardProps {
  currentQuestion?: QuestionItem;
  questionIndex: number;
  questionsLength: number;
  isShortAnswer: boolean;
  isReasoning: boolean;
  checkingQuiz: boolean;
  quizFeedbackPreview?: string;
  quizFeedback: ExplainFeedback | null;
  onCheckShortAnswer: (payload: { answer: string; question: string; expectedAnswer: string; answerExplanation?: string }) => Promise<void>;
  onClearQuizFeedback: () => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onRestartQuestions: () => void;
  onChooseNewLesson: () => void;
}

export function QuizCard({
  currentQuestion,
  questionIndex,
  questionsLength,
  isShortAnswer,
  isReasoning,
  checkingQuiz,
  quizFeedbackPreview = "",
  quizFeedback,
  onCheckShortAnswer,
  onClearQuizFeedback,
  onPrevQuestion,
  onNextQuestion,
  onRestartQuestions,
  onChooseNewLesson,
}: QuizCardProps) {
  const [shortAnswer, setShortAnswer] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setShortAnswer("");
    setSelectedAnswer(null);
    setShowAnswer(false);
    onClearQuizFeedback();
  }, [currentQuestion?.question, onClearQuizFeedback, questionIndex]);

  const canCheckAnswer = useMemo(
    () => (isShortAnswer ? shortAnswer.trim().length > 0 : Boolean(selectedAnswer)),
    [isShortAnswer, selectedAnswer, shortAnswer],
  );

  const isAnswerCorrect = useMemo(() => {
    if (!currentQuestion) return false;
    if (isShortAnswer) {
      const aiCorrect = quizFeedback?.isCorrect;
      if (typeof aiCorrect === "boolean") return aiCorrect;
      if (isReasoning) return false;
      return shortAnswer.trim().toLowerCase() === currentQuestion.answer.correct.trim().toLowerCase();
    }
    return selectedAnswer === currentQuestion.answer.correct;
  }, [currentQuestion, isReasoning, isShortAnswer, quizFeedback?.isCorrect, selectedAnswer, shortAnswer]);

  const handleCheckAnswer = async () => {
    if (!currentQuestion || !canCheckAnswer) return;
    if (!isShortAnswer) { setShowAnswer(true); return; }
    await onCheckShortAnswer({
      answer: shortAnswer.trim(),
      question: currentQuestion.question,
      expectedAnswer: currentQuestion.answer.correct,
      answerExplanation: currentQuestion.answer.explanation,
    });
    setShowAnswer(true);
  };

  const handleTryAgain = () => {
    setShowAnswer(false);
    if (isShortAnswer) setShortAnswer(""); else setSelectedAnswer(null);
    onClearQuizFeedback();
  };

  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-semibold text-text mb-6">Check Understanding</h2>

      {currentQuestion ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-text-muted">Question {questionIndex + 1} of {questionsLength}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onPrevQuestion} disabled={questionIndex === 0} aria-label="Previous question">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="M11 19l-7-7 7-7" /></svg>
                  Prev
                </span>
              </Button>
              <Button variant="ghost" size="sm" onClick={onNextQuestion} disabled={questionIndex >= questionsLength - 1} aria-label="Next question">
                <span className="inline-flex items-center gap-1">
                  Next
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></svg>
                </span>
              </Button>
            </div>
          </div>
          <div className="text-lg font-medium text-text mb-6 p-4 bg-surface/80 rounded-xl border border-border" dangerouslySetInnerHTML={renderHtml(currentQuestion.question)} />
        </>
      ) : (
        <div className="text-sm text-text-muted mb-6">No questions available for this subtopic yet.</div>
      )}

      {currentQuestion && isShortAnswer ? (
        <div className="mb-8">
          <label className="block text-sm font-medium text-text mb-2">{isReasoning ? "Your explanation" : "Your answer"}</label>
          <Input value={shortAnswer} onChange={(e) => setShortAnswer(e.target.value)} disabled={showAnswer} placeholder={isReasoning ? "Explain in 1-2 sentences" : "Type your answer here"} />
        </div>
      ) : currentQuestion ? (
        <div className="space-y-3 mb-8">
          {(currentQuestion.options || []).map((option) => (
            <OptionButton key={option.label} label={option.label} text={renderWithKaTeX(option.text)} isSelected={selectedAnswer === option.label} isCorrect={option.label === currentQuestion.answer.correct} showResult={showAnswer} onClick={() => !showAnswer && setSelectedAnswer(option.label)} disabled={showAnswer} />
          ))}
        </div>
      ) : null}

      {currentQuestion && !showAnswer ? (
        <>
          <Button variant="primary" size="lg" fullWidth onClick={() => void handleCheckAnswer()} disabled={!canCheckAnswer || checkingQuiz}>
            {checkingQuiz ? "Checking..." : "Check Answer"}
          </Button>
          {isShortAnswer && checkingQuiz && quizFeedbackPreview && (
            <div className="mt-3 rounded-xl border border-border bg-surface/70 p-3 text-sm text-text whitespace-pre-wrap">{quizFeedbackPreview}</div>
          )}
        </>
      ) : currentQuestion ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <div className={`p-6 rounded-2xl mb-6 ${isAnswerCorrect ? "bg-success-light border border-success" : "bg-error-light border border-error/30"}`}>
            <h3 className={`font-semibold text-xl mb-2 ${isAnswerCorrect ? "text-accent-hover" : "text-error"}`}>
              {isReasoning ? (isAnswerCorrect ? "Great explanation." : "Nice try! Compare with the model answer.") : (isAnswerCorrect ? "Correct! Great job." : "Nice try! Check the explanation below.")}
            </h3>
            {isShortAnswer && (
              <div className="text-text text-sm mb-3">
                <div><strong>Your answer:</strong> {shortAnswer.trim() || "No answer provided"}</div>
                <div><strong>Expected answer:</strong> {currentQuestion.answer.correct}</div>
              </div>
            )}
            {isShortAnswer && quizFeedback && (
              <div className="mt-3 rounded-xl border border-border bg-surface/70 p-3 text-sm text-text">
                <div className="text-xs uppercase tracking-wide text-text-muted font-semibold">{quizFeedback.rating}</div>
                <div className="mt-2"><strong>What&apos;s right:</strong> {quizFeedback.praise}</div>
                <div className="mt-2"><strong>Improve:</strong> {quizFeedback.fix}</div>
                <div className="mt-2"><strong>Re-read:</strong> {quizFeedback.rereadTip}</div>
              </div>
            )}
            <div className="text-text"><strong>Explanation:</strong>{" "}<span dangerouslySetInnerHTML={renderHtml(currentQuestion.answer.explanation)} /></div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" size="md" className="flex-1" onClick={handleTryAgain}>Try Again</Button>
            {questionIndex < questionsLength - 1 ? (
              <Button variant="secondary" size="md" className="flex-1" onClick={onNextQuestion}>
                <span className="inline-flex items-center justify-center gap-2">Next Question<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></svg></span>
              </Button>
            ) : (
              <Button variant="secondary" size="md" className="flex-1" onClick={onRestartQuestions}>Restart Questions</Button>
            )}
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="md" fullWidth className="!bg-secondary !text-white hover:!bg-secondary-hover" onClick={onChooseNewLesson}>Choose New Lesson</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
