import { ButtonHTMLAttributes, forwardRef } from "react";

export interface SubjectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    subject: "Science" | "Maths";
    isActive?: boolean;
}

const subjectStyles = {
    Science: {
        active: "bg-emerald-200 border-emerald-600 text-emerald-800 shadow-md",
        inactive: "bg-white border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600",
    },
    Maths: {
        active: "bg-sky-200 border-sky-600 text-sky-800 shadow-md",
        inactive: "bg-white border-gray-300 text-gray-500 hover:border-sky-400 hover:text-sky-600",
    },
};

export const SubjectButton = forwardRef<HTMLButtonElement, SubjectButtonProps>(
    ({ subject, isActive = false, className = "", children, ...props }, ref) => {
        const style = subjectStyles[subject][isActive ? "active" : "inactive"];

        return (
            <button
                ref={ref}
                aria-pressed={isActive}
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all cursor-pointer ${style} ${className}`}
                {...props}
            >
                {children || subject}
            </button>
        );
    }
);

SubjectButton.displayName = "SubjectButton";
