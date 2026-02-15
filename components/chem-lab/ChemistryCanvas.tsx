"use client";

/**
 * ChemistryCanvas - React Flow canvas for the chemistry reaction lab.
 *
 * Shows a chemical tray at top, React Flow canvas with beaker node in centre,
 * and auto-creates chemical/product nodes as students interact.
 */

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { chemNodeTypes } from "./nodes";
import { useChemistryFlow } from "./useChemistryFlow";
import { CHEM_BOTTLE_COLORS, splitChemicalLabel } from "./constants";
import { getChemicalsList } from "@/lib/reaction-engine";
import { getChemicalInfo } from "@/lib/chemical-facts";
import type { Reaction } from "@/lib/reactions";
import type { Experiment } from "@/lib/experiments";

interface ChemistryCanvasProps {
  onMix: (chemicalA: string, chemicalB: string) => void;
  reactionResult: { reaction: Reaction | null; explanation: string } | null;
  isReacting: boolean;
  onReset: () => void;
  experiment?: Experiment | null;
  mode: "free" | "guided";
  guidedStep: number;
  guidedFeedback?: { type: "correct" | "wrong"; message: string } | null;
  onGuidedCorrect?: () => void;
  onGuidedWrong?: (droppedChemical: string) => void;
}

export function ChemistryCanvas({
  onMix,
  reactionResult,
  isReacting,
  onReset,
  experiment,
  mode,
  guidedStep,
  guidedFeedback,
  onGuidedCorrect,
  onGuidedWrong,
}: ChemistryCanvasProps) {
  const chemicals = getChemicalsList();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addChemical,
    reset,
    phase,
    addedNames,
  } = useChemistryFlow({
    onMix,
    reactionResult,
    isReacting,
    experiment,
    mode,
    guidedStep,
    onGuidedCorrect,
    onGuidedWrong,
  });

  const handleReset = useCallback(() => {
    reset();
    onReset();
  }, [reset, onReset]);

  const expectedChemical =
    mode === "guided" && experiment?.steps[guidedStep]?.expectedChemical
      ? experiment.steps[guidedStep].expectedChemical
      : null;

  return (
    <div className="chem-scene">
      <div className="chem-tray">
        <div className="chem-tray-header">
          <span className="chem-tray-title">Chemical Shelf</span>
          <span className="chem-tray-count">{addedNames.length}/2 selected</span>
        </div>
        <div className="chem-tray-scroll">
          {chemicals.map((name, i) => {
            const color = CHEM_BOTTLE_COLORS[i % CHEM_BOTTLE_COLORS.length];
            const { name: displayName, formula } = splitChemicalLabel(name);
            const info = getChemicalInfo(name);
            const isAdded = addedNames.includes(name);
            const isExpected = expectedChemical === name && !isAdded;
            const isDisabled =
              isAdded || addedNames.length >= 2 || (phase !== "idle" && phase !== "done");

            return (
              <button
                key={name}
                className={`chem-tray-bottle${isAdded ? " is-added" : ""}${isExpected ? " is-expected" : ""}${isDisabled ? " is-disabled" : ""}`}
                onClick={() => !isDisabled && addChemical(name, i)}
                disabled={isDisabled}
                title={info.fact}
              >
                <div className="chem-tray-bottle-jar">
                  <div className="chem-tray-bottle-neck" />
                  <div className="chem-tray-bottle-body">
                    <div className="chem-tray-bottle-liquid" style={{ backgroundColor: color }} />
                  </div>
                </div>
                <span className="chem-tray-bottle-name">{displayName}</span>
                {formula && <span className="chem-tray-bottle-formula">({formula})</span>}
                <span className="chem-tray-bottle-state">{info.state}</span>
                {isExpected && <span className="chem-tray-expected-badge">*</span>}
              </button>
            );
          })}
        </div>
      </div>

      {guidedFeedback && (
        <div className={`chem-guided-feedback ${guidedFeedback.type}`}>
          {guidedFeedback.type === "correct" ? "Correct" : "Wrong"} - {guidedFeedback.message}
        </div>
      )}

      <div className="chem-canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={chemNodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.5}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor="#94a3b8"
            nodeColor={(n) => {
              if (n.type === "beaker") return "#38bdf8";
              if (n.type === "product") return "#4ade80";
              return "#f472b6";
            }}
            maskColor="rgba(248, 250, 252, 0.8)"
          />
        </ReactFlow>
      </div>

      <div className="chem-controls">
        {(phase === "done" || addedNames.length > 0) && (
          <button onClick={handleReset} className="chem-reset-btn">
            Clear and Reset
          </button>
        )}
        <div className="chem-phase-label">
          {phase === "idle" && addedNames.length === 0 && "Click a chemical to begin"}
          {phase === "idle" && addedNames.length === 1 && "Add one more chemical"}
          {phase === "pouring" && "Pouring..."}
          {phase === "reacting" && "Mixing chemicals..."}
          {phase === "done" && "Reaction complete"}
        </div>
      </div>
    </div>
  );
}
