"use client";

/**
 * Physics Lab page — generic lab that loads experiments per chapter.
 *
 * Access: /physics-lab?chapter=electricity-circuits
 * Equipment and experiments vary based on the chapter query param.
 */

import "./circuit-effects.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
    type ChapterLab,
    type CircuitExperiment,
} from "@/lib/physics-lab-types";
import { AuthWall } from "@/components/auth/AuthWall";
import { useAuth } from "@/components/auth/AuthProvider";

type LabMode = "free" | "guided";

const CircuitCanvas = dynamic(
    () => import("@/components/circuit-lab/CircuitCanvas").then((m) => m.CircuitCanvas),
    {
        ssr: false,
        loading: () => (
            <div className="max-w-[960px] mx-auto rounded-2xl border border-slate-200 bg-white/70 px-4 py-8 text-center text-slate-500">
                Loading circuit board...
            </div>
        ),
    }
);

function PhysicsLabInner() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const chapterId = searchParams.get("chapter") ?? "";

    const [chapterLab, setChapterLab] = useState<ChapterLab | null>(null);
    const [labLoading, setLabLoading] = useState(true);
    const [labError, setLabError] = useState("");

    const [mode, setMode] = useState<LabMode>("guided");
    const [activeExperiment, setActiveExperiment] =
        useState<CircuitExperiment | null>(null);

    // Load chapter lab data from API (Firestore-backed with fallback).
    useEffect(() => {
        let cancelled = false;

        async function loadChapterLab() {
            if (!chapterId) {
                setChapterLab(null);
                setLabError("");
                setLabLoading(false);
                return;
            }

            setLabLoading(true);
            setLabError("");

            try {
                const { getAuthHeaders } = await import("@/lib/auth-client");
                const authHeaders = await getAuthHeaders();
                const res = await fetch(
                    `/api/physics/chapter-lab?chapterId=${encodeURIComponent(chapterId)}`,
                    { headers: authHeaders },
                );
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error || "Failed to load physics lab");
                }

                if (!cancelled) {
                    setChapterLab((data.chapterLab as ChapterLab) ?? null);
                }
            } catch (err) {
                if (!cancelled) {
                    setChapterLab(null);
                    setLabError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load physics lab"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLabLoading(false);
                }
            }
        }

        void loadChapterLab();

        return () => {
            cancelled = true;
        };
    }, [chapterId]);

    // Auto-select first experiment in guided mode
    const experiments = chapterLab?.experiments ?? [];
    const currentExperiment =
        mode === "guided" ? activeExperiment ?? experiments[0] ?? null : null;

    if (authLoading) {
        return (
            <main className="flex items-center justify-center min-h-screen p-8 text-center">
                <p className="text-slate-500">Checking your student session...</p>
            </main>
        );
    }

    if (!user) {
        return <AuthWall title="Student Login Required" message="Log in to access the physics lab." />;
    }

    if (labLoading) {
        return (
            <main className="flex items-center justify-center min-h-screen p-8 text-center">
                <p className="text-slate-500">Loading physics lab...</p>
            </main>
        );
    }

    if (!chapterLab) {
        return (
            <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
                <h1 className="text-2xl font-bold text-slate-700 mb-4">
                    No Lab Available
                </h1>
                <p className="text-slate-500 mb-6">
                    {labError || "This chapter doesn&apos;t have lab experiments yet."}
                </p>
                <Link
                    href="/"
                    className="px-5 py-2 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors"
                >
                    ← Back to Lessons
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-sky-50 to-slate-100 px-4 py-6">
            {/* ── Header ──────────────────────────── */}
            <div className="max-w-[960px] mx-auto mb-4">
                <Link
                    href="/"
                    className="text-sm text-sky-600 hover:text-sky-800 font-medium transition-colors"
                >
                    ← Back to Lessons
                </Link>
                <h1 className="text-2xl font-extrabold text-slate-800 mt-2">
                    ⚡ Physics Lab
                </h1>
                <p className="text-sm text-slate-500">
                    {chapterLab.chapterTitle}
                </p>
            </div>

            {/* ── Mode Toggle ─────────────────────── */}
            <div className="max-w-[960px] mx-auto mb-4 flex gap-2">
                <button
                    onClick={() => setMode("guided")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "guided"
                            ? "bg-sky-500 text-white shadow-md"
                            : "bg-white/70 text-slate-600 border border-slate-200 hover:bg-white"
                        }`}
                >
                    🧭 Guided
                </button>
                <button
                    onClick={() => setMode("free")}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "free"
                            ? "bg-sky-500 text-white shadow-md"
                            : "bg-white/70 text-slate-600 border border-slate-200 hover:bg-white"
                        }`}
                >
                    🔧 Free Build
                </button>
            </div>

            {/* ── Experiment Picker (Guided mode) ── */}
            {mode === "guided" && experiments.length > 1 && (
                <div className="max-w-[960px] mx-auto mb-4 flex gap-2 flex-wrap">
                    {experiments.map((exp) => (
                        <button
                            key={exp.id}
                            onClick={() => setActiveExperiment(exp)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${currentExperiment?.id === exp.id
                                    ? "bg-amber-400 text-amber-900 shadow-md"
                                    : "bg-white/70 text-slate-600 border border-slate-200 hover:bg-white"
                                }`}
                        >
                            {exp.title}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Circuit Canvas ──────────────────── */}
            <CircuitCanvas mode={mode} experiment={currentExperiment} />
        </main>
    );
}

export default function PhysicsLabPage() {
    return (
        <Suspense
            fallback={
                <main className="flex items-center justify-center min-h-screen">
                    <p className="text-slate-500">Loading lab...</p>
                </main>
            }
        >
            <PhysicsLabInner />
        </Suspense>
    );
}
