import type { Reaction } from "./reactions";

export interface SimulationPlan {
    timeline: {
        toPourA: number;
        toPickB: number;
        toPourB: number;
        toReact: number;
    };
    liquid: {
        initialHeight: string;
        finalHeight: string;
        initialColor: string;
        finalColor: string;
        opacity: number;
    };
    effects: {
        bubbles: boolean;
        precipitate: boolean;
        smoke: boolean;
        heat: "exothermic" | "endothermic" | "none";
    };
    badges: {
        colorChange: boolean;
        gasReleased: boolean;
        precipitate: boolean;
    };
}

/**
 * Convert a chemistry outcome into deterministic animation triggers.
 */
export function buildSimulationPlan(reaction: Reaction | null): SimulationPlan {
    if (!reaction) {
        return {
            timeline: {
                toPourA: 240,
                toPickB: 700,
                toPourB: 1040,
                toReact: 1500,
            },
            liquid: {
                initialHeight: "36%",
                finalHeight: "44%",
                initialColor: "#dbeafe",
                finalColor: "#cbd5e1",
                opacity: 0.72,
            },
            effects: {
                bubbles: false,
                precipitate: false,
                smoke: false,
                heat: "none",
            },
            badges: {
                colorChange: false,
                gasReleased: false,
                precipitate: false,
            },
        };
    }

    const heat = reaction.visual.heat ?? "none";
    const timeline =
        reaction.category === "Double Displacement"
            ? { toPourA: 300, toPickB: 840, toPourB: 1220, toReact: 1800 }
            : reaction.category === "Metal–Acid" || reaction.category === "Carbonate–Acid"
                ? { toPourA: 220, toPickB: 680, toPourB: 980, toReact: 1400 }
                : { toPourA: 260, toPickB: 760, toPourB: 1120, toReact: 1650 };

    return {
        timeline,
        liquid: {
            initialHeight: "36%",
            finalHeight: "72%",
            initialColor: "#dbeafe",
            finalColor: reaction.visual.color ?? "#cbd5e1",
            opacity: 0.86,
        },
        effects: {
            bubbles: Boolean(reaction.visual.gas),
            precipitate: Boolean(reaction.visual.precipitate),
            smoke: heat === "exothermic",
            heat,
        },
        badges: {
            colorChange: Boolean(reaction.visual.color),
            gasReleased: Boolean(reaction.visual.gas),
            precipitate: Boolean(reaction.visual.precipitate),
        },
    };
}
