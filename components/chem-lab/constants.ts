export const CHEM_BOTTLE_COLORS = [
  "#6db6ff",
  "#4ade80",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
  "#f87171",
  "#34d399",
  "#c084fc",
  "#e879f9",
  "#22d3ee",
  "#facc15",
  "#fb7185",
  "#818cf8",
  "#2dd4bf",
  "#f97316",
  "#a3e635",
  "#e11d48",
  "#6366f1",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
];

export function splitChemicalLabel(label: string): { name: string; formula: string } {
  const idx = label.indexOf(" (");
  if (idx < 0 || !label.endsWith(")")) {
    return { name: label, formula: "" };
  }
  return {
    name: label.slice(0, idx).trim(),
    formula: label.slice(idx + 2, -1).trim(),
  };
}
