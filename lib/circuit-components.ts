/**
 * Circuit component definitions for the interactive physics lab.
 * Each component type has terminals, visual metadata, and educational info.
 */

// ── Component types ───────────────────────────────────────

export type ComponentType = "battery" | "bulb" | "switch" | "wire" | "led";

export interface Terminal {
    id: string;          // e.g. "battery-1-pos"
    polarity?: "+" | "-"; // only for battery and LED
    gridOffset: { dx: number; dy: number }; // offset from component's grid position
}

export interface CircuitComponentDef {
    type: ComponentType;
    label: string;
    description: string;
    icon: string;       // emoji for tray display
    color: string;      // accent color
    terminals: { polarity?: "+" | "-"; dx: number; dy: number }[];
    width: number;      // grid cells wide
    height: number;     // grid cells tall
}

// ── Component catalog ─────────────────────────────────────

export const COMPONENT_CATALOG: Record<ComponentType, CircuitComponentDef> = {
    battery: {
        type: "battery",
        label: "Battery",
        description: "Provides electrical energy. Has positive (+) and negative (−) terminals.",
        icon: "🔋",
        color: "#f76115",
        terminals: [
            { polarity: "+", dx: 2, dy: 0 },
            { polarity: "-", dx: 0, dy: 0 },
        ],
        width: 3,
        height: 1,
    },
    bulb: {
        type: "bulb",
        label: "Bulb",
        description: "Glows when electric current flows through it.",
        icon: "💡",
        color: "#ff8445",
        terminals: [
            { dx: 0, dy: 1 },
            { dx: 1, dy: 1 },
        ],
        width: 2,
        height: 2,
    },
    switch: {
        type: "switch",
        label: "Switch",
        description: "Opens or closes the circuit. Toggle to control current flow.",
        icon: "🔘",
        color: "#0a1836",
        terminals: [
            { dx: 0, dy: 0 },
            { dx: 2, dy: 0 },
        ],
        width: 3,
        height: 1,
    },
    wire: {
        type: "wire",
        label: "Wire",
        description: "Conducts electricity between components.",
        icon: "〰️",
        color: "#b8bccf",
        terminals: [
            { dx: 0, dy: 0 },
            { dx: 1, dy: 0 },
        ],
        width: 2,
        height: 1,
    },
    led: {
        type: "led",
        label: "LED",
        description: "Glows only when connected the right way. Longer leg is positive (+).",
        icon: "🔴",
        color: "#f76115",
        terminals: [
            { polarity: "+", dx: 0, dy: 1 },
            { polarity: "-", dx: 1, dy: 1 },
        ],
        width: 2,
        height: 2,
    },
};

// ── Placed component instance ─────────────────────────────

export interface PlacedComponent {
    instanceId: string;
    type: ComponentType;
    gridX: number;
    gridY: number;
    rotation: 0 | 90 | 180 | 270;
    switchClosed?: boolean; // only for switch type
}

/**
 * Get the absolute grid positions of a placed component's terminals.
 */
export function getTerminalPositions(comp: PlacedComponent): { id: string; polarity?: "+" | "-"; x: number; y: number }[] {
    const def = COMPONENT_CATALOG[comp.type];
    return def.terminals.map((t, i) => {
        let dx = t.dx;
        let dy = t.dy;

        // Apply rotation
        if (comp.rotation === 90) {
            [dx, dy] = [def.height - 1 - dy, dx];
        } else if (comp.rotation === 180) {
            [dx, dy] = [def.width - 1 - dx, def.height - 1 - dy];
        } else if (comp.rotation === 270) {
            [dx, dy] = [dy, def.width - 1 - dx];
        }

        return {
            id: `${comp.instanceId}-t${i}`,
            polarity: t.polarity,
            x: comp.gridX + dx,
            y: comp.gridY + dy,
        };
    });
}

/**
 * Ordered list of components available in the tray.
 */
export const TRAY_ORDER: ComponentType[] = ["battery", "bulb", "switch", "wire", "led"];
