import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: "amber" | "teal" | "indigo" | "emerald" | "gray" | "rose" | "sky";
}

const variantStyles: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    teal: "bg-emerald-50 text-emerald-700 border-emerald-200",
    indigo: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gray: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",   // Hard difficulty
    sky: "bg-sky-50 text-sky-600 border-sky-200",       // Easy difficulty
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
