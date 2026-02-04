import { SelectHTMLAttributes, forwardRef } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ options, placeholder, className = "", disabled, ...props }, ref) => {
        return (
            <select
                ref={ref}
                disabled={disabled}
                className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors
                    ${disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white/90 border-slate-200 text-slate-900 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                    } ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        );
    }
);

Select.displayName = "Select";
