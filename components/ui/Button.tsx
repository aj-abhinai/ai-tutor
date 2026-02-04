import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

const variantStyles: Record<string, string> = {
    primary:
        "bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-[0_12px_26px_rgba(16,185,129,0.35)]",
    secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50",
    ghost:
        "bg-white/80 border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-50",
    danger:
        "bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50",
};

const sizeStyles: Record<string, string> = {
    sm: "px-3 py-2 text-sm rounded-lg font-semibold",
    md: "px-4 py-3 text-base rounded-xl font-semibold",
    lg: "px-6 py-4 text-xl rounded-xl font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", fullWidth, className = "", children, ...props }, ref) => {
        const base =
            "transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-50";
        const width = fullWidth ? "w-full" : "";

        return (
            <button
                ref={ref}
                className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${width} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
