"use client";

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function BulbNodeComponent({ data, selected }: NodeProps) {
    const isLit = Boolean(data.isLit);

    return (
        <div
            className={`rf-node rf-bulb-node${isLit ? " bulb-lit" : ""}${selected ? " selected" : ""}`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id={`${data.instanceId}-t0`}
                className="rf-handle"
                title="Terminal 1"
            />
            <div className="rf-node-inner">
                <span className="rf-node-icon">💡</span>
                <span className="rf-node-label">Bulb</span>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id={`${data.instanceId}-t1`}
                className="rf-handle"
                title="Terminal 2"
            />
        </div>
    );
}

export const BulbNode = memo(BulbNodeComponent);
