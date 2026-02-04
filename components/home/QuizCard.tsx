"use client";

import { Button, Card, Input, OptionButton } from "@/components/ui";
import { QuestionItem } from "@/lib/curriculum";
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
  onCheckAnswer: () => void;
  onResetQuiz: () => void;
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
  onCheckAnswer,
  onResetQuiz,
  onNextQuestion,
  onRestartQuestions,
  onChooseNewLesson,
}: QuizCardProps) {
  return (
    <Card variant="highlight" padding="lg" className="animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Knowledge Check</h2>

      {currentQuestion ? (
        <>
          <div className="text-sm text-gray-500 mb-2">
            Question {questionIndex + 1} of {questionsLength}
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

      {currentQuestion && !showAnswer ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onCheckAnswer}
          disabled={!canCheckAnswer}
        >
          Check Answer
        </Button>
      ) : currentQuestion ? (
        <div className="animate-in fade-in zoom-in duration-300">
          <div
            className={`p-6 rounded-xl mb-6 ${
              isAnswerCorrect
                ? "bg-green-50 border-2 border-green-100"
                : "bg-yellow-50 border-2 border-yellow-100"
            }`}
          >
            <h3
              className={`font-bold text-xl mb-2 ${
                isAnswerCorrect ? "text-green-700" : "text-yellow-700"
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
              <span dangerouslySetInnerHTML={renderHtml(currentQuestion.answer.explanation)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" size="md" className="flex-1" onClick={onResetQuiz}>
              Try Again
            </Button>
            {questionIndex < questionsLength - 1 ? (
              <Button variant="secondary" size="md" className="flex-1" onClick={onNextQuestion}>
                Next Question
              </Button>
            ) : (
              <Button variant="secondary" size="md" className="flex-1" onClick={onRestartQuestions}>
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
