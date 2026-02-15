/**
 * Circuit engine — graph-based circuit validation and simulation.
 *
 * Builds an adjacency graph of connected terminals and determines
 * whether a valid closed circuit exists, which bulbs/LEDs light up,
 * and whether a short circuit is present.
 *
 * No real physics (Ohm's law) — Class 7 level connectivity checks.
 */

import {
    type PlacedComponent,
    getTerminalPositions,
} from "./circuit-components";

// ── Types ──────────────────────────────────────────────────

export interface Connection {
    fromTerminalId: string;
    toTerminalId: string;
}

export interface SimulationResult {
    isComplete: boolean;
    bulbsLit: string[];      // instance IDs of lit bulbs
    ledsLit: string[];       // instance IDs of lit LEDs
    ledsWrong: string[];     // instance IDs of LEDs in wrong polarity
    shortCircuit: boolean;
    openReason?: string;     // human-readable reason if circuit is open
}

// ── Terminal position key ──────────────────────────────────

function posKey(x: number, y: number): string {
    return `${x},${y}`;
}

// ── Engine ─────────────────────────────────────────────────

export class CircuitEngine {
    private components: PlacedComponent[] = [];
    private connections: Connection[] = [];

    // ── Mutators ───────────────────────────────────────────

    setComponents(comps: PlacedComponent[]) {
        this.components = [...comps];
    }

    setConnections(conns: Connection[]) {
        this.connections = [...conns];
    }

