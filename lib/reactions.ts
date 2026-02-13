/**
 * Reaction Dataset – Common Class 7 NCERT Chemical Reactions
 *
 * Each reaction includes reactants, balanced equation, products,
 * visual metadata (colour, gas, heat, precipitate), and a category.
 */

export interface ReactionVisual {
    color?: string;          // CSS colour for the result flask
    gas?: boolean;           // show bubbles animation
    heat?: "exothermic" | "endothermic" | null;
    precipitate?: boolean;   // solid forming
}

export interface Reaction {
    id: string;
    reactantA: string;
    reactantB: string;
    equation: string;
    products: string;
    visual: ReactionVisual;
    category: string;
}

const REACTIONS: Reaction[] = [
    // ── Neutralization ─────────────────────────────────────────────
    {
        id: "hcl-naoh",
        reactantA: "Hydrochloric Acid (HCl)",
        reactantB: "Sodium Hydroxide (NaOH)",
        equation: "HCl + NaOH → NaCl + H₂O",
        products: "Sodium Chloride + Water",
        visual: { color: "#d4f1f9", heat: "exothermic" },
        category: "Neutralization",
    },
    {
        id: "h2so4-koh",
        reactantA: "Sulphuric Acid (H₂SO₄)",
        reactantB: "Potassium Hydroxide (KOH)",
        equation: "H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O",
        products: "Potassium Sulphate + Water",
        visual: { color: "#e0e7ff", heat: "exothermic" },
        category: "Neutralization",
    },

    {
        id: "hcl-koh",
        reactantA: "Hydrochloric Acid (HCl)",
        reactantB: "Potassium Hydroxide (KOH)",
        equation: "HCl + KOH → KCl + H₂O",
        products: "Potassium Chloride + Water",
        visual: { color: "#eef2ff", heat: "exothermic" },
        category: "Neutralization",
    },
    {
        id: "h2so4-naoh",
        reactantA: "Sulphuric Acid (H₂SO₄)",
        reactantB: "Sodium Hydroxide (NaOH)",
        equation: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
        products: "Sodium Sulphate + Water",
        visual: { color: "#e0f2f1", heat: "exothermic" },
        category: "Neutralization",
    },

    // ── Neutralization (Cross-Acid/Base) above ─────────────────────

    // ── Metal + Acid ───────────────────────────────────────────────
    {
        id: "zn-hcl",
        reactantA: "Zinc (Zn)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "Zn + 2HCl → ZnCl₂ + H₂↑",
        products: "Zinc Chloride + Hydrogen gas",
        visual: { color: "#f0f4c3", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },
    {
        id: "mg-hcl",
        reactantA: "Magnesium (Mg)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "Mg + 2HCl → MgCl₂ + H₂↑",
        products: "Magnesium Chloride + Hydrogen gas",
        visual: { color: "#e8f5e9", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },
    {
        id: "fe-hcl",
        reactantA: "Iron (Fe)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "Fe + 2HCl → FeCl₂ + H₂↑",
        products: "Ferrous Chloride + Hydrogen gas",
        visual: { color: "#dcedc8", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },
    {
        id: "fe-h2so4",
        reactantA: "Iron (Fe)",
        reactantB: "Sulphuric Acid (H₂SO₄)",
        equation: "Fe + H₂SO₄ → FeSO₄ + H₂↑",
        products: "Iron Sulphate + Hydrogen gas",
        visual: { color: "#c8e6c9", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },
    {
        id: "zn-h2so4",
        reactantA: "Zinc (Zn)",
        reactantB: "Sulphuric Acid (H₂SO₄)",
        equation: "Zn + H₂SO₄ → ZnSO₄ + H₂↑",
        products: "Zinc Sulphate + Hydrogen gas",
        visual: { color: "#e6ee9c", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },
    {
        id: "mg-h2so4",
        reactantA: "Magnesium (Mg)",
        reactantB: "Sulphuric Acid (H₂SO₄)",
        equation: "Mg + H₂SO₄ → MgSO₄ + H₂↑",
        products: "Magnesium Sulphate + Hydrogen gas",
        visual: { color: "#c5e1a5", gas: true, heat: "exothermic" },
        category: "Metal–Acid",
    },

    // ── Carbonate + Acid ───────────────────────────────────────────
    {
        id: "caco3-hcl",
        reactantA: "Calcium Carbonate (CaCO₃)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑",
        products: "Calcium Chloride + Water + Carbon Dioxide gas",
        visual: { color: "#fff9c4", gas: true, heat: "exothermic" },
        category: "Carbonate–Acid",
    },
    {
        id: "nahco3-hcl",
        reactantA: "Sodium Bicarbonate (NaHCO₃)",
        reactantB: "Hydrochloric Acid (HCl)",
        equation: "NaHCO₃ + HCl → NaCl + H₂O + CO₂↑",
        products: "Sodium Chloride + Water + Carbon Dioxide gas",
        visual: { color: "#fffde7", gas: true },
        category: "Carbonate–Acid",
    },
    {
        id: "nahco3-h2so4",
        reactantA: "Sodium Bicarbonate (NaHCO₃)",
        reactantB: "Sulphuric Acid (H₂SO₄)",
        equation: "2NaHCO₃ + H₂SO₄ → Na₂SO₄ + 2H₂O + 2CO₂↑",
        products: "Sodium Sulphate + Water + Carbon Dioxide gas",
        visual: { color: "#ffecb3", gas: true },
        category: "Carbonate–Acid",
    },
    {
        id: "nahco3-vinegar",
        reactantA: "Baking Soda (NaHCO₃)",
        reactantB: "Vinegar (CH₃COOH)",
        equation: "NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑",
        products: "Sodium Acetate + Water + Carbon Dioxide gas",
        visual: { color: "#fff8e1", gas: true },
        category: "Carbonate–Acid",
    },
    {
        id: "caco3-vinegar",
        reactantA: "Calcium Carbonate (CaCO₃)",
        reactantB: "Vinegar (CH₃COOH)",
        equation: "CaCO₃ + 2CH₃COOH → (CH₃COO)₂Ca + H₂O + CO₂↑",
        products: "Calcium Acetate + Water + Carbon Dioxide gas",
        visual: { color: "#fffde7", gas: true },
        category: "Carbonate–Acid",
    },

    // ── Displacement ───────────────────────────────────────────────
    {
        id: "fe-cuso4",
        reactantA: "Iron (Fe)",
        reactantB: "Copper Sulphate Solution (CuSO₄)",
        equation: "Fe + CuSO₄ → FeSO₄ + Cu",
        products: "Iron Sulphate + Copper (deposited)",
        visual: { color: "#a5d6a7", precipitate: true },
        category: "Displacement",
    },
    {
        id: "zn-cuso4",
        reactantA: "Zinc (Zn)",
        reactantB: "Copper Sulphate Solution (CuSO₄)",
        equation: "Zn + CuSO₄ → ZnSO₄ + Cu",
        products: "Zinc Sulphate + Copper (deposited)",
        visual: { color: "#b2dfdb", precipitate: true },
        category: "Displacement",
    },
    {
        id: "mg-cuso4",
        reactantA: "Magnesium (Mg)",
        reactantB: "Copper Sulphate Solution (CuSO₄)",
        equation: "Mg + CuSO₄ → MgSO₄ + Cu",
        products: "Magnesium Sulphate + Copper (deposited)",
        visual: { color: "#80cbc4", precipitate: true, heat: "exothermic" },
        category: "Displacement",
    },

    // ── Reactive Metal + Water ─────────────────────────────────────
    {
        id: "na-h2o",
        reactantA: "Sodium (Na)",
        reactantB: "Water (H₂O)",
        equation: "2Na + 2H₂O → 2NaOH + H₂↑",
        products: "Sodium Hydroxide + Hydrogen gas",
        visual: { color: "#ffcdd2", gas: true, heat: "exothermic" },
        category: "Metal–Water",
    },
    {
        id: "ca-h2o",
        reactantA: "Calcium (Ca)",
        reactantB: "Water (H₂O)",
        equation: "Ca + 2H₂O → Ca(OH)₂ + H₂↑",
        products: "Calcium Hydroxide (slaked lime) + Hydrogen gas",
        visual: { color: "#f8bbd0", gas: true, heat: "exothermic" },
        category: "Metal–Water",
    },

    // ── Combustion ─────────────────────────────────────────────────
    {
        id: "c-o2",
        reactantA: "Carbon (C)",
        reactantB: "Oxygen (O₂)",
        equation: "C + O₂ → CO₂",
        products: "Carbon Dioxide",
        visual: { color: "#ffecb3", heat: "exothermic" },
        category: "Combustion",
    },
    {
        id: "mg-o2",
        reactantA: "Magnesium (Mg)",
        reactantB: "Oxygen (O₂)",
        equation: "2Mg + O₂ → 2MgO",
        products: "Magnesium Oxide (bright white flame)",
        visual: { color: "#ffffff", heat: "exothermic" },
        category: "Combustion",
    },

    // ── Precipitation ──────────────────────────────────────────────
    {
        id: "agno3-nacl",
        reactantA: "Silver Nitrate (AgNO₃)",
        reactantB: "Sodium Chloride (NaCl)",
        equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
        products: "Silver Chloride (white precipitate) + Sodium Nitrate",
        visual: { color: "#eceff1", precipitate: true },
        category: "Double Displacement",
    },
    {
        id: "bacl2-na2so4",
        reactantA: "Barium Chloride (BaCl₂)",
        reactantB: "Sodium Sulphate (Na₂SO₄)",
        equation: "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl",
        products: "Barium Sulphate (white precipitate) + Sodium Chloride",
        visual: { color: "#f5f5f5", precipitate: true },
        category: "Double Displacement",
    },

    // ── Lime + Water (slaking) ─────────────────────────────────────
    {
        id: "cao-h2o",
        reactantA: "Quick Lime (CaO)",
        reactantB: "Water (H₂O)",
        equation: "CaO + H₂O → Ca(OH)₂",
        products: "Slaked Lime (Calcium Hydroxide)",
        visual: { color: "#fff3e0", heat: "exothermic" },
        category: "Combination",
    },
];

export default REACTIONS;
