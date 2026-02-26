"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Badge } from "@/components/ui/Badge";
import { StatusCard } from "@/components/ui/StatusCard";

interface SearchResult {
  id: string;
  question: string;
  answer: string;
  sources: string[];
}

const SUBJECT_TAGS = [
  { value: "science", label: "Science", color: "secondary" },
  { value: "maths", label: "Maths", color: "amber" },
];

const TOPIC_TAGS = [
  { value: "physics", label: "Physics", color: "teal" },
  { value: "chemistry", label: "Chemistry", color: "indigo" },
  { value: "biology", label: "Biology", color: "emerald" },
  { value: "algebra", label: "Algebra", color: "rose" },
  { value: "geometry", label: "Geometry", color: "sky" },
];

export function ExploreClient() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  const toggleTag = (tag: string) => {
    startTransition(() => {
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    });
  };

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();

      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          query: query.trim(),
          subjects: selectedTags.filter(t => t === "science" || t === "maths"),
          topics: selectedTags.filter(t => t !== "science" && t !== "maths"),
        }),
      });

      const data = await res.json();

      startTransition(() => {
        if (res.ok && data?.answer) {
          setResults([
            {
              id: "1",
              question: query,
              answer: data.answer,
              sources: data.sources || ["Class 7 NCERT"],
            },
          ]);
        } else {
          setResults([
            {
              id: "1",
              question: query,
              answer: data.error || "I couldn't find an answer. Try a different question.",
              sources: [],
            },
          ]);
        }
      });
    } catch {
      startTransition(() => {
        setResults([
          {
            id: "1",
            question: query,
            answer: "Something went wrong. Please try again.",
            sources: [],
          },
        ]);
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
        <StatusCard message="Loading..." />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
          <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
        </div>
        <div className="relative w-full max-w-2xl mt-16">
          <Card padding="lg" className="text-center">
            <h1 className="text-2xl font-semibold text-text mb-4">Explore</h1>
            <p className="text-text-muted mb-6">
              Ask anything about your Science and Maths topics. Get AI-powered answers with verified sources.
            </p>
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

      <div className="relative w-full max-w-3xl">
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                Class 7 NCERT
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-text">Explore</h1>
              <p className="text-sm text-text-muted mt-2">
                Ask anything. Get AI answers with sources.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
              >
                Home
              </Link>
              <Link
                href="/profile"
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
              >
                {user.displayName || "Student"}
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        <Card padding="lg" className="mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-text-muted">Subjects:</span>
              {SUBJECT_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTags.includes(tag.value)
                      ? tag.color === "secondary"
                        ? "bg-secondary text-white"
                        : "bg-warning text-text"
                      : "bg-surface border border-border text-text-muted hover:border-secondary"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-text-muted">Topics:</span>
              {TOPIC_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTags.includes(tag.value)
                      ? tag.color === "teal"
                        ? "bg-accent text-white"
                        : tag.color === "indigo"
                        ? "bg-secondary text-white"
                        : tag.color === "emerald"
                        ? "bg-accent text-white"
                        : tag.color === "rose"
                        ? "bg-error text-white"
                        : "bg-accent text-white"
                      : "bg-surface border border-border text-text-muted hover:border-secondary"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Ask anything about your subjects..."
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={!query.trim() || isSearching}
                className="px-6"
              >
                {isSearching ? "..." : "Search"}
              </Button>
            </div>
          </div>
        </Card>

        {isSearching || isPending ? (
          <Card padding="lg" className="text-center mb-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-muted">Searching...</p>
            </div>
          </Card>
        ) : null}

        {!hasSearched && !isSearching && (
          <Card padding="lg" className="text-center">
            <p className="text-text-muted">
              Select tags to filter your search, then ask any question about Science or Maths.
            </p>
          </Card>
        )}

        {hasSearched && results.length > 0 && !isSearching && (
          <div className="flex flex-col gap-4">
            {results.map((result) => (
              <Card key={result.id} padding="md">
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-primary text-white px-4 py-2 rounded-2xl rounded-br-md max-w-[85%]">
                      <p className="text-sm">{result.question}</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]">
                      <div className="prose prose-sm max-w-none text-text">
                        <p className="whitespace-pre-wrap">{result.answer}</p>
                      </div>
                      {result.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-text-muted mb-2">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.sources.map((source, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-full border border-border bg-muted-bg px-2.5 py-0.5 text-xs font-semibold text-text"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
