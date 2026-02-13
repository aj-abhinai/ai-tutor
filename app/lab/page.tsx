"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert, Button, StatusCard } from "@/components/ui";
import { LabHeader } from "@/components/lab/LabHeader";
import { ChemicalPicker } from "@/components/lab/ChemicalPicker";
import { ReactionResult } from "@/components/lab/ReactionResult";
import { getChemicalsList, getDefaultReactionPair } from "@/lib/reaction-engine";
import type { Reaction } from "@/lib/reactions";

interface LabAPIResponse {
    reaction: Reaction | null;
    explanation: string;
    error?: string;
}

export default function LabPage() {
    const chemicals = useMemo(() => getChemicalsList(), []);
    const defaultPair = useMemo(() => getDefaultReactionPair(), []);
    const chemicalOptions = useMemo(
        () => chemicals.map((chemical) => ({ value: chemical, label: chemical })),
        [chemicals]
    );

    const [chemicalA, setChemicalA] = useState(defaultPair?.chemicalA ?? "");
    const [chemicalB, setChemicalB] = useState(defaultPair?.chemicalB ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<{
        reaction: Reaction | null;
        explanation: string;
    } | null>(null);

    const canMix =
        chemicalA.trim().length > 0 &&
        chemicalB.trim().length > 0 &&
        chemicalA !== chemicalB;

    const handleMix = async () => {
        if (!canMix || loading) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/lab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chemicalA: chemicalA.trim(),
                    chemicalB: chemicalB.trim(),
                }),
            });
            const data: LabAPIResponse = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
            } else {
                setResult({
                    reaction: data.reaction,
                    explanation: data.explanation,
                });
            }
        } catch {
            setError("Failed to connect to API");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setChemicalA("");
        setChemicalB("");
        setResult(null);
        setError("");
    };

    return (
        <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,#ede9fe,transparent_60%),linear-gradient(180deg,#f7fbff,#f3e8ff_55%,#ede9fe)] px-6 py-8 flex flex-col items-center">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-fuchsia-200/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
            </div>

            <div className="relative w-full max-w-lg">
                <div className="mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(109,40,217,0.25)] hover:bg-violet-700 transition-colors"
                    >
                        Back to AI Tutor
                    </Link>
                </div>

                <LabHeader />

                <ChemicalPicker
                    options={chemicalOptions}
                    chemicalA={chemicalA}
                    chemicalB={chemicalB}
                    onChemicalAChange={setChemicalA}
                    onChemicalBChange={setChemicalB}
                    onMix={handleMix}
                    loading={loading}
                    disabled={!canMix}
                />

                {error && (
                    <Alert variant="error" className="mt-4">
                        {error}
                    </Alert>
                )}

                {loading && (
                    <StatusCard className="mt-6" message="Mixing chemicals and generating explanation..." />
                )}

                {result && !loading && (
                    <>
                        <ReactionResult
                            reaction={result.reaction}
                            explanation={result.explanation}
                            chemicalA={chemicalA}
                            chemicalB={chemicalB}
                        />
                        <div className="mt-6 text-center">
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                Try Another Mix
                            </Button>
                        </div>
                    </>
                )}

                {!result && !loading && !error && (
                    <StatusCard
                        className="mt-6 text-slate-500"
                        message="Select two chemicals above and click Mix to see what happens."
                    />
                )}
            </div>
        </main>
    );
}
