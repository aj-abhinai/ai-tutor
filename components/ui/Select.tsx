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
                className={`w-full p-4 text-lg border-2 rounded-lg outline-none transition-colors
                    ${disabled
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white border-gray-300 text-gray-800 hover:border-teal-400 focus:border-teal-500 cursor-pointer"
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
