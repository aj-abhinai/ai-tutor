/**
 * Chemical Fun Facts — Short, kid-friendly facts shown on bottle hover
 * to enhance the learning experience.
 */

export interface ChemicalInfo {
    /** Short fun fact for kids */
    fact: string;
    /** Physical state: solid, liquid, gas, solution */
    state: string;
}

const CHEMICAL_FACTS: Record<string, ChemicalInfo> = {
    "Hydrochloric Acid (HCl)": {
        fact: "Your stomach uses this acid to digest food!",
        state: "Liquid",
    },
    "Sodium Hydroxide (NaOH)": {
        fact: "Also called caustic soda — used to make soap.",
        state: "Solid",
    },
    "Sulphuric Acid (H₂SO₄)": {
        fact: "Called the 'king of chemicals' — used in car batteries.",
        state: "Liquid",
    },
    "Potassium Hydroxide (KOH)": {
        fact: "Used to make soft soaps and liquid detergents.",
        state: "Solid",
    },
    "Zinc (Zn)": {
        fact: "Pennies are coated with zinc! It protects iron from rusting.",
        state: "Solid (Metal)",
    },
    "Magnesium (Mg)": {
        fact: "Burns with a dazzling bright white flame!",
        state: "Solid (Metal)",
    },
    "Iron (Fe)": {
        fact: "Earth's core is mostly iron — it makes compasses work!",
        state: "Solid (Metal)",
    },
    "Calcium Carbonate (CaCO₃)": {
        fact: "Found in chalk, marble, and seashells!",
        state: "Solid",
    },
    "Sodium Bicarbonate (NaHCO₃)": {
        fact: "It's baking soda — makes cakes rise!",
        state: "Solid",
    },
    "Baking Soda (NaHCO₃)": {
        fact: "Mix with vinegar for a fizzy volcano experiment!",
        state: "Solid",
    },
    "Vinegar (CH₃COOH)": {
        fact: "A weak acid found in your kitchen — made from fermented fruit.",
        state: "Liquid",
    },
    "Copper Sulphate Solution (CuSO₄)": {
        fact: "Its beautiful blue colour disappears when metals react with it!",
        state: "Solution",
    },
    "Sodium (Na)": {
        fact: "So reactive it explodes when dropped in water!",
        state: "Solid (Metal)",
    },
    "Calcium (Ca)": {
        fact: "Makes your bones and teeth strong!",
        state: "Solid (Metal)",
    },
    "Water (H₂O)": {
        fact: "Covers 71% of Earth — the universal solvent!",
        state: "Liquid",
    },
    "Carbon (C)": {
        fact: "Diamonds and pencil graphite are both pure carbon!",
        state: "Solid",
    },
    "Oxygen (O₂)": {
        fact: "You breathe it in — makes up 21% of air.",
        state: "Gas",
    },
    "Silver Nitrate (AgNO₃)": {
        fact: "Used in photography and to test for chloride ions.",
        state: "Solid",
    },
    "Sodium Chloride (NaCl)": {
        fact: "It's table salt — we eat it every day!",
        state: "Solid",
    },
    "Barium Chloride (BaCl₂)": {
        fact: "Used as a test reagent to detect sulphate ions.",
        state: "Solid",
    },
    "Sodium Sulphate (Na₂SO₄)": {
        fact: "Used in making detergents and paper pulp.",
        state: "Solid",
    },
    "Quick Lime (CaO)": {
        fact: "Gets very hot when mixed with water — used in cement!",
        state: "Solid",
    },
    "Phenolphthalein Solution": {
        fact: "An invisible ink! Turns pink only in bases.",
        state: "Solution",
    },
    "Lemon Juice (Citric Acid)": {
        fact: "A natural acid — that's what makes lemons sour!",
        state: "Liquid",
    },
    "Aluminium (Al)": {
        fact: "The most abundant metal on Earth — used in planes!",
        state: "Solid (Metal)",
    },
    "Lead Nitrate (Pb(NO₃)₂)": {
        fact: "Forms a beautiful 'golden rain' with potassium iodide!",
        state: "Solid",
    },
    "Potassium Iodide (KI)": {
        fact: "Added to table salt to prevent iodine deficiency.",
        state: "Solid",
    },
    "Copper (Cu)": {
        fact: "Turns green over time — like the Statue of Liberty!",
        state: "Solid (Metal)",
    },
};

export function getChemicalInfo(name: string): ChemicalInfo {
    return CHEMICAL_FACTS[name] ?? { fact: "A fascinating chemical!", state: "Unknown" };
}
