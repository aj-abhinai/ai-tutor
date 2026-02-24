"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth/AuthProvider";

type FormState = {
  name: string;
  email: string;
  password: string;
};

export function friendlySignupAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Sign up failed. Please try again.";
  }
}

export function isSignupFormSubmittable(
  name: string,
  email: string,
  password: string
): boolean {
  return name.trim().length > 1 && email.trim().length > 0 && password.trim().length >= 6;
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return isSignupFormSubmittable(form.name, form.email, form.password);
  }, [form.email, form.name, form.password]);

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
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );
      const displayName = form.name.trim();
      if (displayName) {
        await updateProfile(credential.user, { displayName });
      }
      router.replace("/");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const firebaseCode = (err as { code?: string })?.code ?? code;
      setError(friendlySignupAuthError(firebaseCode));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setError(friendlySignupAuthError(firebaseCode));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[radial-gradient(circle_at_top,#fff6ea,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf5e6_55%,#f9f0dd)]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-lg backdrop-blur">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Student Signup
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600">
            Start saving notes, streaks, and practice history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Your name"
            />
          </label>

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
              autoComplete="new-password"
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
            {submitting ? "Creating account..." : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => void handleGoogleSignup()}
            disabled={submitting || googleSubmitting}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {googleSubmitting ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
