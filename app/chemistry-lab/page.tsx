"use client";

import "./chem-effects.css";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthWall } from "@/components/auth/AuthWall";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { OptionButton } from "@/components/ui/OptionButton";
import { ExperimentPicker } from "@/components/lab/ExperimentPicker";
import { ExperimentGuide } from "@/components/lab/ExperimentGuide";
import { ReactionResult } from "@/components/lab/ReactionResult";
import { LabNotebook, type LogEntry } from "@/components/lab/LabNotebook";
import { LabBench } from "@/components/chem-lab/LabBench";
import { MobileDisclaimer } from "@/components/chem-lab/MobileDisclaimer";
import type { ChemicalInfo } from "@/lib/chemical-facts-types";
import type { Experiment } from "@/lib/experiments";
import type { Reaction } from "@/lib/reactions";

type LabMode = "free" | "guided";

interface LabAPIResponse {
  reaction: Reaction | null;
  explanation?: string;
  concept?: string;
  whyItHappens?: string;
  realLifeExample?: string;
  error?: string;
}

interface ExperimentsAPIResponse {
  experiments?: Experiment[];
  error?: string;
}

interface ChemicalsAPIResponse {
  chemicals?: string[];
  error?: string;
}

interface FactsAPIResponse {
  facts?: Record<string, ChemicalInfo>;
  error?: string;
}

interface ReactionState {
  reaction: Reaction | null;
  explanation?: string;
  concept?: string;
  whyItHappens?: string;
  realLifeExample?: string;
}

interface FreeQuiz {
  question: string;
  options: [string, string];
  correctIndex: 0 | 1;
}

function buildFallback(chemA: string, chemB: string, reaction: Reaction | null): ReactionState {
  return {
    reaction,
    concept: reaction?.category,
    explanation: reaction
      ? `${reaction.reactantA} reacts with ${reaction.reactantB}. Equation: ${reaction.equation}. Products: ${reaction.products}.`
      : `${chemA} and ${chemB} do not react under normal class-lab conditions.`,
  };
}

function buildFreeQuiz(reaction: Reaction | null): FreeQuiz {
  if (!reaction) {
    return {
      question: "What is the most accurate lab conclusion?",
      options: ["A reaction happened and formed clear products", "No observable reaction occurred for this pair"],
      correctIndex: 1,
    };
  }

  return {
    question: "What best describes the outcome of this mix?",
    options: [`It is a ${reaction.category} reaction`, "There was no reaction between the chemicals"],
    correctIndex: 0,
  };
}

let sessionEntryCounter = 0;

