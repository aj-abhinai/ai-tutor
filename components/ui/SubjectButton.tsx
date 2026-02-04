import { ButtonHTMLAttributes, forwardRef } from "react";

export interface SubjectButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    subject: "Science" | "Maths";
    isActive?: boolean;
}

const subjectStyles = {
    Science: {
        active: "bg-emerald-100 border-emerald-500 text-emerald-700",
        inactive: "bg-gray-50 border-gray-200 hover:border-emerald-300",
    },
    Maths: {
        active: "bg-sky-100 border-sky-500 text-sky-700",
        inactive: "bg-gray-50 border-gray-200 hover:border-sky-300",
    },
};

export const SubjectButton = forwardRef<HTMLButtonElement, SubjectButtonProps>(
    ({ subject, isActive = false, className = "", children, ...props }, ref) => {
        const style = subjectStyles[subject][isActive ? "active" : "inactive"];

        return (
            <button
                ref={ref}
                aria-pressed={isActive}
                className={`flex-1 py-3 rounded-lg font-bold border-2 transition-all ${style} ${className}`}
                {...props}
            >
                {children || subject}
            </button>
        );
    }
);

SubjectButton.displayName = "SubjectButton";
