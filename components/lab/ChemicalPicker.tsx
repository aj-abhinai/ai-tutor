"use client";

import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ChemicalPickerProps {
    options: { value: string; label: string }[];
    chemicalA: string;
    chemicalB: string;
    onChemicalAChange: (value: string) => void;
    onChemicalBChange: (value: string) => void;
    onMix: () => void;
    loading: boolean;
    disabled: boolean;
}

export function ChemicalPicker({
    options,
    chemicalA,
    chemicalB,
    onChemicalAChange,
    onChemicalBChange,
    onMix,
    loading,
    disabled,
}: ChemicalPickerProps) {
    return (
        <Card variant="highlight" padding="lg">
            <div className="flex flex-col gap-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Chemical A
                    </label>
                    <Select
                        options={options}
                        placeholder="Select first chemical..."
                        value={chemicalA}
                        onChange={(e) => onChemicalAChange(e.target.value)}
                    />
                </div>

                <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-400">+</span>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Chemical B
                    </label>
                    <Select
                        options={options}
                        placeholder="Select second chemical..."
                        value={chemicalB}
                        onChange={(e) => onChemicalBChange(e.target.value)}
                    />
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onMix}
                    disabled={disabled || loading}
                    className="mt-1"
                >
                    {loading ? "Mixing..." : "Mix"}
                </Button>
            </div>
        </Card>
    );
}