    // ── Auto-connect ───────────────────────────────────────
    /**
     * Builds implicit connections: terminals of different components
     * that occupy the same grid cell are considered connected.
     */
    private buildAutoConnections(): Connection[] {
        const posMap = new Map<string, { termId: string; instanceId: string }[]>();

        for (const comp of this.components) {
            const terms = getTerminalPositions(comp);
            for (const t of terms) {
                const key = posKey(t.x, t.y);
                if (!posMap.has(key)) posMap.set(key, []);
                posMap.get(key)!.push({ termId: t.id, instanceId: comp.instanceId });
            }
        }

        const auto: Connection[] = [];
        for (const group of posMap.values()) {
            // Connect every terminal at this position to every other
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    // Only connect across different components
                    if (group[i].instanceId !== group[j].instanceId) {
                        auto.push({
                            fromTerminalId: group[i].termId,
                            toTerminalId: group[j].termId,
                        });
                    }
                }
            }
        }

        return auto;
    }

    // ── Adjacency graph ────────────────────────────────────

    private buildGraph(): Map<string, Set<string>> {
        const graph = new Map<string, Set<string>>();
        const allConns = [...this.connections, ...this.buildAutoConnections()];

        // Add intra-component edges (terminals of same component are connected internally)
        for (const comp of this.components) {
            // Battery terminals are not internally connected.
            if (comp.type === "battery") continue;
            // Skip open switches — they break the internal connection
            if (comp.type === "switch" && !comp.switchClosed) continue;

            const terms = getTerminalPositions(comp);
            if (terms.length === 2) {
                const a = terms[0].id;
                const b = terms[1].id;
                if (!graph.has(a)) graph.set(a, new Set());
                if (!graph.has(b)) graph.set(b, new Set());
                graph.get(a)!.add(b);
                graph.get(b)!.add(a);
            }
        }

        // Add explicit and auto connections
        for (const conn of allConns) {
            const { fromTerminalId, toTerminalId } = conn;
            if (!graph.has(fromTerminalId)) graph.set(fromTerminalId, new Set());
            if (!graph.has(toTerminalId)) graph.set(toTerminalId, new Set());
            graph.get(fromTerminalId)!.add(toTerminalId);
            graph.get(toTerminalId)!.add(fromTerminalId);
        }

        return graph;
    }

    // ── Reachability ───────────────────────────────────────

    private reachable(graph: Map<string, Set<string>>, start: string): Set<string> {
        const visited = new Set<string>();
        const queue = [start];
        while (queue.length > 0) {
            const node = queue.shift()!;
            if (visited.has(node)) continue;
            visited.add(node);
            for (const neighbor of graph.get(node) ?? []) {
                if (!visited.has(neighbor)) queue.push(neighbor);
            }
        }
        return visited;
    }

    private shortestDistances(graph: Map<string, Set<string>>, start: string): Map<string, number> {
        const distance = new Map<string, number>();
        const queue = [start];
        distance.set(start, 0);

        while (queue.length > 0) {
            const node = queue.shift()!;
            const current = distance.get(node)!;
            for (const neighbor of graph.get(node) ?? []) {
                if (!distance.has(neighbor)) {
                    distance.set(neighbor, current + 1);
                    queue.push(neighbor);
                }
            }
        }

        return distance;
    }

    // ── Simulate ───────────────────────────────────────────

    simulate(): SimulationResult {
        const batteries = this.components.filter(c => c.type === "battery");
        const bulbs = this.components.filter(c => c.type === "bulb");
        const leds = this.components.filter(c => c.type === "led");

        // Must have at least one battery
        if (batteries.length === 0) {
            return {
                isComplete: false,
                bulbsLit: [],
                ledsLit: [],
                ledsWrong: [],
                shortCircuit: false,
                openReason: "Add a battery to power the circuit",
            };
        }

        const graph = this.buildGraph();

        // Check for short circuit: battery + terminal directly reaches − terminal
        // without passing through any load (bulb, LED, resistor)
        const shortCircuit = this.checkShortCircuit(graph, batteries);

        if (shortCircuit) {
            return {
                isComplete: false,
                bulbsLit: [],
                ledsLit: [],
                ledsWrong: [],
                shortCircuit: true,
                openReason: "Short circuit! Current has no load to pass through",
            };
        }

        // Check complete loop: from battery + terminal, can we reach battery − terminal?
        const battery = batteries[0];
        const batteryTerms = getTerminalPositions(battery);
        const posTermId = batteryTerms.find(t => t.polarity === "+")?.id;
        const negTermId = batteryTerms.find(t => t.polarity === "-")?.id;

        if (!posTermId || !negTermId) {
            return {
                isComplete: false,
                bulbsLit: [],
                ledsLit: [],
                ledsWrong: [],
                shortCircuit: false,
                openReason: "Battery terminals are not connected",
            };
        }

        const reachableFromPos = this.reachable(graph, posTermId);
        const distancesFromPos = this.shortestDistances(graph, posTermId);
        const isComplete = reachableFromPos.has(negTermId);

        if (!isComplete) {
            // Figure out what's missing
            const hasOpenSwitch = this.components.some(c => c.type === "switch" && !c.switchClosed);
            const reason = hasOpenSwitch
                ? "Switch is open — close it to complete the circuit"
                : "Circuit is not complete — connect all components in a loop";
            return {
                isComplete: false,
                bulbsLit: [],
                ledsLit: [],
                ledsWrong: [],
                shortCircuit: false,
                openReason: reason,
            };
        }

        // Determine which bulbs and LEDs are lit
        const bulbsLit: string[] = [];
        const ledsLit: string[] = [];
        const ledsWrong: string[] = [];

        for (const bulb of bulbs) {
            const terms = getTerminalPositions(bulb);
            const inLoop = terms.every(t => reachableFromPos.has(t.id));
            if (inLoop) bulbsLit.push(bulb.instanceId);
        }

        for (const led of leds) {
            const terms = getTerminalPositions(led);
            const inLoop = terms.every(t => reachableFromPos.has(t.id));
            if (inLoop) {
                const posTerminal = terms.find(t => t.polarity === "+");
                const negTerminal = terms.find(t => t.polarity === "-");
                const posDistance = posTerminal ? distancesFromPos.get(posTerminal.id) : undefined;
                const negDistance = negTerminal ? distancesFromPos.get(negTerminal.id) : undefined;

                if (
                    posDistance !== undefined &&
                    negDistance !== undefined &&
                    posDistance < negDistance
                ) {
                    ledsLit.push(led.instanceId);
                } else if (posDistance !== undefined && negDistance !== undefined) {
                    ledsWrong.push(led.instanceId);
                } else {
                    ledsLit.push(led.instanceId);
                }
            }
        }

        return {
            isComplete: true,
            bulbsLit,
            ledsLit,
            ledsWrong,
            shortCircuit: false,
        };
    }

    // ── Short circuit check ────────────────────────────────

    private checkShortCircuit(
        graph: Map<string, Set<string>>,
        batteries: PlacedComponent[]
    ): boolean {
        // Simple check: if battery terminals are connected and no bulb/LED/resistor
        // is in the path, it's a short circuit
        const loads = this.components.filter(
            c => c.type === "bulb" || c.type === "led"
        );
        if (loads.length === 0 && this.components.length > 1) {
            // No loads at all — check if battery has a path
            const battery = batteries[0];
            const terms = getTerminalPositions(battery);
            const posId = terms.find(t => t.polarity === "+")?.id;
            const negId = terms.find(t => t.polarity === "-")?.id;
            if (posId && negId) {
                const reach = this.reachable(graph, posId);
                if (reach.has(negId)) return true;
            }
        }
        return false;
    }

    // ── Utility ────────────────────────────────────────────

    getComponents(): PlacedComponent[] {
        return [...this.components];
    }

    getConnections(): Connection[] {
        return [...this.connections];
    }
}
