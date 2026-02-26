"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import type { SubjectName } from "@/lib/learning-types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";

interface Flashcard {
  id: string;
  chapterId: string;
  chapterTitle: string;
  term: string;
  definition: string;
}

interface ChapterGroup {
  chapterId: string;
  chapterTitle: string;
  cards: Flashcard[];
  cardCount: number;
}

type RevisionState = "select" | "reviewing";

export default function QuickRevisionClientPage() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>("Science");
  const [loading, setLoading] = useState(false);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [revisionState, setRevisionState] = useState<RevisionState>("select");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const fetchFlashcards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setAllFlashcards([]);
    setKnownCards(new Set());
    setRevisionState("select");
    setSelectedChapterId("");
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/quick-revision/flashcards?subject=${selectedSubject}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load flashcards");
        return;
      }
      setAllFlashcards(data.flashcards || []);
    } catch {
      setError("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  }, [user, selectedSubject]);

  useEffect(() => {
    if (user) {
      fetchFlashcards();
    }
  }, [user, fetchFlashcards]);

  const chapters = useMemo(() => {
    const map = new Map<string, ChapterGroup>();
    for (const card of allFlashcards) {
      if (!map.has(card.chapterId)) {
        map.set(card.chapterId, {
          chapterId: card.chapterId,
          chapterTitle: card.chapterTitle,
          cards: [],
          cardCount: 0,
        });
      }
      const group = map.get(card.chapterId)!;
      group.cards.push(card);
      group.cardCount = group.cards.length;
    }
    return Array.from(map.values());
  }, [allFlashcards]);

  const currentChapterCards = useMemo(() => {
    if (!selectedChapterId) return [];
    return allFlashcards.filter((c) => c.chapterId === selectedChapterId);
  }, [allFlashcards, selectedChapterId]);

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setRevisionState("reviewing");
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleKnow = () => {
    const card = currentChapterCards[currentIndex];
    setKnownCards((prev) => new Set(prev).add(card.id));
    handleNext();
  };

  const handleDontKnow = () => {
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < currentChapterCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setRevisionState("select");
    }
  };

  const handleSubjectChange = (subject: SubjectName) => {
    setSelectedSubject(subject);
  };

  const handleBackToSelect = () => {
    setRevisionState("select");
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = currentChapterCards[currentIndex];
  const progress = currentChapterCards.length > 0 ? ((currentIndex + 1) / currentChapterCards.length) * 100 : 0;
  const selectedChapter = chapters.find((c) => c.chapterId === selectedChapterId);

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <LinkButton href="/" variant="secondary" size="sm" className="mb-6 rounded-full">
            ← Back to Home
          </LinkButton>
          <Card variant="highlight" padding="lg" className="text-center py-12">
            <h2 className="text-xl font-bold text-text mb-4">Login Required</h2>
            <p className="text-text mb-6">Please log in to access Quick Revision.</p>
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
          <h1 className="text-2xl font-bold text-text mb-2">Quick Revision</h1>
          <p className="text-text mb-4">
            {revisionState === "select" 
              ? "Select a chapter to review with flashcards." 
              : `${selectedChapter?.chapterTitle} - Card ${currentIndex + 1} of ${currentChapterCards.length}`}
          </p>
          
          <div className="flex gap-3">
            <Button
              variant={selectedSubject === "Science" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSubjectChange("Science")}
              disabled={revisionState !== "select"}
              className="rounded-full"
            >
              Science
            </Button>
            <Button
              variant={selectedSubject === "Maths" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSubjectChange("Maths")}
              disabled={revisionState !== "select"}
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
            <p className="text-text">Loading flashcards...</p>
          </Card>
        )}

        {/* No Flashcards */}
        {!loading && allFlashcards.length === 0 && revisionState === "select" && (
          <Card variant="default" padding="lg" className="text-center">
            <p className="text-text">No flashcards available for this subject yet.</p>
          </Card>
        )}

        {/* Chapter Selection */}
        {!loading && revisionState === "select" && chapters.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text mb-4">Choose a Chapter</h2>
            {chapters.map((chapter) => (
              <Card key={chapter.chapterId} variant="default" padding="lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-text">{chapter.chapterTitle}</h3>
                    <p className="text-sm text-text-muted mt-1">{chapter.cardCount} flashcards</p>
                  </div>
                  <Button
                    onClick={() => handleSelectChapter(chapter.chapterId)}
                    variant="primary"
                    size="sm"
                    className="rounded-full"
                  >
                    Start Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reviewing State */}
        {!loading && revisionState === "reviewing" && currentCard && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSelect}
              className="rounded-full"
            >
              ← Back to Chapters
            </Button>

            {/* Progress Bar */}
            <div className="w-full bg-border rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Flashcard with 3D Flip Animation */}
            <div className="perspective-1000">
              <div 
                className="relative w-full h-64 cursor-pointer"
                onClick={handleFlip}
                style={{ transformStyle: "preserve-3d", transition: "transform 0.6s" }}
              >
                {/* Front of Card */}
                <div 
                  className="absolute inset-0 rounded-2xl border border-border bg-surface/85 shadow-[0_16px_32px_rgba(10,24,54,0.06)] backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center"
                  style={{ backfaceVisibility: "hidden", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                >
                  <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-1 rounded-lg mb-4">
                    {currentCard.chapterTitle}
                  </span>
                  <p className="text-lg font-bold text-text mb-2">Term</p>
                  <p className="text-xl text-text">{currentCard.term}</p>
                  <p className="text-sm text-text-muted mt-4">Tap to flip</p>
                </div>

                {/* Back of Card */}
                <div 
                  className="absolute inset-0 rounded-2xl border border-border bg-secondary-light/30 shadow-[0_16px_32px_rgba(10,24,54,0.06)] p-6 flex flex-col items-center justify-center text-center"
                  style={{ backfaceVisibility: "hidden", transform: isFlipped ? "rotateY(0deg)" : "rotateY(-180deg)" }}
                >
                  <span className="text-xs font-semibold text-secondary bg-secondary/20 px-2 py-1 rounded-lg mb-4">
                    Definition
                  </span>
                  <p className="text-text">{currentCard.definition}</p>
                  <p className="text-sm text-text-muted mt-4">Tap to flip back</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isFlipped ? (
              <div className="flex gap-4">
                <Button 
                  onClick={handleDontKnow} 
                  variant="outline" 
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  Still Learning
                </Button>
                <Button 
                  onClick={handleKnow} 
                  variant="primary" 
                  className="flex-1 rounded-full"
                  size="lg"
                >
                  I Know This
                </Button>
              </div>
            ) : (
              <Button onClick={handleFlip} className="w-full rounded-full" size="lg">
                Show Answer
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
