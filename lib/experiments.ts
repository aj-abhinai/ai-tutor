/**
 * Guided Experiments — Step-by-step lab activities.
 * Now includes richer educational metadata (ageMin/Max, concept, whyItHappens, chapterId).
 * Used as local fallback when Firestore is unavailable.
 */

export interface ExperimentStep {
    instruction: string;
    expectedChemical: string; // must match getChemicalsList() entry exactly
    hint?: string;
}

export interface ObservationQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface Experiment {
    id: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    category: string;
    reactionId: string;         // links to reaction.id
    steps: ExperimentStep[];
    observation?: ObservationQuestion;
    // — richer educational metadata —
    ageMin: number;             // minimum target age
    ageMax: number;             // maximum target age
    concept: string;            // core concept this experiment teaches
    whyItHappens: string;       // plain-language explanation of the mechanism
    chapterId?: string;         // NCERT chapter ID in Firestore (if applicable)
    chapterName?: string;       // human-readable chapter name
}

const EXPERIMENTS: Experiment[] = [
    {
        id: "exp-baking-soda-volcano",
        title: "Baking Soda Volcano",
        description: "Mix vinegar and baking soda to create a fizzy eruption — the classic beginner experiment!",
        difficulty: "easy",
        category: "Carbonate–Acid",
        reactionId: "nahco3-vinegar",
        ageMin: 8,
        ageMax: 12,
        concept: "Acid-Carbonate Reaction & CO₂ Gas Production",
        whyItHappens: "Vinegar (acetic acid) donates a hydrogen ion (H⁺) to baking soda (NaHCO₃). This breaks the carbonate group, releasing carbon dioxide gas (CO₂) — the fizz you see. It's the same reaction that makes bread rise!",
        chapterId: "science-7-ch5",
        chapterName: "Acids, Bases and Salts",
        steps: [
            {
                instruction: "Drag **Vinegar** into the beaker",
                expectedChemical: "Vinegar (CH₃COOH)",
                hint: "It's labelled CH₃COOH — a common kitchen acid.",
            },
            {
                instruction: "Now add **Baking Soda** to start the reaction",
                expectedChemical: "Baking Soda (NaHCO₃)",
                hint: "Look for NaHCO₃ on the shelf.",
            },
        ],
        observation: {
            question: "What gas was released during this reaction?",
            options: ["Oxygen (O₂)", "Hydrogen (H₂)", "Carbon Dioxide (CO₂)", "Nitrogen (N₂)"],
            correctIndex: 2,
        },
    },
    {
        id: "exp-acid-metal",
        title: "Metal in Acid",
        description: "Drop zinc into hydrochloric acid and watch hydrogen gas bubble out.",
        difficulty: "easy",
        category: "Metal–Acid",
        reactionId: "zn-hcl",
        ageMin: 10,
        ageMax: 14,
        concept: "Metal–Acid Displacement & Hydrogen Gas",
        whyItHappens: "Zinc is higher in the reactivity series than hydrogen. When zinc meets HCl, it pushes hydrogen out of the acid compound. The released hydrogen bubbles up as gas, and zinc chloride stays in solution.",
        chapterId: "science-7-ch5",
        chapterName: "Acids, Bases and Salts",
        steps: [
            {
                instruction: "Add **Hydrochloric Acid** to the beaker",
                expectedChemical: "Hydrochloric Acid (HCl)",
                hint: "Find the bottle labelled HCl.",
            },
            {
                instruction: "Now drop in **Zinc** to start the reaction",
                expectedChemical: "Zinc (Zn)",
                hint: "Zinc is a silvery-grey metal — look for Zn.",
            },
        ],
        observation: {
            question: "What type of reaction is this?",
            options: ["Neutralization", "Displacement", "Double Displacement", "Combustion"],
            correctIndex: 1,
        },
    },
    {
        id: "exp-neutralization",
        title: "Neutralization",
        description: "Combine an acid with a base to make salt and water — feel the heat!",
        difficulty: "medium",
        category: "Neutralization",
        reactionId: "hcl-naoh",
        ageMin: 11,
        ageMax: 15,
        concept: "Acid-Base Neutralization & Salt Formation",
        whyItHappens: "HCl releases H⁺ ions; NaOH releases OH⁻ ions. When they meet, H⁺ and OH⁻ combine to form water (H₂O). The leftover Na⁺ and Cl⁻ ions form sodium chloride (table salt). Energy is released as heat — this is called an exothermic reaction.",
        chapterId: "science-7-ch5",
        chapterName: "Acids, Bases and Salts",
        steps: [
            {
                instruction: "Add **Hydrochloric Acid** to the beaker",
                expectedChemical: "Hydrochloric Acid (HCl)",
                hint: "HCl is a strong acid.",
            },
            {
                instruction: "Now add **Sodium Hydroxide** to neutralize it",
                expectedChemical: "Sodium Hydroxide (NaOH)",
                hint: "NaOH is a strong base — look for the NaOH label.",
            },
        ],
        observation: {
            question: "Is this reaction exothermic or endothermic?",
            options: ["Exothermic (releases heat)", "Endothermic (absorbs heat)", "Neither"],
            correctIndex: 0,
        },
    },
    {
        id: "exp-displacement",
        title: "Iron Displaces Copper",
        description: "Watch iron kick copper out of its sulphate solution — a colour change you can see!",
        difficulty: "medium",
        category: "Displacement",
        reactionId: "fe-cuso4",
        ageMin: 11,
        ageMax: 15,
        concept: "Single Displacement & Reactivity Series",
        whyItHappens: "Iron is higher in the reactivity series than copper. Iron atoms give electrons to Cu²⁺ ions in solution, turning them into neutral copper metal (you see brown coating). Iron dissolves as Fe²⁺, making the blue solution turn pale green.",
        chapterId: "science-7-ch6",
        chapterName: "Physical and Chemical Changes",
        steps: [
            {
                instruction: "Add **Copper Sulphate Solution** to the beaker",
                expectedChemical: "Copper Sulphate Solution (CuSO₄)",
                hint: "It's the bright blue solution — CuSO₄.",
            },
            {
                instruction: "Now add **Iron** to displace the copper",
                expectedChemical: "Iron (Fe)",
                hint: "Look for Fe on the shelf.",
            },
        ],
        observation: {
            question: "What do you observe happening to the blue colour?",
            options: [
                "It becomes darker blue",
                "It fades to green as copper is displaced",
                "No colour change",
                "It turns red",
            ],
            correctIndex: 1,
        },
    },
    {
        id: "exp-golden-rain",
        title: "Golden Rain",
        description: "Mix lead nitrate with potassium iodide to see a beautiful yellow precipitate form.",
        difficulty: "hard",
        category: "Double Displacement",
        reactionId: "pbn03-ki",
        ageMin: 13,
        ageMax: 15,
        concept: "Double Displacement & Precipitate Formation",
        whyItHappens: "When two solutions are mixed, the ions swap partners. Pb²⁺ ions from lead nitrate pair with I⁻ ions from potassium iodide to form PbI₂ — a compound that is insoluble in water. It falls out as a bright yellow solid called a precipitate.",
        chapterId: "science-7-ch6",
        chapterName: "Physical and Chemical Changes",
        steps: [
            {
                instruction: "Add **Lead Nitrate** to the beaker",
                expectedChemical: "Lead Nitrate (Pb(NO₃)₂)",
                hint: "The bottle is labelled Pb(NO₃)₂.",
            },
            {
                instruction: "Now add **Potassium Iodide** to see the golden precipitate",
                expectedChemical: "Potassium Iodide (KI)",
                hint: "KI — Potassium Iodide.",
            },
        ],
        observation: {
            question: "What type of reaction produced the yellow precipitate?",
            options: ["Combustion", "Decomposition", "Double Displacement", "Combination"],
            correctIndex: 2,
        },
    },
];

export default EXPERIMENTS;
