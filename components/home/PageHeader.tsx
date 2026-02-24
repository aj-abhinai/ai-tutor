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
          {/* Small badge + product title */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Class 7 NCERT
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-slate-900">AI Tutor</h1>
          <p className="text-sm text-slate-600 mt-2">
            Learn. Listen. Quiz. Build confidence one topic at a time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
                title="Open student profile"
              >
                {user.displayName || "Student"}
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
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
