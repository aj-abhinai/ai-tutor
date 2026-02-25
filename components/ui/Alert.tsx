import React from "react";

const variants = {
    error: "text-error bg-error-light border-error/20",
    success: "text-accent-hover bg-accent-light border-accent/20",
    warning: "text-warning bg-warning-light border-warning/20",
    info: "text-text-muted bg-surface/70 border-border",
} as const;

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: keyof typeof variants;
}

export function Alert({ variant = "info", children, className = "", role = "alert", ...rest }: AlertProps) {
    return (
        <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${variants[variant]} ${className}`}
            role={role}
            {...rest}
        >
            {children}
        </div>
    );
}
