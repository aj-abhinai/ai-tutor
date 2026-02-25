import React from "react";

interface NavCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    title: string;
    description: string;
    isActive?: boolean;
}

export function NavCard({
    label,
    title,
    description,
    isActive = false,
    disabled,
    className = "",
    ...rest
}: NavCardProps) {
    const base =
        "relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
    const activeStyle = isActive
        ? "border-secondary bg-secondary-light shadow-[0_14px_30px_rgba(92,49,181,0.15)]"
        : "hover:border-border-hover hover:shadow-[0_10px_20px_rgba(10,24,54,0.06)]";
    return (
        <button
            disabled={disabled}
            className={`${base} ${activeStyle} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
            {...rest}
        >
            {isActive && (
                <span className="absolute inset-x-0 top-0 h-1 bg-secondary" />
            )}
            <div className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
                <div className="text-lg font-semibold text-text mt-1">{title}</div>
                <div className="text-sm text-text-muted mt-1">{description}</div>
            </div>
        </button>
    );
}
