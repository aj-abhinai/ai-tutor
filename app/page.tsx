"use client";

import { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Standard 7 AI Tutor - Main Page
 * 
 * A friendly, interactive tutor for Class 7 students.
 * Subjects: Science and Maths (NCERT aligned)
 */

// Response structure from API
interface TutorResponse {
  quickExplanation: string;
  stepByStep: string;
  practiceQuestion: {
    question: string;
    options: { label: string; text: string }[];
    type: "mcq" | "short";
  };
  answer: {
    correct: string;
    explanation: string;
  };
}

// NCERT Class 7 Science chapters
const SCIENCE_TOPICS = [
  "Nutrition in Plants",
  "Nutrition in Animals",
  "Fibre to Fabric",
  "Heat",
  "Acids, Bases and Salts",
  "Physical and Chemical Changes",
  "Weather, Climate and Adaptations",
  "Winds, Storms and Cyclones",
  "Soil",
  "Respiration in Organisms",
  "Transportation in Animals and Plants",
  "Reproduction in Plants",
  "Motion and Time",
  "Electric Current and its Effects",
  "Light",
  "Water: A Precious Resource",
  "Forests: Our Lifeline",
  "Wastewater Story",
];

// NCERT Class 7 Maths chapters
const MATHS_TOPICS = [
  "Integers",
  "Fractions and Decimals",
  "Data Handling",
  "Simple Equations",
  "Lines and Angles",
  "The Triangle and its Properties",
  "Congruence of Triangles",
  "Comparing Quantities",
  "Rational Numbers",
  "Practical Geometry",
  "Perimeter and Area",
  "Algebraic Expressions",
  "Exponents and Powers",
  "Symmetry",
  "Visualising Solid Shapes",
];

/**
 * Render LaTeX equations using KaTeX
 */
function renderWithKaTeX(text: string): string {
  if (!text) return "";

  // Display mode: $$...$$
  let rendered = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${eq}$$`;
    }
  });

  // Inline mode: $...$
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

  // Remove dangerous elements
  ["script", "style", "iframe", "object", "embed"].forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  return doc.body.innerHTML;
}

export default function Home() {
  // Form state
  const [subject, setSubject] = useState<"Science" | "Maths">("Science");
  const [topic, setTopic] = useState("");

  // Response state
  const [data, setData] = useState<TutorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Get topics based on selected subject
  const topics = subject === "Science" ? SCIENCE_TOPICS : MATHS_TOPICS;

  /**
   * Handle subject change - reset topic when subject changes
   */
  const handleSubjectChange = (newSubject: "Science" | "Maths") => {
    setSubject(newSubject);
    setTopic(""); // Reset topic when subject changes
  };

  /**
   * Call the explain API
   */
  const handleExplain = async () => {
    if (!topic) return;

    setLoading(true);
    setError("");
    setData(null);
    setSelectedAnswer(null);
    setShowAnswer(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setError(resData.error || "Something went wrong");
      } else {
        setData(resData.content);
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if selected answer is correct
   */
  const handleCheckAnswer = () => {
    setShowAnswer(true);
  };

  const isCorrect = showAnswer && data && selectedAnswer === data.answer.correct;
  const isWrong = showAnswer && data && selectedAnswer !== data.answer.correct;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Class 7 AI Tutor
          </h1>
          <p className="text-gray-600">
            Learn Science and Maths the fun way! 🚀
          </p>
        </div>

        {/* Subject and Topic Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* Subject Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📚 Choose a Subject
            </label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value as "Science" | "Maths")}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white"
              disabled={loading}
            >
              <option value="Science">🔬 Science</option>
              <option value="Maths">🔢 Maths</option>
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📖 Choose a Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white"
              disabled={loading}
            >
              <option value="">-- Select a topic --</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExplain}
            disabled={loading || !topic}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "🤔 Thinking..." : "✨ Teach Me!"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-lg mb-6">
            😕 {error}
          </div>
        )}

        {/* Response Display */}
        {data && (
          <div className="space-y-6">

            {/* Quick Explanation */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                💡 Quick Explanation
              </h2>
              <div
                className="text-gray-700 text-lg leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(renderWithKaTeX(data.quickExplanation))
                }}
              />
            </div>

            {/* Step by Step */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                📝 Let&apos;s Understand Step-by-Step
              </h2>
              <div
                className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(renderWithKaTeX(data.stepByStep))
                }}
              />
            </div>

            {/* Practice Question */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🎯 Try This Question!
              </h2>

              <div
                className="text-lg font-medium text-gray-800 mb-4"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(renderWithKaTeX(data.practiceQuestion.question))
                }}
              />

              {/* MCQ Options */}
              <div className="space-y-3 mb-4">
                {data.practiceQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.label;
                  const isThisCorrect = showAnswer && option.label === data.answer.correct;
                  const isThisWrong = showAnswer && isSelected && option.label !== data.answer.correct;

                  let bgColor = "bg-gray-50 hover:bg-gray-100";
                  let borderColor = "border-gray-200";

                  if (isThisCorrect) {
                    bgColor = "bg-green-100";
                    borderColor = "border-green-500";
                  } else if (isThisWrong) {
                    bgColor = "bg-red-100";
                    borderColor = "border-red-500";
                  } else if (isSelected && !showAnswer) {
                    bgColor = "bg-purple-100";
                    borderColor = "border-purple-500";
                  }

                  return (
                    <button
                      key={option.label}
                      onClick={() => !showAnswer && setSelectedAnswer(option.label)}
                      disabled={showAnswer}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${bgColor} ${borderColor}`}
                    >
                      <span className="font-bold mr-2">{option.label}.</span>
                      <span dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(renderWithKaTeX(option.text))
                      }} />
                      {isThisCorrect && <span className="ml-2">✅</span>}
                      {isThisWrong && <span className="ml-2">❌</span>}
                    </button>
                  );
                })}
              </div>

              {/* Check Answer Button */}
              {!showAnswer && (
                <button
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check My Answer! 🤞
                </button>
              )}

              {/* Answer Feedback */}
              {showAnswer && (
                <div className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border-2 border-green-300" : "bg-yellow-50 border-2 border-yellow-300"}`}>
                  <p className={`font-bold text-lg mb-2 ${isCorrect ? "text-green-700" : "text-yellow-700"}`}>
                    {isCorrect ? "🎉 Great job! You got it right!" : "🤔 Not quite, but that's okay!"}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">Correct answer:</span> {data.answer.correct}
                  </p>
                  <div
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(renderWithKaTeX(data.answer.explanation))
                    }}
                  />
                </div>
              )}
            </div>

            {/* Try Another Topic */}
            <div className="text-center">
              <button
                onClick={() => {
                  setData(null);
                  setTopic("");
                  setSelectedAnswer(null);
                  setShowAnswer(false);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300"
              >
                🔄 Learn Something Else
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
