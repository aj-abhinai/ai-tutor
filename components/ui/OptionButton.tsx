import React from "react";

interface OptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    text: string;
    isSelected: boolean;
    isCorrect: boolean;
    showResult: boolean;
}

export function OptionButton({
    label,
    text,
    isSelected,
    isCorrect,
    showResult,
    className = "",
    ...rest
}: OptionButtonProps) {
    let style = "border-border bg-surface/80 text-text hover:border-accent hover:bg-accent-light/60";
    let labelStyle = "bg-muted-bg text-text";

    if (showResult) {
        if (isCorrect) {
            style = "bg-success-light border-success text-text";
            labelStyle = "bg-success/20 text-text";
        } else if (isSelected) {
            style = "bg-error-light border-error text-text";
            labelStyle = "bg-error/20 text-text";
        }
    } else if (isSelected) {
        style = "bg-secondary-light border-secondary text-text shadow-sm transform scale-[1.01]";
        labelStyle = "bg-secondary/20 text-secondary";
    }

    return (
        <button
            className={`w-full rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${style} ${className}`}
            {...rest}
        >
            <div className="flex items-center gap-3">
                <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${labelStyle}`}
                >
                    {label}
                </span>
                <span className="flex-1 text-sm" dangerouslySetInnerHTML={{ __html: text }} />
                {showResult && (
                    <span className={`text-xs font-semibold ${isCorrect ? "text-success" : "text-error"}`}>
                        {isCorrect ? "Correct" : isSelected ? "Incorrect" : ""}
                    </span>
                )}
            </div>
        </button>
    );
}
