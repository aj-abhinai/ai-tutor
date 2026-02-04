import { ButtonHTMLAttributes, forwardRef } from "react";

export interface SubjectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    subject: "Science" | "Maths";
    isActive?: boolean;
}

const subjectStyles = {
    Science: {
        active:
            "bg-emerald-100 border-emerald-400 text-emerald-800 shadow-[0_10px_22px_rgba(16,185,129,0.25)]",
        inactive:
            "bg-white/80 border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700",
    },
    Maths: {
        active:
            "bg-sky-100 border-sky-400 text-sky-800 shadow-[0_10px_22px_rgba(14,165,233,0.25)]",
        inactive:
            "bg-white/80 border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-700",
    },
};

export const SubjectButton = forwardRef<HTMLButtonElement, SubjectButtonProps>(
    ({ subject, isActive = false, className = "", children, ...props }, ref) => {
        const style = subjectStyles[subject][isActive ? "active" : "inactive"];

        return (
            <button
                ref={ref}
                aria-pressed={isActive}
            className={`flex-1 py-3 rounded-xl font-semibold border transition-all cursor-pointer ${style} ${className}`}
                {...props}
            >
                {children || subject}
            </button>
        );
    }
);

SubjectButton.displayName = "SubjectButton";
