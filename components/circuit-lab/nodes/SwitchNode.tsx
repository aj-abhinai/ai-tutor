"use client";

import React, { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

function SwitchNodeComponent({ data, selected }: NodeProps) {
    const isClosed = Boolean(data.switchClosed);

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (typeof data.onToggle === "function") {
                (data.onToggle as (id: string) => void)(data.instanceId as string);
            }
        },
        [data.onToggle, data.instanceId]
    );

    return (
        <div
            className={`rf-node rf-switch-node${isClosed ? " switch-closed" : " switch-open"}${selected ? " selected" : ""}`}
            onClick={handleClick}
        >
            <Handle
                type="target"
                position={Position.Left}
                id={`${data.instanceId}-t0`}
                className="rf-handle"
                title="Terminal 1"
            />
            <div className="rf-node-inner">
                <span className="rf-node-icon">🔘</span>
                <span className="rf-node-label">
                    Switch
                    <span className={`rf-switch-badge ${isClosed ? "closed" : "open"}`}>
                        {isClosed ? " ON" : " OFF"}
                    </span>
                </span>
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

export const SwitchNode = memo(SwitchNodeComponent);
