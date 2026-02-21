/**
 * Chemistry Flow tests - Validates:
 *  1. Reaction engine pair matching (order-agnostic)
 *  2. SimulationPlan effect mapping
 */

import type { Reaction } from "@/lib/reactions";
import { findReaction, getChemicalsList, getDefaultReactionPair } from "@/lib/reaction-engine";
import { buildSimulationPlan } from "@/lib/simulation-engine";

const TEST_REACTIONS: Reaction[] = [
    {
        id: "hcl-naoh",
        reactantA: "Hydrochloric Acid (HCl)",
        reactantB: "Sodium Hydroxide (NaOH)",
        equation: "HCl + NaOH -> NaCl + H2O",
        products: "Sodium Chloride + Water",
        visual: { color: "#d4f1f9", heat: "exothermic" },
        category: "Neutralization",
    },
    {
        id: "zn-hcl",
        reactantA: "Zinc (Zn)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "Zn + 2HCl -> ZnCl2 + H2",
        products: "Zinc Chloride + Hydrogen gas",
        visual: { color: "#f0f4c3", gas: true, heat: "exothermic" },
        category: "Metal-Acid",
    },
    {
        id: "agno3-nacl",
        reactantA: "Silver Nitrate (AgNO3)",
        reactantB: "Sodium Chloride (NaCl)",
        equation: "AgNO3 + NaCl -> AgCl + NaNO3",
        products: "Silver Chloride + Sodium Nitrate",
        visual: { color: "#eceff1", precipitate: true },
        category: "Double Displacement",
    },
];

describe("Chemistry reaction engine", () => {
    it("finds a known reaction (HCl + NaOH)", () => {
        const reaction = findReaction(
            "Hydrochloric Acid (HCl)",
            "Sodium Hydroxide (NaOH)",
            TEST_REACTIONS
        );
        expect(reaction).not.toBeNull();
        expect(reaction!.id).toBe("hcl-naoh");
        expect(reaction!.category).toBe("Neutralization");
    });

    it("finds reaction regardless of order", () => {
        const r1 = findReaction("Zinc (Zn)", "Hydrochloric Acid (HCl)", TEST_REACTIONS);
        const r2 = findReaction("Hydrochloric Acid (HCl)", "Zinc (Zn)", TEST_REACTIONS);
        expect(r1).not.toBeNull();
        expect(r2).not.toBeNull();
        expect(r1!.id).toBe(r2!.id);
    });

    it("returns null for unknown pair", () => {
        const reaction = findReaction("Water (H2O)", "Oxygen (O2)", TEST_REACTIONS);
        expect(reaction).toBeNull();
    });

    it("getChemicalsList returns sorted unique names", () => {
        const list = getChemicalsList(TEST_REACTIONS);
        expect(list.length).toBeGreaterThan(3);
        for (let i = 1; i < list.length; i += 1) {
            expect(list[i].localeCompare(list[i - 1])).toBeGreaterThanOrEqual(0);
        }
    });

    it("getDefaultReactionPair returns a valid pair", () => {
        const pair = getDefaultReactionPair(TEST_REACTIONS);
        expect(pair).not.toBeNull();
        expect(pair!.chemicalA).toBeTruthy();
        expect(pair!.chemicalB).toBeTruthy();
    });
});

describe("Simulation plan from reaction", () => {
    it("maps gas reaction to bubbles + gasReleased badge", () => {
        const reaction = findReaction("Zinc (Zn)", "Hydrochloric Acid (HCl)", TEST_REACTIONS);
        expect(reaction).not.toBeNull();
        const plan = buildSimulationPlan(reaction);
        expect(plan.effects.bubbles).toBe(true);
        expect(plan.badges.gasReleased).toBe(true);
        expect(plan.effects.heat).toBe("exothermic");
    });

    it("maps precipitate reaction correctly", () => {
        const reaction = findReaction(
            "Silver Nitrate (AgNO3)",
            "Sodium Chloride (NaCl)",
            TEST_REACTIONS
        );
        expect(reaction).not.toBeNull();
        const plan = buildSimulationPlan(reaction);
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

