"use client";

import { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * AI Concept Explainer - Main Page
 * NCERT-aligned with Class and Chapter selection.
 */

interface APIResponse {
  concept: string;
  example: string;
  mcqs: MCQQuestion[];
}

interface MCQQuestion {
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

type SectionKey = "concept" | "example" | "mcq";

const SECTION_CONFIG: { key: SectionKey; title: string; emoji: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: "concept", title: "Concept Breakdown", emoji: "📚", color: "text-blue-800", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
  { key: "example", title: "Worked Example", emoji: "✏️", color: "text-green-800", bgColor: "bg-green-50", borderColor: "border-green-300" },
  { key: "mcq", title: "Practice MCQs", emoji: "📝", color: "text-purple-800", bgColor: "bg-purple-50", borderColor: "border-purple-300" },
];

const CLASS_OPTIONS = [
  { value: "6", label: "Class 6" },
  { value: "7", label: "Class 7" },
  { value: "8", label: "Class 8" },
  { value: "9", label: "Class 9" },
  { value: "10", label: "Class 10" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
];

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

export default function Home() {
  const [topic, setTopic] = useState("");
  const [studentClass, setStudentClass] = useState("11");
  const [chapter, setChapter] = useState("");
  const [data, setData] = useState<APIResponse | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionKey>("concept");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // MCQ Quiz State
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleExplain = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setData(null);
    setCurrentMcqIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setScore(0);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, class: studentClass, chapter }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Something went wrong");
      } else {
        setData(resData.content);
        setSelectedSection("concept");
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !data) return;
    setSubmitted(true);
    if (selectedAnswer === data.mcqs[currentMcqIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setCurrentMcqIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  const currentConfig = SECTION_CONFIG.find((s) => s.key === selectedSection)!;
  const mcqs = data?.mcqs || [];
  const currentMcq = mcqs[currentMcqIndex];
  const isQuizComplete = currentMcqIndex >= mcqs.length && mcqs.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Concept Explainer
        </h1>
        <p className="text-gray-600 mb-6">
          NCERT-aligned explanations for JEE/NEET preparation.
        </p>

        {/* Input Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Class Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {CLASS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter (Optional)
              </label>
              <input
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Motion in a Straight Line"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic *
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExplain()}
                placeholder="e.g. Newton's Laws"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleExplain}
            disabled={loading || !topic.trim()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating NCERT-aligned explanation..." : "Explain Topic"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Section Selector Cards */}
        {data && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SECTION_CONFIG.map((config) => (
                <button
                  key={config.key}
                  onClick={() => setSelectedSection(config.key)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${selectedSection === config.key
                      ? `${config.bgColor} ${config.borderColor} shadow-md`
                      : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <span className="text-2xl block mb-1">{config.emoji}</span>
                  <span className={`text-sm font-medium ${selectedSection === config.key ? config.color : "text-gray-700"}`}>
                    {config.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className={`bg-white border-2 ${currentConfig.borderColor} rounded-lg p-6`}>
              <h2 className={`text-xl font-semibold ${currentConfig.color} mb-4 flex items-center gap-2`}>
                <span>{currentConfig.emoji}</span>
                {currentConfig.title}
              </h2>

              {/* Concept & Example */}
              {selectedSection === "concept" && (
                <div
                  className="prose prose-gray max-w-none whitespace-pre-wrap font-sans leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderWithKaTeX(data.concept) }}
                />
              )}

              {selectedSection === "example" && (
                <div
                  className="prose prose-gray max-w-none whitespace-pre-wrap font-sans leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderWithKaTeX(data.example) }}
                />
              )}

              {/* MCQ Section */}
              {selectedSection === "mcq" && (
                <div>
                  {mcqs.length === 0 ? (
                    <p className="text-gray-500 italic">No MCQs found.</p>
                  ) : isQuizComplete ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🎉</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h3>
                      <p className="text-xl text-gray-600">
                        Your score: <span className="font-bold text-purple-600">{score}/{mcqs.length}</span>
                      </p>
                      <button
                        onClick={() => {
                          setCurrentMcqIndex(0);
                          setSelectedAnswer(null);
                          setSubmitted(false);
                          setScore(0);
                        }}
                        className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                      >
                        Retry Quiz
                      </button>
                    </div>
                  ) : currentMcq && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          Question {currentMcqIndex + 1} of {mcqs.length}
                        </span>
                        <span className="text-sm text-purple-600 font-medium">
                          Score: {score}
                        </span>
                      </div>

                      <div
                        className="text-lg font-medium text-gray-800 mb-6"
                        dangerouslySetInnerHTML={{ __html: renderWithKaTeX(currentMcq.question) }}
                      />

                      <div className="space-y-3 mb-6">
                        {currentMcq.options.map((option) => {
                          const isSelected = selectedAnswer === option.label;
                          const isCorrect = option.label === currentMcq.correctAnswer;

                          let optionStyle = "border-gray-200 hover:border-gray-400";
                          if (submitted) {
                            if (isCorrect) {
                              optionStyle = "border-green-500 bg-green-50";
                            } else if (isSelected && !isCorrect) {
                              optionStyle = "border-red-500 bg-red-50";
                            }
                          } else if (isSelected) {
                            optionStyle = "border-purple-500 bg-purple-50";
                          }

                          return (
                            <button
                              key={option.label}
                              onClick={() => !submitted && setSelectedAnswer(option.label)}
                              disabled={submitted}
                              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${optionStyle}`}
                            >
                              <span className="font-semibold mr-2">{option.label}.</span>
                              <span dangerouslySetInnerHTML={{ __html: renderWithKaTeX(option.text) }} />
                              {submitted && isCorrect && (
                                <span className="ml-2 text-green-600">✓</span>
                              )}
                              {submitted && isSelected && !isCorrect && (
                                <span className="ml-2 text-red-600">✗</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {!submitted ? (
                        <button
                          onClick={handleAnswerSubmit}
                          disabled={!selectedAnswer}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <>
                          <div className={`p-4 rounded-lg mb-4 ${selectedAnswer === currentMcq.correctAnswer
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                            }`}>
                            <p className={`font-semibold mb-2 ${selectedAnswer === currentMcq.correctAnswer ? "text-green-700" : "text-red-700"
                              }`}>
                              {selectedAnswer === currentMcq.correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                            </p>
                            <div
                              className="text-gray-700 text-sm"
                              dangerouslySetInnerHTML={{ __html: renderWithKaTeX(currentMcq.explanation) }}
                            />
                          </div>

                          <button
                            onClick={handleNextQuestion}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700"
                          >
                            {currentMcqIndex < mcqs.length - 1 ? "Next Question →" : "Finish Quiz"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
