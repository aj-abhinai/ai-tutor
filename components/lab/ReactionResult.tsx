"use client";

/**
 * ReactionResult.tsx — Shows the outcome of a reaction.
 * Layer: lab-shared. Uses global Card, Badge, Button.
 *
 * Improvements vs old version:
 * - Displays new AI fields: concept, whyItHappens, realLifeExample
 * - Chapter deep-link to the tutor
 * - KaTeX equation rendering via dangerouslySetInnerHTML (katex.renderToString is safe here)
 * - "Test Yourself" button in free mode
 */

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { type Reaction } from "@/lib/reactions";
import { buildSimulationPlan } from "@/lib/simulation-engine";

export interface ReactionResultProps {
    reaction: Reaction | null;
    explanation?: string;
    concept?: string;
    whyItHappens?: string;
    realLifeExample?: string;
    chemicalA: string;
    chemicalB: string;
    // Optional — guided experiments only
    chapterId?: string;
    chapterName?: string;
    // Free mode
    showQuizButton?: boolean;
    onTestYourself?: () => void;
}

export function ReactionResult({
    reaction,
    explanation,
    concept,
    whyItHappens,
    realLifeExample,
    chemicalA,
    chemicalB,
    chapterId,
    chapterName,
    showQuizButton,
    onTestYourself,
}: ReactionResultProps) {
    const plan = useMemo(() => buildSimulationPlan(reaction), [reaction]);
    const [equationHtml, setEquationHtml] = useState<string | null>(null);

    // Render KaTeX equation lazily on change — safe static HTML.
    useEffect(() => {
        let cancelled = false;
        if (!reaction?.equation) {
            setEquationHtml(null);
            return () => {
                cancelled = true;
            };
        }

        import("katex")
            .then((katex) => {
                if (cancelled) return;
                const html = katex.default.renderToString(
                    reaction.equation
                        .replace(/→/g, "\\to")
                        .replace(/₀/g, "_0").replace(/₁/g, "_1")
                        .replace(/₂/g, "_2").replace(/₃/g, "_3")
                        .replace(/₄/g, "_4").replace(/₅/g, "_5")
                        .replace(/₆/g, "_6").replace(/₇/g, "_7")
                        .replace(/₈/g, "_8").replace(/₉/g, "_9"),
                    { throwOnError: false, displayMode: false }
                );
                setEquationHtml(html);
            })
            .catch(() => {
                if (!cancelled) setEquationHtml(null);
            });

        return () => {
            cancelled = true;
        };
    }, [reaction?.equation]);

    return (
        <div className="reaction-result" aria-live="polite" aria-label="Reaction result">
            {/* Observation badges */}
            <Card variant="highlight" padding="md">
                {reaction ? (
                    <>
                        <div className="reaction-result-badges">
                            {plan.badges.colorChange && <Badge variant="indigo">🎨 Colour Change</Badge>}
                            {plan.badges.gasReleased && <Badge variant="teal">💨 Gas Produced</Badge>}
                            {plan.badges.precipitate && <Badge variant="gray">⚗️ Precipitate</Badge>}
                            {plan.effects.heat === "exothermic" && <Badge variant="amber">🔥 Exothermic</Badge>}
                            {plan.effects.heat === "endothermic" && <Badge variant="sky">❄️ Endothermic</Badge>}
                        </div>
                        <p className="reaction-result-category">{reaction.category}</p>
                    </>
                ) : (
                    <div className="reaction-result-none">
                        <Badge variant="gray">No Reaction</Badge>
                        <p className="reaction-result-category">
                            {chemicalA} + {chemicalB} → No observable change
                        </p>
                    </div>
                )}
            </Card>

            {/* Concept + AI explanation */}
            {(concept || explanation) && (
                <Card variant="default" padding="md" className="reaction-result-explain">
                    {concept && (
                        <p className="reaction-result-concept">🔬 {concept}</p>
                    )}
                    {explanation && (
                        <p className="reaction-result-explanation">{explanation}</p>
                    )}
                    {whyItHappens && (
                        <div className="reaction-result-why">
                            <span className="reaction-result-why-label">Why it happens:</span>
                            <p>{whyItHappens}</p>
                        </div>
                    )}
                    {realLifeExample && (
                        <div className="reaction-result-example">
                            <span className="reaction-result-example-label">🏠 Real life:</span>
                            <p>{realLifeExample}</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Balanced equation */}
            {reaction && (
                <Card variant="subtle" padding="sm" className="reaction-result-equation-card">
                    <p className="reaction-result-equation-label">Balanced Equation</p>
                    {equationHtml ? (
                        <div
                            className="reaction-result-equation-katex"
                            // KaTeX output is safe static HTML — no user input involved
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: equationHtml }}
                        />
                    ) : (
                        <p className="reaction-result-equation-text">{reaction.equation}</p>
                    )}
                    <p className="reaction-result-products">Products: {reaction.products}</p>
                </Card>
            )}

            {/* Chapter deep-link */}
            {chapterId && chapterName && (
                <a
                    href={`/?chapter=${chapterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reaction-result-chapter-link"
                >
                    📖 Study "{chapterName}" in the Tutor →
                </a>
            )}

            {/* Free mode: optional Test Yourself button */}
            {showQuizButton && onTestYourself && (
                <Button variant="secondary" size="sm" onClick={onTestYourself}>
                    🧠 Test Yourself
                </Button>
            )}
        </div>
    );
}
