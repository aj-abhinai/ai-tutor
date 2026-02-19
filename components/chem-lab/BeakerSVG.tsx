"use client";

/**
 * BeakerSVG.tsx
 * Animated SVG beaker. Uses CSS keyframe classes from chem-effects.css
 * and Framer Motion for the liquid fill and colour transition.
 *
 * Props:
 *   phase     — idle | pouring | reacting | done
 *   color     — CSS hex or named colour for the liquid
 *   level     — 0..100 liquid fill percentage
 *   hasBubbles, hasPrecipitate, hasSmoke — particle effects
 *   heatType  — "exothermic" | "endothermic" | "none"
 */

import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";

export type ChemPhase = "idle" | "pouring" | "reacting" | "done";

interface BeakerSVGProps {
    phase?: ChemPhase;
    color?: string;
    level?: number;           // 0–100
    hasBubbles?: boolean;
    hasPrecipitate?: boolean;
    hasSmoke?: boolean;
    heatType?: "exothermic" | "endothermic" | "none";
    label?: string;           // phase label override
}

// Fixed bubble/precipitate positions — stable across renders (no Math.random)
const BUBBLE_POSITIONS = [15, 28, 42, 57, 70, 83];
const PRECIP_POSITIONS = [20, 35, 50, 65];
const SMOKE_POSITIONS = [28, 44, 60];

function BeakerSVGComponent({
    phase = "idle",
    color = "#dbeafe",
    level = 0,
    hasBubbles = false,
    hasPrecipitate = false,
    hasSmoke = false,
    heatType = "none",
    label,
}: BeakerSVGProps) {
    const glowColor =
        heatType === "exothermic" ? "rgba(251,191,36,0.35)"
            : heatType === "endothermic" ? "rgba(129,140,248,0.35)"
                : phase === "done" ? "rgba(74,222,128,0.2)"
                    : "transparent";

    const borderColor =
        heatType === "exothermic" ? "#fbbf24"
            : heatType === "endothermic" ? "#818cf8"
                : phase === "done" ? "#4ade80"
                    : "#bae6fd";

    const phaseLabel =
        label ??
        (phase === "idle" && level === 0 ? "Add chemicals to begin"
            : phase === "idle" && level > 0 ? "Add one more…"
                : phase === "pouring" ? "Pouring…"
                    : phase === "reacting" ? "Mixing…"
                        : phase === "done" ? "Reaction Complete!"
                            : "");

    return (
        <div className="beaker-svg-wrapper">
            {/* Smoke / gas rising above */}
            <AnimatePresence>
                {hasSmoke && (
                    <div className="beaker-smoke-zone" aria-hidden>
                        {SMOKE_POSITIONS.map((left, i) => (
                            <span
                                key={i}
                                className="beaker-smoke"
                                style={{ left: `${left}%`, animationDelay: `${i * 0.5}s` }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Main SVG beaker shape */}
            <div
                className="beaker-body"
                style={{
                    borderColor,
                    boxShadow: `0 0 32px ${glowColor}, 0 8px 24px rgba(0,0,0,0.06)`,
                }}
            >
                {/* Measurement ticks */}
                <div className="beaker-ticks" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="beaker-tick" />
                    ))}
                </div>

                {/* Liquid */}
                <motion.div
                    className={`beaker-liquid${phase === "reacting" ? " reacting" : ""}`}
                    animate={{
                        height: `${level}%`,
                        backgroundColor: color,
                        opacity: level > 0 ? 0.85 : 0,
                    }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                />

                {/* Bubbles */}
                {hasBubbles && (
                    <div className="beaker-particles" aria-hidden>
                        {BUBBLE_POSITIONS.map((left, i) => (
                            <span
                                key={i}
                                className="beaker-bubble"
                                style={{ left: `${left}%`, animationDelay: `${i * 0.28}s` }}
                            />
                        ))}
                    </div>
                )}

                {/* Precipitate */}
                {hasPrecipitate && (
                    <div className="beaker-particles" aria-hidden>
                        {PRECIP_POSITIONS.map((left, i) => (
                            <span
                                key={i}
                                className="beaker-precipitate"
                                style={{ left: `${left}%`, animationDelay: `${i * 0.4}s` }}
                            />
                        ))}
                    </div>
                )}

                {/* Spout / lip */}
                <div className="beaker-spout" aria-hidden />
            </div>

            {/* Phase label below beaker */}
            <motion.p
                key={phaseLabel}
                className={`beaker-label beaker-label--${phase}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
            >
                {phaseLabel}
            </motion.p>
        </div>
    );
}

export const BeakerSVG = memo(BeakerSVGComponent);
