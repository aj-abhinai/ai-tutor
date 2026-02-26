"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProgress } from "@/components/progress";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { Alert } from "@/components/ui/Alert";
import { ProgressCard } from "@/components/progress/components/ProgressCard";
import { ProgressEmpty } from "@/components/progress/components/ProgressEmpty";

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const { progress, isLoading, error } = useProgress();

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
          <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
        </div>
        <div className="relative w-full max-w-2xl animate-pulse mt-16">
          <div className="h-40 rounded-xl bg-surface/60" />
        </div>
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
            <h1 className="text-2xl font-semibold text-text mb-4">Progress</h1>
            <p className="text-text-muted mb-6">
              Track your unit test completion progress and study streaks.
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
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary"
              >
                Class 7 NCERT
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-text">Progress</h1>
              <p className="text-sm text-text-muted mt-2">
                Track your unit test completion
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

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {progress && progress.totalCompleted > 0 ? (
          <ProgressCard
            totalCompleted={progress.totalCompleted}
            streakDays={progress.streakDays}
            completions={progress.completedUnitTests}
          />
        ) : (
          <ProgressEmpty />
        )}
      </div>
    </main>
  );
}
