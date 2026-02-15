"use client";

/**
 * useChemistryFlow - Bridge between React Flow and reaction engine.
 *
 * Manages a fixed BeakerNode at centre, lets user add ChemicalNodes
 * which auto-connect to the beaker. When 2 chemicals are connected,
 * it calls onMix and then renders ProductNode from reactionResult.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import { getChemicalInfo } from "@/lib/chemical-facts";
import { buildSimulationPlan } from "@/lib/simulation-engine";
import { splitChemicalLabel } from "./constants";
import type { Reaction } from "@/lib/reactions";
import type { Experiment } from "@/lib/experiments";

type ChemPhase = "idle" | "pouring" | "reacting" | "done";

interface UseChemistryFlowOptions {
  onMix: (chemicalA: string, chemicalB: string) => void;
  reactionResult: { reaction: Reaction | null; explanation: string } | null;
  isReacting: boolean;
  experiment?: Experiment | null;
  mode: "free" | "guided";
  guidedStep: number;
  onGuidedCorrect?: () => void;
  onGuidedWrong?: (droppedChemical: string) => void;
}

interface UseChemistryFlowReturn {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node>;
  onEdgesChange: OnEdgesChange<Edge>;
  addChemical: (name: string, index: number) => boolean;
  reset: () => void;
  phase: ChemPhase;
  addedNames: string[];
}

let nextChemId = 1;

const BEAKER_POS = { x: 360, y: 140 };
const CHEM_POSITIONS = [
  { x: 50, y: 80 },
  { x: 50, y: 260 },
];
const PRODUCT_POS = { x: 660, y: 140 };

function createBeakerNode(): Node {
  return {
    id: "beaker",
    type: "beaker",
    position: BEAKER_POS,
    draggable: false,
    selectable: false,
    deletable: false,
    data: {
      phase: "idle",
      liquidColor: "#dbeafe",
      liquidLevel: 0,
      heatType: "none",
      hasBubbles: false,
      hasPrecipitate: false,
      hasSmoke: false,
      inputsUsed: 0,
    },
  };
}

export function useChemistryFlow({
  onMix,
  reactionResult,
  isReacting,
  experiment,
  mode,
  guidedStep,
  onGuidedCorrect,
  onGuidedWrong,
}: UseChemistryFlowOptions): UseChemistryFlowReturn {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([createBeakerNode()]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [phase, setPhase] = useState<ChemPhase>("idle");
  const [addedNames, setAddedNames] = useState<string[]>([]);

  const prevResultRef = useRef<typeof reactionResult>(null);
  const pourTimerRef = useRef<number | null>(null);

  const addChemical = useCallback(
    (name: string, colorIndex: number): boolean => {
      if (addedNames.length >= 2) return false;
      if (addedNames.includes(name)) return false;
      if (phase !== "idle" && phase !== "done") return false;

      if (mode === "guided" && experiment) {
        const step = experiment.steps[guidedStep];
        if (step && step.expectedChemical !== name) {
          onGuidedWrong?.(name);
          return false;
        }
        onGuidedCorrect?.();
      }

      const { name: displayName, formula } = splitChemicalLabel(name);
      const info = getChemicalInfo(name);
      const id = `chem-${nextChemId++}`;
      const slot = addedNames.length;

      const chemNode: Node = {
        id,
        type: "chemical",
        position: CHEM_POSITIONS[slot],
        data: {
          instanceId: id,
          name: displayName,
          formula,
          fact: info.fact,
          state: info.state,
          colorIndex,
          fullName: name,
        },
      };

      const edge: Edge = {
        id: `e-${id}-beaker`,
        source: id,
        target: "beaker",
        sourceHandle: `${id}-out`,
        targetHandle: `beaker-in-${slot}`,
        type: "default",
        animated: true,
        style: { stroke: "#38bdf8", strokeWidth: 2.5 },
      };

      const newNames = [...addedNames, name];
      setAddedNames(newNames);

      setNodes((prev) => {
        const updated = prev.map((n) => {
          if (n.id === "beaker") {
            return {
              ...n,
              data: {
                ...n.data,
                inputsUsed: newNames.length,
                liquidLevel: Math.min((n.data.liquidLevel as number) + 35, 80),
                phase: "pouring",
              },
            };
          }
          return n;
        });
        return [...updated, chemNode];
      });

      setEdges((prev) => [...prev, edge]);
      setPhase("pouring");

      if (pourTimerRef.current !== null) {
        window.clearTimeout(pourTimerRef.current);
      }

      pourTimerRef.current = window.setTimeout(() => {
        if (newNames.length === 2) {
          setPhase("reacting");
          setNodes((prev) =>
            prev.map((n) =>
              n.id === "beaker" ? { ...n, data: { ...n.data, phase: "reacting" } } : n
            )
          );
          onMix(newNames[0], newNames[1]);
        } else {
          setPhase("idle");
          setNodes((prev) =>
            prev.map((n) => (n.id === "beaker" ? { ...n, data: { ...n.data, phase: "idle" } } : n))
          );
        }
      }, 900);

      return true;
    },
    [addedNames, experiment, guidedStep, mode, onGuidedCorrect, onGuidedWrong, onMix, phase, setEdges, setNodes]
  );

  useEffect(() => {
    if (!reactionResult) return;
    if (isReacting) return;
    if (phase !== "reacting") return;
    if (prevResultRef.current === reactionResult) return;

    prevResultRef.current = reactionResult;

    const reaction = reactionResult.reaction;
    const plan = buildSimulationPlan(reaction);

    setNodes((prev) => {
      const updated = prev.map((n) => {
        if (n.id === "beaker") {
          return {
            ...n,
            data: {
              ...n.data,
              phase: "done",
              liquidColor: plan.liquid.finalColor,
              liquidLevel: 70,
              heatType: plan.effects.heat,
              hasBubbles: plan.effects.bubbles,
              hasPrecipitate: plan.effects.precipitate,
              hasSmoke: plan.effects.smoke,
            },
          };
        }
        return n;
      });

      const productNode: Node = {
        id: "product",
        type: "product",
        position: PRODUCT_POS,
        deletable: false,
        data: {
          products: reaction?.products ?? "No visible reaction",
          equation: reaction?.equation ?? "",
          category: reaction?.category ?? "",
          resultColor: reaction?.visual.color ?? "#cbd5e1",
          gasReleased: plan.badges.gasReleased,
          colorChange: plan.badges.colorChange,
          precipitate: plan.badges.precipitate,
          heat: plan.effects.heat,
        },
      };

      const withoutProduct = updated.filter((n) => n.id !== "product");
      return [...withoutProduct, productNode];
    });

    setEdges((prev) => {
      const withoutProductEdge = prev.filter((e) => e.id !== "e-beaker-product");
      return [
        ...withoutProductEdge,
        {
          id: "e-beaker-product",
          source: "beaker",
          target: "product",
          sourceHandle: "beaker-out",
          targetHandle: "product-in",
          type: "default",
          animated: true,
          style: {
            stroke: reaction?.visual.color ?? "#64748b",
            strokeWidth: 3,
          },
        },
      ];
    });

    setPhase("done");
  }, [isReacting, phase, reactionResult, setEdges, setNodes]);

  const reset = useCallback(() => {
    if (pourTimerRef.current !== null) {
      window.clearTimeout(pourTimerRef.current);
      pourTimerRef.current = null;
    }
    setNodes([createBeakerNode()]);
    setEdges([]);
    setPhase("idle");
    setAddedNames([]);
    prevResultRef.current = null;
    nextChemId = 1;
  }, [setEdges, setNodes]);

  useEffect(() => {
    return () => {
      if (pourTimerRef.current !== null) {
        window.clearTimeout(pourTimerRef.current);
      }
    };
  }, []);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addChemical,
    reset,
    phase,
    addedNames,
  };
}
