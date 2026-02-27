"use client"; // Enable client-side rendering

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";

type ProfileResponse = { // Response type for profile API
  profile?: {
    name: string;
    email: string;
  };
  error?: string;
};

export default function ProfilePage() { // Main profile page component
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState(""); // User's display name
  const [email, setEmail] = useState(""); // User's email (read-only)
  const [saving, setSaving] = useState(false); // Save operation state
  const [pageLoading, setPageLoading] = useState(true); // Initial load state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]); // Validate name length

  useEffect(() => { // Load profile on mount
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const load = async () => {
      setPageLoading(true);
      setError("");
      try {
        const { getAuthHeaders } = await import("@/lib/auth-client");
        const headers = await getAuthHeaders();
        const res = await fetch("/api/profile", { headers });
        const data = (await res.json()) as ProfileResponse;
        if (!res.ok || !data.profile) {
          setError(data.error || "Failed to load profile.");
          return;
        }
        setName(data.profile.name);
        setEmail(data.profile.email);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setPageLoading(false);
      }
    };

    void load();
  }, [loading, router, user]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => { // Save profile changes
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json()) as ProfileResponse;
      if (!res.ok || !data.profile) {
        setError(data.error || "Failed to update profile.");
        return;
      }
      setName(data.profile.name);
      setEmail(data.profile.email);
      setSuccess("Profile updated.");
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) { // Show loading spinner while fetching
    return (
      <main className="auth-shell min-h-screen flex items-center justify-center px-6 py-10 bg-background">
        <Card className="px-5 py-4 text-sm text-text-muted">
          Loading profile...
        </Card>
      </main>
    );
  }

  return ( // Render profile form
    <main className="auth-shell min-h-screen flex items-center justify-center px-6 py-10 bg-background">
      <Card className="w-full max-w-md rounded-3xl p-7 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="indigo" className="auth-eyebrow uppercase">Student Profile</Badge>
            <h1 className="mt-3 text-3xl font-semibold text-text">Profile</h1>
          </div>
          <LinkButton href="/" variant="outline" size="sm" className="rounded-full">
            Back
          </LinkButton>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSave}>
          <label className="block text-sm font-semibold text-text">
            Name
            <Input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 py-2 text-sm"
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-semibold text-text">
            Email (read only)
            <Input
              type="email"
              value={email}
              readOnly
              className="mt-2 bg-muted-bg py-2 text-sm text-text-muted"
            />
          </label>

          {error && <Alert variant="error" className="px-3 py-2 text-xs">{error}</Alert>}
          {success && <Alert variant="success" className="px-3 py-2 text-xs">{success}</Alert>}

          <Button
            type="submit"
            disabled={!canSave}
            className="w-full py-2 text-sm"
          >
            {saving ? "Saving..." : "Save name"}
          </Button>
          <LinkButton href="/notes" variant="outline" size="md" className="w-full py-2 text-sm text-center">
            My Notes
          </LinkButton>
          <LinkButton href="/progress" variant="secondary" size="md" className="w-full py-2 text-sm text-center">
            View Progress
          </LinkButton>
        </form>
      </Card>
    </main>
  );
}
