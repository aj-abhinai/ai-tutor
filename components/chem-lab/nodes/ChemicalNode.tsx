"use client";

import React, { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CHEM_BOTTLE_COLORS } from "../constants";

function ChemicalNodeComponent({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const name = String(data.name ?? "");
  const formula = String(data.formula ?? "");
  const fact = String(data.fact ?? "");
  const state = String(data.state ?? "");
  const colorIdx = Number(data.colorIndex ?? 0);
  const color = CHEM_BOTTLE_COLORS[colorIdx % CHEM_BOTTLE_COLORS.length];

  return (
    <div
      className={`rf-chem-node${selected ? " selected" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="rf-chem-bottle" style={{ "--bottle-color": color } as React.CSSProperties}>
        <div className="rf-chem-bottle-neck" />
        <div className="rf-chem-bottle-body">
          <div className="rf-chem-bottle-liquid" style={{ backgroundColor: color }} />
        </div>
      </div>

      <div className="rf-chem-labels">
        <span className="rf-chem-name">{name}</span>
        {formula && <span className="rf-chem-formula">({formula})</span>}
        {state && <span className="rf-chem-state">{state}</span>}
      </div>

      {hovered && fact && <div className="rf-chem-tooltip">{fact}</div>}

      <Handle
        type="source"
        position={Position.Right}
        id={`${data.instanceId}-out`}
        className="rf-chem-handle"
        title="Pour into beaker"
      />
    </div>
  );
}

export const ChemicalNode = memo(ChemicalNodeComponent);
