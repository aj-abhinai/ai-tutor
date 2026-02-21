"use client";

/**
 * ChemicalShelf.tsx
 * A grid of chemical bottles displayed as clickable buttons.
 * Uses the global Button for disabled/enabled state; chemistry-specific SVG bottle visual.
 *
 * Layer: chem-lab (chemistry-specific), uses global Button.
 */

import { memo, useCallback, useMemo } from "react";
import type { ChemicalInfo } from "@/lib/chemical-facts-types";
import { type Experiment } from "@/lib/experiments";

interface ChemicalShelfProps {
    chemicals: string[];
    chemicalFacts?: Record<string, ChemicalInfo>;
    addedNames: string[];
    onAdd: (name: string) => void;
    isDisabled: boolean;               // true while reacting / done
    experiment?: Experiment | null;    // guided mode: highlight expected chemicals
    guidedStep?: number;
}

// Simple colour palette cycling for bottle visuals
const BOTTLE_COLORS = [
    "#38bdf8", "#34d399", "#fb923c", "#a78bfa", "#f472b6",
    "#fbbf24", "#60a5fa", "#4ade80", "#f87171", "#818cf8",
];
const GUIDED_VISIBLE_COUNT = 10;

function getBottleColor(index: number): string {
    return BOTTLE_COLORS[index % BOTTLE_COLORS.length];
}

function stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function ChemicalShelfComponent({
    chemicals,
    chemicalFacts = {},
    addedNames,
    onAdd,
    isDisabled,
    experiment,
    guidedStep = 0,
}: ChemicalShelfProps) {
    const expectedChemical = experiment?.steps[guidedStep]?.expectedChemical;
    const visibleChemicals = useMemo(() => {
        if (!experiment) return chemicals;

        const expected = Array.from(
            new Set(
                experiment.steps
                    .map((step) => step.expectedChemical)
                    .filter((name) => chemicals.includes(name))
            )
        );

        const extrasNeeded = Math.max(0, GUIDED_VISIBLE_COUNT - expected.length);
        const extras = chemicals
            .filter((name) => !expected.includes(name))
            .map((name) => ({ name, score: stableHash(`${experiment.id}:${name}`) }))
            .sort((a, b) => a.score - b.score)
            .slice(0, extrasNeeded)
            .map((item) => item.name)
            .sort((a, b) => a.localeCompare(b));

        return [...expected, ...extras];
    }, [chemicals, experiment]);

    const handleClick = useCallback(
        (name: string) => {
            if (!isDisabled && !addedNames.includes(name)) {
                onAdd(name);
            }
        },
        [isDisabled, addedNames, onAdd]
    );

    return (
        <div className={`chem-shelf${experiment ? " is-guided" : ""}`} role="list" aria-label="Chemical shelf">
            <div className="chem-shelf-header">
                <span className="chem-shelf-title">🧪 Reagents</span>
                <span className="chem-shelf-count">
                    {experiment
                        ? `${visibleChemicals.length} shown · ${chemicals.length} total`
                        : `${chemicals.length} available`}
                </span>
            </div>
            <div className="chem-shelf-grid">
                {visibleChemicals.map((name, idx) => {
                    const isAdded = addedNames.includes(name);
                    const isExpected = name === expectedChemical;
                    const disabled = isAdded || isDisabled;
                    const color = getBottleColor(idx);
                    const info = chemicalFacts[name];

                    return (
                        <button
                            key={name}
                            role="listitem"
                            aria-label={`Add ${name}`}
                            aria-pressed={isAdded}
                            onClick={() => handleClick(name)}
                            disabled={disabled}
                            className={[
                                "chem-shelf-bottle",
                                isAdded ? "is-added" : "",
                                isExpected ? "is-expected" : "",
                                !isAdded && isDisabled ? "is-disabled" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                        >
                            {/* Expected pulse badge */}
                            {isExpected && !isAdded && (
                                <span className="shelf-expected-badge" aria-label="Expected next">
                                    ✦
                                </span>
                            )}

                            {/* Bottle visual */}
                            <div className="shelf-bottle-jar" aria-hidden>
                                <div className="shelf-bottle-neck" style={{ background: color }} />
                                <div className="shelf-bottle-body">
                                    <div
                                        className="shelf-bottle-liquid"
                                        style={{ background: color }}
                                    />
                                </div>
                            </div>

                            {/* Label */}
                            <span className="shelf-bottle-name" title={name}>
                                {name.replace(/ \(.+\)$/, "")}
                            </span>
                            <span className="shelf-bottle-formula">
                                {name.match(/\(([^)]+)\)/)?.at(1) ?? ""}
                            </span>
                            {info?.fact && (
                                <span className="shelf-bottle-fact" title={info.fact}>
                                    {info.fact}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export const ChemicalShelf = memo(ChemicalShelfComponent);
