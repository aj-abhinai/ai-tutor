"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { StatusCard } from "@/components/ui/StatusCard";
import { LabHeader } from "@/components/lab/LabHeader";
import { LabCanvas } from "@/components/lab/LabCanvas";
import { ReactionResult } from "@/components/lab/ReactionResult";
import { ExperimentPicker } from "@/components/lab/ExperimentPicker";
import { ExperimentGuide } from "@/components/lab/ExperimentGuide";
import { findReaction, getChemicalsList } from "@/lib/reaction-engine";
import EXPERIMENTS from "@/lib/experiments";
import type { Experiment } from "@/lib/experiments";
import type { Reaction } from "@/lib/reactions";

type LabMode = "free" | "guided";

interface LabAPIResponse {
  reaction: Reaction | null;
  explanation: string;
  error?: string;
}

function buildFallbackExplanation(
  chemicalA: string,
  chemicalB: string,
  reaction: Reaction | null
): string {
  if (reaction) {
    return `${reaction.reactantA} reacts with ${reaction.reactantB}. Balanced equation: ${reaction.equation}. Products: ${reaction.products}.`;
  }
  return `${chemicalA} and ${chemicalB} do not show a clear reaction under normal class-lab conditions.`;
}

export default function LabPage() {
  const chemicals = useMemo(() => getChemicalsList(), []);

  // Keep Guided selected by default.
  const [mode, setMode] = useState<LabMode>("guided");

  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState<{
    type: "correct" | "wrong";
    message: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    reaction: Reaction | null;
    explanation: string;
  } | null>(null);
  const [mixedChemicals, setMixedChemicals] = useState<{
    chemicalA: string;
    chemicalB: string;
  } | null>(null);

  const handleMix = useCallback(async (chemicalA: string, chemicalB: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setMixedChemicals({ chemicalA, chemicalB });

    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chemicalA, chemicalB }),
      });
      const data: LabAPIResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        const fallbackReaction = findReaction(chemicalA, chemicalB);
        setResult({
          reaction: fallbackReaction,
          explanation: buildFallbackExplanation(chemicalA, chemicalB, fallbackReaction),
        });
      } else {
        setResult({
          reaction: data.reaction,
          explanation: data.explanation,
        });
      }
    } catch {
      setError("Failed to connect to API");
      const fallbackReaction = findReaction(chemicalA, chemicalB);
      setResult({
        reaction: fallbackReaction,
        explanation: buildFallbackExplanation(chemicalA, chemicalB, fallbackReaction),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError("");
    setMixedChemicals(null);
  }, []);

  const handleSelectExperiment = useCallback(
    (experiment: Experiment) => {
      setActiveExperiment(experiment);
      setGuidedStep(0);
      setGuidedFeedback(null);
      handleReset();
    },
    [handleReset]
  );

  const handleQuitExperiment = useCallback(() => {
    setActiveExperiment(null);
    setGuidedStep(0);
    setGuidedFeedback(null);
    handleReset();
  }, [handleReset]);

  const guidedStepProp = useMemo(() => {
    if (mode !== "guided" || !activeExperiment) return null;

    const step = activeExperiment.steps[guidedStep];
    if (!step) return null;

    return {
      expectedChemical: step.expectedChemical,
      onCorrectDrop: () => {
        setGuidedFeedback({ type: "correct", message: "Correct. Well done." });
        window.setTimeout(() => {
          setGuidedStep((prev) => prev + 1);
          setGuidedFeedback(null);
        }, 1200);
      },
      onWrongDrop: (droppedChemical: string) => {
        setGuidedFeedback({
          type: "wrong",
          message: `That is ${droppedChemical} and not the expected bottle. Try another one.`,
        });
        window.setTimeout(() => setGuidedFeedback(null), 3000);
      },
    };
  }, [mode, activeExperiment, guidedStep]);

  const handleSwitchToGuided = useCallback(() => {
    setMode("guided");
    handleReset();
  }, [handleReset]);

  const handleSwitchToFree = useCallback(() => {
    setMode("free");
    setActiveExperiment(null);
    setGuidedStep(0);
    setGuidedFeedback(null);
    handleReset();
  }, [handleReset]);

  const reactionDone = !loading && result !== null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff4e6,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf4e2_55%,#eef6ff)] px-4 py-6 sm:px-6 sm:py-8 flex flex-col items-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        <div className="mb-4">
          <Link href="/" className="chemistry-nav-btn">
            <span aria-hidden="true">{"\u2190"}</span>
            Back to AI Tutor
          </Link>
        </div>

        <LabHeader />

        {/* Mode selector below the header subheading */}
        <div className="mb-4 flex justify-center">
          <div className="flex rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-sm backdrop-blur-sm">
            <button
              onClick={handleSwitchToFree}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                mode === "free"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Free Mix
            </button>
            <button
              onClick={handleSwitchToGuided}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                mode === "guided"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Guided
            </button>
          </div>
        </div>

        {mode === "guided" && !activeExperiment && (
          <ExperimentPicker
            experiments={EXPERIMENTS}
            onSelect={handleSelectExperiment}
            onBackToFree={handleSwitchToFree}
          />
        )}

        {mode === "guided" && activeExperiment && (
          <ExperimentGuide
            experiment={activeExperiment}
            currentStep={guidedStep}
            totalSteps={activeExperiment.steps.length}
            feedback={guidedFeedback}
            reactionDone={reactionDone}
            onQuit={handleQuitExperiment}
          />
        )}

        {(mode === "free" || activeExperiment) && (
          <div className="mt-4">
            <LabCanvas
              chemicals={chemicals}
              onMix={handleMix}
              reaction={result?.reaction ?? null}
              isReacting={loading}
              onReset={handleReset}
              guidedStep={guidedStepProp}
            />
          </div>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}

        {loading && (
          <StatusCard className="mt-6" message="Mixing chemicals and generating explanation..." />
        )}

        {result && !loading && (
          <ReactionResult
            reaction={result.reaction}
            explanation={result.explanation}
            chemicalA={mixedChemicals?.chemicalA ?? ""}
            chemicalB={mixedChemicals?.chemicalB ?? ""}
          />
        )}

        {mode === "free" && !result && !loading && !error && (
          <StatusCard
            className="mt-5 text-slate-600"
            message="Drag two chemicals into the beaker to run an experiment."
          />
        )}
      </div>
    </main>
  );
}
