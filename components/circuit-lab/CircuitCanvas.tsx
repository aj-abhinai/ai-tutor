"use client";

/**
 * CircuitCanvas — React Flow–based circuit builder.
 *
 * Replaces the old grid-based drag-and-drop with React Flow's
 * node-graph editor. Custom nodes render Battery, Bulb, Switch,
 * and LED components. Edges act as wires. The useCircuitFlow hook
 * bridges the graph state into CircuitEngine for simulation.
 */

import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCallback } from "react";
import {
    type ComponentType,
    COMPONENT_CATALOG,
    TRAY_ORDER,
} from "@/lib/circuit-components";
import type { CircuitExperiment } from "@/lib/physics-lab-types";

import { nodeTypes } from "./nodes";
import { useCircuitFlow } from "./useCircuitFlow";

// ── Types ─────────────────────────────────────────────────

interface CircuitCanvasProps {
    experiment?: CircuitExperiment | null;
    mode: "free" | "guided";
}

// Components available in the tray (wire excluded — edges are wires)
const TRAY_ITEMS = TRAY_ORDER.filter((t) => t !== "wire");

// ── Component ─────────────────────────────────────────────

export function CircuitCanvas({ experiment, mode }: CircuitCanvasProps) {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        isValidConnection,
        simResult,
        addComponent,
        toggleSwitch,
        removeNode,
        clearBoard,
        guidedStep,
        completedTips,
    } = useCircuitFlow({ experiment, mode });

    // ── Inject toggleSwitch callback into switch nodes ────
    const nodesWithCallbacks = nodes.map((node) => {
        if (node.type === "switch") {
            return {
                ...node,
                data: { ...node.data, onToggle: toggleSwitch },
            };
        }
        return node;
    });

    // ── Tray click handler ────────────────────────────────
    const handleTrayClick = useCallback(
        (type: ComponentType) => {
            addComponent(type);
        },
        [addComponent]
    );

    // ── Delete selected nodes via keyboard ────────────────
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "Delete" || event.key === "Backspace") {
                const selected = nodes.filter((n) => n.selected);
                for (const node of selected) {
                    removeNode(node.id);
                }
            }
        },
        [nodes, removeNode]
    );

    // ── Status display ────────────────────────────────────
    const statusIcon = simResult.shortCircuit
        ? "⚡"
        : simResult.isComplete
            ? "✅"
            : "🔴";
    const statusClass = simResult.shortCircuit
        ? "short"
        : simResult.isComplete
            ? "complete"
            : "open";
    const statusText = simResult.shortCircuit
        ? "Short circuit! Add a bulb/LED in the loop."
        : simResult.isComplete
            ? "Circuit complete — current is flowing!"
            : simResult.openReason ?? "Circuit is open";

    return (
        <div className="circuit-scene" onKeyDown={handleKeyDown} tabIndex={0}>
            {/* ── Component Tray ───────────────────────── */}
            <div className="circuit-tray">
                <div className="circuit-tray-bar">
                    {TRAY_ITEMS.map((type) => {
                        const def = COMPONENT_CATALOG[type];
                        return (
                            <div
                                key={type}
                                className="circuit-tray-item"
                                onClick={() => handleTrayClick(type)}
                            >
                                <span className="circuit-tray-icon">{def.icon}</span>
                                <span className="circuit-tray-label">{def.label}</span>
                                <span className="circuit-tray-desc">{def.description.split(".")[0]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Status Bar ───────────────────────────── */}
            <div className={`circuit-status ${statusClass}`}>
                <span className="circuit-status-icon">{statusIcon}</span>
                <span>{statusText}</span>
            </div>

            {/* ── React Flow Canvas ────────────────────── */}
            <div className="circuit-board">
                <div className="rf-canvas-wrapper">
                    <ReactFlow
                        nodes={nodesWithCallbacks}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        isValidConnection={isValidConnection}
                        nodeTypes={nodeTypes}
                        fitView
                        snapToGrid
                        snapGrid={[20, 20]}
                        minZoom={0.4}
                        maxZoom={2}
                        deleteKeyCode={["Delete", "Backspace"]}
                        defaultEdgeOptions={{
                            type: "default",
                            animated: simResult.isComplete,
                            style: {
                                stroke: simResult.isComplete ? "#f59e0b" : "#64748b",
                                strokeWidth: 3,
                            },
                        }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="rgba(100,116,139,0.15)" />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeStrokeWidth={3}
                            pannable
                            zoomable
                            style={{ background: "rgba(255,255,255,0.8)" }}
                        />
                    </ReactFlow>
                </div>
            </div>

            {/* ── Controls ─────────────────────────────── */}
            <div className="circuit-controls">
                <button
                    onClick={clearBoard}
                    className="circuit-control-btn"
                >
                    Clear Board
                </button>
            </div>

            {/* ── Guided Mode Panel ────────────────────── */}
            {mode === "guided" && experiment && (
                <div className="circuit-guide">
                    <div className="circuit-guide-title">{experiment.title}</div>
                    <div className="circuit-guide-desc">{experiment.description}</div>
                    {experiment.steps.map((step, i) => {
                        const isCurrent = i === guidedStep;
                        const isDone = i < guidedStep || completedTips.includes(i);
                        return (
                            <div key={i}>
                                <div className={`circuit-guide-step ${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}>
                                    <div className="circuit-guide-step-num">{isDone ? "✓" : i + 1}</div>
                                    <div>
                                        <div className="circuit-guide-step-text">{step.instruction}</div>
                                        {isCurrent ? <div className="circuit-guide-hint">{step.hint}</div> : null}
                                    </div>
                                </div>
                                {isDone && step.successTip ? (
                                    <div className="circuit-guide-tip">💡 {step.successTip}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="circuit-tip">
                Click a component to add it to the canvas. Drag between terminal handles (●) to create wires.
                Use Delete key to remove selected components.
            </p>
        </div>
    );
}
