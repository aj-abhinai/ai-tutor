import React from "react";

type Subject = "science" | "maths" | "Science" | "Maths";

interface SubjectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    subject: Subject;
    isActive: boolean;
}

export function SubjectButton({
    subject,
    isActive,
    className = "",
    children,
    ...rest
}: SubjectButtonProps) {
    const normalized = subject.toLowerCase() as "science" | "maths";
    const styles = isActive
        ? "bg-secondary-light border-secondary text-secondary shadow-[0_10px_22px_rgba(92,49,181,0.2)]"
        : "bg-surface/80 border-border text-text-muted hover:border-accent hover:text-accent-hover";

    return (
        <button
            aria-pressed={isActive}
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-all duration-200 ${styles} ${className}`}
            {...rest}
        >
            {children || normalized}
        </button>
    );
}
