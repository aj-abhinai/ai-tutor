import React from "react";

const variants = {
    primary:
        "bg-primary text-text-on-primary hover:bg-primary-hover disabled:opacity-50 shadow-[0_12px_26px_rgba(247,97,21,0.35)]",
    secondary:
        "bg-secondary text-text-on-secondary hover:bg-secondary-hover disabled:opacity-50 shadow-[0_10px_22px_rgba(92,49,181,0.25)]",
    neutral:
        "bg-muted-bg text-text hover:bg-border disabled:opacity-50",
    accent:
        "bg-accent text-text hover:bg-accent-hover disabled:opacity-50 shadow-[0_10px_22px_rgba(19,215,197,0.25)]",
    warning:
        "bg-warning text-text-on-primary hover:bg-primary-hover disabled:opacity-50",
    outline:
        "bg-surface/80 border border-border text-text hover:bg-surface disabled:opacity-50",
    ghost: "bg-transparent text-text hover:bg-muted-bg disabled:opacity-50",
    danger:
        "bg-error text-white hover:bg-primary-hover disabled:opacity-50",
} as const;

const sizes = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
    fullWidth?: boolean;
}

export function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    children,
    ...rest
}: ButtonProps) {
    const base =
        "transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background";
    const w = fullWidth ? "w-full" : "";
    return (
        <button
            className={`${base} rounded-xl font-semibold ${variants[variant]} ${sizes[size]} ${w} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}
