import React from "react";

const variants = {
    amber: "bg-warning-light text-warning border-warning/30",
    teal: "bg-accent-light text-accent-hover border-accent/30",
    indigo: "bg-secondary-light text-secondary border-secondary/30",
    emerald: "bg-accent-light text-accent-hover border-accent/30",
    gray: "bg-muted-bg text-text border-border",
    rose: "bg-error-light text-error border-error/30",
    sky: "bg-accent-light text-accent-hover border-accent/30",
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: keyof typeof variants;
}

export function Badge({ variant = "gray", children, className = "", ...rest }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
            {...rest}
        >
            {children}
        </span>
    );
}
