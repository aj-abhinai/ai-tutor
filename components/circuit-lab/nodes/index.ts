/**
 * Node type registry for React Flow.
 * Hoisted outside components to prevent re-renders (rerender-memo).
 */

import { BatteryNode } from "./BatteryNode";
import { BulbNode } from "./BulbNode";
import { SwitchNode } from "./SwitchNode";
import { LedNode } from "./LedNode";

export const nodeTypes = {
    battery: BatteryNode,
    bulb: BulbNode,
    switch: SwitchNode,
    led: LedNode,
} as const;
