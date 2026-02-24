"use client";

import Link from "next/link";

export function AuthWall({
  title = "Student Login Required",
  message = "Please log in to continue learning.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
