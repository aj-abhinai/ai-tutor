"use client";

import { Button, Card, Input, OptionButton } from "@/components/ui";
import { QuestionItem } from "@/lib/curriculum";
import { ExplainFeedback } from "./types";
import { renderHtml, renderWithKaTeX } from "./lesson-utils";

interface QuizCardProps {
  currentQuestion?: QuestionItem;
  questionIndex: number;
  questionsLength: number;
  isShortAnswer: boolean;
  isReasoning: boolean;
  shortAnswer: string;
  onShortAnswerChange: (value: string) => void;
  selectedAnswer: string | null;
  onSelectAnswer: (value: string) => void;
  showAnswer: boolean;
  canCheckAnswer: boolean;
  isAnswerCorrect: boolean;
  checkingQuiz: boolean;
  quizFeedback: ExplainFeedback | null;
  onCheckAnswer: () => void;
  onResetQuiz: () => void;
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
  shortAnswer,
  onShortAnswerChange,
  selectedAnswer,
  onSelectAnswer,
  showAnswer,
  canCheckAnswer,
  isAnswerCorrect,
  checkingQuiz,
  quizFeedback,
  onCheckAnswer,
  onResetQuiz,
  onPrevQuestion,
  onNextQuestion,
  onRestartQuestions,
  onChooseNewLesson,
}: QuizCardProps) {
  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Check Understanding</h2>

      {/* Question header + navigation */}
      {currentQuestion ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">
              Question {questionIndex + 1} of {questionsLength}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevQuestion}
                disabled={questionIndex === 0}
                aria-label="Previous question"
              >
                <span className="inline-flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5" />
                    <path d="M11 19l-7-7 7-7" />
                  </svg>
                  Prev
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextQuestion}
                disabled={questionIndex >= questionsLength - 1}
                aria-label="Next question"
              >
                <span className="inline-flex items-center gap-1">
                  Next
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </span>
              </Button>
            </div>
          </div>
          <div
            className="text-lg font-medium text-slate-800 mb-6 p-4 bg-white/80 rounded-xl border border-slate-200"
            dangerouslySetInnerHTML={renderHtml(currentQuestion.question)}
          />
        </>
      ) : (
        <div className="text-sm text-slate-600 mb-6">
          No questions available for this subtopic yet.
        </div>
      )}

      {/* Answer input (short answer or MCQ options) */}
      {currentQuestion && isShortAnswer ? (
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isReasoning ? "Your explanation" : "Your answer"}
          </label>
          <Input
            value={shortAnswer}
            onChange={(e) => onShortAnswerChange(e.target.value)}
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
              onClick={() => !showAnswer && onSelectAnswer(option.label)}
              disabled={showAnswer}
            />
          ))}
        </div>
      ) : null}

      {/* Check answer button or result panel */}
      {currentQuestion && !showAnswer ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onCheckAnswer}
          disabled={!canCheckAnswer || checkingQuiz}
        >
          {checkingQuiz ? "Checking..." : "Check Answer"}
        </Button>
      ) : currentQuestion ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <div
            className={`p-6 rounded-2xl mb-6 ${
              isAnswerCorrect
                ? "bg-emerald-50/70 border border-emerald-200"
                : "bg-amber-50/70 border border-amber-200"
            }`}
          >
            <h3
              className={`font-semibold text-xl mb-2 ${
                isAnswerCorrect ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {isReasoning
                ? isAnswerCorrect
                  ? "Great explanation."
                  : "Nice try! Compare with the model answer."
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
            {isShortAnswer && quizFeedback && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  {quizFeedback.rating}
                </div>
                <div className="mt-2">
                  <strong>What’s right:</strong> {quizFeedback.praise}
                </div>
                <div className="mt-2">
                  <strong>Improve:</strong> {quizFeedback.fix}
                </div>
                <div className="mt-2">
                  <strong>Re-read:</strong> {quizFeedback.rereadTip}
                </div>
              </div>
            )}
            <div className="text-gray-700">
              <strong>Explanation:</strong>{" "}
              <span dangerouslySetInnerHTML={renderHtml(currentQuestion.answer.explanation)} />
            </div>
          </div>

          {/* Post-answer navigation actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" size="md" className="flex-1" onClick={onResetQuiz}>
              Try Again
            </Button>
            {questionIndex < questionsLength - 1 ? (
              <Button variant="secondary" size="md" className="flex-1" onClick={onNextQuestion}>
                <span className="inline-flex items-center justify-center gap-2">
                  Next Question
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </span>
              </Button>
            ) : (
              <Button variant="secondary" size="md" className="flex-1" onClick={onRestartQuestions}>
                Restart Questions
              </Button>
            )}
          </div>

          {/* Quick exit to start a new lesson */}
          <div className="mt-4">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              className="!bg-gray-800 !text-white hover:!bg-gray-900"
              onClick={onChooseNewLesson}
            >
              Choose New Lesson
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
