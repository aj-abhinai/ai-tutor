"use client";

import "./circuit-effects.css";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthWall } from "@/components/auth/AuthWall";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { TextLink } from "@/components/ui/TextLink";
import type { ChapterLab, CircuitExperiment } from "@/lib/physics-lab-types";

type LabMode = "free" | "guided";

const CircuitCanvas = dynamic(
  () => import("@/components/circuit-lab/CircuitCanvas").then((m) => m.CircuitCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-surface/70 px-4 py-8 text-center text-text-muted">
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
  const [activeExperiment, setActiveExperiment] = useState<CircuitExperiment | null>(null);

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
        const res = await fetch(`/api/physics/chapter-lab?chapterId=${encodeURIComponent(chapterId)}`, {
          headers: authHeaders,
        });
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
          setLabError(err instanceof Error ? err.message : "Failed to load physics lab");
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

  const experiments = chapterLab?.experiments ?? [];
  const currentExperiment = mode === "guided" ? activeExperiment ?? experiments[0] ?? null : null;

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-text-muted">Checking your student session...</p>
      </main>
    );
  }

  if (!user) {
    return <AuthWall title="Student Login Required" message="Log in to access the physics lab." />;
  }

  if (labLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-text-muted">Loading physics lab...</p>
      </main>
    );
  }

  if (!chapterLab) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-text">No Lab Available</h1>
        <p className="mb-6 text-text-muted">{labError || "This chapter does not have lab experiments yet."}</p>
        <LinkButton href="/" variant="primary" size="md">
          Back to Lessons
        </LinkButton>
      </main>
    );
  }

  return (
    <main className="lab-bg-physics min-h-screen px-4 py-6">
      <div className="mx-auto mb-4 max-w-5xl">
        <TextLink href="/" className="text-sm font-medium">
          Back to Lessons
        </TextLink>
        <h1 className="mt-2 text-2xl font-extrabold text-text">Physics Lab</h1>
        <p className="text-sm text-text-muted">{chapterLab.chapterTitle}</p>
      </div>

      <div className="mx-auto mb-4 flex max-w-5xl gap-2">
        <SegmentedControl
          value={mode}
          options={[
            { value: "guided", label: "Guided" },
            { value: "free", label: "Free Build" },
          ]}
          onChange={(nextMode) => setMode(nextMode)}
        />
      </div>

      {mode === "guided" && experiments.length > 1 && (
        <div className="mx-auto mb-4 flex max-w-5xl flex-wrap gap-2">
          {experiments.map((exp) => (
            <Button
              key={exp.id}
              onClick={() => setActiveExperiment(exp)}
              variant={currentExperiment?.id === exp.id ? "accent" : "outline"}
              size="sm"
              className={currentExperiment?.id === exp.id ? "" : "text-text-muted"}
            >
              {exp.title}
            </Button>
          ))}
        </div>
      )}

      <CircuitCanvas mode={mode} experiment={currentExperiment} />
    </main>
  );
}

export default function PhysicsLabPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-text-muted">Loading lab...</p>
        </main>
      }
    >
      <PhysicsLabInner />
    </Suspense>
  );
}
