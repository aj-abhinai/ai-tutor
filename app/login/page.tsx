"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";

type FormState = {
  email: string;
  password: string;
};

export function friendlyLoginAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Login failed. Please try again.";
  }
}

export function isLoginFormSubmittable(email: string, password: string): boolean {
  return email.trim().length > 0 && password.trim().length >= 6;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return isLoginFormSubmittable(form.email, form.password);
  }, [form.email, form.password]);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      router.replace("/");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const firebaseCode = (err as { code?: string })?.code ?? code;
      setError(friendlyLoginAuthError(firebaseCode));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (submitting || googleSubmitting) return;
    setGoogleSubmitting(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.replace("/");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const firebaseCode = (err as { code?: string })?.code ?? code;
      setError(friendlyLoginAuthError(firebaseCode));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[radial-gradient(circle_at_top,#fff6ea,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf5e6_55%,#f9f0dd)]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-lg backdrop-blur">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Student Login
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in to save notes, streaks, and your learning progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="student@example.com"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting || googleSubmitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={submitting || googleSubmitting}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleSubmitting ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Create a student account
          </Link>
        </p>
      </div>
    </main>
  );
}
