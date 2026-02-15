"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function LedNodeComponent({ data, selected }: NodeProps) {
    const isLit = Boolean(data.isLit);
    const isWrong = Boolean(data.isWrong);

    return (
        <div
            className={`rf-node rf-led-node${isLit ? " led-lit" : ""}${isWrong ? " led-wrong" : ""}${selected ? " selected" : ""}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id={`${data.instanceId}-t0`}
                className="rf-handle rf-handle-pos"
                title="+ terminal"
            />
            <div className="rf-node-inner">
                <span className="rf-node-icon">🔴</span>
                <span className="rf-node-label">LED</span>
                <div className="rf-polarity-labels">
                    <span className="rf-pol-pos">+</span>
                    <span className="rf-pol-neg">−</span>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id={`${data.instanceId}-t1`}
                className="rf-handle rf-handle-neg"
                title="− terminal"
            />
        </div>
    );
}

export const LedNode = memo(LedNodeComponent);
