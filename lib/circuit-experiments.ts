/**
 * Guided circuit experiments for the physics lab.
 *
 * Each experiment belongs to a chapter and defines step-by-step
 * instructions for building a specific circuit.
 */

import type { ComponentType } from "./circuit-components";

// ── Types ──────────────────────────────────────────────────

export interface ExperimentStep {
    instruction: string;
    hint: string;
    /** Component type the student should place in this step */
    expectedComponent?: ComponentType;
    /** After this step, should the student toggle a switch? */
    toggleSwitch?: boolean;
    /** Education tip shown after completing this step */
    successTip?: string;
}

export interface CircuitExperiment {
    id: string;
    title: string;
    description: string;
    conceptTaught: string;
    difficulty: "easy" | "medium";
    steps: ExperimentStep[];
}

export interface ChapterLab {
    chapterId: string;
    chapterTitle: string;
    experiments: CircuitExperiment[];
}

// ── Chapter 3 experiments ──────────────────────────────────

const CHAPTER_3_EXPERIMENTS: CircuitExperiment[] = [
    {
        id: "light-the-bulb",
        title: "Light the Bulb 💡",
        description:
            "Build a simple circuit with a battery, wires, and a bulb to make it glow.",
        conceptTaught:
            "A complete closed loop is needed for current to flow and a bulb to glow.",
        difficulty: "easy",
        steps: [
            {
                instruction: "Place a Battery on the board.",
                hint: "Drag the 🔋 Battery from the tray onto the grid.",
                expectedComponent: "battery",
                successTip:
                    "A battery has two terminals: positive (+) and negative (−). It pushes current through the circuit!",
            },
            {
                instruction: "Place a Bulb on the board.",
                hint: "Drag the 💡 Bulb from the tray.",
                expectedComponent: "bulb",
                successTip:
                    "A bulb has a thin filament inside. When current flows through it, it heats up and glows!",
            },
            {
                instruction: "Connect the battery's + terminal to one side of the bulb using a Wire.",
                hint: "Place a wire so one end touches the battery's + terminal and the other touches the bulb.",
                expectedComponent: "wire",
                successTip:
                    "Wires are made of metal (a conductor) so current can flow through them.",
            },
            {
                instruction: "Connect the other side of the bulb back to the battery's − terminal with another Wire.",
                hint: "Complete the loop! The circuit must form a closed path.",
                expectedComponent: "wire",
                successTip:
                    "🎉 The circuit is complete! Current flows from + through the bulb to −. This closed path is called a circuit.",
            },
        ],
    },
    {
        id: "add-a-switch",
        title: "Add a Switch 🔘",
        description:
            "Add a switch to your circuit and see how it controls the bulb.",
        conceptTaught:
            "A switch opens or closes the circuit. An open switch breaks the loop and stops current.",
        difficulty: "easy",
        steps: [
            {
                instruction: "Place a Battery on the board.",
                hint: "Drag the 🔋 Battery from the tray.",
                expectedComponent: "battery",
                successTip: "The battery will power our circuit.",
            },
            {
                instruction: "Place a Switch next to the battery.",
                hint: "Drag the 🔘 Switch from the tray.",
                expectedComponent: "switch",
                successTip:
                    "A switch has two positions: open (off) and closed (on). Right now it's open!",
            },
            {
                instruction: "Place a Bulb on the board.",
                hint: "Drag the 💡 Bulb from the tray.",
                expectedComponent: "bulb",
                successTip: "The bulb will only glow when the circuit is complete.",
            },
            {
                instruction: "Connect all components with Wires to form a loop: Battery → Switch → Bulb → Battery.",
                hint: "Use wires to connect: battery + → switch → bulb → battery −",
                expectedComponent: "wire",
                successTip:
                    "The circuit is built but the switch is open. The bulb won't glow yet!",
            },
            {
                instruction: "Click the Switch to close it (turn ON).",
                hint: "Click on the switch component to toggle it closed.",
                toggleSwitch: true,
                successTip:
                    "🎉 The switch closed the circuit! Current now flows and the bulb glows. Try opening it again to turn the bulb off.",
            },
        ],
    },
    {
        id: "led-direction",
        title: "LED Direction 🔴",
        description:
            "Discover that an LED only glows when connected the right way around.",
        conceptTaught:
            "An LED allows current in only one direction. The longer leg is positive (+).",
        difficulty: "medium",
        steps: [
            {
                instruction: "Place a Battery on the board.",
                hint: "Drag the 🔋 Battery from the tray.",
                expectedComponent: "battery",
                successTip: "The battery provides energy for the LED.",
            },
            {
                instruction: "Place an LED on the board.",
                hint: "Drag the 🔴 LED from the tray. Notice it has a + and − side.",
                expectedComponent: "led",
                successTip:
                    "An LED (Light Emitting Diode) has two legs. The longer one is positive (+).",
            },
            {
                instruction: "Connect the battery to the LED with Wires. Try connecting battery + to LED + and battery − to LED −.",
                hint: "Use two wires to complete the loop: battery → LED → battery.",
                expectedComponent: "wire",
                successTip:
                    "🎉 The LED glows! Current flows from battery + through the LED in the correct direction.",
            },
        ],
    },
];

// ── Registry ───────────────────────────────────────────────

const CHAPTER_LABS: ChapterLab[] = [
    {
        chapterId: "electricity-circuits",
        chapterTitle: "Electricity: Circuits and Their Components",
        experiments: CHAPTER_3_EXPERIMENTS,
    },
];

/**
 * Get the lab data for a given chapter ID.
 * Returns undefined if the chapter has no lab experiments.
 */
export function getChapterLab(chapterId: string): ChapterLab | undefined {
    return CHAPTER_LABS.find((lab) => lab.chapterId === chapterId);
}

/**
 * Check if a chapter has lab experiments available.
 */
export function hasLabExperiments(chapterId: string): boolean {
    return CHAPTER_LABS.some((lab) => lab.chapterId === chapterId);
}

/**
 * Get all chapter IDs that have lab experiments.
 */
export function getLabChapterIds(): string[] {
    return CHAPTER_LABS.map((lab) => lab.chapterId);
}
