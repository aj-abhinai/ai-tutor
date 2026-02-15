/**
 * Chemistry Flow tests — Validates:
 *  1. Reaction engine pair matching (order-agnostic)
 *  2. SimulationPlan effect mapping
 *  3. Chemical facts lookup
 */

import { findReaction, getChemicalsList, getDefaultReactionPair } from "@/lib/reaction-engine";
import { buildSimulationPlan } from "@/lib/simulation-engine";
import { getChemicalInfo } from "@/lib/chemical-facts";

// ── Reaction engine ─────────────────────────────────────────

describe("Chemistry reaction engine", () => {
    it("finds a known reaction (HCl + NaOH)", () => {
        const reaction = findReaction(
            "Hydrochloric Acid (HCl)",
            "Sodium Hydroxide (NaOH)"
        );
        expect(reaction).not.toBeNull();
        expect(reaction!.id).toBe("hcl-naoh");
        expect(reaction!.category).toBe("Neutralization");
    });

    it("finds reaction regardless of order", () => {
        const r1 = findReaction("Zinc (Zn)", "Hydrochloric Acid (HCl)");
        const r2 = findReaction("Hydrochloric Acid (HCl)", "Zinc (Zn)");
        expect(r1).not.toBeNull();
        expect(r2).not.toBeNull();
        expect(r1!.id).toBe(r2!.id);
    });

    it("returns null for unknown pair", () => {
        const reaction = findReaction("Water (H₂O)", "Oxygen (O₂)");
        expect(reaction).toBeNull();
    });

    it("getChemicalsList returns sorted unique names", () => {
        const list = getChemicalsList();
        expect(list.length).toBeGreaterThan(10);
        // Check sorted
        for (let i = 1; i < list.length; i++) {
            expect(list[i].localeCompare(list[i - 1])).toBeGreaterThanOrEqual(0);
        }
    });

    it("getDefaultReactionPair returns a valid pair", () => {
        const pair = getDefaultReactionPair();
        expect(pair).not.toBeNull();
        expect(pair!.chemicalA).toBeTruthy();
        expect(pair!.chemicalB).toBeTruthy();
    });
});

// ── Simulation plan mapping ─────────────────────────────────

describe("Simulation plan from reaction", () => {
    it("maps gas reaction to bubbles + gasReleased badge", () => {
        const reaction = findReaction("Zinc (Zn)", "Hydrochloric Acid (HCl)");
        expect(reaction).not.toBeNull();
        const plan = buildSimulationPlan(reaction!);
        expect(plan.effects.bubbles).toBe(true);
        expect(plan.badges.gasReleased).toBe(true);
        expect(plan.effects.heat).toBe("exothermic");
    });

    it("maps precipitate reaction correctly", () => {
        const reaction = findReaction(
            "Silver Nitrate (AgNO₃)",
            "Sodium Chloride (NaCl)"
        );
        expect(reaction).not.toBeNull();
        const plan = buildSimulationPlan(reaction!);
        expect(plan.effects.precipitate).toBe(true);
        expect(plan.badges.precipitate).toBe(true);
        expect(plan.badges.colorChange).toBe(true);
    });

    it("returns neutral plan for null reaction", () => {
        const plan = buildSimulationPlan(null);
        expect(plan.effects.bubbles).toBe(false);
        expect(plan.effects.precipitate).toBe(false);
        expect(plan.effects.heat).toBe("none");
        expect(plan.badges.gasReleased).toBe(false);
    });
});

// ── Chemical facts ──────────────────────────────────────────

describe("Chemical facts lookup", () => {
    it("returns fact for known chemical", () => {
        const info = getChemicalInfo("Hydrochloric Acid (HCl)");
        expect(info.fact).toContain("stomach");
        expect(info.state).toBe("Liquid");
    });

    it("returns fallback for unknown chemical", () => {
        const info = getChemicalInfo("Unknown XYZ");
        expect(info.fact).toBeTruthy();
        expect(info.state).toBe("Unknown");
    });
});
