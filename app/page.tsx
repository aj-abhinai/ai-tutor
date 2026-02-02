"use client";

import { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * AI Concept Explainer - Main Page
 *
 * UI mirrors the output contract from agent.md:
 * - Concept Breakdown
 * - Worked Example
 * - Practice MCQs
 * - Why Wrong Options Fail
 *
 * Minimal Tailwind styling. No routing, no auth.
 * UI reflects thinking structure, not features.
 */

export default function Home() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExplain = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data.content);
      }
    } catch {
      setError("Failed to connect to API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Concept Explainer
        </h1>
        <p className="text-gray-600 mb-6">
          Enter a JEE/NEET topic to get a structured explanation.
        </p>

        {/* Input Section */}
        <div className="flex gap-3 mb-8">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExplain()}
            placeholder="e.g. Newton's Laws of Motion"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleExplain}
            disabled={loading || !topic.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Explaining..." : "Explain"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Result Display - Structured Sections */}
        {result && (
          <div className="space-y-6">
            {/* Section: Concept Breakdown */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-3 border-b border-blue-100 pb-2">
                📚 Concept Breakdown
              </h2>
              <div className="prose prose-gray max-w-none">
                <Content section="Concept Breakdown" content={result} />
              </div>
            </section>

            {/* Section: Worked Example */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-3 border-b border-green-100 pb-2">
                ✏️ Worked Example
              </h2>
              <div className="prose prose-gray max-w-none">
                <Content section="Worked Example" content={result} />
              </div>
            </section>

            {/* Section: Practice MCQs */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-800 mb-3 border-b border-purple-100 pb-2">
                📝 Practice MCQs
              </h2>
              <div className="prose prose-gray max-w-none">
                <Content section="Practice MCQs" content={result} />
              </div>
            </section>

            {/* Section: Why Wrong Options Fail */}
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-orange-800 mb-3 border-b border-orange-100 pb-2">
                ❌ Why Wrong Options Fail
              </h2>
              <div className="prose prose-gray max-w-none">
                <Content section="Why Wrong Options Fail" content={result} />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Render text with LaTeX equations using KaTeX.
 * Handles both inline ($...$) and block ($$...$$) equations.
 */
function renderWithKaTeX(text: string): string {
  // Handle block equations first ($$...$$)
  let rendered = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `$$${eq}$$`;
    }
  });

  // Handle inline equations ($...$)
  rendered = rendered.replace(/\$([^$\n]+?)\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `$${eq}$`;
    }
  });

  return rendered;
}

/**
 * Helper component to extract and display a specific section from the markdown response.
 */
function Content({ section, content }: { section: string; content: string }) {
  // Extract content between this section header and the next ## header
  const sectionHeader = `## ${section}`;
  const startIndex = content.indexOf(sectionHeader);

  if (startIndex === -1) {
    return <p className="text-gray-500 italic">Section not found</p>;
  }

  const afterHeader = content.slice(startIndex + sectionHeader.length);
  const nextSectionIndex = afterHeader.indexOf("\n## ");

  const sectionContent =
    nextSectionIndex === -1
      ? afterHeader.trim()
      : afterHeader.slice(0, nextSectionIndex).trim();

  // Render with KaTeX
  const renderedContent = renderWithKaTeX(sectionContent);

  return (
    <div
      className="whitespace-pre-wrap font-sans leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
