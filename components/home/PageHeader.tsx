"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";

export function PageHeader() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
            Class 7 NCERT
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-text">AI Tutor</h1>
          <p className="text-sm text-text-muted mt-2">
            Learn. Listen. Quiz. Build confidence one topic at a time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
                title="Open student profile"
              >
                {user.displayName || "Student"}
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-semibold text-text hover:bg-surface"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-text-on-primary hover:bg-primary-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
