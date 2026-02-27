"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import ReactMarkdown from "react-markdown";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { StatusCard } from "@/components/ui/StatusCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
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

// Explore client - AI chat interface
export function ExploreClient() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSearching]);

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

  const handleSendMessage = async () => {
    if (!query.trim() || isSearching) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query.trim(),
    };

    startTransition(() => {
      setMessages((prev) => [...prev, userMessage]);
    });

    setQuery("");
    setIsSearching(true);

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();

      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          query: userMessage.content,
          subjects: selectedTags.filter(t => t === "science" || t === "maths"),
          topics: selectedTags.filter(t => t !== "science" && t !== "maths"),
        }),
      });

      const data = await res.json();

      startTransition(() => {
        if (res.ok && data?.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.answer,
              sources: data.sources || ["Class 7 NCERT"],
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: data.error || "I couldn't find an answer. Try a different question.",
              sources: [],
            },
          ]);
        }
      });
    } catch {
      startTransition(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
            sources: [],
          },
        ]);
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasMessages = messages.length > 0;

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
    <main className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-3xl mx-auto flex flex-col h-screen">
        <header className="px-6 py-4 flex-shrink-0">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                AI Tutor
              </Link>
              <h1 className="mt-4 text-2xl font-semibold text-text flex items-center gap-2">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                AI Chat
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Ask me anything about Science or Maths
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
        </header>

        <div className="px-6 flex-shrink-0">
          <div className="flex flex-wrap gap-2 pb-4 border-b border-border/50">
            <span className="text-xs text-text-muted self-center mr-1">Filter:</span>
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!hasMessages && !isSearching && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-light/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-text-muted max-w-xs">
                Start a conversation! Ask me anything about your Science or Maths topics.
              </p>
              <p className="text-xs text-text-muted/60 mt-3">
                Note: Chat is not saved. Messages will be lost on refresh.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-surface border border-border text-text rounded-bl-md"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none text-text">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em>{children}</em>,
                          code: ({ children }) => <code className="bg-muted-bg px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-muted-bg p-3 rounded-lg overflow-x-auto mb-2 text-xs">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-secondary pl-3 italic text-text-muted">{children}</blockquote>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-text-muted mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source: string, i: number) => (
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
            ))}

            {isSearching && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="px-6 py-4 flex-shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!query.trim() || isSearching}
              className="rounded-full px-5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
