"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function BatteryNodeComponent({ data, selected }: NodeProps) {
    return (
        <div className={`rf-node rf-battery-node${selected ? " selected" : ""}`}>
            <Handle
                type="target"
                position={Position.Left}
                id={`${data.instanceId}-t1`}
                className="rf-handle rf-handle-neg"
                title="− terminal"
            />
            <div className="rf-node-inner">
                <span className="rf-node-icon">🔋</span>
                <span className="rf-node-label">Battery</span>
                <div className="rf-polarity-labels">
                    <span className="rf-pol-neg">−</span>
                    <span className="rf-pol-pos">+</span>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id={`${data.instanceId}-t0`}
                className="rf-handle rf-handle-pos"
                title="+ terminal"
            />
        </div>
    );
}

export const BatteryNode = memo(BatteryNodeComponent);