export default function ChemistryLabPage() {
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<LabMode>("guided");
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState<{ type: "correct" | "wrong"; message: string } | null>(null);

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [chemicals, setChemicals] = useState<string[]>([]);
  const [chemicalFacts, setChemicalFacts] = useState<Record<string, ChemicalInfo>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReactionState | null>(null);
  const [mixedChemicals, setMixedChemicals] = useState<{ chemicalA: string; chemicalB: string } | null>(null);
  const [showFreeQuiz, setShowFreeQuiz] = useState(false);
  const [freeQuizChoice, setFreeQuizChoice] = useState<number | null>(null);

  const [sessionLog, setSessionLog] = useState<LogEntry[]>([]);
  const [showNotebook, setShowNotebook] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadChemistryData() {
      setDataLoading(true);
      setDataError("");

      try {
        const { getAuthHeaders } = await import("@/lib/auth-client");
        const authHeaders = await getAuthHeaders();
        const [experimentsRes, chemicalsRes, factsRes] = await Promise.all([
          fetch("/api/chemistry/experiments", { headers: authHeaders }),
          fetch("/api/chemistry/chemicals", { headers: authHeaders }),
          fetch("/api/chemistry/facts", { headers: authHeaders }),
        ]);

        const experimentsData: ExperimentsAPIResponse = await experimentsRes.json();
        const chemicalsData: ChemicalsAPIResponse = await chemicalsRes.json();
        const factsData: FactsAPIResponse = await factsRes.json();

        if (!experimentsRes.ok) {
          throw new Error(experimentsData.error ?? "Failed to load experiments");
        }
        if (!chemicalsRes.ok) {
          throw new Error(chemicalsData.error ?? "Failed to load chemicals");
        }
        if (cancelled) return;
        setExperiments(experimentsData.experiments ?? []);
        setChemicals(chemicalsData.chemicals ?? []);
        setChemicalFacts(factsRes.ok ? (factsData.facts ?? {}) : {});
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load chemistry data";
        setDataError(message);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }

    void loadChemistryData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeExperiment) return;
    const stillExists = experiments.some((experiment) => experiment.id === activeExperiment.id);
    if (!stillExists) {
      setActiveExperiment(null);
      setGuidedStep(0);
      setGuidedFeedback(null);
    }
  }, [activeExperiment, experiments]);

  const handleMix = useCallback(async (chemicalA: string, chemicalB: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setMixedChemicals({ chemicalA, chemicalB });
    setShowFreeQuiz(false);
    setFreeQuizChoice(null);

    try {
      const { getAuthHeaders } = await import("@/lib/auth-client");
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ chemicalA, chemicalB }),
      });
      const data: LabAPIResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        const state = buildFallback(chemicalA, chemicalB, null);
        setResult(state);
        addToLog(chemicalA, chemicalB, state.reaction, state.concept);
      } else {
        const state: ReactionState = {
          reaction: data.reaction,
          explanation: data.explanation,
          concept: data.concept,
          whyItHappens: data.whyItHappens,
          realLifeExample: data.realLifeExample,
        };
        setResult(state);
        addToLog(chemicalA, chemicalB, state.reaction, state.concept);
      }
    } catch {
      setError("Failed to connect to API");
      const state = buildFallback(chemicalA, chemicalB, null);
      setResult(state);
      addToLog(chemicalA, chemicalB, state.reaction, state.concept);
    } finally {
      setLoading(false);
    }
  }, []);

  function addToLog(chemA: string, chemB: string, reaction: Reaction | null, concept?: string) {
    sessionEntryCounter += 1;
    const entry: LogEntry = {
      id: `entry-${sessionEntryCounter}`,
      chemicalA: chemA,
      chemicalB: chemB,
      reaction,
      concept,
      timestamp: Date.now(),
    };
    setSessionLog((prev) => [entry, ...prev]);
  }

  const handleReset = useCallback(() => {
    setResult(null);
    setError("");
    setMixedChemicals(null);
    setShowFreeQuiz(false);
    setFreeQuizChoice(null);
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

  const onGuidedCorrect = useCallback(() => {
    setGuidedFeedback({ type: "correct", message: "Correct! Well done." });
    window.setTimeout(() => {
      setGuidedStep((prev) => prev + 1);
      setGuidedFeedback(null);
    }, 1200);
  }, []);

  const onGuidedWrong = useCallback((droppedChemical?: string) => {
    setGuidedFeedback({
      type: "wrong",
      message: droppedChemical
        ? `That's ${droppedChemical.replace(/ \(.+\)$/, "")} - not what's needed here. Check the hint!`
        : "Not quite - try again.",
    });
  }, []);

  const reactionDone = !loading && result !== null;
  const isGuidedActive = mode === "guided" && activeExperiment !== null;
  const freeQuiz = buildFreeQuiz(result?.reaction ?? null);
  const isFreeQuizCorrect = freeQuizChoice === freeQuiz.correctIndex;

  const handleOpenFreeQuiz = useCallback(() => {
    setShowFreeQuiz(true);
    setFreeQuizChoice(null);
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-slate-600">Checking your student session...</p>
      </main>
    );
  }

  if (!user) {
    return <AuthWall title="Student Login Required" message="Log in to access the chemistry lab." />;
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,#fff4e6,transparent_60%),linear-gradient(180deg,#f7fbff,#fdf4e2_55%,#eef6ff)] px-4 py-4 sm:px-6 sm:py-5 flex flex-col items-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="chemistry-nav-btn">
            Back to AI Tutor
          </Link>
          <button
            onClick={() => setShowNotebook((p) => !p)}
            className="chemistry-nav-btn"
            aria-label="Toggle lab notebook"
          >
            {sessionLog.length > 0 ? `Notebook (${sessionLog.length})` : "Notebook"}
          </button>
        </div>

        <MobileDisclaimer />

        <div className="text-center mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Chemistry Reaction Lab
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mix chemicals, observe reactions, and learn the science behind them.
          </p>
        </div>

        {showNotebook && (
          <div className="mb-4">
            <LabNotebook entries={sessionLog} />
          </div>
        )}

        <div className="mb-3 flex justify-center">
          <div className="flex rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-sm backdrop-blur-sm">
            <button
              onClick={handleSwitchToFree}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${mode === "free" ? "bg-sky-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Free Mix
            </button>
            <button
              onClick={handleSwitchToGuided}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${mode === "guided" ? "bg-sky-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Guided
            </button>
          </div>
        </div>

        {mode === "guided" && !activeExperiment && (
          dataLoading ? (
            <Card variant="subtle" padding="md" className="text-sm text-slate-500 text-center">
              Loading experiments from Firestore...
            </Card>
          ) : experiments.length > 0 ? (
            <ExperimentPicker
              experiments={experiments}
              onSelect={handleSelectExperiment}
              onBackToFree={handleSwitchToFree}
            />
          ) : (
            <Alert variant="warning">No experiments found in Firestore.</Alert>
          )
        )}

        {isGuidedActive && activeExperiment && (
          <div className="mt-2 grid gap-3 lg:items-stretch lg:grid-cols-[minmax(290px,330px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-3">
              <ExperimentGuide
                experiment={activeExperiment}
                currentStep={guidedStep}
                totalSteps={activeExperiment.steps.length}
                feedback={guidedFeedback}
                reactionDone={reactionDone}
                onQuit={handleQuitExperiment}
              />
            </div>
            <div className="h-full">
              <LabBench
                chemicals={chemicals}
                chemicalFacts={chemicalFacts}
                onMix={handleMix}
                reaction={result?.reaction ?? null}
                isLoading={loading}
                onReset={handleReset}
                mode={mode}
                experiment={activeExperiment}
                guidedStep={guidedStep}
                onGuidedCorrect={onGuidedCorrect}
                onGuidedWrong={onGuidedWrong}
              />
            </div>
          </div>
        )}

        {mode === "free" && (
          <div className="mt-2">
            <LabBench
              chemicals={chemicals}
              chemicalFacts={chemicalFacts}
              onMix={handleMix}
              reaction={result?.reaction ?? null}
              isLoading={loading}
              onReset={handleReset}
              mode={mode}
              experiment={activeExperiment}
              guidedStep={guidedStep}
              onGuidedCorrect={onGuidedCorrect}
              onGuidedWrong={onGuidedWrong}
            />
          </div>
        )}

        {dataError && (
          <Alert variant="error" className="mt-4">
            {dataError}
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}

        {result && !loading && (
          <div className="mt-4">
            <ReactionResult
              reaction={result.reaction}
              explanation={result.explanation}
              concept={result.concept}
              whyItHappens={result.whyItHappens}
              realLifeExample={result.realLifeExample}
              chemicalA={mixedChemicals?.chemicalA ?? ""}
              chemicalB={mixedChemicals?.chemicalB ?? ""}
              chapterId={activeExperiment?.chapterId}
              chapterName={activeExperiment?.chapterName}
              showQuizButton={mode === "free"}
              onTestYourself={mode === "free" ? handleOpenFreeQuiz : undefined}
            />
          </div>
        )}

        {mode === "free" && result && showFreeQuiz && (
          <Card variant="subtle" padding="md" className="mt-3">
            <p className="text-sm font-semibold text-slate-700">Quick Check</p>
            <p className="text-sm text-slate-600 mt-1">{freeQuiz.question}</p>
            <div className="mt-3 grid gap-2">
              {freeQuiz.options.map((option, index) => (
                <OptionButton
                  key={option}
                  label={String.fromCharCode(65 + index)}
                  text={option}
                  isSelected={freeQuizChoice === index}
                  isCorrect={index === freeQuiz.correctIndex}
                  showResult={freeQuizChoice !== null}
                  onClick={() => setFreeQuizChoice(index)}
                  disabled={freeQuizChoice !== null}
                />
              ))}
            </div>
            {freeQuizChoice !== null && (
              <Alert variant={isFreeQuizCorrect ? "success" : "error"} className="mt-3">
                {isFreeQuizCorrect ? "Correct. Nice observation." : "Not quite. Review the reaction result and try again."}
              </Alert>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
