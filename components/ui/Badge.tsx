import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "amber" | "teal" | "indigo" | "emerald" | "gray";
}

const variantStyles: Record<string, string> = {
    amber: "bg-white text-amber-700 border-amber-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = "amber", className = "", children, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = "Badge";
