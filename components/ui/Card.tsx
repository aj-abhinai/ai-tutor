import React from "react";

const variants = {
    default:
        "bg-surface/85 border border-border shadow-[0_16px_32px_rgba(10,24,54,0.06)] backdrop-blur-sm",
    highlight:
        "bg-surface/90 border border-border shadow-[0_24px_48px_rgba(10,24,54,0.08)] backdrop-blur-sm",
    subtle: "bg-surface/70 border border-border shadow-[0_10px_24px_rgba(10,24,54,0.04)]",
} as const;

const paddings = {
    none: "",
    md: "p-4",
    lg: "p-6",
} as const;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof variants;
    padding?: keyof typeof paddings;
}

export function Card({
    variant = "default",
    padding = "md",
    className = "",
    children,
    ...rest
}: CardProps) {
    return (
        <div
            className={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
}
