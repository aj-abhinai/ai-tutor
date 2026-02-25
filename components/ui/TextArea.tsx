import React from "react";

const variantStyles = {
    default: "border-border focus:border-border-focus focus:ring-2 focus:ring-accent-light",
    teal: "border-accent/30 bg-accent-light/40 focus:border-border-focus focus:ring-2 focus:ring-accent-light",
    indigo: "border-secondary/30 bg-secondary-light/40 focus:border-border-focus focus:ring-2 focus:ring-accent-light",
} as const;

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: keyof typeof variantStyles;
}

export function TextArea({ variant = "default", className = "", ...rest }: TextAreaProps) {
    return (
        <textarea
            {...rest}
            className={`w-full rounded-xl border bg-surface p-3 text-sm text-text outline-none transition-colors ${variantStyles[variant]} ${className}`}
        />
    );
}
