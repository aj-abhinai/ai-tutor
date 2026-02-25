"use client";

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
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { TextLink } from "@/components/ui/TextLink";

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
    <main className="auth-shell min-h-screen flex items-center justify-center px-6 py-10 bg-background">
      <Card className="w-full max-w-md rounded-3xl p-7 backdrop-blur">
        <div className="text-center">
          <Badge variant="indigo" className="auth-eyebrow uppercase">
            Student Signup
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold text-text">Create your account</h1>
          <p className="mt-2 text-sm text-text-muted">
            Start saving notes, streaks, and practice history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-text">
            Name
            <Input
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 py-2 text-sm"
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-semibold text-text">
            Email
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-2 py-2 text-sm"
              placeholder="student@example.com"
            />
          </label>

          <label className="block text-sm font-semibold text-text">
            Password
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-2 py-2 text-sm"
              placeholder="At least 6 characters"
            />
          </label>

          {error && (
            <Alert variant="error" className="px-3 py-2 text-xs">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!canSubmit || submitting || googleSubmitting}
            className="w-full py-2 text-sm"
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleGoogleSignup()}
            disabled={submitting || googleSubmitting}
            variant="outline"
            className="w-full border-secondary/30 bg-secondary-light py-2 text-sm text-secondary hover:bg-secondary-light/80"
          >
            {googleSubmitting ? "Connecting to Google..." : "Continue with Google"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <TextLink href="/login">
            Log in
          </TextLink>
        </p>
        <div className="mt-3">
          <LinkButton href="/" variant="ghost" size="sm" className="w-full">
            Back to AI Tutor
          </LinkButton>
        </div>
      </Card>
    </main>
  );
}
