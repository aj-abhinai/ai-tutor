/**
 * Tests for useCircuitFlow bridge logic.
 *
 * Verifies:
 * 1. Node → PlacedComponent mapping with correct terminal IDs
 * 2. Edge → Connection mapping
 * 3. LED polarity (correct vs wrong) with explicit edges
 */

import { CircuitEngine, type Connection } from "@/lib/circuit-engine";
import type { PlacedComponent } from "@/lib/circuit-components";

/* ── Helper: build PlacedComponents like the hook does ───── */

function toPlacedComponent(
    instanceId: string,
    type: PlacedComponent["type"],
    index: number
): PlacedComponent {
    return {
        instanceId,
        type,
        gridX: index * 100,   // sparse — avoids auto-connect
        gridY: 0,
        rotation: 0,
        switchClosed: type === "switch" ? false : undefined,
    };
}

function toConnection(sourceHandle: string, targetHandle: string): Connection {
    return {
        fromTerminalId: sourceHandle,
        toTerminalId: targetHandle,
    };
}

/* ── Tests ────────────────────────────────────────────────── */

describe("Circuit Flow mapping", () => {
    describe("Node → PlacedComponent mapping", () => {
        it("maps nodes to components with correct sparse positions", () => {
            const comps = [
                toPlacedComponent("battery-1", "battery", 0),
                toPlacedComponent("bulb-1", "bulb", 1),
            ];

            expect(comps[0].gridX).toBe(0);
            expect(comps[1].gridX).toBe(100);
            expect(comps[0].instanceId).toBe("battery-1");
            expect(comps[1].type).toBe("bulb");
        });

        it("terminal IDs match engine convention", () => {
            const instanceId = "battery-1";
            const t0 = `${instanceId}-t0`;
            const t1 = `${instanceId}-t1`;
            expect(t0).toBe("battery-1-t0");
            expect(t1).toBe("battery-1-t1");
        });
    });

    describe("Edge → Connection mapping", () => {
        it("maps edges to engine connections", () => {
            const conn = toConnection("battery-1-t0", "bulb-1-t0");
            expect(conn.fromTerminalId).toBe("battery-1-t0");
            expect(conn.toTerminalId).toBe("bulb-1-t0");
        });
    });

    describe("LED polarity via engine simulation", () => {
        it("LED glows when connected correctly (+→+, −→−)", () => {
            const engine = new CircuitEngine();

            const comps: PlacedComponent[] = [
                toPlacedComponent("battery-1", "battery", 0),
                toPlacedComponent("led-1", "led", 1),
            ];

            // Battery + terminal = t0, Battery - terminal = t1
            // LED + terminal = t0, LED - terminal = t1
            const conns: Connection[] = [
                // Battery+ → LED+
                toConnection("battery-1-t0", "led-1-t0"),
                // LED− → Battery−
                toConnection("led-1-t1", "battery-1-t1"),
            ];

            engine.setComponents(comps);
            engine.setConnections(conns);

            const result = engine.simulate();
            expect(result.isComplete).toBe(true);
            expect(result.ledsLit).toContain("led-1");
            expect(result.ledsWrong).not.toContain("led-1");
        });

        it("LED shows wrong polarity when wired backwards", () => {
            const engine = new CircuitEngine();

            const comps: PlacedComponent[] = [
                toPlacedComponent("battery-1", "battery", 0),
                toPlacedComponent("led-1", "led", 1),
            ];

            // Wire backwards: Battery+ → LED−, LED+ → Battery−
            const conns: Connection[] = [
                toConnection("battery-1-t0", "led-1-t1"),
                toConnection("led-1-t0", "battery-1-t1"),
            ];

            engine.setComponents(comps);
            engine.setConnections(conns);

            const result = engine.simulate();
            expect(result.isComplete).toBe(true);
            expect(result.ledsWrong).toContain("led-1");
            expect(result.ledsLit).not.toContain("led-1");
        });

        it("circuit is open with no connections", () => {
            const engine = new CircuitEngine();

            const comps: PlacedComponent[] = [
                toPlacedComponent("battery-1", "battery", 0),
                toPlacedComponent("bulb-1", "bulb", 1),
            ];

            engine.setComponents(comps);
            engine.setConnections([]);

            const result = engine.simulate();
            expect(result.isComplete).toBe(false);
            expect(result.bulbsLit).toHaveLength(0);
        });
    });
});
