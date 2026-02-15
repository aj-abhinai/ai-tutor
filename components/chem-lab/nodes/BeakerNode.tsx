"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function BeakerNodeComponent({ data, selected }: NodeProps) {
    const phase = String(data.phase ?? "idle");
    const liquidColor = String(data.liquidColor ?? "#dbeafe");
    const liquidLevel = Number(data.liquidLevel ?? 0);
    const heatType = String(data.heatType ?? "none");
    const hasBubbles = Boolean(data.hasBubbles);
    const hasPrecipitate = Boolean(data.hasPrecipitate);
    const hasSmoke = Boolean(data.hasSmoke);
    const inputsUsed = Number(data.inputsUsed ?? 0);

    const phaseLabel =
        phase === "idle" && inputsUsed === 0
            ? "Drag chemicals here"
            : phase === "idle" && inputsUsed === 1
                ? "Add one more…"
                : phase === "pouring"
                    ? "Pouring…"
                    : phase === "reacting"
                        ? "Mixing…"
                        : phase === "done"
                            ? "Reaction Complete!"
                            : "";

    const glowClass =
        heatType === "exothermic"
            ? " beaker-exo"
            : heatType === "endothermic"
                ? " beaker-endo"
                : phase === "done"
                    ? " beaker-done"
                    : "";

    return (
        <div className={`rf-beaker-node${glowClass}${selected ? " selected" : ""}`}>
            {/* Input handles — two targets for reactant A and B */}
            <Handle
                type="target"
                position={Position.Left}
                id="beaker-in-0"
                className="rf-chem-handle rf-beaker-handle-top"
                title="Reactant A"
                style={{ top: "35%" }}
            />
            <Handle
                type="target"
                position={Position.Left}
                id="beaker-in-1"
                className="rf-chem-handle rf-beaker-handle-bottom"
                title="Reactant B"
                style={{ top: "65%" }}
            />

            {/* Beaker body */}
            <div className="rf-beaker-body">
                {/* Measurement lines */}
                <div className="rf-beaker-lines">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="rf-beaker-line" />
                    ))}
                </div>

                {/* Liquid fill */}
                <div
                    className={`rf-beaker-liquid${phase === "reacting" ? " reacting" : ""}`}
                    style={{
                        height: `${liquidLevel}%`,
                        backgroundColor: liquidColor,
                        opacity: liquidLevel > 0 ? 0.85 : 0,
                    }}
                />

                {/* Particle effects */}
                {hasBubbles && (
                    <div className="rf-beaker-particles">
                        {[...Array(6)].map((_, i) => (
                            <span key={`b${i}`} className="rf-beaker-bubble" style={{
                                left: `${15 + Math.random() * 70}%`,
                                animationDelay: `${i * 0.3}s`,
                                animationDuration: `${1.5 + Math.random() * 1}s`,
                            }} />
                        ))}
                    </div>
                )}

                {hasPrecipitate && (
                    <div className="rf-beaker-particles">
                        {[...Array(4)].map((_, i) => (
                            <span key={`p${i}`} className="rf-beaker-precipitate" style={{
                                left: `${20 + Math.random() * 60}%`,
                                animationDelay: `${i * 0.4}s`,
                            }} />
                        ))}
                    </div>
                )}

                {hasSmoke && (
                    <div className="rf-beaker-particles rf-beaker-smoke-zone">
                        {[...Array(4)].map((_, i) => (
                            <span key={`s${i}`} className="rf-beaker-smoke" style={{
                                left: `${25 + Math.random() * 50}%`,
                                animationDelay: `${i * 0.5}s`,
                            }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Phase label */}
            <div className={`rf-beaker-phase ${phase}`}>
                {phaseLabel}
            </div>

            {/* Output handle — to product */}
            <Handle
                type="source"
                position={Position.Right}
                id="beaker-out"
                className="rf-chem-handle"
                title="Products"
            />
        </div>
    );
}

export const BeakerNode = memo(BeakerNodeComponent);
