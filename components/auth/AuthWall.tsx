"use client"; // Client-side component for authentication wall

import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";

// Blocked access component shown to unauthenticated users
export function AuthWall({
  title = "Student Login Required",
  message = "Please log in to continue learning.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="auth-shell min-h-screen flex items-center justify-center px-6 py-10 bg-background">
      <Card className="w-full max-w-md p-6 text-center">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-2 text-sm text-text-muted">{message}</p>
        <div className="mt-4 flex flex-col gap-2">
          <LinkButton href="/login" variant="primary" size="md">
            Log in
          </LinkButton>
          <LinkButton href="/signup" variant="outline" size="md">
            Create account
          </LinkButton>
        </div>
      </Card>
    </main>
  );
}
