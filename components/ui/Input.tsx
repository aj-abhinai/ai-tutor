import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function Input({ className = "", ...rest }: InputProps) {
    return (
        <input
            {...rest}
            className={`w-full rounded-xl border border-border bg-surface/90 px-4 py-3 text-base text-text outline-none transition-colors focus:border-border-focus focus:ring-2 focus:ring-accent-light placeholder:text-text-muted/50 ${className}`}
        />
    );
}
