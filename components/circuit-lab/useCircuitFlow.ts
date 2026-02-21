"use client";

/**
 * useCircuitFlow — Bridge between React Flow state and CircuitEngine.
 *
 * Maps React Flow nodes → PlacedComponent[], edges → Connection[],
 * feeds them into CircuitEngine.simulate(), and returns the result.
 *
 * Pseudo-grid positions: each node gets a unique sparse position
 * (col = index * 100) so engine auto-connections never fire — we
 * rely entirely on explicit setConnections() from edges.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    type Edge,
    type Connection as RFConnection,
    type OnConnect,
    type OnNodesChange,
    type OnEdgesChange,
    type Node,
} from "@xyflow/react";
import {
    type ComponentType,
    type PlacedComponent,
} from "@/lib/circuit-components";
import { CircuitEngine, type Connection, type SimulationResult } from "@/lib/circuit-engine";
import type { CircuitExperiment } from "@/lib/physics-lab-types";

// ── Terminal ID contract ──────────────────────────────────
// Handle IDs: `${instanceId}-t0`, `${instanceId}-t1`
// These match engine terminal IDs from getTerminalPositions().
export function terminalId(instanceId: string, index: number): string {
    return `${instanceId}-t${index}`;
}

// ── Unique ID generator ───────────────────────────────────
let nextId = 1;
function genId(type: string): string {
    return `${type}-${nextId++}`;
}

// ── Types ─────────────────────────────────────────────────
interface UseCircuitFlowOptions {
    experiment?: CircuitExperiment | null;
    mode: "free" | "guided";
}

interface UseCircuitFlowReturn {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange<Node>;
    onEdgesChange: OnEdgesChange<Edge>;
    onConnect: OnConnect;
    isValidConnection: (connection: RFConnection | Edge) => boolean;
    simResult: SimulationResult;
    addComponent: (type: ComponentType) => void;
    toggleSwitch: (instanceId: string) => void;
    removeNode: (nodeId: string) => void;
    clearBoard: () => void;
    guidedStep: number;
    completedTips: number[];
}

// ── Default positions for new drops ───────────────────────
const DROP_POSITIONS: Partial<Record<ComponentType, { x: number; y: number }>> = {
    battery: { x: 50, y: 180 },
    bulb: { x: 320, y: 160 },
    switch: { x: 185, y: 40 },
    led: { x: 320, y: 160 },
};

let dropOffset = 0;

export function useCircuitFlow({ experiment, mode }: UseCircuitFlowOptions): UseCircuitFlowReturn {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const [guidedStep, setGuidedStep] = useState(0);
    const [completedTips, setCompletedTips] = useState<number[]>([]);

    // Stable ref to avoid stale closures in callbacks
    const stateRef = useRef({ guidedStep, experiment, mode });
    stateRef.current = { guidedStep, experiment, mode };

    // ── Map nodes → PlacedComponent[] ─────────────────────
    // Each node gets a unique pseudo-grid position (sparse)
    // so engine auto-connections never collide.
    const placedComponents = useMemo((): PlacedComponent[] => {
        return nodes.map((node, i) => ({
            instanceId: node.data.instanceId as string,
            type: node.type as ComponentType,
            gridX: i * 100,      // sparse — avoids auto-connect
            gridY: 0,
            rotation: 0,
            switchClosed: node.type === "switch" ? Boolean(node.data.switchClosed) : undefined,
        }));
    }, [nodes]);

    // ── Map edges → Connection[] ──────────────────────────
    const connections = useMemo((): Connection[] => {
        return edges.map((edge) => ({
            fromTerminalId: edge.sourceHandle ?? "",
            toTerminalId: edge.targetHandle ?? "",
        }));
    }, [edges]);

    // ── Simulate ──────────────────────────────────────────
    const simResult = useMemo((): SimulationResult => {
        const engine = new CircuitEngine();
        engine.setComponents(placedComponents);
        engine.setConnections(connections);
        return engine.simulate();
    }, [placedComponents, connections]);

    // ── Enriched nodes (inject sim status into data) ──────
    const enrichedNodes = useMemo((): Node[] => {
        return nodes.map((node) => {
            const id = node.data.instanceId as string;
            const extra: Record<string, unknown> = {};

            if (node.type === "bulb") {
                extra.isLit = simResult.bulbsLit.includes(id);
            } else if (node.type === "led") {
                extra.isLit = simResult.ledsLit.includes(id);
                extra.isWrong = simResult.ledsWrong.includes(id);
            }

            if (Object.keys(extra).length === 0) return node;

            return {
                ...node,
                data: { ...node.data, ...extra },
            };
        });
    }, [nodes, simResult]);

    // ── Guided mode step progression ──────────────────────
    const advanceGuided = useCallback((trigger: "component" | "wire" | "toggle", componentType?: ComponentType) => {
        const { guidedStep: step, experiment: exp, mode: m } = stateRef.current;
        if (m !== "guided" || !exp) return;

        const currentStep = exp.steps[step];
        if (!currentStep) return;

        let shouldAdvance = false;

        if (trigger === "component" && currentStep.expectedComponent && currentStep.expectedComponent === componentType) {
            shouldAdvance = true;
        } else if (trigger === "wire" && currentStep.expectedComponent === "wire") {
            shouldAdvance = true;
        } else if (trigger === "toggle" && currentStep.toggleSwitch) {
            shouldAdvance = true;
        }

        if (shouldAdvance) {
            setCompletedTips((prev) => [...prev, step]);
            setGuidedStep((prev) => Math.min(prev + 1, exp.steps.length - 1));
        }
    }, []);

    // ── Connection validation ─────────────────────────────
    const isValidConnection = useCallback(
        (connection: RFConnection | Edge): boolean => {
            // Must have handles (terminal-to-terminal only)
            if (!connection.sourceHandle || !connection.targetHandle) return false;

            // Block self-loops (same node)
            if (connection.source === connection.target) return false;

            // Block duplicate parallel edges between same two terminals
            const existing = edges.some(
                (e) =>
                    (e.sourceHandle === connection.sourceHandle && e.targetHandle === connection.targetHandle) ||
                    (e.sourceHandle === connection.targetHandle && e.targetHandle === connection.sourceHandle)
            );
            if (existing) return false;

            return true;
        },
        [edges]
    );

    // ── onConnect ─────────────────────────────────────────
    const onConnect: OnConnect = useCallback(
        (params) => {
            if (!params.sourceHandle || !params.targetHandle) return;

            const newEdge: Edge = {
                id: `e-${params.sourceHandle}-${params.targetHandle}`,
                source: params.source,
                target: params.target,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
                type: "default",
                animated: false,
            };

            setEdges((prev) => [...prev, newEdge]);
            advanceGuided("wire");
        },
        [setEdges, advanceGuided]
    );

    // ── Add component ─────────────────────────────────────
    const addComponent = useCallback(
        (type: ComponentType) => {
            if (type === "wire") return; // wires are edges, not nodes

            const instanceId = genId(type);
            const base = DROP_POSITIONS[type] ?? { x: 200, y: 200 };
            dropOffset = (dropOffset + 1) % 10;

            const newNode: Node = {
                id: instanceId,
                type,
                position: {
                    x: base.x + dropOffset * 20,
                    y: base.y + dropOffset * 15,
                },
                data: {
                    instanceId,
                    switchClosed: type === "switch" ? false : undefined,
                },
            };

            setNodes((prev) => [...prev, newNode]);
            advanceGuided("component", type);
        },
        [setNodes, advanceGuided]
    );

    // ── Toggle switch ─────────────────────────────────────
    const toggleSwitch = useCallback(
        (instanceId: string) => {
            setNodes((prev) =>
                prev.map((n) =>
                    n.data.instanceId === instanceId && n.type === "switch"
                        ? { ...n, data: { ...n.data, switchClosed: !n.data.switchClosed } }
                        : n
                )
            );
            advanceGuided("toggle");
        },
        [setNodes, advanceGuided]
    );

    // ── Remove node ───────────────────────────────────────
    const removeNode = useCallback(
        (nodeId: string) => {
            setNodes((prev) => prev.filter((n) => n.id !== nodeId));
            setEdges((prev) =>
                prev.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
        },
        [setNodes, setEdges]
    );

    // ── Clear board ───────────────────────────────────────
    const clearBoard = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setGuidedStep(0);
        setCompletedTips([]);
        dropOffset = 0;
    }, [setNodes, setEdges]);

    return {
        nodes: enrichedNodes,
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
    };
}
