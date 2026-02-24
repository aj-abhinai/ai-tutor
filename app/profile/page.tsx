"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type ProfileResponse = {
  profile?: {
    name: string;
    email: string;
  };
  error?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSave = useMemo(() => name.trim().length >= 2 && !saving, [name, saving]);

  useEffect(() => {
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

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
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

  if (pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[radial-gradient(circle_at_top,#fff6ea,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf5e6_55%,#f9f0dd)]">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 text-sm text-slate-700 shadow">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10 bg-[radial-gradient(circle_at_top,#fff6ea,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf5e6_55%,#f9f0dd)]">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-7 shadow-lg backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Student Profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Profile</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Back
          </Link>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSave}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Email (read only)
            <input
              type="email"
              value={email}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 shadow-sm"
            />
          </label>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{success}</div>}

          <button
            type="submit"
            disabled={!canSave}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {saving ? "Saving..." : "Save name"}
          </button>
        </form>
      </div>
    </main>
  );
}
